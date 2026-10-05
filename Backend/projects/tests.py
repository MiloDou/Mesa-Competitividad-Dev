import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role, User
from directory.models import Commission, CommissionMembership, Institution, Member
from projects.models import Document, Project, ProjectAssignment


class ProjectAndDocumentApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.user = User.objects.create_user("editor@example.test", "Long-Unique-Passphrase-2026!", first_name="Edu", last_name="Editor")
        cls.user.roles.add(Role.objects.get(key="editor"))
        cls.commission = Commission.objects.create(name="Comisión de documentos")

    def test_document_upload_is_private_and_download_requires_capability(self):
        project = Project.objects.create(
            code="DOC-1", title="Iniciativa privada", commission=self.commission,
            created_by=self.user, updated_by=self.user,
        )
        client = APIClient()
        client.force_authenticate(self.user)
        with tempfile.TemporaryDirectory() as media_dir, override_settings(MEDIA_ROOT=media_dir):
            expected = b"%PDF-1.7\n" + "contenido sintético".encode("utf-8")
            upload = SimpleUploadedFile("resumen.pdf", expected, content_type="text/plain")
            response = client.post("/api/v1/documents/", {"project": project.pk, "title": "Resumen", "file": upload}, format="multipart")
            self.assertEqual(response.status_code, 201)
            document_id = response.data["id"]
            self.assertNotIn("file", response.data)
            self.assertIn("/api/v1/documents/", response.data["download_url"])
            document = Document.objects.get(pk=document_id)
            self.assertEqual(document.original_name, "resumen.pdf")
            self.assertEqual(document.confidentiality, Project.Confidentiality.INTERNAL)

            downloaded = client.get(response.data["download_url"])
            self.assertEqual(downloaded.status_code, 200)
            self.assertEqual(b"".join(downloaded.streaming_content), expected)

            invalid = SimpleUploadedFile("falso.pdf", b"esto es texto plano", content_type="application/pdf")
            rejected = client.post("/api/v1/documents/", {"project": project.pk, "title": "Falso", "file": invalid}, format="multipart")
            self.assertEqual(rejected.status_code, 400)

            confidential_upload = SimpleUploadedFile("confidencial.pdf", expected, content_type="application/pdf")
            confidential = client.post("/api/v1/documents/", {
                "project": project.pk,
                "title": "Documento confidencial",
                "confidentiality": Project.Confidentiality.TEMPORARY,
                "file": confidential_upload,
            }, format="multipart")
            self.assertEqual(confidential.status_code, 400)

    def test_openapi_schema_lists_versioned_business_routes(self):
        response = APIClient().get("/api/schema/", HTTP_ACCEPT="application/json")
        self.assertEqual(response.status_code, 200)
        paths = response.data["paths"]
        self.assertIn("/api/v1/votings/{id}/cast/", paths)
        self.assertIn("/api/v1/public/events/{slug}/register/", paths)
        self.assertIn("/api/v1/auth/refresh/", paths)
        self.assertIn("/api/v1/project-assignments/", paths)
        self.assertIn("/api/v1/votings/pending/", paths)
        self.assertIn("/api/v1/site-profile/", paths)
        self.assertIn("/api/v1/media-assets/{id}/download/", paths)
        self.assertIn("/api/v1/public/site-profile/", paths)
        self.assertIn("/api/v1/public/media-assets/{id}/download/", paths)
        self.assertNotIn("/api/v1/notifications/broadcast/", paths)

    def test_project_assignment_preserves_responsibility_history(self):
        project = Project.objects.create(
            code="RESP-1", title="Proyecto con responsables", commission=self.commission,
            created_by=self.user, updated_by=self.user,
        )
        institution = Institution.objects.create(name="Institución responsable")
        member = Member.objects.create(institution=institution, first_name="Rosa", last_name="Responsable")
        CommissionMembership.objects.create(member=member, commission=self.commission, starts_at=timezone.localdate())
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post("/api/v1/project-assignments/", {
            "project": project.pk,
            "member": member.pk,
            "responsibility": "Coordinación",
            "starts_at": timezone.localdate().isoformat(),
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ProjectAssignment.objects.get(pk=response.data["id"]).assigned_by, self.user)

    def test_member_project_scope_hides_temporary_confidentiality(self):
        institution = Institution.objects.create(name="Institución lectora")
        mobile_user = User.objects.create_user("project-member@example.test", "Long-Unique-Passphrase-2026!", first_name="Mía", last_name="Miembro")
        mobile_user.roles.add(Role.objects.get(key="member"))
        member = Member.objects.create(user=mobile_user, institution=institution, first_name="Mía", last_name="Miembro")
        CommissionMembership.objects.create(member=member, commission=self.commission, starts_at=timezone.localdate())
        internal = Project.objects.create(
            code="SAFE-1", title="Proyecto interno", commission=self.commission,
            confidentiality=Project.Confidentiality.INTERNAL, status=Project.Status.ACTIVE,
            created_by=self.user, updated_by=self.user,
        )
        confidential = Project.objects.create(
            code="SAFE-2", title="Proyecto confidencial temporal", commission=self.commission,
            confidentiality=Project.Confidentiality.TEMPORARY, status=Project.Status.ACTIVE,
            created_by=self.user, updated_by=self.user,
        )
        client = APIClient()
        client.force_authenticate(mobile_user)
        response = client.get("/api/v1/projects/")
        project_ids = {item["id"] for item in response.data["results"]}
        self.assertIn(internal.pk, project_ids)
        self.assertNotIn(confidential.pk, project_ids)

        editor_client = APIClient()
        editor_client.force_authenticate(self.user)
        editor_response = editor_client.get("/api/v1/projects/")
        editor_ids = {item["id"] for item in editor_response.data["results"]}
        self.assertIn(internal.pk, editor_ids)
        self.assertNotIn(confidential.pk, editor_ids)

        commission_user = User.objects.create_user("commission-admin@example.test", "Long-Unique-Passphrase-2026!", first_name="Comisión", last_name="Admin")
        commission_user.roles.add(Role.objects.get(key="commission"))
        commission_client = APIClient()
        commission_client.force_authenticate(commission_user)
        commission_response = commission_client.get("/api/v1/projects/")
        commission_ids = {item["id"] for item in commission_response.data["results"]}
        self.assertIn(confidential.pk, commission_ids)

        editor_create = editor_client.post("/api/v1/projects/", {
            "code": "TEMP-EDITOR",
            "title": "Negociación temporal",
            "commission": self.commission.pk,
            "confidentiality": Project.Confidentiality.TEMPORARY,
        }, format="json")
        self.assertEqual(editor_create.status_code, 400)
