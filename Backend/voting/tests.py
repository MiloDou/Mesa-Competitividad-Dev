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


class VisibleVotingsForTests(TestCase):
    """Regla de acceso extraída de ``VotingViewSet`` y reutilizada por las políticas de Telegram."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        password = "Long-Unique-Passphrase-2026!"
        institution = Institution.objects.create(name="Institución ficticia")
        cls.own, other = Commission.objects.create(name="Comisión propia"), Commission.objects.create(name="Comisión ajena")
        cls.manager = User.objects.create_user("manager@example.test", password)
        cls.manager.roles.add(Role.objects.get(key="commission"))
        cls.voter, cls.outsider, cls.no_member, cls.inactive = (
            User.objects.create_user(f"{name}@example.test", password) for name in ("voter", "outsider", "nomember", "inactive")
        )
        for user, commission, active in ((cls.voter, cls.own, True), (cls.outsider, other, True), (cls.inactive, cls.own, False)):
            user.roles.add(Role.objects.get(key="member"))
            member = Member.objects.create(user=user, institution=institution, first_name="Persona", last_name="Ficticia", is_active=active)
            CommissionMembership.objects.create(member=member, commission=commission, starts_at=timezone.localdate())
        cls.no_member.roles.add(Role.objects.get(key="member"))
        confidential = Project.objects.create(
            code="VIS-001", title="Proyecto reservado", commission=cls.own, confidentiality=Project.Confidentiality.TEMPORARY,
            created_by=cls.manager, updated_by=cls.manager,
        )
        public = Project.objects.create(code="VIS-002", title="Proyecto público", commission=cls.own, created_by=cls.manager, updated_by=cls.manager)
        later = timezone.now() + timedelta(days=1)

        def voting(title, commission=cls.own, status=Voting.Status.OPEN, project=public, **extra):
            return Voting.objects.create(
                commission=commission, project=project, title=title, options=["Sí", "No"], status=status, created_by=cls.manager, **extra
            )

        cls.open = voting("Abierta")
        cls.scheduled = voting("Programada", status=Voting.Status.SCHEDULED, opens_at=later, closes_at=later + timedelta(hours=1))
        cls.closed = voting("Cerrada", status=Voting.Status.CLOSED)
        cls.draft = voting("Borrador", status=Voting.Status.DRAFT)
        cls.foreign = voting("De otra comisión", commission=other)
        cls.secret = voting("Confidencial", project=confidential)
        voting("Eliminada", deleted_at=timezone.now())

    def visible(self, user):
        from voting.access import visible_votings_for

        return set(visible_votings_for(user))

    def test_manager_sees_every_non_deleted_voting(self):
        self.assertEqual(self.visible(self.manager), {self.open, self.scheduled, self.closed, self.draft, self.foreign, self.secret})

    def test_member_sees_only_published_non_confidential_votings_of_own_commission(self):
        self.assertEqual(self.visible(self.voter), {self.open, self.scheduled, self.closed})
        self.assertEqual(self.visible(self.outsider), {self.foreign})

    def test_user_without_active_member_sees_nothing(self):
        self.assertEqual(self.visible(self.no_member), set())
        self.assertEqual(self.visible(self.inactive), set())

    def test_api_list_uses_the_same_rule(self):
        client = APIClient()
        for user in (self.manager, self.voter, self.outsider, self.no_member):
            client.force_authenticate(user)
            listed = {item["id"] for item in client.get("/api/v1/votings/?page_size=50").data["results"]}
            self.assertEqual(listed, {voting.pk for voting in self.visible(user)}, user.email)
