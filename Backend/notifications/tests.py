from unittest.mock import Mock, patch

from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from notifications.models import DeviceToken, Notification, PushOutbox


class NotificationApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.first_user = User.objects.create_user("first@example.test", "Long-Unique-Passphrase-2026!", first_name="Primera", last_name="Cuenta")
        cls.second_user = User.objects.create_user("second@example.test", "Long-Unique-Passphrase-2026!", first_name="Segunda", last_name="Cuenta")

    def test_notifications_and_device_tokens_are_scoped_to_the_account(self):
        Notification.objects.create(user=self.first_user, kind="test", title="Aviso privado", body="Solo primera cuenta")
        Notification.objects.create(user=self.second_user, kind="test", title="Otro aviso", body="Solo segunda cuenta")
        client = APIClient()
        client.force_authenticate(self.first_user)
        response = client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["title"] for item in response.data["results"]], ["Aviso privado"])

        registered = client.post("/api/v1/devices/", {
            "token": "ExpoPushToken[synthetic-device-token]", "platform": "ios", "device_label": "Prueba"
        }, format="json")
        self.assertEqual(registered.status_code, 201)
        self.assertEqual(DeviceToken.objects.get().user, self.first_user)

    @override_settings(EXPO_PUSH_ENABLED=True, EXPO_ACCESS_TOKEN="", EXPO_PUSH_URL="https://exp.host/--/api/v2/push/send")
    @patch("notifications.management.commands.deliver_push.requests.post")
    def test_push_outbox_delivers_without_external_network(self, mocked_post):
        DeviceToken.objects.create(user=self.first_user, token="ExpoPushToken[synthetic-device-token]")
        notification = Notification.objects.create(user=self.first_user, kind="test", title="Aviso", body="Prueba")
        job = PushOutbox.objects.create(notification=notification)
        response = Mock()
        response.json.return_value = {"data": [{"status": "ok", "id": "synthetic-ticket"}]}
        mocked_post.return_value = response

        call_command("deliver_push", verbosity=0)

        job.refresh_from_db()
        self.assertEqual(job.status, "sent")
        self.assertEqual(job.attempts, 1)
        mocked_post.assert_called_once()
        self.assertEqual(mocked_post.call_args.kwargs["json"][0]["to"], "ExpoPushToken[synthetic-device-token]")
