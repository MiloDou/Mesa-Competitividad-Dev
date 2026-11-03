from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from telegram_notifications.models import LinkTicket, ProcessedUpdate

WEBHOOK_URL = "/api/v1/telegram/webhook/"
SECRET = "test-webhook-secret"


def private_message(update_id, text, chat_id=5001, chat_type="private"):
    return {"update_id": update_id, "message": {"message_id": 1, "chat": {"id": chat_id, "type": chat_type}, "from": {"first_name": "Prueba"}, "text": text}}


@override_settings(TELEGRAM_WEBHOOK_SECRET=SECRET)
class WebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def post(self, update, secret=SECRET):
        headers = {"HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN": secret} if secret is not None else {}
        return self.client.post(WEBHOOK_URL, update, format="json", **headers)

    def test_missing_or_wrong_secret_is_rejected(self):
        self.assertEqual(self.post(private_message(1, "/start"), secret=None).status_code, 403)
        self.assertEqual(self.post(private_message(2, "/start"), secret="otro").status_code, 403)
        self.assertFalse(ProcessedUpdate.objects.exists())

    @override_settings(TELEGRAM_WEBHOOK_SECRET="")
    def test_unconfigured_secret_fails_closed(self):
        self.assertEqual(self.post(private_message(1, "/start"), secret="").status_code, 403)

    def test_repeated_update_is_processed_once(self):
        first = self.post(private_message(10, "/start"))
        second = self.post(private_message(10, "/start"))
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()["method"], "sendMessage")
        self.assertEqual(second.json(), {})
        self.assertEqual(LinkTicket.objects.count(), 1)

    def test_non_private_chat_is_ignored(self):
        response = self.post(private_message(11, "/start", chat_type="group"))
        self.assertEqual(response.json(), {})
        self.assertFalse(LinkTicket.objects.exists())

    def test_internal_error_answers_200_and_is_logged(self):
        with patch("telegram_notifications.linking.handle_update", side_effect=RuntimeError("fallo")), self.assertLogs("telegram_notifications.views", "ERROR"):
            response = self.post(private_message(12, "/estado"))
        self.assertEqual((response.status_code, response.json()), (200, {}))
        self.assertTrue(ProcessedUpdate.objects.filter(update_id=12).exists())
