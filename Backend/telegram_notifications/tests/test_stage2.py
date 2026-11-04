"""Etapa 2 de Persona B: proyectos, documentos, minutas, acuerdos, seguimiento y botones."""
import shutil
import tempfile
from datetime import date, datetime, timedelta
from itertools import count
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from directory.models import CommissionMembership
from meetings.models import Agreement, Minute
from projects.access import visible_documents_for, visible_projects_for
from projects.models import Document, FollowUpTopic, Project, ProjectAssignment
from telegram_notifications import events, policies, reminders, templates
from telegram_notifications.contracts import record_event
from telegram_notifications.models import DeliveryJob, NotificationEvent
from telegram_notifications.tests.test_reminders import ReminderFixtureMixin

_codes = count(1)
PDF = b"%PDF-1.4\n%ficticio\n"


class Stage2FixtureMixin(ReminderFixtureMixin):
    def project(self, commission=None, **fields):
        return Project.objects.create(
            code=f"ST2-{next(_codes):03d}", title=fields.pop("title", "Corredor logístico"), commission=commission or self.commission_a,
            status=fields.pop("status", Project.Status.ACTIVE), created_by=self.admin, updated_by=self.admin, **fields,
        )

    def document(self, project=None, minute=None, **fields):
        return Document.objects.create(
            project=project, minute=minute, title=fields.pop("title", "Informe trimestral"), file=fields.pop("file", "private/x/informe.pdf"),
            uploaded_by=self.admin, **fields,
        )

    def approved_minute(self, invited=(), **meeting_fields):
        meeting = self.meeting(invited=invited, **meeting_fields)
        return Minute.objects.create(
            meeting=meeting, content="Acta", status=Minute.Status.APPROVED, created_by=self.admin, approved_by=self.admin, approved_at=timezone.now(),
        )

    def agreement(self, minute, responsible=None, **fields):
        return Agreement.objects.create(minute=minute, title=fields.pop("title", "Enviar propuesta"), responsible=responsible, created_by=self.admin, **fields)

    def render(self, user, event_type, resource, key="", data=None):
        return policies.authorize_and_render(self.job(user, event_type, resource, key, data))

    def recipients(self, event_type):
        return set(DeliveryJob.objects.filter(event__event_type=event_type).values_list("user_id", flat=True))


# --- Plantillas ----------------------------------------------------------------------------


class Stage2TemplateTests(TestCase):
    def test_every_new_event_has_a_template_and_catalog_entry(self):
        due = date(2026, 11, 6)
        contexts = {
            "project.status_changed": {"title": "P", "status": "paused"},
            "project.published": {"title": "P"},
            "project.archived": {"title": "P"},
            "project.assigned": {"title": "P", "responsibility": "Seguimiento", "starts_at": due},
            "document.uploaded": {"title": "D", "parent": "Proyecto P"},
            "document.updated": {"title": "D", "parent": "Proyecto P", "changed": ["file"]},
            "document.removed": {"title": "D", "parent": "Proyecto P"},
            "minute.approved": {"title": "Sesión", "scheduled_at": timezone.now()},
            "agreement.assigned": {"title": "A", "meeting_title": "Sesión", "due_at": due},
            "agreement.status_changed": {"title": "A", "meeting_title": "Sesión", "status": "completed"},
            "agreement.reminder": {"title": "A", "due_at": due, "days_before": 3},
            "followup.reminder": {"title": "T", "project_title": "P", "due_at": due, "days_before": 1},
        }
        for event_type, context in contexts.items():
            with self.subTest(event_type):
                self.assertIn(event_type, events.EVENTS)
                self.assertTrue(templates.render(event_type, context).text)
        self.assertIn("Vence en 3 días (viernes 6 de noviembre de 2026).", templates.render("agreement.reminder", contexts["agreement.reminder"]).text)
        self.assertIn("Vence mañana", templates.render("followup.reminder", contexts["followup.reminder"]).text)
        self.assertIn("Nuevo estado: Pausado.", templates.render("project.status_changed", contexts["project.status_changed"]).text)

    def test_unknown_status_or_missing_data_does_not_render(self):
        with self.assertRaises(templates.TemplateError):
            templates.render("project.status_changed", {"title": "P", "status": "inventado"})
        with self.assertRaises(templates.TemplateError):
            templates.render("document.uploaded", {"title": "D"})


# --- Políticas -----------------------------------------------------------------------------


class ProjectPolicyTests(Stage2FixtureMixin, TestCase):
    def test_commission_member_receives_status_change_and_other_commission_does_not(self):
        project = self.project(status=Project.Status.PAUSED)
        data = {"status": "paused"}
        self.assertIn("Nuevo estado: Pausado.", self.render(self.user_a, "project.status_changed", project, data=data).text)
        self.assertIsNone(self.render(self.user_b, "project.status_changed", project, data=data))

    def test_stale_status_notice_is_dropped(self):
        project = self.project(status=Project.Status.COMPLETED)
        self.assertIsNone(self.render(self.user_a, "project.status_changed", project, data={"status": "paused"}))

    def test_temporary_confidential_project_is_hidden_from_members(self):
        project = self.project(status=Project.Status.PAUSED, confidentiality=Project.Confidentiality.TEMPORARY)
        self.assertIsNone(self.render(self.user_a, "project.status_changed", project, data={"status": "paused"}))
        self.assertIsNotNone(self.render(self.admin, "project.status_changed", project, data={"status": "paused"}))

    def test_archived_notice_requires_the_project_to_be_archived(self):
        project = self.project()
        self.assertIsNone(self.render(self.user_a, "project.archived", project))
        Project.objects.filter(pk=project.pk).update(deleted_at=timezone.now())
        self.assertIn("Proyecto archivado", self.render(self.user_a, "project.archived", project).text)
        self.assertIsNone(self.render(self.user_b, "project.archived", project))

    def test_assignment_notice_goes_only_to_the_assigned_member_while_active(self):
        project = self.project()
        assignment = ProjectAssignment.objects.create(project=project, member=self.member_a, starts_at=timezone.localdate(), assigned_by=self.admin)
        key, data = events.occurrence_key(assignment.pk, self.member_a.pk), {"assignment_id": assignment.pk}
        self.assertIn("Te asignaron a un proyecto", self.render(self.user_a, "project.assigned", project, key, data).text)
        self.assertIsNone(self.render(self.user_a2, "project.assigned", project, key, data))
        ProjectAssignment.objects.filter(pk=assignment.pk).update(ends_at=timezone.localdate() - timedelta(days=1), starts_at=timezone.localdate() - timedelta(days=5))
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(user=self.user_a)))

    def test_could_see_project_matches_visible_projects_for(self):
        projects = [
            self.project(),
            self.project(commission=self.commission_b),
            self.project(confidentiality=Project.Confidentiality.TEMPORARY),
            self.project(commission=self.commission_b, is_public=True, confidentiality=Project.Confidentiality.PUBLIC),
            self.project(commission=self.commission_b, is_public=True, confidentiality=Project.Confidentiality.PUBLIC, status=Project.Status.DRAFT),
            self.project(commission=None),
        ]
        for user in (self.admin, self.reader, self.user_a, self.user_b, self.no_roles):
            visible = set(visible_projects_for(user).values_list("pk", flat=True))
            for project in projects:
                with self.subTest(user=user.email, project=project.pk):
                    self.assertEqual(policies._could_see_project(user, project), project.pk in visible)


class DocumentPolicyTests(Stage2FixtureMixin, TestCase):
    def test_project_document_is_validated_together_with_its_parent(self):
        document = self.document(project=self.project(title="Puerto seco"))
        self.assertIn("En: Proyecto Puerto seco", self.render(self.user_a, "document.uploaded", document).text)
        self.assertIsNone(self.render(self.user_b, "document.uploaded", document))
        Project.objects.filter(pk=document.project_id).update(deleted_at=timezone.now())
        self.assertIsNone(self.render(self.user_a, "document.uploaded", document))

    def test_document_without_current_access_is_not_announced(self):
        document = self.document(project=self.project(), confidentiality=Project.Confidentiality.TEMPORARY)
        self.assertIsNone(self.render(self.user_a, "document.uploaded", document))
        CommissionMembership.objects.filter(member=self.member_a).update(ends_at=timezone.localdate() - timedelta(days=1))
        self.assertIsNone(self.render(self.user_a, "document.uploaded", self.document(project=self.project())))

    def test_minute_document_reaches_only_invited_members(self):
        document = self.document(minute=self.approved_minute(invited=[self.member_a], title="Sesión de enero"))
        self.assertIn("En: Minuta de Sesión de enero", self.render(self.user_a, "document.uploaded", document).text)
        self.assertIsNone(self.render(self.user_a2, "document.uploaded", document))

    def test_removed_notice_requires_removal(self):
        document = self.document(project=self.project())
        self.assertIsNone(self.render(self.user_a, "document.removed", document))
        Document.objects.filter(pk=document.pk).update(deleted_at=timezone.now())
        self.assertIn("Documento retirado", self.render(self.user_a, "document.removed", document).text)

    def test_could_see_document_matches_visible_documents_for(self):
        own, other = self.project(), self.project(commission=self.commission_b)
        public = self.project(commission=self.commission_b, is_public=True, confidentiality=Project.Confidentiality.PUBLIC)
        draft_minute = Minute.objects.create(meeting=self.meeting(invited=[self.member_a]), created_by=self.admin)
        documents = [
            self.document(project=own),
            self.document(project=own, confidentiality=Project.Confidentiality.TEMPORARY),
            self.document(project=other),
            self.document(project=public, confidentiality=Project.Confidentiality.PUBLIC),
            self.document(project=public),
            self.document(minute=self.approved_minute(invited=[self.member_a])),
            self.document(minute=draft_minute),
        ]
        for user in (self.admin, self.reader, self.user_a, self.user_a2, self.user_b, self.no_roles):
            visible = set(visible_documents_for(user).values_list("pk", flat=True))
            for document in documents:
                with self.subTest(user=user.email, document=document.pk):
                    self.assertEqual(policies._could_see_document(user, document), document.pk in visible)


class MinuteAndAgreementPolicyTests(Stage2FixtureMixin, TestCase):
    def test_minute_approval_reaches_invited_members_only(self):
        minute = self.approved_minute(invited=[self.member_a], title="Sesión de febrero")
        self.assertIn("Minuta aprobada\nSesión de febrero", self.render(self.user_a, "minute.approved", minute).text)
        self.assertIsNone(self.render(self.user_a2, "minute.approved", minute))
        self.assertIsNone(self.render(self.user_b, "minute.approved", minute))

    def test_agreement_assignment_uses_the_member_relation_not_a_name(self):
        minute = self.approved_minute(invited=[self.member_a, self.member_a2])
        agreement = self.agreement(minute, responsible=self.member_a)
        key = events.occurrence_key("responsable", self.member_a.pk)
        self.assertIn("Te asignaron un acuerdo", self.render(self.user_a, "agreement.assigned", agreement, key).text)
        self.assertIsNone(self.render(self.user_a2, "agreement.assigned", agreement, key))
        Agreement.objects.filter(pk=agreement.pk).update(responsible=self.member_a2)
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(user=self.user_a)))

    def test_stale_agreement_status_is_dropped(self):
        agreement = self.agreement(self.approved_minute(invited=[self.member_a]), status=Agreement.Status.IN_PROGRESS)
        self.assertIn("En seguimiento", self.render(self.user_a, "agreement.status_changed", agreement, "k", {"status": "in_progress"}).text)
        Agreement.objects.filter(pk=agreement.pk).update(status=Agreement.Status.COMPLETED)
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(user=self.user_a)))


# --- Recordatorios por fecha ---------------------------------------------------------------


class DateReminderTests(Stage2FixtureMixin, TestCase):
    def setUp(self):
        self.due = timezone.localdate() + timedelta(days=5)
        self.item = self.agreement(self.approved_minute(invited=[self.member_a]), responsible=self.member_a, due_at=self.due)
        Agreement.objects.filter(pk=self.item.pk).update(created_at=timezone.now() - timedelta(days=10))
        self.at = timezone.make_aware(datetime.combine(self.due - timedelta(days=3), reminders.DATE_REMINDER_TIME)) + timedelta(minutes=5)

    def job(self, *args, **kwargs):  # noqa: D401 - mismo nombre que el ayudante de la clase base
        return super().job(*args, **kwargs) if args else DeliveryJob.objects.get(event__event_type="agreement.reminder")

    def test_reminder_goes_to_the_responsible_at_eight_three_days_before_without_duplicates(self):
        self.assertEqual(reminders.generate_due(self.at - timedelta(minutes=10)), 0)
        self.assertEqual(reminders.generate_due(self.at), 1)
        for _ in range(3):
            self.assertEqual(reminders.generate_due(self.at + timedelta(minutes=1)), 0)
        self.assertEqual(self.recipients("agreement.reminder"), {self.user_a.pk})
        self.assertIn("Vence en 3 días", policies.authorize_and_render(self.job()).text)

    def test_completed_rescheduled_reassigned_or_deleted_agreement_drops_old_reminder(self):
        reminders.generate_due(self.at)
        job = self.job()
        for change in (
            {"status": Agreement.Status.COMPLETED},
            {"due_at": self.due + timedelta(days=7)},
            {"responsible": self.member_a2},
            {"deleted_at": timezone.now()},
        ):
            with self.subTest(change=list(change)):
                Agreement.objects.filter(pk=self.item.pk).update(**change)
                self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(pk=job.pk)))
                Agreement.objects.filter(pk=self.item.pk).update(
                    status=Agreement.Status.PENDING, due_at=self.due, responsible=self.member_a, deleted_at=None,
                )
        self.assertIsNotNone(policies.authorize_and_render(DeliveryJob.objects.get(pk=job.pk)))

    def test_closed_agreement_generates_no_reminder(self):
        Agreement.objects.filter(pk=self.item.pk).update(status=Agreement.Status.CANCELLED)
        self.assertEqual(reminders.generate_due(self.at), 0)

    def test_follow_up_topic_reminder(self):
        Agreement.objects.filter(pk=self.item.pk).update(status=Agreement.Status.COMPLETED)  # solo interesa el tema
        project = self.project(title="Parque industrial")
        topic = FollowUpTopic.objects.create(project=project, title="Visita técnica", responsible=self.member_a, due_at=self.due, created_by=self.admin)
        FollowUpTopic.objects.filter(pk=topic.pk).update(created_at=timezone.now() - timedelta(days=10))
        at = self.at + timedelta(days=2)  # 1 día antes
        self.assertEqual(reminders.generate_due(at), 1)
        job = DeliveryJob.objects.get(event__event_type="followup.reminder")
        self.assertEqual(job.user_id, self.user_a.pk)
        self.assertIn("Proyecto: Parque industrial\nVence mañana", policies.authorize_and_render(job).text)
        FollowUpTopic.objects.filter(pk=topic.pk).update(completed_at=timezone.now())
        self.assertIsNone(policies.authorize_and_render(DeliveryJob.objects.get(pk=job.pk)))
        self.assertEqual(reminders.generate_due(at + timedelta(minutes=1)), 0)


# --- Productores conectados a la API ------------------------------------------------------


@override_settings(TELEGRAM_ENABLED=True)
class Stage2ProducerTests(Stage2FixtureMixin, TestCase):
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
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_project_status_change_notifies_and_irrelevant_change_does_not(self):
        project = self.project()
        url = f"/api/v1/projects/{project.pk}/"
        self.assertEqual(self.client.patch(url, {"title": "Otro título", "progress": 40}, format="json").status_code, 200)
        self.assertFalse(NotificationEvent.objects.exists())
        self.assertEqual(self.client.patch(url, {"status": "paused"}, format="json").status_code, 200)
        self.assertEqual(self.recipients("project.status_changed"), {self.user_a.pk, self.user_a2.pk})
        self.assertIn("Pausado", policies.authorize_and_render(DeliveryJob.objects.filter(user=self.user_a).get()).text)

    def test_failed_operation_leaves_no_event(self):
        project = self.project()
        self.assertEqual(self.client.patch(f"/api/v1/projects/{project.pk}/", {"status": "inventado"}, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"/api/v1/projects/{project.pk}/publish/").status_code, 400)  # no es pública
        self.assertFalse(NotificationEvent.objects.exists())

    def test_publish_and_archive(self):
        project = self.project(confidentiality=Project.Confidentiality.PUBLIC)
        self.assertEqual(self.client.post(f"/api/v1/projects/{project.pk}/publish/").status_code, 200)
        self.assertEqual(self.recipients("project.published"), {self.user_a.pk, self.user_a2.pk})
        published = DeliveryJob.objects.get(event__event_type="project.published", user=self.user_a)
        self.assertEqual(self.client.delete(f"/api/v1/projects/{project.pk}/").status_code, 204)
        published.refresh_from_db()
        self.assertEqual((published.status, published.cancel_reason), ("cancelled", "Proyecto archivado"))
        self.assertEqual(self.recipients("project.archived"), {self.user_a.pk, self.user_a2.pk})

    def test_assignment_notifies_only_the_assigned_member(self):
        project = self.project()
        payload = {"project": project.pk, "member": self.member_a.pk, "starts_at": timezone.localdate().isoformat(), "responsibility": "Enlace"}
        self.assertEqual(self.client.post("/api/v1/project-assignments/", payload, format="json").status_code, 201)
        self.assertEqual(self.recipients("project.assigned"), {self.user_a.pk})
        self.assertIn("Responsabilidad: Enlace", policies.authorize_and_render(DeliveryJob.objects.get(user=self.user_a)).text)

    def test_document_upload_update_and_removal(self):
        project = self.project()
        upload = SimpleUploadedFile("informe.pdf", PDF, content_type="application/pdf")
        response = self.client.post("/api/v1/documents/", {"project": project.pk, "title": "Informe", "file": upload}, format="multipart")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(self.recipients("document.uploaded"), {self.user_a.pk, self.user_a2.pk})
        url = f"/api/v1/documents/{response.data['id']}/"
        self.assertEqual(self.client.patch(url, {"description": "Solo un detalle"}, format="json").status_code, 200)
        self.assertFalse(NotificationEvent.objects.filter(event_type="document.updated").exists())
        self.assertEqual(self.client.patch(url, {"title": "Informe final"}, format="json").status_code, 200)
        self.assertEqual(NotificationEvent.objects.get(event_type="document.updated").data, {"changed": ["title"]})
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(self.recipients("document.removed"), {self.user_a.pk, self.user_a2.pk})

    def test_minute_approval_and_agreement_flow(self):
        meeting = self.meeting(invited=[self.member_a, self.member_a2])
        minute = Minute.objects.create(meeting=meeting, content="Acta", created_by=self.admin)
        self.assertEqual(self.client.post(f"/api/v1/minutes/{minute.pk}/approve/").status_code, 200)
        self.assertEqual(self.recipients("minute.approved"), {self.user_a.pk, self.user_a2.pk})
        payload = {"minute": minute.pk, "title": "Enviar propuesta", "responsible": self.member_a.pk, "due_at": (timezone.localdate() + timedelta(days=9)).isoformat()}
        response = self.client.post("/api/v1/agreements/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(self.recipients("agreement.assigned"), {self.user_a.pk})
        url = f"/api/v1/agreements/{response.data['id']}/"
        self.assertEqual(self.client.patch(url, {"title": "Enviar propuesta final"}, format="json").status_code, 200)
        self.assertFalse(NotificationEvent.objects.filter(event_type="agreement.status_changed").exists())
        reminder = record_event("agreement.reminder", "agreement", response.data["id"], "k", [self.user_a], data={"days_before": 3})
        self.assertEqual(self.client.patch(url, {"status": "completed"}, format="json").status_code, 200)
        self.assertEqual(self.recipients("agreement.status_changed"), {self.user_a.pk, self.user_a2.pk})
        self.assertEqual(DeliveryJob.objects.get(event=reminder).status, "cancelled")

    def test_producer_failure_never_breaks_the_operation(self):
        project = self.project()
        with patch("telegram_notifications.producers.record_event", side_effect=RuntimeError("falla simulada")):
            with self.assertLogs("telegram_notifications.producers", "ERROR"):
                response = self.client.patch(f"/api/v1/projects/{project.pk}/", {"status": "paused"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.get(pk=project.pk).status, "paused")

    def test_disabled_channel_records_nothing(self):
        project = self.project()
        with override_settings(TELEGRAM_ENABLED=False):
            self.client.patch(f"/api/v1/projects/{project.pk}/", {"status": "paused"}, format="json")
            self.client.delete(f"/api/v1/projects/{project.pk}/")
        self.assertFalse(NotificationEvent.objects.exists())


# --- Botones -------------------------------------------------------------------------------


class ButtonTests(Stage2FixtureMixin, TestCase):
    def test_button_uses_the_configured_https_base_url(self):
        meeting = self.meeting(invited=[self.member_a])
        job = self.job(self.user_a, "meeting.created", meeting)
        self.assertEqual(policies.authorize_and_render(job).buttons, [])
        with override_settings(TELEGRAM_FRONTEND_URL="https://plataforma.example.test/"):
            self.assertEqual(policies.authorize_and_render(job).buttons, [(templates.BUTTON_LABEL, "https://plataforma.example.test/")])
        with override_settings(TELEGRAM_FRONTEND_URL="http://inseguro.example.test"):
            self.assertEqual(policies.authorize_and_render(job).buttons, [])
