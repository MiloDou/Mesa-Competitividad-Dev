import re
from datetime import timedelta
from unittest.mock import Mock, patch

import requests
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role, User
from audit.models import AuditEvent
from telegram_notifications.contracts import record_event
from telegram_notifications.models import DeliveryJob, LinkTicket, TelegramLink

from .test_webhook import SECRET, WEBHOOK_URL, private_message

LINKS_URL = "/api/v1/telegram/links/"
TELEGRAM_OK = Mock(json=Mock(return_value={"ok": True, "result": {"message_id": 1}}), status_code=200)


@override_settings(TELEGRAM_WEBHOOK_SECRET=SECRET, TELEGRAM_BOT_TOKEN="123:test", TELEGRAM_ENABLED=True)
class LinkingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        password = "Long-Unique-Passphrase-2026!"
        cls.admin = User.objects.create_user("admin@example.test", password, first_name="Admin", last_name="Mesa")
        cls.admin.roles.add(Role.objects.get(key="commission"))
        cls.editor = User.objects.create_user("editor@example.test", password, first_name="Editor", last_name="Mesa")
        cls.editor.roles.add(Role.objects.get(key="editor"))
        cls.member = User.objects.create_user("member@example.test", password, first_name="Miembro", last_name="Mesa")
        cls.other = User.objects.create_user("other@example.test", password, first_name="Otra", last_name="Cuenta")

    def setUp(self):
        self.bot = APIClient()
        self.api = APIClient()
        self.api.force_authenticate(self.admin)
        self.update_id = 100

    def send(self, update):
        self.update_id += 1
        update["update_id"] = self.update_id
        return self.bot.post(WEBHOOK_URL, update, format="json", HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=SECRET).json()

    def command(self, text, chat_id=5001):
        return self.send(private_message(0, text, chat_id))

    def consent(self, answer, chat_id=5001):
        return self.send({"callback_query": {"id": "q", "data": f"consent:{answer}", "message": {"message_id": 9, "chat": {"id": chat_id, "type": "private"}}}})

    def code_for(self, chat_id=5001):
        return re.search(r"es ([A-Z0-9]{8})\.", self.command("/start", chat_id)["text"]).group(1)

    def approve(self, code, user=None):
        with patch("telegram_notifications.client.requests.post", return_value=TELEGRAM_OK) as post:
            response = self.api.post(f"{LINKS_URL}approve/", {"code": code, "user": (user or self.member).pk}, format="json")
        return response, post

    def link_active(self, chat_id=5001, user=None):
        self.approve(self.code_for(chat_id), user)
        self.consent("yes", chat_id)
        return TelegramLink.objects.get(chat_id=chat_id, status=TelegramLink.Status.ACTIVE)

    def test_full_flow_start_approve_and_consent(self):
        code = self.code_for()
        response, post = self.approve(code.lower())
        self.assertEqual(response.status_code, 201)
        self.assertEqual((response.data["status"], response.data["consent_sent"]), ("pending_consent", True))
        self.assertEqual(post.call_args.kwargs["json"]["reply_markup"]["inline_keyboard"][0][0]["callback_data"], "consent:yes")
        self.assertIsNotNone(LinkTicket.objects.get().used_at)
        self.assertTrue(AuditEvent.objects.filter(action="telegram_link.approve", actor=self.admin).exists())

        reply = self.consent("yes")
        self.assertEqual(reply["method"], "editMessageText")
        link = TelegramLink.objects.get()
        self.assertEqual((link.status, link.approved_by), ("active", self.admin))
        self.assertIsNotNone(link.consent_at)
        self.assertEqual(self.consent("yes")["text"], "Avisos activos.")
        self.assertIn("ya está vinculado", self.command("/start")["text"])

    def test_invalid_expired_or_reused_code_is_rejected(self):
        self.assertEqual(self.approve("NOEXISTE")[0].status_code, 400)
        code = self.code_for()
        LinkTicket.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.approve(code)[0].status_code, 400)

        code = self.code_for()
        self.assertEqual(self.approve(code)[0].status_code, 201)
        TelegramLink.objects.all().delete()
        self.assertEqual(self.approve(code)[0].status_code, 400)

    def test_new_start_replaces_previous_code(self):
        old = self.code_for()
        new = self.code_for()
        self.assertEqual(self.approve(old)[0].status_code, 400)
        self.assertEqual(self.approve(new)[0].status_code, 201)

    def test_account_or_chat_already_linked_is_rejected(self):
        self.link_active()
        response, _ = self.approve(self.code_for(chat_id=5002))
        self.assertEqual(response.status_code, 400)
        self.assertFalse(LinkTicket.objects.get(chat_id=5002).used_at)

        # El chat vinculado no recibe código nuevo; un ticket viejo del chat tampoco sirve para otra cuenta.
        LinkTicket.objects.create(code_digest="x" * 64, chat_id=5001, expires_at=timezone.now() + timedelta(minutes=5))
        with patch("telegram_notifications.linking.digest_token", return_value="x" * 64):
            self.assertEqual(self.approve("CUALQUIER", self.other)[0].status_code, 400)

    def test_inactive_user_is_rejected(self):
        self.other.is_active = False
        self.other.save(update_fields=["is_active"])
        self.assertEqual(self.approve(self.code_for(), self.other)[0].status_code, 400)
        self.assertFalse(TelegramLink.objects.exists())

    def test_users_manage_is_required(self):
        code = self.code_for()
        self.api.force_authenticate(self.editor)
        self.assertEqual(self.approve(code)[0].status_code, 403)
        self.assertEqual(self.api.get(LINKS_URL).status_code, 403)
        self.assertEqual(APIClient().get(LINKS_URL).status_code, 401)
        self.assertFalse(TelegramLink.objects.exists())

    def test_consent_send_failure_keeps_link_and_start_resends_buttons(self):
        code = self.code_for()
        with patch("telegram_notifications.client.requests.post", side_effect=requests.ConnectionError), self.assertLogs("telegram_notifications.linking", "ERROR"):
            response = self.api.post(f"{LINKS_URL}approve/", {"code": code, "user": self.member.pk}, format="json")
        self.assertEqual((response.status_code, response.data["consent_sent"]), (201, False))
        self.assertEqual(self.command("/start")["reply_markup"]["inline_keyboard"][0][1]["callback_data"], "consent:no")

    def test_consent_rejected_revokes_link(self):
        self.approve(self.code_for())
        self.consent("no")
        link = TelegramLink.objects.get()
        self.assertEqual(link.status, "revoked")
        self.assertIsNone(link.consent_at)
        self.assertIn("no está vinculado", self.consent("yes")["text"])

    def test_commands_are_idempotent(self):
        link = self.link_active()
        for _ in range(2):
            self.assertIn("en pausa", self.command("/pausar")["text"])
        link.refresh_from_db()
        self.assertEqual(link.status, "paused")
        for _ in range(2):
            self.assertEqual(self.command("/reanudar@MesaBot")["text"], "Avisos activos.")
        self.assertEqual(self.command("/estado")["text"], "Avisos activos.")

        record_event("meeting.created", "meeting", 1, "", [self.member])
        self.command("/desvincular")
        self.assertIn("no está vinculado", self.command("/desvincular")["text"])
        link.refresh_from_db()
        self.assertEqual(link.status, "revoked")
        self.assertEqual(DeliveryJob.objects.get().status, "cancelled")

    def test_resume_requires_prior_consent(self):
        self.approve(self.code_for())
        self.command("/reanudar")
        self.command("/pausar")
        self.assertEqual(TelegramLink.objects.get().status, "pending_consent")

    def test_admin_list_filter_and_revoke(self):
        link = self.link_active()
        record_event("meeting.created", "meeting", 1, "", [self.member])
        self.assertEqual(self.api.get(LINKS_URL, {"status": "active"}).data["count"], 1)
        self.assertEqual(self.api.get(LINKS_URL, {"status": "revoked"}).data["count"], 0)

        for _ in range(2):
            response = self.api.post(f"{LINKS_URL}{link.pk}/revoke/")
            self.assertEqual((response.status_code, response.data["status"]), (200, "revoked"))
        self.assertEqual(DeliveryJob.objects.get().cancel_reason, "Revocado por la administración")
        self.assertEqual(AuditEvent.objects.filter(action="telegram_link.revoke", actor=self.admin).count(), 1)
        self.assertIn("no está vinculado", self.command("/estado")["text"])
