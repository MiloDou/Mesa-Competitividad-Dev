"""Integrantes de Telegram sin cuenta: registro por la Comisión, avisos generales, avisos manuales y baja.

Telegram se simula; todo lo demás (API, productores, políticas, cola y ``process_once``) es real.
"""
import re
import shutil
import tempfile
from datetime import timedelta
from unittest.mock import Mock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from telegram_notifications import delivery, integrantes
from telegram_notifications.models import DeliveryJob, LinkTicket, NotificationEvent, TelegramLink
from telegram_notifications.tests.test_policies import PolicyFixtureMixin
from telegram_notifications.tests.test_webhook import SECRET, WEBHOOK_URL, private_message
from voting.models import Voting

URL = "/api/v1/telegram/integrantes/"
CHAT_I, CHAT_J, CHAT_A = 201, 202, 203


class FakeTelegram:
    def __init__(self):
        self.sent = []

    def __call__(self, url, json=None, timeout=None):
        if url.endswith("/sendMessage"):
            self.sent.append((json["chat_id"], json["text"]))
        return Mock(status_code=200, json=Mock(return_value={"ok": True, "result": {"message_id": len(self.sent)}}))

    def texts(self, chat_id):
        return [text for chat, text in self.sent if chat == chat_id]


@override_settings(TELEGRAM_ENABLED=True, TELEGRAM_WEBHOOK_SECRET=SECRET, TELEGRAM_BOT_TOKEN="123:test")
class IntegranteTests(PolicyFixtureMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.editor = cls.make_user("editor", "editor")

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.media = tempfile.mkdtemp()
        cls.media_override = override_settings(MEDIA_ROOT=cls.media)
        cls.media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls.media_override.disable()
        shutil.rmtree(cls.media, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.telegram = FakeTelegram()
        patcher = patch("telegram_notifications.client.requests.post", side_effect=self.telegram)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.api = self.client_for(self.admin)
        self.update_id = 0

    # --- Ayudantes ---------------------------------------------------------------------------

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def webhook(self, update):
        self.update_id += 1
        update["update_id"] = self.update_id
        return APIClient().post(WEBHOOK_URL, update, format="json", HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=SECRET).json()

    def start(self, chat_id):
        return re.search(r"es ([A-Z0-9]{8})\.", self.webhook(private_message(0, "/start", chat_id))["text"]).group(1)

    def accept(self, chat_id):
        self.webhook({"callback_query": {"id": "q", "data": "consent:yes", "message": {"message_id": 1, "chat": {"id": chat_id, "type": "private"}}}})

    def register(self, name, chat_id, accept=True):
        response = self.api.post(f"{URL}register/", {"name": name, "code": self.start(chat_id)}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        if accept:
            self.accept(chat_id)
        return TelegramLink.objects.get(pk=response.data["id"])

    def link_account(self, user, chat_id):
        response = self.api.post("/api/v1/telegram/links/approve/", {"code": self.start(chat_id), "user": user.pk}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.accept(chat_id)

    def create_meeting(self, **fields):
        payload = {
            "commission": self.commission_a.pk, "title": fields.pop("title", "Sesión ordinaria"),
            "scheduled_at": (timezone.now() + timedelta(days=3)).isoformat(), "modality": "in_person", "location": "Sala 1",
            "invited_member_ids": [self.member_a.pk], **fields,
        }
        response = self.api.post("/api/v1/meetings/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return response.data["id"]

    def cycle(self, now=None):
        return delivery.process_once(now)

    # --- Permisos ------------------------------------------------------------------------------

    def test_only_the_commission_can_list_register_remove_and_announce(self):
        link = self.register("Ana Pérez", CHAT_I)
        for user, expected in ((self.editor, 403), (self.reader, 403), (self.user_a, 403)):
            client = self.client_for(user)
            self.assertEqual(client.get(URL).status_code, expected)
            self.assertEqual(client.post(f"{URL}register/", {"name": "X", "code": "ABCDEFGH"}, format="json").status_code, expected)
            self.assertEqual(client.post(f"{URL}{link.pk}/remove/").status_code, expected)
            self.assertEqual(client.post(f"{URL}announce/", {"text": "Hola"}, format="json").status_code, expected)
        self.assertEqual(APIClient().get(URL).status_code, 401)
        link.refresh_from_db()
        self.assertEqual(link.status, TelegramLink.Status.ACTIVE)

    # --- Registro --------------------------------------------------------------------------------

    def test_register_creates_an_internal_user_that_cannot_log_in_and_asks_for_consent(self):
        link = self.register("  Ana   Pérez ", CHAT_I, accept=False)
        self.assertEqual(link.status, TelegramLink.Status.PENDING_CONSENT)
        self.assertEqual(link.approved_by, self.admin)
        user = link.user
        self.assertEqual(user.first_name, "Ana Pérez")
        self.assertTrue(user.email.endswith("@integrantes.telegram.invalid"))
        self.assertFalse(user.has_usable_password())
        self.assertEqual(list(user.roles.values_list("key", flat=True)), ["reader"])
        self.assertIn(integrantes.CONSENT_TEXT, self.telegram.texts(CHAT_I))
        login = APIClient().post("/api/v1/auth/login/", {"email": user.email, "password": ""}, format="json")
        self.assertNotEqual(login.status_code, 200)

        self.accept(CHAT_I)
        link.refresh_from_db()
        self.assertEqual(link.status, TelegramLink.Status.ACTIVE)
        listed = self.api.get(URL).data["results"]
        self.assertEqual([(row["name"], row["status"], row["registered_by"]) for row in listed], [("Ana Pérez", "active", "Admin Ficticio")])

    def test_bad_expired_or_reused_codes_create_nothing(self):
        users_before = User.objects.count()
        self.assertEqual(self.api.post(f"{URL}register/", {"name": "Ana", "code": "ZZZZZZZZ"}, format="json").status_code, 400)
        code = self.start(CHAT_I)
        LinkTicket.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
        self.assertEqual(self.api.post(f"{URL}register/", {"name": "Ana", "code": code}, format="json").status_code, 400)
        self.assertEqual(self.api.post(f"{URL}register/", {"name": "   ", "code": self.start(CHAT_I)}, format="json").status_code, 400)
        self.assertEqual(User.objects.count(), users_before)

        self.register("Ana", CHAT_I)
        reply = self.webhook(private_message(0, "/start", CHAT_I))["text"]
        self.assertTrue(reply.startswith("Este chat ya está vinculado."))  # un chat vinculado no recibe otro código
        self.assertEqual(User.objects.count(), users_before + 1)

    def test_list_shows_only_integrantes(self):
        self.link_account(self.user_a, CHAT_A)
        self.register("Ana", CHAT_I)
        self.assertEqual([row["name"] for row in self.api.get(URL).data["results"]], ["Ana"])

    # --- Avisos generales ---------------------------------------------------------------------

    def test_integrantes_get_general_notices_but_never_confidential_or_personal_ones(self):
        self.register("Ana", CHAT_I)
        self.register("Beto", CHAT_J, accept=False)  # sin «Acepto» no recibe nada
        meeting_id = self.create_meeting(title="Sesión abierta")
        self.create_meeting(title="Sesión reservada", confidentiality="temporary_confidential")
        self.cycle()
        # Agregar una invitada genera el aviso personal «Fuiste incluido»: no es para integrantes.
        response = self.api.patch(f"/api/v1/meetings/{meeting_id}/", {"invited_member_ids": [self.member_a.pk, self.member_a2.pk]}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.cycle()

        received = self.telegram.texts(CHAT_I)
        self.assertTrue(any(text.startswith("Nueva reunión") and "Sesión abierta" in text for text in received))
        self.assertFalse(any("Sesión reservada" in text for text in received))
        self.assertFalse(any(text.startswith("Fuiste incluido") for text in received))
        self.assertTrue(NotificationEvent.objects.filter(event_type="meeting.invited").exists())
        self.assertFalse(DeliveryJob.objects.filter(event__event_type="meeting.invited").exists())
        self.assertEqual([text for text in self.telegram.texts(CHAT_J) if text != integrantes.CONSENT_TEXT], [])

    def test_integrantes_get_voting_project_and_document_notices(self):
        self.register("Ana", CHAT_I)
        voting = self.voting(status=Voting.Status.DRAFT, closes_at=timezone.now() + timedelta(days=3), title="Plan anual")
        self.assertEqual(self.api.post(f"/api/v1/votings/{voting.pk}/open/").status_code, 200)
        project = voting.project
        self.assertEqual(self.api.patch(f"/api/v1/projects/{project.pk}/", {"status": "paused"}, format="json").status_code, 200)
        upload = SimpleUploadedFile("informe.pdf", b"%PDF-1.4\n%ficticio\n", content_type="application/pdf")
        response = self.api.post("/api/v1/documents/", {"project": project.pk, "title": "Informe trimestral", "file": upload}, format="multipart")
        self.assertEqual(response.status_code, 201, response.content)
        self.cycle()

        received = "\n".join(self.telegram.texts(CHAT_I))
        for expected in ("Votación abierta", "Plan anual", "Proyecto actualizado", "Nuevo documento", "Informe trimestral"):
            self.assertIn(expected, received)
        # La invitación a votar «no has votado» es personal: nunca para integrantes.
        voting.refresh_from_db()
        self.cycle(voting.closes_at - timedelta(hours=24) + timedelta(minutes=5))
        self.assertFalse(DeliveryJob.objects.filter(event__event_type="voting.reminder", user__email__endswith=integrantes.EMAIL_DOMAIN).exists())

    def test_confidential_project_never_reaches_integrantes_even_if_a_job_exists(self):
        link = self.register("Ana", CHAT_I)
        project = self.voting().project
        project.confidentiality = "temporary_confidential"
        project.save(update_fields=["confidentiality"])
        from telegram_notifications.contracts import record_event

        record_event("project.status_changed", "project", project.pk, "manual", [], data={"status": "paused"})
        self.cycle()
        job = DeliveryJob.objects.get(user=link.user, event__event_type="project.status_changed")
        self.assertEqual(job.status, DeliveryJob.Status.CANCELLED)
        self.assertEqual([text for text in self.telegram.texts(CHAT_I) if text != integrantes.CONSENT_TEXT], [])

    def test_account_links_keep_their_own_rules(self):
        self.link_account(self.user_b, CHAT_A)  # otra comisión y no invitado
        self.register("Ana", CHAT_I)
        self.create_meeting(title="Sesión de la comisión A")
        self.cycle()
        self.assertFalse(any("Sesión de la comisión A" in text for text in self.telegram.texts(CHAT_A)))
        self.assertTrue(any("Sesión de la comisión A" in text for text in self.telegram.texts(CHAT_I)))

    # --- Aviso manual ---------------------------------------------------------------------------

    def test_announcement_reaches_every_active_chat_with_the_text_as_written(self):
        self.register("Ana", CHAT_I)
        self.register("Beto", CHAT_J, accept=False)
        self.link_account(self.user_a, CHAT_A)
        text = "Reunión ordinaria el jueves 6 a las 10:00.\n\n\n\nLugar: Cámara de Comercio\x07"
        response = self.api.post(f"{URL}announce/", {"text": text}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data, {"recipients": 2})
        self.cycle()
        expected = "Aviso de la Mesa de Competitividad\n\nReunión ordinaria el jueves 6 a las 10:00.\n\nLugar: Cámara de Comercio"
        self.assertIn(expected, self.telegram.texts(CHAT_I))
        self.assertIn(expected, self.telegram.texts(CHAT_A))
        self.assertNotIn(expected, self.telegram.texts(CHAT_J))
        self.assertEqual(self.api.post(f"{URL}announce/", {"text": " \n "}, format="json").status_code, 400)
        self.assertEqual(self.api.post(f"{URL}announce/", {"text": "x" * 2001}, format="json").status_code, 400)

    # --- Baja ------------------------------------------------------------------------------------

    def test_remove_stops_messages_at_once_and_says_goodbye(self):
        link = self.register("Ana", CHAT_I)
        self.assertEqual(self.api.post(f"{URL}announce/", {"text": "Aviso en cola"}, format="json").data, {"recipients": 1})
        response = self.api.post(f"{URL}{link.pk}/remove/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "revoked")
        link.user.refresh_from_db()
        self.assertFalse(link.user.is_active)
        self.assertIn(integrantes.REMOVED_TEXT, self.telegram.texts(CHAT_I))

        self.create_meeting(title="Sesión posterior")
        self.cycle()
        self.assertFalse(any("Aviso en cola" in text or "Sesión posterior" in text for text in self.telegram.texts(CHAT_I)))
        self.assertEqual(self.api.post(f"{URL}{link.pk}/remove/").status_code, 200)  # idempotente
        self.assertEqual(self.telegram.texts(CHAT_I).count(integrantes.REMOVED_TEXT), 1)
        self.assertEqual(self.webhook(private_message(0, "/estado", CHAT_I))["text"], "Este chat no está vinculado. Usa /start para obtener un código de vinculación.")

    def test_a_removed_person_can_be_registered_again(self):
        first = self.register("Ana", CHAT_I)
        self.api.post(f"{URL}{first.pk}/remove/")
        second = self.register("Ana", CHAT_I)
        self.assertNotEqual(first.user_id, second.user_id)
        self.assertEqual(second.status, TelegramLink.Status.ACTIVE)
