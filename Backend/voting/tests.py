from datetime import timedelta
from uuid import uuid4

from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role, User
from directory.models import Commission, CommissionMembership, Institution, Member
from notifications.models import Notification, PushOutbox
from projects.models import Project
from voting.models import Vote, Voting
from audit.models import AuditEvent


class VotingApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        commission_role = Role.objects.get(key="commission")
        member_role = Role.objects.get(key="member")
        cls.user = User.objects.create_user("voter@example.test", "Long-Unique-Passphrase-2026!", first_name="Vera", last_name="Votante")
        cls.user.roles.add(commission_role, member_role)
        cls.institution = Institution.objects.create(name="Institución ficticia")
        cls.commission = Commission.objects.create(name="Comisión ficticia")
        cls.member = Member.objects.create(user=cls.user, institution=cls.institution, first_name="Vera", last_name="Votante")
        CommissionMembership.objects.create(member=cls.member, commission=cls.commission, starts_at=timezone.localdate())
        cls.project = Project.objects.create(
            code="VOTE-001", title="Proyecto ficticio", commission=cls.commission,
            created_by=cls.user, updated_by=cls.user,
        )

    def test_voter_can_cast_only_once_and_results_are_hidden_until_close(self):
        voting = Voting.objects.create(
            commission=self.commission,
            project=self.project,
            title="Propuesta sintética",
            options=["A favor", "En contra", "Abstención"],
            status=Voting.Status.DRAFT,
            opens_at=timezone.now() - timedelta(minutes=1),
            closes_at=timezone.now() + timedelta(minutes=30),
            created_by=self.user,
        )
        client = APIClient()
        client.force_authenticate(self.user)

        opened = client.post(f"/api/v1/votings/{voting.pk}/open/")
        self.assertEqual(opened.status_code, 200)
        pending = client.get("/api/v1/votings/pending/")
        self.assertIn(voting.pk, {item["id"] for item in pending.data["results"]})
        self.assertEqual(opened.data["subject"]["title"], "Proyecto ficticio")
        hidden = client.get(f"/api/v1/votings/{voting.pk}/results/")
        self.assertEqual(hidden.status_code, 400)
        missing_request_id = client.post(f"/api/v1/votings/{voting.pk}/cast/", {"option": "A favor"}, format="json")
        self.assertEqual(missing_request_id.status_code, 400)
        request_id = str(uuid4())
        cast = client.post(f"/api/v1/votings/{voting.pk}/cast/", {
            "option": "A favor", "client_request_id": request_id,
        }, format="json")
        self.assertEqual(cast.status_code, 201)
        self.assertNotIn("option", cast.data)
        retry = client.post(f"/api/v1/votings/{voting.pk}/cast/", {
            "option": "A favor", "client_request_id": request_id,
        }, format="json")
        self.assertEqual(retry.status_code, 201)
        self.assertEqual(retry.data["cast_at"], cast.data["cast_at"])
        voted = client.get(f"/api/v1/votings/{voting.pk}/")
        self.assertTrue(voted.data["member_has_voted"])
        pending_after_vote = client.get("/api/v1/votings/pending/")
        self.assertNotIn(voting.pk, {item["id"] for item in pending_after_vote.data["results"]})
        conflicting_retry = client.post(f"/api/v1/votings/{voting.pk}/cast/", {
            "option": "En contra", "client_request_id": request_id,
        }, format="json")
        self.assertEqual(conflicting_retry.status_code, 400)
        duplicate = client.post(f"/api/v1/votings/{voting.pk}/cast/", {
            "option": "En contra", "client_request_id": str(uuid4()),
        }, format="json")
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(Vote.objects.filter(voting=voting).count(), 1)

        closed = client.post(f"/api/v1/votings/{voting.pk}/close/")
        self.assertEqual(closed.status_code, 200)
        results = client.get(f"/api/v1/votings/{voting.pk}/results/")
        self.assertEqual(results.status_code, 200)
        closed_retry = client.post(f"/api/v1/votings/{voting.pk}/cast/", {
            "option": "A favor", "client_request_id": request_id,
        }, format="json")
        self.assertEqual(closed_retry.status_code, 201)
        self.assertEqual(Vote.objects.filter(voting=voting).count(), 1)
        self.assertEqual(results.data["results"], {"A favor": 1, "En contra": 0, "Abstención": 0})
        self.assertEqual(results.data["percentages"], {"A favor": 100.0, "En contra": 0.0, "Abstención": 0.0})
        self.assertEqual(results.data["project_id"], self.project.pk)
        self.assertEqual(results.data["total_votes"], 1)
        opening_audit = AuditEvent.objects.get(action="voting.open")
        self.assertEqual(opening_audit.actor_roles, ["commission", "member"])
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 2)
        self.assertEqual(PushOutbox.objects.filter(notification__user=self.user).count(), 2)

    def test_database_constraint_prevents_second_ballot_for_same_member(self):
        voting = Voting.objects.create(
            commission=self.commission, project=self.project, title="Votación", options=["Sí", "No"],
            status=Voting.Status.OPEN, created_by=self.user,
        )
        Vote.objects.create(voting=voting, member=self.member, option="Sí")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Vote.objects.create(voting=voting, member=self.member, option="No")

    def test_list_and_results_return_automatically_refreshed_voting_state(self):
        voting = Voting.objects.create(
            commission=self.commission, project=self.project, title="Votación programada",
            options=["Sí", "No"], status=Voting.Status.SCHEDULED,
            opens_at=timezone.now() - timedelta(minutes=2), closes_at=timezone.now() + timedelta(minutes=10),
            created_by=self.user,
        )
        client = APIClient()
        client.force_authenticate(self.user)

        listed = client.get("/api/v1/votings/")
        item = next(item for item in listed.data["results"] if item["id"] == voting.pk)
        self.assertEqual(item["status"], Voting.Status.OPEN)

        voting.closes_at = timezone.now() - timedelta(seconds=1)
        voting.save(update_fields=["closes_at", "updated_at"])
        results = client.get(f"/api/v1/votings/{voting.pk}/results/")
        self.assertEqual(results.status_code, 200)
        self.assertEqual(results.data["status"], Voting.Status.CLOSED)
