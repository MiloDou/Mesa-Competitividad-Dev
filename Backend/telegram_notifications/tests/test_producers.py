from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from meetings.models import Meeting
from telegram_notifications import policies
from telegram_notifications.contracts import record_event
from telegram_notifications.models import DeliveryJob, NotificationEvent
from telegram_notifications.tests.test_reminders import ReminderFixtureMixin
from voting.models import Voting


@override_settings(TELEGRAM_ENABLED=True)
class MeetingProducerTests(ReminderFixtureMixin, TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.when = timezone.now() + timedelta(days=3)

    def create(self, invited=None, **fields):
        payload = {
            "commission": self.commission_a.pk,
            "title": "Reunión de prueba",
            "scheduled_at": self.when.isoformat(),
            "modality": "in_person",
            "location": "Sala 1",
            "invited_member_ids": [m.pk for m in (invited if invited is not None else [self.member_a, self.member_a2])],
            **fields,
        }
        return self.client.post("/api/v1/meetings/", payload, format="json")

    def jobs(self, event_type):
        return DeliveryJob.objects.filter(event__event_type=event_type)

    def recipients(self, event_type):
        return set(self.jobs(event_type).values_list("user_id", flat=True))

    def test_creating_a_meeting_records_an_event_that_the_policy_can_render(self):
        response = self.create()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.recipients("meeting.created"), {self.user_a.pk, self.user_a2.pk})
        job = self.jobs("meeting.created").get(user=self.user_a)
        self.assertIn("Reunión de prueba", policies.authorize_and_render(job).text)

    def test_disabled_channel_records_nothing(self):
        with override_settings(TELEGRAM_ENABLED=False):
            self.assertEqual(self.create().status_code, 201)
            meeting = Meeting.objects.get()
            self.assertEqual(self.client.patch(f"/api/v1/meetings/{meeting.pk}/", {"location": "Otra"}, format="json").status_code, 200)
            self.assertEqual(self.client.delete(f"/api/v1/meetings/{meeting.pk}/").status_code, 204)
        self.assertFalse(NotificationEvent.objects.exists())

    def test_failed_operation_leaves_no_event(self):
        self.assertEqual(self.create(title="").status_code, 400)
        self.assertFalse(Meeting.objects.exists())
        self.assertFalse(NotificationEvent.objects.exists())

    def test_past_meeting_generates_no_notice(self):
        self.assertEqual(self.create(scheduled_at=(timezone.now() - timedelta(hours=1)).isoformat()).status_code, 201)
        self.assertFalse(NotificationEvent.objects.exists())

    def test_irrelevant_changes_generate_no_notice(self):
        meeting_id = self.create().data["id"]
        url = f"/api/v1/meetings/{meeting_id}/"
        for payload in ({"title": "Otro título"}, {"description": "Más detalle"}, {"agenda": ["Punto 1"]}, {"scheduled_at": self.when.isoformat(), "location": "Sala 1"}):
            self.assertEqual(self.client.patch(url, payload, format="json").status_code, 200)
        self.assertFalse(NotificationEvent.objects.filter(event_type="meeting.updated").exists())

    def test_relevant_change_notifies_and_reschedule_cancels_old_reminders(self):
        meeting_id = self.create().data["id"]
        old_key_reminder = record_event("meeting.reminder", "meeting", meeting_id, "clave-vieja", [self.user_a], data={"window_hours": 24})
        reminder_job = DeliveryJob.objects.get(event=old_key_reminder)
        url = f"/api/v1/meetings/{meeting_id}/"
        self.assertEqual(self.client.patch(url, {"location": "Sala 2"}, format="json").status_code, 200)
        reminder_job.refresh_from_db()
        self.assertEqual(reminder_job.status, "pending")  # solo cambió el lugar: el recordatorio sigue vigente
        self.assertEqual(self.client.patch(url, {"scheduled_at": (self.when + timedelta(days=1)).isoformat()}, format="json").status_code, 200)
        reminder_job.refresh_from_db()
        self.assertEqual((reminder_job.status, reminder_job.cancel_reason), ("cancelled", "Reunión reprogramada"))
        changes = [event.data["changed"] for event in NotificationEvent.objects.filter(event_type="meeting.updated").order_by("id")]
        self.assertEqual(changes, [["location"], ["scheduled_at"]])
        job = self.jobs("meeting.updated").filter(user=self.user_a).last()
        self.assertIn("Cambió: fecha y hora.", policies.authorize_and_render(job).text)

    def test_new_invitee_receives_only_the_invitation(self):
        meeting_id = self.create(invited=[self.member_a]).data["id"]
        response = self.client.patch(
            f"/api/v1/meetings/{meeting_id}/", {"invited_member_ids": [self.member_a.pk, self.member_a2.pk], "location": "Sala 3"}, format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.recipients("meeting.updated"), {self.user_a.pk})
        self.assertEqual(self.recipients("meeting.invited"), {self.user_a2.pk})

    def test_cancelling_notifies_and_cancels_pending_notices(self):
        meeting_id = self.create().data["id"]
        pending = self.jobs("meeting.created").get(user=self.user_a)
        self.assertEqual(self.client.delete(f"/api/v1/meetings/{meeting_id}/").status_code, 204)
        pending.refresh_from_db()
        self.assertEqual((pending.status, pending.cancel_reason), ("cancelled", "Reunión cancelada"))
        self.assertEqual(self.recipients("meeting.cancelled"), {self.user_a.pk, self.user_a2.pk})
        self.assertIn("Reunión cancelada", policies.authorize_and_render(self.jobs("meeting.cancelled").get(user=self.user_a)).text)

    def test_producer_failure_never_breaks_the_business_operation(self):
        with patch("telegram_notifications.producers.record_event", side_effect=RuntimeError("falla simulada")):
            with self.assertLogs("telegram_notifications.producers", "ERROR"):
                response = self.create()
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Meeting.objects.filter(pk=response.data["id"]).exists())
        self.assertFalse(NotificationEvent.objects.exists())


@override_settings(TELEGRAM_ENABLED=True)
class VotingProducerTests(ReminderFixtureMixin, TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def recipients(self, event_type):
        return set(DeliveryJob.objects.filter(event__event_type=event_type).values_list("user_id", flat=True))

    def test_opening_notifies_the_commission_and_the_policy_renders_it(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        self.assertEqual(self.client.post(f"/api/v1/votings/{voting.pk}/open/").status_code, 200)
        self.assertEqual(self.recipients("voting.opened"), {self.user_a.pk, self.user_a2.pk})  # b es de otra comisión
        job = DeliveryJob.objects.get(event__event_type="voting.opened", user=self.user_a)
        self.assertIn("Votación abierta\nPlan 2027", policies.authorize_and_render(job).text)

    def test_failed_open_leaves_no_event(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        Voting.objects.filter(pk=voting.pk).update(options=[])
        self.assertEqual(self.client.post(f"/api/v1/votings/{voting.pk}/open/").status_code, 400)
        self.assertFalse(NotificationEvent.objects.exists())

    def test_closing_notifies_and_cancels_pending_notices(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        self.client.post(f"/api/v1/votings/{voting.pk}/open/")
        reminder = record_event("voting.reminder", "voting", voting.pk, "clave", [self.user_a], data={"window_hours": 2})
        self.assertEqual(self.client.post(f"/api/v1/votings/{voting.pk}/close/").status_code, 200)
        self.assertEqual(DeliveryJob.objects.get(event=reminder).status, "cancelled")
        self.assertEqual(DeliveryJob.objects.get(event__event_type="voting.opened", user=self.user_a).status, "cancelled")
        self.assertEqual(self.recipients("voting.closed"), {self.user_a.pk, self.user_a2.pk})
        # cerrar de nuevo no duplica el aviso
        self.client.post(f"/api/v1/votings/{voting.pk}/close/")
        self.assertEqual(NotificationEvent.objects.filter(event_type="voting.closed").count(), 1)

    def test_scheduling_notifies_the_commission(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        payload = {"opens_at": (timezone.now() + timedelta(days=1)).isoformat(), "closes_at": (timezone.now() + timedelta(days=2)).isoformat()}
        self.assertEqual(self.client.post(f"/api/v1/votings/{voting.pk}/schedule/", payload, format="json").status_code, 200)
        self.assertEqual(self.recipients("voting.scheduled"), {self.user_a.pk, self.user_a2.pk})

    def test_producer_failure_never_breaks_opening(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        with patch("telegram_notifications.producers.record_event", side_effect=RuntimeError("falla simulada")):
            with self.assertLogs("telegram_notifications.producers", "ERROR"):
                response = self.client.post(f"/api/v1/votings/{voting.pk}/open/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Voting.objects.get(pk=voting.pk).status, "open")

    def test_disabled_channel_records_nothing(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        with override_settings(TELEGRAM_ENABLED=False):
            self.client.post(f"/api/v1/votings/{voting.pk}/open/")
            self.client.post(f"/api/v1/votings/{voting.pk}/close/")
        self.assertFalse(NotificationEvent.objects.exists())
