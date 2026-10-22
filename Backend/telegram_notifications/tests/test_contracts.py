from datetime import timedelta

from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from telegram_notifications.contracts import cancel_jobs, record_event
from telegram_notifications.models import DeliveryJob, NotificationEvent, TelegramLink


class PersistenceAndContractTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        password = "Long-Unique-Passphrase-2026!"
        cls.active_user = User.objects.create_user("active@example.test", password, first_name="Activa", last_name="Cuenta")
        cls.paused_user = User.objects.create_user("paused@example.test", password, first_name="Pausada", last_name="Cuenta")
        cls.unlinked_user = User.objects.create_user("unlinked@example.test", password, first_name="Sin", last_name="Vinculo")
        TelegramLink.objects.create(user=cls.active_user, chat_id=1001, status=TelegramLink.Status.ACTIVE)
        TelegramLink.objects.create(user=cls.paused_user, chat_id=1002, status=TelegramLink.Status.PAUSED)

    def test_record_event_is_idempotent_and_only_targets_active_links(self):
        recipients = [self.active_user, self.paused_user.pk, self.unlinked_user]
        first = record_event("meeting.created", "meeting", 7, "", recipients, data={"title": "Sesión"})
        second = record_event("meeting.created", "meeting", "7", "", recipients)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(NotificationEvent.objects.count(), 1)
        self.assertEqual(list(DeliveryJob.objects.values_list("user_id", "status")), [(self.active_user.pk, "pending")])

    def test_record_event_respects_run_after(self):
        later = timezone.now() + timedelta(hours=2)
        record_event("meeting.reminder", "meeting", 7, "2h", [self.active_user], run_after=later)
        self.assertEqual(DeliveryJob.objects.get().run_after, later)

    def test_cancel_jobs_only_touches_pending_jobs_of_the_resource(self):
        record_event("meeting.created", "meeting", 7, "", [self.active_user])
        record_event("meeting.reminder", "meeting", 7, "2h", [self.active_user])
        record_event("meeting.created", "meeting", 8, "", [self.active_user])
        DeliveryJob.objects.filter(event__event_type="meeting.created", event__resource_id="7").update(status=DeliveryJob.Status.SENT)

        self.assertEqual(cancel_jobs("meeting", 7, reason="reprogramada"), 1)
        self.assertEqual(
            sorted(DeliveryJob.objects.values_list("event__resource_id", "event__event_type", "status", "cancel_reason")),
            [("7", "meeting.created", "sent", ""), ("7", "meeting.reminder", "cancelled", "reprogramada"), ("8", "meeting.created", "pending", "")],
        )
        self.assertEqual(cancel_jobs("meeting", 8, event_types=["meeting.reminder"]), 0)

    def test_one_current_link_per_user_and_chat_keeping_history(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            TelegramLink.objects.create(user=self.active_user, chat_id=2001)
        with self.assertRaises(IntegrityError), transaction.atomic():
            TelegramLink.objects.create(user=self.unlinked_user, chat_id=1001)

        TelegramLink.objects.filter(user=self.active_user).update(status=TelegramLink.Status.REVOKED)
        TelegramLink.objects.create(user=self.active_user, chat_id=1001)
        TelegramLink.objects.create(user=self.active_user, chat_id=1001, status=TelegramLink.Status.REVOKED)
        self.assertEqual(TelegramLink.objects.filter(user=self.active_user).count(), 3)
