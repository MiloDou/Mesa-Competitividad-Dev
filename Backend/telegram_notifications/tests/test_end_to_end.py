"""Validación final conjunta (sección 9 de la guía) con Telegram simulado.

Usa todo lo real: vinculación por webhook y API, productores de B al operar por la API,
recordatorios, políticas, cola y ``process_once``. Solo se reemplaza la red de Telegram.
Los instantes futuros se simulan pasando ``now`` al ciclo, igual que lo haría el Worker
cada minuto en ese momento.
"""
import re
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import uuid4

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from directory.models import CommissionMembership, Member
from telegram_notifications import delivery, linking, reminders
from telegram_notifications.contracts import record_event
from telegram_notifications.models import DeliveryJob, TelegramLink
from telegram_notifications.tests.test_policies import PolicyFixtureMixin
from telegram_notifications.tests.test_webhook import SECRET, WEBHOOK_URL, private_message
from voting.models import Voting

CHAT_A, CHAT_A2, CHAT_B = 101, 102, 103


class FakeTelegram:
    """Reemplaza requests.post del cliente. Registra (chat_id, texto) de cada aviso enviado (no los consentimientos)."""

    def __init__(self, seconds_per_call=0.0):
        self.sent = []
        self.clock = 0.0
        self.seconds_per_call = seconds_per_call

    def __call__(self, url, json=None, timeout=None):
        self.clock += self.seconds_per_call
        if url.endswith("/sendMessage") and json["text"] != linking.CONSENT_TEXT:
            self.sent.append((json["chat_id"], json["text"]))
        return Mock(status_code=200, json=Mock(return_value={"ok": True, "result": {"message_id": len(self.sent) + 1}}))

    def chats(self):
        return [chat_id for chat_id, _ in self.sent]


@override_settings(TELEGRAM_ENABLED=True, TELEGRAM_WEBHOOK_SECRET=SECRET, TELEGRAM_BOT_TOKEN="123:test")
class EndToEndTests(PolicyFixtureMixin, TestCase):
    def setUp(self):
        self.telegram = FakeTelegram()
        patcher = patch("telegram_notifications.client.requests.post", side_effect=self.telegram)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.bot = APIClient()
        self.api = APIClient()
        self.api.force_authenticate(self.admin)
        self.update_id = 0

    # --- Ayudantes --------------------------------------------------------------------

    def webhook(self, update):
        self.update_id += 1
        update["update_id"] = self.update_id
        return self.bot.post(WEBHOOK_URL, update, format="json", HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=SECRET).json()

    def command(self, text, chat_id):
        return self.webhook(private_message(0, text, chat_id))

    def link(self, user, chat_id):
        """Punto 1: /start → aprobación por la API (users.manage) → «Acepto»."""
        code = re.search(r"es ([A-Z0-9]{8})\.", self.command("/start", chat_id)["text"]).group(1)
        self.assertEqual(self.api.post("/api/v1/telegram/links/approve/", {"code": code, "user": user.pk}, format="json").status_code, 201)
        self.webhook({"callback_query": {"id": "q", "data": "consent:yes", "message": {"message_id": 1, "chat": {"id": chat_id, "type": "private"}}}})
        self.assertEqual(TelegramLink.objects.get(chat_id=chat_id).status, TelegramLink.Status.ACTIVE)

    def create_meeting(self, scheduled_at, invited):
        response = self.api.post("/api/v1/meetings/", {
            "commission": self.commission_a.pk, "title": "Sesión de seguimiento", "scheduled_at": scheduled_at.isoformat(),
            "modality": "in_person", "location": "Sala 1", "invited_member_ids": [member.pk for member in invited],
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return response.data["id"]

    def cycle(self, now=None):
        return delivery.process_once(now)

    def sent_types(self):
        return list(DeliveryJob.objects.filter(status=DeliveryJob.Status.SENT).order_by("sent_at", "id").values_list("event__event_type", "user_id"))

    # --- Puntos 1 a 4: vinculación, creación, destinatarios, reprogramación y cancelación ---

    def test_meeting_reaches_only_the_authorized_chat_and_old_reminders_never_leave(self):
        self.link(self.user_a, CHAT_A)
        self.link(self.user_b, CHAT_B)  # vinculada, pero de otra comisión y no invitada
        when = timezone.now() + timedelta(days=3)
        meeting_id = self.create_meeting(when, invited=[self.member_a, self.member_a2])  # a2 no está vinculada

        self.cycle()
        self.assertEqual(self.telegram.chats(), [CHAT_A])
        self.assertIn("Sesión de seguimiento", self.telegram.sent[0][1])

        # El recordatorio de 24 h queda generado, pero la reunión se reprograma antes de enviarlo.
        first_due = when - timedelta(hours=24) + timedelta(minutes=5)
        self.assertEqual(reminders.generate_due(first_due), 1)
        new_when = when + timedelta(days=1)
        self.assertEqual(self.api.patch(f"/api/v1/meetings/{meeting_id}/", {"scheduled_at": new_when.isoformat()}, format="json").status_code, 200)
        self.cycle(first_due)
        self.assertEqual(self.sent_types(), [("meeting.created", self.user_a.pk), ("meeting.updated", self.user_a.pk)])
        self.assertTrue(DeliveryJob.objects.filter(event__event_type="meeting.reminder", status=DeliveryJob.Status.CANCELLED).exists())

        # Llega la nueva ventana de 24 h: sale un único recordatorio, con la fecha nueva.
        self.cycle(new_when - timedelta(hours=24) + timedelta(minutes=5))
        self.assertEqual(self.sent_types()[-1], ("meeting.reminder", self.user_a.pk))

        # Se cancela: se avisa y ya no sale el recordatorio de 1 h.
        self.assertEqual(self.api.delete(f"/api/v1/meetings/{meeting_id}/").status_code, 204)
        self.cycle()
        self.cycle(new_when - timedelta(hours=1) + timedelta(minutes=5))
        self.assertEqual([event for event, _ in self.sent_types()], ["meeting.created", "meeting.updated", "meeting.reminder", "meeting.cancelled"])
        self.assertEqual(set(self.telegram.chats()), {CHAT_A})

    # --- Punto 5: recordatorio de votación solo a quien no votó --------------------------

    def test_voting_reminder_goes_only_to_who_has_not_voted(self):
        self.link(self.user_a, CHAT_A)
        self.link(self.user_a2, CHAT_A2)
        voting = self.voting(status=Voting.Status.DRAFT, closes_at=timezone.now() + timedelta(days=3))
        self.assertEqual(self.api.post(f"/api/v1/votings/{voting.pk}/open/").status_code, 200)
        self.cycle()
        self.assertEqual(sorted(self.telegram.chats()), [CHAT_A, CHAT_A2])

        voter = APIClient()
        voter.force_authenticate(self.user_a)
        cast = voter.post(f"/api/v1/votings/{voting.pk}/cast/", {"option": "A favor", "client_request_id": str(uuid4())}, format="json")
        self.assertIn(cast.status_code, (200, 201))

        voting.refresh_from_db()
        self.cycle(voting.closes_at - timedelta(hours=24) + timedelta(minutes=5))
        self.assertEqual(self.sent_types()[-1], ("voting.reminder", self.user_a2.pk))
        self.assertEqual(DeliveryJob.objects.filter(event__event_type="voting.reminder").count(), 1)
        self.assertEqual(self.telegram.chats()[-1], CHAT_A2)

    # --- Punto 6: recuperación tras interrumpir el procesamiento ------------------------

    def test_interrupted_processing_resumes_without_duplicates(self):
        self.link(self.user_a, CHAT_A)
        self.create_meeting(timezone.now() + timedelta(days=3), invited=[self.member_a])

        delivery.claim()  # el ciclo reserva y se cae antes de enviar
        self.cycle()
        self.assertEqual(self.telegram.sent, [])  # la reserva sigue vigente: nadie la toma
        self.cycle(timezone.now() + delivery.LOCK_TTL + timedelta(seconds=1))
        self.assertEqual(self.telegram.chats(), [CHAT_A])

        # Si se cae a mitad del envío, no se reenvía a ciegas: queda «uncertain».
        self.create_meeting(timezone.now() + timedelta(days=4), invited=[self.member_a])
        for job in delivery.claim():
            DeliveryJob.objects.filter(pk=job.pk).update(send_started_at=timezone.now())
        self.cycle(timezone.now() + delivery.LOCK_TTL + timedelta(seconds=1))
        self.assertEqual(self.telegram.chats(), [CHAT_A])
        self.assertEqual(DeliveryJob.objects.filter(status=DeliveryJob.Status.UNCERTAIN).count(), 1)

    # --- Punto 7: revocación antes del envío ---------------------------------------------

    def test_revocation_before_delivery_sends_nothing(self):
        self.link(self.user_a, CHAT_A)
        self.create_meeting(timezone.now() + timedelta(days=3), invited=[self.member_a])
        self.command("/desvincular", CHAT_A)
        self.cycle()
        self.assertEqual(self.telegram.sent, [])
        self.assertEqual(DeliveryJob.objects.get().status, DeliveryJob.Status.CANCELLED)

    # --- Punto 8: audiencia de 50 personas ----------------------------------------------

    def test_audience_of_fifty_is_served_within_two_cycles_without_duplicates(self):
        members = []
        for index in range(50):
            user = self.make_user(f"audiencia-{index}", "member")
            member = Member.objects.create(user=user, institution=self.institution, first_name="Persona", last_name=str(index))
            CommissionMembership.objects.create(member=member, commission=self.commission_a, starts_at=timezone.localdate())
            TelegramLink.objects.create(user=user, chat_id=10_000 + index, status=TelegramLink.Status.ACTIVE, consent_at=timezone.now())
            members.append(member)
        self.create_meeting(timezone.now() + timedelta(days=3), invited=members)

        # Telegram simulado tarda 250 ms por envío; el ciclo respeta su presupuesto de 8 s.
        self.telegram.seconds_per_call = 0.25
        with patch("telegram_notifications.delivery.time", SimpleNamespace(monotonic=lambda: self.telegram.clock)):
            first = self.cycle()["delivery"]
            second = self.cycle()["delivery"]
        self.assertGreater(first.get("released", 0), 0)
        self.assertEqual(first["sent"] + second["sent"], 50)
        self.assertEqual(sorted(self.telegram.chats()), list(range(10_000, 10_050)))

    # --- Punto 9: tras restaurar un respaldo, lo viejo caduca sin enviarse ---------------

    def test_restored_old_notice_expires_instead_of_being_sent(self):
        self.link(self.user_a, CHAT_A)
        meeting_id = self.create_meeting(timezone.now() + timedelta(days=3), invited=[self.member_a])
        self.cycle()
        record_event("meeting.updated", "meeting", meeting_id, "restaurado", [self.user_a], run_after=timezone.now() - timedelta(hours=25))
        self.assertEqual(self.cycle()["delivery"], {"expired": 1})
        self.assertEqual(len(self.telegram.sent), 1)
