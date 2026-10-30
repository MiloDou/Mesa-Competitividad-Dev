from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase
from django.utils import timezone

from meetings.models import Meeting
from telegram_notifications import events, policies, reminders
from telegram_notifications.models import DeliveryJob, NotificationEvent, TelegramLink
from telegram_notifications.tests.test_policies import PolicyFixtureMixin
from voting.models import Vote, Voting


class ReminderFixtureMixin(PolicyFixtureMixin):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        for user, chat_id in ((cls.user_a, 101), (cls.user_a2, 102), (cls.user_b, 103)):
            TelegramLink.objects.create(user=user, chat_id=chat_id, status=TelegramLink.Status.ACTIVE)

    def reminder_jobs(self, event_type):
        return DeliveryJob.objects.filter(event__event_type=event_type)


class MeetingReminderTests(ReminderFixtureMixin, TestCase):
    def setUp(self):
        self.scheduled = timezone.now() + timedelta(days=3)
        self.reminder_meeting = self.meeting(invited=[self.member_a], scheduled_at=self.scheduled)
        self.due = self.scheduled - timedelta(hours=24)

    def test_creates_the_due_reminder_only_for_linked_invited_members(self):
        created = reminders.generate_due(self.due + timedelta(minutes=5))
        self.assertEqual(created, 1)
        event = NotificationEvent.objects.get(event_type="meeting.reminder")
        self.assertEqual(event.data, {"window_hours": 24})
        self.assertEqual(event.occurrence_key, events.occurrence_key(self.scheduled, 24))
        self.assertEqual(list(self.reminder_jobs("meeting.reminder").values_list("user_id", "run_after")), [(self.user_a.pk, self.due)])

    def test_running_repeatedly_does_not_duplicate(self):
        now = self.due + timedelta(minutes=5)
        self.assertEqual(reminders.generate_due(now), 1)
        for _ in range(3):
            self.assertEqual(reminders.generate_due(now + timedelta(minutes=1)), 0)
        self.assertEqual(NotificationEvent.objects.filter(event_type="meeting.reminder").count(), 1)
        self.assertEqual(self.reminder_jobs("meeting.reminder").count(), 1)

    def test_sent_or_cancelled_jobs_are_not_recreated(self):
        now = self.due + timedelta(minutes=5)
        reminders.generate_due(now)
        DeliveryJob.objects.update(status=DeliveryJob.Status.CANCELLED)
        reminders.generate_due(now + timedelta(minutes=1))
        self.assertEqual(list(DeliveryJob.objects.values_list("status", flat=True)), ["cancelled"])

    def test_nothing_before_the_window_or_after_the_grace_period(self):
        self.assertEqual(reminders.generate_due(self.due - timedelta(minutes=1)), 0)
        self.assertEqual(reminders.generate_due(self.due + reminders.GRACE + timedelta(minutes=1)), 0)
        self.assertFalse(NotificationEvent.objects.exists())

    def test_generates_the_one_hour_window_too(self):
        self.assertEqual(reminders.generate_due(self.scheduled - timedelta(hours=1) + timedelta(minutes=2)), 1)
        self.assertEqual(NotificationEvent.objects.get().data, {"window_hours": 1})

    def test_window_that_passed_before_the_meeting_was_created_is_skipped(self):
        Meeting.objects.filter(pk=self.reminder_meeting.pk).delete()
        soon = self.meeting(invited=[self.member_a], title="Sesión corta", scheduled_at=timezone.now() + timedelta(hours=10))
        self.assertEqual(reminders.generate_due(soon.scheduled_at - timedelta(hours=24) + timedelta(minutes=5)), 0)  # el 24 h ya había pasado
        self.assertEqual(reminders.generate_due(soon.scheduled_at - timedelta(hours=1) + timedelta(minutes=5)), 1)

    def test_archived_or_past_meetings_get_no_reminder(self):
        Meeting.objects.filter(pk=self.reminder_meeting.pk).update(deleted_at=timezone.now())
        self.assertEqual(reminders.generate_due(self.due + timedelta(minutes=5)), 0)
        Meeting.objects.filter(pk=self.reminder_meeting.pk).update(deleted_at=None)
        self.assertEqual(reminders.generate_due(self.scheduled + timedelta(minutes=1)), 0)

    def test_member_linked_later_gets_a_job_within_the_window(self):
        TelegramLink.objects.filter(user=self.user_a).update(status=TelegramLink.Status.PAUSED)
        now = self.due + timedelta(minutes=5)
        self.assertEqual(reminders.generate_due(now), 1)
        self.assertEqual(self.reminder_jobs("meeting.reminder").count(), 0)
        TelegramLink.objects.filter(user=self.user_a).update(status=TelegramLink.Status.ACTIVE)
        self.assertEqual(reminders.generate_due(now + timedelta(minutes=1)), 0)
        self.assertEqual(self.reminder_jobs("meeting.reminder").count(), 1)

    def test_reschedule_invalidates_the_old_reminder_and_creates_a_new_one(self):
        reminders.generate_due(self.due + timedelta(minutes=5))
        old_job = self.reminder_jobs("meeting.reminder").get()
        Meeting.objects.filter(pk=self.reminder_meeting.pk).update(scheduled_at=self.scheduled + timedelta(days=1))
        self.assertEqual(reminders.cancel_reminders("meeting", self.reminder_meeting.pk, "Reprogramada"), 1)
        old_job.refresh_from_db()
        self.assertEqual((old_job.status, old_job.cancel_reason), ("cancelled", "Reprogramada"))
        self.assertEqual(reminders.generate_due(self.due + timedelta(days=1, minutes=5)), 1)
        self.assertEqual(NotificationEvent.objects.filter(event_type="meeting.reminder").count(), 2)

    def test_old_reminder_is_rejected_by_policy_even_if_not_cancelled(self):
        reminders.generate_due(self.due + timedelta(minutes=5))
        job = self.reminder_jobs("meeting.reminder").get()
        self.assertIn("Comienza en 24 horas", policies.authorize_and_render(job).text)
        Meeting.objects.filter(pk=self.reminder_meeting.pk).update(scheduled_at=self.scheduled + timedelta(days=1))
        job = DeliveryJob.objects.get(pk=job.pk)
        self.assertIsNone(policies.authorize_and_render(job))


class VotingReminderTests(ReminderFixtureMixin, TestCase):
    def setUp(self):
        base = timezone.now()
        self.closes = base + timedelta(hours=5)
        self.open_voting = self.voting(opens_at=base - timedelta(hours=1), closes_at=self.closes)
        self.due = self.closes - timedelta(hours=2)

    def test_reminds_only_commission_members_who_have_not_voted(self):
        Vote.objects.create(voting=self.open_voting, member=self.member_a, option="A favor", client_request_id=uuid4())
        self.assertEqual(reminders.generate_due(self.due + timedelta(minutes=5)), 1)
        event = NotificationEvent.objects.get(event_type="voting.reminder")
        self.assertEqual((event.data, event.occurrence_key), ({"window_hours": 2}, events.occurrence_key(self.closes, 2)))
        recipients = set(self.reminder_jobs("voting.reminder").values_list("user_id", flat=True))
        self.assertEqual(recipients, {self.user_a2.pk})  # a ya votó; b es de otra comisión

    def test_window_before_the_voting_opened_is_skipped(self):
        # la votación abrió hace 1 h: el recordatorio de 24 h nunca aplica
        self.assertEqual(reminders.generate_due(self.closes - timedelta(hours=24) + timedelta(minutes=5)), 0)

    def test_running_repeatedly_does_not_duplicate(self):
        now = self.due + timedelta(minutes=5)
        self.assertEqual(reminders.generate_due(now), 1)
        self.assertEqual(reminders.generate_due(now + timedelta(minutes=1)), 0)
        self.assertEqual(self.reminder_jobs("voting.reminder").count(), 2)  # a y a2

    def test_closed_or_archived_votings_get_no_reminder(self):
        Voting.objects.filter(pk=self.open_voting.pk).update(status=Voting.Status.CLOSED)
        self.assertEqual(reminders.generate_due(self.due + timedelta(minutes=5)), 0)
        Voting.objects.filter(pk=self.open_voting.pk).update(status=Voting.Status.OPEN, deleted_at=timezone.now())
        self.assertEqual(reminders.generate_due(self.due + timedelta(minutes=5)), 0)

    def test_generated_reminder_passes_the_policy_and_stops_after_voting(self):
        reminders.generate_due(self.due + timedelta(minutes=5))
        job = self.reminder_jobs("voting.reminder").get(user=self.user_a2)
        self.assertIn("Aún no registras tu voto", policies.authorize_and_render(job).text)
        Vote.objects.create(voting=self.open_voting, member=self.member_a2, option="A favor", client_request_id=uuid4())
        self.assertIsNone(policies.authorize_and_render(job))


class VotingLifecycleTests(ReminderFixtureMixin, TestCase):
    def test_generate_due_opens_scheduled_and_closes_expired_votings(self):
        now = timezone.now()
        scheduled = self.voting(status=Voting.Status.SCHEDULED, opens_at=now - timedelta(minutes=1), closes_at=now + timedelta(hours=3))
        expired = self.voting(status=Voting.Status.OPEN, opens_at=now - timedelta(hours=2), closes_at=now - timedelta(hours=1))
        future = self.voting(status=Voting.Status.SCHEDULED, opens_at=now + timedelta(hours=1), closes_at=now + timedelta(hours=3))
        reminders.generate_due(now)
        statuses = {voting.pk: Voting.objects.get(pk=voting.pk).status for voting in (scheduled, expired, future)}
        self.assertEqual(statuses, {scheduled.pk: "open", expired.pk: "closed", future.pk: "scheduled"})

    def test_a_failing_voting_does_not_stop_the_rest(self):
        now = timezone.now()
        first = self.voting(status=Voting.Status.OPEN, opens_at=now - timedelta(hours=2), closes_at=now - timedelta(hours=1))
        second = self.voting(status=Voting.Status.OPEN, opens_at=now - timedelta(hours=2), closes_at=now - timedelta(hours=1))
        real = reminders.refresh_voting

        def flaky(voting):
            if voting.pk == first.pk:
                raise RuntimeError("falla simulada")
            return real(voting)

        with patch.object(reminders, "refresh_voting", side_effect=flaky), self.assertLogs("telegram_notifications.reminders", "ERROR"):
            self.assertEqual(reminders.generate_due(now), 0)
        self.assertEqual(Voting.objects.get(pk=first.pk).status, "open")
        self.assertEqual(Voting.objects.get(pk=second.pk).status, "closed")

    def test_generate_due_without_data_returns_zero(self):
        self.assertEqual(reminders.generate_due(), 0)
