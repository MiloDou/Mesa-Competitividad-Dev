from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role, User
from directory.models import Commission, CommissionMembership, Institution, Member
from portal.models import Publication
from projects.models import FollowUpTopic, Project


class DirectoryAndPrivacyApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.member_user = User.objects.create_user("reader@example.test", "Long-Unique-Passphrase-2026!", first_name="Rosa", last_name="Lectora")
        cls.member_user.roles.add(Role.objects.get(key="member"))
        cls.institution = Institution.objects.create(name="Institución de prueba")
        cls.commission = Commission.objects.create(name="Comisión de prueba")
        cls.member = Member.objects.create(
            user=cls.member_user,
            institution=cls.institution,
            first_name="Rosa",
            last_name="Lectora",
            email="rosa@example.test",
            phone="+502 0000 0000",
            public_profile_consent=True,
            public_contact_consent=False,
        )
        CommissionMembership.objects.create(member=cls.member, commission=cls.commission, starts_at=timezone.localdate())

    def test_public_directory_hides_personal_contacts_without_consent(self):
        response = APIClient().get("/api/v1/public/members/")
        self.assertEqual(response.status_code, 200)
        result = response.data["results"][0]
        self.assertEqual(result["name"], "Rosa Lectora")
        self.assertEqual(result["institution"], self.institution.name)
        self.assertEqual(result["email"], "")
        self.assertEqual(result["phone"], "")
        self.assertNotIn("user", result)

    def test_member_only_sees_projects_in_their_commission_and_public_projects(self):
        own_project = Project.objects.create(
            code="P-OWN", title="Proyecto interno propio", status=Project.Status.ACTIVE,
            confidentiality=Project.Confidentiality.INTERNAL, commission=self.commission,
            created_by=self.member_user, updated_by=self.member_user,
        )
        other_commission = Commission.objects.create(name="Otra comisión")
        private_project = Project.objects.create(
            code="P-OTHER", title="Proyecto confidencial ajeno", status=Project.Status.ACTIVE,
            confidentiality=Project.Confidentiality.TEMPORARY, commission=other_commission,
            created_by=self.member_user, updated_by=self.member_user,
        )
        public_project = Project.objects.create(
            code="P-PUBLIC", title="Proyecto público", status=Project.Status.ACTIVE,
            confidentiality=Project.Confidentiality.PUBLIC, is_public=True, commission=other_commission,
            created_by=self.member_user, updated_by=self.member_user,
        )
        FollowUpTopic.objects.create(project=public_project, title="Mejora vial", description="Avance sintético", created_by=self.member_user)
        client = APIClient()
        client.force_authenticate(self.member_user)
        internal = client.get("/api/v1/projects/")
        self.assertEqual(internal.status_code, 200)
        ids = {row["id"] for row in internal.data["results"]}
        self.assertIn(own_project.pk, ids)
        self.assertIn(public_project.pk, ids)
        self.assertNotIn(private_project.pk, ids)

        public = APIClient().get("/api/v1/public/projects/")
        self.assertEqual(public.status_code, 200)
        public_ids = {row["id"] for row in public.data["results"]}
        self.assertEqual(public_ids, {public_project.pk})
        self.assertEqual(public.data["results"][0]["follow_up_topics"][0]["progress"], "in_progress")

    def test_editor_cannot_publish_content(self):
        editor = User.objects.create_user("editor@example.test", "Long-Unique-Passphrase-2026!", first_name="Eli", last_name="Editor")
        editor.roles.add(Role.objects.get(key="editor"))
        publication = Publication.objects.create(title="Borrador", slug="borrador", body="Texto simple", author=editor, updated_by=editor)
        client = APIClient()
        client.force_authenticate(editor)
        response = client.post(f"/api/v1/publications/{publication.pk}/publish/")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(publication.status, Publication.Status.DRAFT)
