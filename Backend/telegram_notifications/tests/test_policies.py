from datetime import timedelta
from itertools import count
from uuid import uuid4

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from accounts.models import Role, User
from directory.models import Commission, CommissionMembership, Institution, Member
from meetings.access import visible_meetings_for
from meetings.models import Meeting
from projects.models import Project
from telegram_notifications import events, policies
from telegram_notifications.models import DeliveryJob, NotificationEvent
from voting.models import Vote, Voting

PASSWORD = "Long-Unique-Passphrase-2026!"
_codes = count(1)


class PolicyFixtureMixin:
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.institution = Institution.objects.create(name="Institución ficticia")
        cls.commission_a = Commission.objects.create(name="Comisión A")
        cls.commission_b = Commission.objects.create(name="Comisión B")
        cls.admin = cls.make_user("admin", "commission")
        cls.reader = cls.make_user("reader", "reader")
        cls.member_a, cls.user_a = cls.make_member("a", cls.commission_a)
        cls.member_a2, cls.user_a2 = cls.make_member("a2", cls.commission_a)
        cls.member_b, cls.user_b = cls.make_member("b", cls.commission_b)
        cls.no_roles = User.objects.create_user("noroles@example.test", PASSWORD, first_name="Sin", last_name="Roles")

    @classmethod
    def make_user(cls, label, role_key):
        user = User.objects.create_user(f"{label}@example.test", PASSWORD, first_name=label.title(), last_name="Ficticio")
        user.roles.add(Role.objects.get(key=role_key))
        return user

    @classmethod
    def make_member(cls, label, commission):
        user = cls.make_user(f"member-{label}", "member")
        member = Member.objects.create(user=user, institution=cls.institution, first_name=label.title(), last_name="Miembro")
        CommissionMembership.objects.create(member=member, commission=commission, starts_at=timezone.localdate() - timedelta(days=10))
        return member, user

    def meeting(self, commission=None, invited=(), **fields):
        meeting = Meeting.objects.create(
            commission=commission or self.commission_a,
            title=fields.pop("title", "Sesión ordinaria"),
            scheduled_at=fields.pop("scheduled_at", timezone.now() + timedelta(days=2)),
            created_by=self.admin,
            **fields,
        )
        meeting.invited_members.add(*invited)
        return meeting

    def voting(self, commission=None, **fields):
        commission = commission or self.commission_a
        project = fields.pop("project", None) or Project.objects.create(
            code=f"POL-{next(_codes):03d}", title="Proyecto ficticio", commission=commission, created_by=self.admin, updated_by=self.admin,
        )
        return Voting.objects.create(
            commission=commission,
            project=project,
            title=fields.pop("title", "Plan 2027"),
            status=fields.pop("status", Voting.Status.OPEN),
            options=["A favor", "En contra"],
            opens_at=fields.pop("opens_at", timezone.now() - timedelta(hours=1)),
            closes_at=fields.pop("closes_at", timezone.now() + timedelta(hours=5)),
            created_by=self.admin,
            **fields,
        )

    @staticmethod
    def job(user, event_type, resource, key="", data=None):
        resource_type = event_type.split(".")[0]
        event, _ = NotificationEvent.objects.get_or_create(
            event_type=event_type, resource_type=resource_type, resource_id=str(resource.pk), occurrence_key=key, defaults={"data": data or {}},
        )
        return DeliveryJob.objects.get_or_create(event=event, user=user)[0]


class MeetingPolicyTests(PolicyFixtureMixin, TestCase):
    def test_invited_member_receives_the_notice_with_current_data(self):
        meeting = self.meeting(invited=[self.member_a], modality="virtual", meeting_link="https://meet.example.test/x")
        message = policies.authorize_and_render(self.job(self.user_a, "meeting.created", meeting))
        self.assertIsNotNone(message)
        self.assertIn("Sesión ordinaria", message.text)
        self.assertIn("https://meet.example.test/x", message.text)

    def test_content_uses_current_title_not_event_data(self):
        meeting = self.meeting(invited=[self.member_a])
        job = self.job(self.user_a, "meeting.created", meeting, data={"title": "Título viejo"})
        meeting.title = "Título vigente"
        meeting.save()
        text = policies.authorize_and_render(job).text
        self.assertIn("Título vigente", text)
        self.assertNotIn("Título viejo", text)

    def test_other_commission_and_not_invited_members_get_nothing(self):
        meeting = self.meeting(invited=[self.member_a])
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_b, "meeting.created", meeting)))
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a2, "meeting.created", meeting)))

    def test_invited_member_of_another_commission_is_still_blocked(self):
        meeting = self.meeting(commission=self.commission_a, invited=[self.member_b])
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_b, "meeting.created", meeting)))

    def test_lost_access_before_delivery_cancels(self):
        meeting = self.meeting(invited=[self.member_a])
        job = self.job(self.user_a, "meeting.created", meeting)
        self.assertIsNotNone(policies.authorize_and_render(job))
        meeting.invited_members.remove(self.member_a)
        self.assertIsNone(policies.authorize_and_render(job))
        meeting.invited_members.add(self.member_a)
        CommissionMembership.objects.filter(member=self.member_a).update(ends_at=timezone.localdate() - timedelta(days=1))
        self.assertIsNone(policies.authorize_and_render(job))

    def test_inactive_accounts_and_members_get_nothing(self):
        meeting = self.meeting(invited=[self.member_a])
        job = self.job(self.user_a, "meeting.created", meeting)
        Member.objects.filter(pk=self.member_a.pk).update(is_active=False)
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(pk=job.pk)))
        Member.objects.filter(pk=self.member_a.pk).update(is_active=True)
        User.objects.filter(pk=self.user_a.pk).update(is_active=False)
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(pk=job.pk)))

    def test_user_without_read_capability_gets_nothing(self):
        meeting = self.meeting()
        self.assertIsNone(policies.authorize_and_render(self.job(self.no_roles, "meeting.created", meeting)))

    def test_temporary_confidential_meeting_is_hidden_from_members(self):
        meeting = self.meeting(invited=[self.member_a], confidentiality=Meeting.Confidentiality.TEMPORARY)
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "meeting.created", meeting)))

    def test_past_meeting_is_dropped(self):
        meeting = self.meeting(invited=[self.member_a], scheduled_at=timezone.now() - timedelta(minutes=1))
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "meeting.created", meeting)))

    def test_reschedule_invalidates_old_reminder_but_not_the_new_one(self):
        meeting = self.meeting(invited=[self.member_a])
        old = self.job(self.user_a, "meeting.reminder", meeting, events.occurrence_key(meeting.scheduled_at, 24), {"window_hours": 24})
        self.assertIn("Comienza en 24 horas", policies.authorize_and_render(old).text)
        meeting.scheduled_at += timedelta(days=1)
        meeting.save()
        self.assertIsNone(policies.authorize_and_render(old))
        new = self.job(self.user_a, "meeting.reminder", meeting, events.occurrence_key(meeting.scheduled_at, 24), {"window_hours": 24})
        self.assertIsNotNone(policies.authorize_and_render(new))

    def test_reminder_key_built_from_local_time_still_matches(self):
        meeting = self.meeting(invited=[self.member_a])
        local_key = events.occurrence_key(timezone.localtime(meeting.scheduled_at), 24)  # p. ej. la fecha que devuelve un serializer
        job = self.job(self.user_a, "meeting.reminder", meeting, local_key, {"window_hours": 24})
        self.assertIn("Comienza en 24 horas", policies.authorize_and_render(job).text)

    def test_reminder_without_valid_window_is_dropped(self):
        meeting = self.meeting(invited=[self.member_a])
        job = self.job(self.user_a, "meeting.reminder", meeting, events.occurrence_key(meeting.scheduled_at, 24), {"window_hours": 24})
        self.assertIsNotNone(policies.authorize_and_render(job))
        for data in ({}, {"window_hours": "24"}, {"window_hours": 0}, {"window_hours": True}):
            job.event.data = data
            job.event.save()
            self.assertIsNone(policies.authorize_and_render(job), data)

    def test_cancellation_only_after_archive_and_only_for_those_who_had_access(self):
        meeting = self.meeting(invited=[self.member_a])
        cancel_a = self.job(self.user_a, "meeting.cancelled", meeting)
        cancel_b = self.job(self.user_b, "meeting.cancelled", meeting)
        self.assertIsNone(policies.authorize_and_render(cancel_a))  # aún no está archivada
        meeting.deleted_at = timezone.now()
        meeting.save()
        message = policies.authorize_and_render(cancel_a)
        self.assertIn("Reunión cancelada", message.text)
        self.assertIsNone(policies.authorize_and_render(cancel_b))
        # una reunión archivada no admite otros avisos
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "meeting.created", meeting)))

    def test_updated_notice_lists_changes(self):
        meeting = self.meeting(invited=[self.member_a])
        job = self.job(self.user_a, "meeting.updated", meeting, "v1", {"changed": ["location", "agenda"]})
        text = policies.authorize_and_render(job).text
        self.assertIn("Cambió: lugar.", text)

    def test_could_see_meeting_matches_visible_meetings_for(self):
        inactive_commission = Commission.objects.create(name="Comisión inactiva", is_active=False)
        meetings = [
            self.meeting(invited=[self.member_a]),
            self.meeting(invited=[self.member_a, self.member_b], confidentiality=Meeting.Confidentiality.PUBLIC),
            self.meeting(invited=[self.member_a], confidentiality=Meeting.Confidentiality.TEMPORARY),
            self.meeting(commission=inactive_commission, invited=[self.member_a]),
            self.meeting(commission=self.commission_b, invited=[self.member_b]),
        ]
        for user in (self.admin, self.reader, self.user_a, self.user_a2, self.user_b, self.no_roles):
            for meeting in meetings:
                with self.subTest(user=user.email, meeting=meeting.pk):
                    self.assertEqual(policies._could_see_meeting(user, meeting), visible_meetings_for(user).filter(pk=meeting.pk).exists())


class VotingPolicyTests(PolicyFixtureMixin, TestCase):
    def test_eligible_member_receives_opened_notice(self):
        voting = self.voting()
        message = policies.authorize_and_render(self.job(self.user_a, "voting.opened", voting))
        self.assertIn("Votación abierta\nPlan 2027", message.text)

    def test_other_commission_member_gets_nothing(self):
        voting = self.voting()
        for event_type in ("voting.opened", "voting.closed", "voting.scheduled"):
            self.assertIsNone(policies.authorize_and_render(self.job(self.user_b, event_type, voting)))

    def test_notice_is_dropped_when_status_no_longer_matches(self):
        voting = self.voting(status=Voting.Status.OPEN)
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "voting.closed", voting)))
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "voting.scheduled", voting)))
        voting.status = Voting.Status.CLOSED
        voting.save()
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "voting.opened", voting)))
        self.assertEqual(policies.authorize_and_render(self.job(self.user_a, "voting.closed", voting)).text, "Votación cerrada\nPlan 2027")

    def test_draft_voting_is_not_visible_to_members(self):
        voting = self.voting(status=Voting.Status.DRAFT)
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "voting.scheduled", voting)))

    def test_archived_voting_is_dropped(self):
        voting = self.voting(deleted_at=timezone.now())
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "voting.opened", voting)))

    def test_temporary_confidential_project_is_hidden_from_members(self):
        project = Project.objects.create(
            code="POL-TEMP", title="Reservado", commission=self.commission_a, created_by=self.admin, updated_by=self.admin,
            confidentiality=Project.Confidentiality.TEMPORARY,
        )
        voting = self.voting(project=project)
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_a, "voting.opened", voting)))

    def test_reminder_goes_only_to_eligible_members_who_have_not_voted(self):
        voting = self.voting()
        key = events.occurrence_key(voting.closes_at, 2)
        data = {"window_hours": 2}
        pending = self.job(self.user_a, "voting.reminder", voting, key, data)
        self.assertIn("Aún no registras tu voto", policies.authorize_and_render(pending).text)
        Vote.objects.create(voting=voting, member=self.member_a, option="A favor", client_request_id=uuid4())
        self.assertIsNone(policies.authorize_and_render(pending))
        self.assertIsNone(policies.authorize_and_render(self.job(self.user_b, "voting.reminder", voting, key, data)))
        self.assertIsNotNone(policies.authorize_and_render(self.job(self.user_a2, "voting.reminder", voting, key, data)))

    def test_reminder_is_dropped_if_close_time_changed_or_passed(self):
        voting = self.voting()
        key = events.occurrence_key(voting.closes_at, 2)
        job = self.job(self.user_a, "voting.reminder", voting, key, {"window_hours": 2})
        voting.closes_at += timedelta(hours=1)
        voting.save()
        self.assertIsNone(policies.authorize_and_render(job))
        voting.closes_at = timezone.now() - timedelta(minutes=1)
        voting.save()
        expired = self.job(self.user_a, "voting.reminder", voting, events.occurrence_key(voting.closes_at, 2), {"window_hours": 2})
        self.assertIsNone(policies.authorize_and_render(expired))

    def test_reminder_is_not_sent_to_viewers_who_cannot_vote(self):
        voting = self.voting()
        key = events.occurrence_key(voting.closes_at, 2)
        self.assertIsNone(policies.authorize_and_render(self.job(self.reader, "voting.reminder", voting, key, {"window_hours": 2})))


class GeneralPolicyTests(PolicyFixtureMixin, TestCase):
    def test_unknown_event_or_mismatched_resource_is_dropped(self):
        meeting = self.meeting(invited=[self.member_a])
        event = NotificationEvent.objects.create(event_type="otro.evento", resource_type="meeting", resource_id=str(meeting.pk))
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.create(event=event, user=self.user_a)))
        event = NotificationEvent.objects.create(event_type="meeting.created", resource_type="voting", resource_id=str(meeting.pk))
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.create(event=event, user=self.user_a)))

    def test_missing_or_invalid_resource_is_dropped(self):
        event = NotificationEvent.objects.create(event_type="meeting.created", resource_type="meeting", resource_id="999999")
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.create(event=event, user=self.user_a)))
        event = NotificationEvent.objects.create(event_type="voting.opened", resource_type="voting", resource_id="no-es-numero")
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.create(event=event, user=self.user_a)))
