from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import AuthSession, Role, User
from audit.models import AuditEvent
from notifications.models import DeviceToken


class AuthenticationApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.user = User.objects.create_user(
            "member@example.test", "Long-Unique-Passphrase-2026!", first_name="Ana", last_name="Prueba"
        )
        cls.user.roles.add(Role.objects.get(key="member"))

    def test_login_refresh_and_logout_revoke_database_session(self):
        client = APIClient()
        login = client.post("/api/v1/auth/login/", {
            "email": "MEMBER@example.test", "password": "Long-Unique-Passphrase-2026!", "device_label": "Pruebas"
        }, format="json")
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data["token_type"], "Bearer")
        first_access = login.data["access"]
        self.assertFalse(AuthSession.objects.get(user=self.user).access_digest == first_access)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {first_access}")
        self.assertEqual(client.get("/api/v1/auth/me/").status_code, 200)
        registration = client.post("/api/v1/devices/", {
            "token": "ExpoPushToken[synthetic-auth-test]", "platform": "ios"
        }, format="json")
        self.assertEqual(registration.status_code, 201)
        self.assertTrue(DeviceToken.objects.get().is_active)

        refresh = APIClient().post("/api/v1/auth/refresh/", {"refresh": login.data["refresh"]}, format="json")
        self.assertEqual(refresh.status_code, 200)
        self.assertNotEqual(refresh.data["refresh"], login.data["refresh"])
        self.assertEqual(client.get("/api/v1/auth/me/").status_code, 401)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.data['access']}")
        self.assertEqual(client.post("/api/v1/auth/logout/").status_code, 204)
        self.assertEqual(client.get("/api/v1/auth/me/").status_code, 401)
        self.assertIsNotNone(AuthSession.objects.get(user=self.user).revoked_at)
        self.assertFalse(DeviceToken.objects.get().is_active)
        self.assertTrue(AuditEvent.objects.filter(actor=self.user, action="auth.login").exists())

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_is_non_enumerating_and_revokes_sessions(self):
        session, access, _ = AuthSession.issue(self.user)
        client = APIClient()
        known = client.post("/api/v1/auth/password-reset/", {"email": self.user.email}, format="json")
        unknown = client.post("/api/v1/auth/password-reset/", {"email": "absent@example.test"}, format="json")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)

        query = parse_qs(urlparse(mail.outbox[0].body.split(": ", 1)[1].splitlines()[0]).query)
        response = client.post("/api/v1/auth/password-reset/confirm/", {
            "uid": query["uid"][0], "token": query["token"][0], "password": "Another-Unique-Passphrase-2026!"
        }, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertIsNotNone(AuthSession.objects.get(pk=session.pk).revoked_at)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Another-Unique-Passphrase-2026!"))
        self.assertTrue(AuditEvent.objects.filter(actor=self.user, action="auth.password_reset").exists())
        reset_event = AuditEvent.objects.get(actor=self.user, action="auth.password_reset")
        self.assertEqual(reset_event.actor_roles, ["member"])
