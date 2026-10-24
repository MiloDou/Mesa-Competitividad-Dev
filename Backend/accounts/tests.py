from datetime import datetime, timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import AuthSession, Role, User
from audit.models import AuditEvent
from notifications.models import DeviceToken


class AuthenticationApiTests(TestCase):
    def setUp(self):
        cache.clear()

    def password_reset_query(self):
        reset_url = next(line.strip() for line in mail.outbox[-1].body.splitlines() if line.startswith("http"))
        return parse_qs(urlparse(reset_url).query)

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
        device = DeviceToken.objects.create(user=self.user, auth_session=session, token="synthetic-reset-device")
        client = APIClient()
        known = client.post("/api/v1/auth/password-reset/", {"email": self.user.email}, format="json")
        unknown = client.post("/api/v1/auth/password-reset/", {"email": "absent@example.test"}, format="json")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, [self.user.email])
        self.assertEqual(message.subject, "Recupera tu contraseña | Mesa de Competitividad")
        self.assertIn("Hola, Ana", message.body)
        self.assertEqual(message.alternatives[0].mimetype, "text/html")
        self.assertIn("#12025B", message.alternatives[0].content)
        self.assertIn("#E5B82E", message.alternatives[0].content)
        self.assertIn("cid:mesa-competitividad-logo", message.alternatives[0].content)
        self.assertEqual(message.attachments[0]["Content-ID"], "<mesa-competitividad-logo>")

        query = self.password_reset_query()
        response = client.post("/api/v1/auth/password-reset/confirm/", {
            "uid": query["uid"][0], "token": query["token"][0], "password": "Another-Unique-Passphrase-2026!"
        }, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertIsNotNone(AuthSession.objects.get(pk=session.pk).revoked_at)
        device.refresh_from_db()
        self.assertFalse(device.is_active)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Another-Unique-Passphrase-2026!"))
        self.assertTrue(AuditEvent.objects.filter(actor=self.user, action="auth.password_reset").exists())
        reset_event = AuditEvent.objects.get(actor=self.user, action="auth.password_reset")
        self.assertEqual(reset_event.actor_roles, ["member"])

        replay = client.post("/api/v1/auth/password-reset/confirm/", {
            "uid": query["uid"][0], "token": query["token"][0], "password": "Yet-Another-Unique-Passphrase-2026!"
        }, format="json")
        self.assertEqual(replay.status_code, 403)
        old_login = client.post("/api/v1/auth/login/", {
            "email": self.user.email, "password": "Long-Unique-Passphrase-2026!"
        }, format="json")
        self.assertEqual(old_login.status_code, 400)
        new_login = client.post("/api/v1/auth/login/", {
            "email": self.user.email, "password": "Another-Unique-Passphrase-2026!"
        }, format="json")
        self.assertEqual(new_login.status_code, 200)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_rejects_weak_passwords_without_changing_account(self):
        session, _, _ = AuthSession.issue(self.user)
        client = APIClient()
        client.post("/api/v1/auth/password-reset/", {"email": self.user.email}, format="json")
        query = self.password_reset_query()
        for password in ["short", "123456789012", "qwertyuiop123"]:
            with self.subTest(password=password):
                response = client.post("/api/v1/auth/password-reset/confirm/", {
                    "uid": query["uid"][0], "token": query["token"][0], "password": password
                }, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("password", response.data["error"]["detail"])
                self.user.refresh_from_db()
                self.assertTrue(self.user.check_password("Long-Unique-Passphrase-2026!"))
                self.assertIsNone(AuthSession.objects.get(pk=session.pk).revoked_at)
        self.assertFalse(AuditEvent.objects.filter(action="auth.password_reset").exists())
        valid = client.post("/api/v1/auth/password-reset/confirm/", {
            "uid": query["uid"][0], "token": query["token"][0], "password": "Another-Unique-Passphrase-2026!"
        }, format="json")
        self.assertEqual(valid.status_code, 204)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", PASSWORD_RESET_TIMEOUT=1)
    def test_password_reset_rejects_expired_and_invalid_links(self):
        client = APIClient()
        client.post("/api/v1/auth/password-reset/", {"email": self.user.email}, format="json")
        query = self.password_reset_query()
        body = {"uid": query["uid"][0], "token": query["token"][0], "password": "Another-Unique-Passphrase-2026!"}
        invalid = client.post("/api/v1/auth/password-reset/confirm/", {**body, "token": "invalid"}, format="json")
        self.assertEqual(invalid.status_code, 403)
        missing_user = client.post("/api/v1/auth/password-reset/confirm/", {**body, "uid": "invalid"}, format="json")
        self.assertEqual(missing_user.status_code, 403)
        with patch("django.contrib.auth.tokens.PasswordResetTokenGenerator._now", return_value=datetime.now() + timedelta(seconds=2)):
            expired = client.post("/api/v1/auth/password-reset/confirm/", body, format="json")
        self.assertEqual(expired.status_code, 403)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Long-Unique-Passphrase-2026!"))
