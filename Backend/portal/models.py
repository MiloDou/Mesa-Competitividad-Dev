import uuid
from pathlib import Path

from django.conf import settings
from django.db import models
from django.utils import timezone


def content_asset_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"content-assets/{uuid.uuid4().hex}{extension}"


class ContentAsset(models.Model):
    title = models.CharField(max_length=180)
    alt_text = models.CharField(max_length=240, blank=True)
    file = models.FileField(upload_to=content_asset_path)
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=120, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="content_assets_uploaded")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]


class SiteProfile(models.Model):
    key = models.CharField(max_length=40, unique=True, default="main")
    name = models.CharField(max_length=180, default="Mesa de Competitividad de Quetzaltenango")
    summary = models.CharField(max_length=500, blank=True)
    mission = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    objectives = models.JSONField(default=list, blank=True)
    represented_sectors = models.JSONField(default=list, blank=True)
    work_framework = models.TextField(blank=True)
    logo_asset = models.ForeignKey(ContentAsset, on_delete=models.PROTECT, related_name="logo_sites", null=True, blank=True)
    banner_asset = models.ForeignKey(ContentAsset, on_delete=models.PROTECT, related_name="banner_sites", null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="site_profiles_updated", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]


class Publication(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        PUBLISHED = "published", "Publicado"
        ARCHIVED = "archived", "Archivado"

    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True)
    summary = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    section = models.CharField(max_length=60, default="news")
    blocks = models.JSONField(default=list, blank=True)
    assets = models.ManyToManyField(ContentAsset, related_name="publications", blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="publications")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="publications_updated")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "-updated_at"]

    def save(self, *args, **kwargs):
        if self.status == self.Status.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


class Event(models.Model):
    class Modality(models.TextChoices):
        IN_PERSON = "in_person", "Presencial"
        VIRTUAL = "virtual", "Virtual"
        HYBRID = "hybrid", "Híbrida"

    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        PUBLISHED = "published", "Publicado"
        CANCELLED = "cancelled", "Cancelado"
        COMPLETED = "completed", "Finalizado"

    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    image_asset = models.ForeignKey(ContentAsset, on_delete=models.PROTECT, related_name="events", null=True, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    modality = models.CharField(max_length=20, choices=Modality.choices, default=Modality.IN_PERSON)
    location = models.CharField(max_length=240, blank=True)
    meeting_link = models.URLField(blank=True)
    agenda = models.JSONField(default=list, blank=True)
    registration_required = models.BooleanField(default=False)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="events_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["starts_at"]


class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.PROTECT, related_name="registrations")
    name = models.CharField(max_length=180)
    email = models.EmailField()
    institution = models.CharField(max_length=180, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "email"], condition=models.Q(cancelled_at__isnull=True), name="one_active_event_registration_per_email")]


class ContactRequest(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Nueva"
        IN_PROGRESS = "in_progress", "En gestión"
        CLOSED = "closed", "Cerrada"

    name = models.CharField(max_length=180)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=220)
    message = models.TextField(max_length=5000)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.NEW)
    submitted_at = models.DateTimeField(auto_now_add=True)
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contact_requests_handled", null=True, blank=True)
    handled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]
