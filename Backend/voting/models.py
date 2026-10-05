from django.conf import settings
from django.db import models
from django.utils import timezone

from directory.models import Commission, Member
from projects.models import Project


class Voting(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        SCHEDULED = "scheduled", "Programada"
        OPEN = "open", "Abierta"
        CLOSED = "closed", "Cerrada"

    commission = models.ForeignKey(Commission, on_delete=models.PROTECT, related_name="votings")
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="votings", null=True, blank=True)
    agreement = models.ForeignKey("meetings.Agreement", on_delete=models.PROTECT, related_name="votings", null=True, blank=True)
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    options = models.JSONField(default=list, help_text="Lista configurable de opciones; quórum y reglas de aprobación quedan pendientes.")
    opens_at = models.DateTimeField(null=True, blank=True)
    closes_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="votings_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(condition=models.Q(closes_at__isnull=True) | models.Q(opens_at__isnull=True) | models.Q(closes_at__gt=models.F("opens_at")), name="voting_close_after_open"),
            models.CheckConstraint(
                condition=(models.Q(project__isnull=False, agreement__isnull=True) | models.Q(project__isnull=True, agreement__isnull=False)),
                name="voting_exactly_one_subject",
            ),
        ]

    @property
    def is_open_now(self):
        now = timezone.now()
        return self.status == self.Status.OPEN and (self.opens_at is None or self.opens_at <= now) and (self.closes_at is None or self.closes_at > now)


class Vote(models.Model):
    voting = models.ForeignKey(Voting, on_delete=models.PROTECT, related_name="votes")
    member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="votes")
    option = models.CharField(max_length=120)
    cast_at = models.DateTimeField(auto_now_add=True)
    client_request_id = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ["cast_at"]
        constraints = [
            models.UniqueConstraint(fields=["voting", "member"], name="one_vote_per_member_per_voting"),
            models.UniqueConstraint(fields=["voting", "client_request_id"], condition=models.Q(client_request_id__isnull=False), name="one_voting_request_id"),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Los votos emitidos son inmutables.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Los votos emitidos no se pueden eliminar.")
