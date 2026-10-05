from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from directory.models import Commission, Institution, Member


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        ACTIVE = "active", "En curso"
        PAUSED = "paused", "Pausado"
        COMPLETED = "completed", "Completado"
        ARCHIVED = "archived", "Archivado"

    class Confidentiality(models.TextChoices):
        PUBLIC = "public", "Público"
        INTERNAL = "internal", "Interno"
        TEMPORARY = "temporary_confidential", "Confidencial temporal"

    code = models.CharField(max_length=30, unique=True)
    title = models.CharField(max_length=220)
    summary = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    sector = models.CharField(max_length=100, blank=True)
    budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    confidentiality = models.CharField(max_length=32, choices=Confidentiality.choices, default=Confidentiality.INTERNAL)
    is_public = models.BooleanField(default=False)
    lead_member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="led_projects", null=True, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="projects", null=True, blank=True)
    commission = models.ForeignKey(Commission, on_delete=models.PROTECT, related_name="projects", null=True, blank=True)
    starts_at = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="projects_created")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="projects_updated")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [models.CheckConstraint(condition=models.Q(target_date__isnull=True) | models.Q(starts_at__isnull=True) | models.Q(target_date__gte=models.F("starts_at")), name="project_target_after_start")]

    def clean(self):
        if self.is_public and self.confidentiality != self.Confidentiality.PUBLIC:
            raise ValidationError({"is_public": "Solo los proyectos clasificados como públicos pueden publicarse."})

    def __str__(self):
        return f"{self.code} — {self.title}"


class ProjectHistory(models.Model):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="history")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="project_history")
    field_name = models.CharField(max_length=80)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ProjectAssignment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="assignments")
    member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="project_assignments")
    responsibility = models.CharField(max_length=120, default="Seguimiento")
    starts_at = models.DateField()
    ends_at = models.DateField(null=True, blank=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="project_assignments_made")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
        constraints = [
            models.CheckConstraint(condition=models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=models.F("starts_at")), name="project_assignment_dates_valid"),
            models.UniqueConstraint(fields=["project", "member"], condition=models.Q(ends_at__isnull=True), name="one_active_project_assignment"),
        ]


class FollowUpTopic(models.Model):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="follow_up_topics")
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    responsible = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="follow_up_topics", null=True, blank=True)
    due_at = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="follow_up_topics_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)


def private_document_path(instance, filename):
    return f"private/{instance.project_id or 'minutes'}/{filename}"


class Document(models.Model):
    ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"}
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    minute = models.ForeignKey("meetings.Minute", on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=private_document_path)
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=120, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    confidentiality = models.CharField(max_length=32, choices=Project.Confidentiality.choices, default=Project.Confidentiality.INTERNAL)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="documents_uploaded")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]
        constraints = [models.CheckConstraint(condition=(models.Q(project__isnull=False, minute__isnull=True) | models.Q(project__isnull=True, minute__isnull=False)), name="document_exactly_one_parent")]

    def clean(self):
        from pathlib import Path
        from django.conf import settings
        if self.file:
            size = getattr(self.file, "size", self.size_bytes)
            if size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                raise ValidationError({"file": f"El archivo excede {settings.MAX_UPLOAD_SIZE_MB} MB."})
            if Path(self.file.name).suffix.lower() not in self.ALLOWED_EXTENSIONS:
                raise ValidationError({"file": "Tipo de archivo no permitido."})
