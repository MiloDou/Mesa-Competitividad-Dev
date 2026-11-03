from datetime import timedelta
from io import StringIO
from unittest.mock import Mock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role, User
from telegram_notifications import delivery
from telegram_notifications.contracts import Message, record_event
from telegram_notifications.models import DeliveryJob, LinkTicket, ProcessedUpdate, TelegramLink

from .test_delivery import POST, telegram_response

PROCESS_URL = "/api/v1/telegram/process/"
STATUS_URL = "/api/v1/telegram/status/"
SECRET = "synthetic-process-secret"


def fake_hooks(policies=True, reminders=None):
    hooks = {"authorize_and_render": (lambda job: Message("Aviso", [])) if policies else None, "generate_due": reminders}
    return patch.object(delivery, "load_hook", side_effect=lambda module, name: hooks[name])


@override_settings(TELEGRAM_ENABLED=True, TELEGRAM_PROCESS_SECRET=SECRET, TELEGRAM_BOT_TOKEN="123:test")
class ProcessTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        password = "Long-Unique-Passphrase-2026!"
        cls.user = User.objects.create_user("one@example.test", password, first_name="Una", last_name="Cuenta")
        cls.admin = User.objects.create_user("admin@example.test", password, first_name="Ad", last_name="Min")
        cls.admin.roles.add(Role.objects.get(key="commission"))
        TelegramLink.objects.create(user=cls.user, chat_id=7001, status=TelegramLink.Status.ACTIVE, consent_at=timezone.now())

    def setUp(self):
        self.api = APIClient()
        record_event("meeting.created", "meeting", 1, "", [self.user])

    def process(self, token=SECRET):
        headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"} if token is not None else {}
        return self.api.post(PROCESS_URL, **headers)

    def test_missing_or_wrong_secret_is_rejected(self):
        with patch(POST) as post:
            self.assertEqual(self.process(None).status_code, 401)
            self.assertEqual(self.process("incorrecto").status_code, 403)
            with override_settings(TELEGRAM_PROCESS_SECRET=""):
                self.assertEqual(self.process("").status_code, 403)
        post.assert_not_called()
        self.assertEqual(DeliveryJob.objects.get().status, "pending")

    @override_settings(TELEGRAM_ENABLED=False)
    def test_disabled_switch_sends_nothing(self):
        with fake_hooks(), patch(POST) as post:
            response = self.process()
        self.assertEqual((response.status_code, response.json()), (200, {"enabled": False}))
        post.assert_not_called()

    def test_missing_hooks_send_nothing(self):
        with fake_hooks(policies=False), patch(POST) as post:
            body = self.process().json()
        post.assert_not_called()
        self.assertIn("skipped", body["delivery"])
        self.assertEqual(body["reminders"], "reminders.generate_due no instalado")

    def test_full_cycle_runs_reminders_delivers_and_cleans(self):
        old = timezone.now() - timedelta(days=8)
        ProcessedUpdate.objects.create(update_id=1)
        ProcessedUpdate.objects.filter(update_id=1).update(created_at=old)
        ProcessedUpdate.objects.create(update_id=2)
        LinkTicket.objects.create(code_digest="a" * 64, chat_id=1, expires_at=old)
        LinkTicket.objects.create(code_digest="b" * 64, chat_id=2, expires_at=timezone.now())
        reminders = Mock(return_value=3)
        with fake_hooks(reminders=reminders), patch(POST, return_value=telegram_response()):
            body = self.process().json()
        reminders.assert_called_once()
        self.assertEqual(body, {"enabled": True, "reminders": 3, "recovered": {"requeued": 0, "uncertain": 0}, "delivery": {"sent": 1}, "cleanup": {"updates": 1, "tickets": 1}})

    def test_reminder_error_does_not_block_delivery(self):
        with fake_hooks(reminders=Mock(side_effect=RuntimeError)), patch(POST, return_value=telegram_response()), self.assertLogs("telegram_notifications.delivery", "ERROR"):
            body = self.process().json()
        self.assertEqual((body["reminders"], body["delivery"]), ("error", {"sent": 1}))

    def test_management_command_runs_same_cycle(self):
        out = StringIO()
        with override_settings(TELEGRAM_ENABLED=False):
            call_command("telegram_process", stdout=out)
        self.assertEqual(out.getvalue().strip(), '{"enabled": false}')

    def test_status_requires_users_manage(self):
        self.api.force_authenticate(self.user)
        self.assertEqual(self.api.get(STATUS_URL).status_code, 403)
        DeliveryJob.objects.update(status="uncertain", last_error="Resultado desconocido")
        self.api.force_authenticate(self.admin)
        with patch("telegram_notifications.views.load_hook", return_value=None):
            body = self.api.get(STATUS_URL).json()
        self.assertEqual((body["enabled"], body["jobs"], body["links"]), (True, {"uncertain": 1}, {"active": 1}))
        self.assertEqual(body["hooks"], {"policies.authorize_and_render": False, "reminders.generate_due": False})
        self.assertEqual([(p["status"], p["last_error"]) for p in body["recent_problems"]], [("uncertain", "Resultado desconocido")])


@override_settings(TELEGRAM_BOT_TOKEN="123:test", TELEGRAM_WEBHOOK_SECRET="synthetic-webhook-secret")
class SetWebhookCommandTests(TestCase):
    def test_registers_webhook_with_secret_and_allowed_updates(self):
        with patch(POST, return_value=Mock(json=Mock(return_value={"ok": True, "result": True}))) as post:
            call_command("telegram_set_webhook", "https://example.test/api/v1/telegram/webhook/", stdout=StringIO())
        self.assertTrue(post.call_args.args[0].endswith("/setWebhook"))
        self.assertEqual(post.call_args.kwargs["json"], {"url": "https://example.test/api/v1/telegram/webhook/", "secret_token": "synthetic-webhook-secret", "allowed_updates": ["message", "callback_query"]})

    def test_rejects_http_url_and_missing_secret(self):
        with patch(POST) as post:
            with self.assertRaises(CommandError):
                call_command("telegram_set_webhook", "http://example.test/")
            with override_settings(TELEGRAM_WEBHOOK_SECRET=""), self.assertRaises(CommandError):
                call_command("telegram_set_webhook", "https://example.test/")
        post.assert_not_called()
