from django.conf import settings
from django.db import models

from directory.models import Commission, Member


class Meeting(models.Model):
    class Modality(models.TextChoices):
        IN_PERSON = "in_person", "Presencial"
        VIRTUAL = "virtual", "Virtual"
        HYBRID = "hybrid", "Híbrida"

    class Confidentiality(models.TextChoices):
        PUBLIC = "public", "Público"
        INTERNAL = "internal", "Interno"
        TEMPORARY = "temporary_confidential", "Confidencial temporal"

    commission = models.ForeignKey(Commission, on_delete=models.PROTECT, related_name="meetings")
    invited_members = models.ManyToManyField(Member, related_name="meeting_invitations", blank=True)
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    agenda = models.JSONField(default=list, blank=True)
    scheduled_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    modality = models.CharField(max_length=20, choices=Modality.choices, default=Modality.IN_PERSON)
    location = models.CharField(max_length=240, blank=True)
    meeting_link = models.URLField(blank=True)
    confidentiality = models.CharField(max_length=32, choices=Confidentiality.choices, default=Confidentiality.INTERNAL)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="meetings_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["scheduled_at"]
        constraints = [models.CheckConstraint(condition=models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=models.F("scheduled_at")), name="meeting_end_after_start")]


class Attendance(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.PROTECT, related_name="attendance")
    member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="attendance_records")
    present = models.BooleanField(default=False)
    notes = models.CharField(max_length=500, blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="attendance_recorded")
    recorded_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["meeting", "member"], name="one_attendance_per_meeting_member")]


class Minute(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        APPROVED = "approved", "Aprobada"

    meeting = models.OneToOneField(Meeting, on_delete=models.PROTECT, related_name="minute")
    content = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="minutes_created")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="minutes_approved", null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.pk:
            previous = Minute.objects.get(pk=self.pk)
            if previous.status == self.Status.APPROVED:
                raise ValueError("Una minuta aprobada es inmutable.")
        super().save(*args, **kwargs)


class Agreement(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        IN_PROGRESS = "in_progress", "En seguimiento"
        COMPLETED = "completed", "Cumplido"
        CANCELLED = "cancelled", "Cancelado"

    minute = models.ForeignKey(Minute, on_delete=models.PROTECT, related_name="agreements")
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    responsible = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="agreements", null=True, blank=True)
    due_at = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="agreements_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
