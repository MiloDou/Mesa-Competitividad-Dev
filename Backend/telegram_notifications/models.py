from django.conf import settings
from django.db import models
from django.utils import timezone


class TelegramLink(models.Model):
    class Status(models.TextChoices):
        PENDING_CONSENT = "pending_consent", "Pendiente de consentimiento"
        ACTIVE = "active", "Activo"
        PAUSED = "paused", "En pausa"
        REVOKED = "revoked", "Revocado"
        BLOCKED = "blocked", "Bloqueado"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="telegram_links")
    chat_id = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_CONSENT)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    consent_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        # Un vínculo vigente por cuenta y por chat; revoked y blocked quedan como historial.
        constraints = [
            models.UniqueConstraint(fields=["user"], condition=models.Q(status__in=["pending_consent", "active", "paused"]), name="one_current_telegram_link_per_user"),
            models.UniqueConstraint(fields=["chat_id"], condition=models.Q(status__in=["pending_consent", "active", "paused"]), name="one_current_telegram_link_per_chat"),
        ]


class LinkTicket(models.Model):
    code_digest = models.CharField(max_length=64, unique=True)
    chat_id = models.BigIntegerField()
    telegram_name = models.CharField(max_length=120, blank=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class NotificationEvent(models.Model):
    event_type = models.CharField(max_length=60)
    resource_type = models.CharField(max_length=60)
    resource_id = models.CharField(max_length=64)
    occurrence_key = models.CharField(max_length=120, blank=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["event_type", "resource_type", "resource_id", "occurrence_key"], name="one_telegram_event_per_occurrence"),
        ]


class DeliveryJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        SENDING = "sending", "Enviando"
        SENT = "sent", "Enviado"
        CANCELLED = "cancelled", "Cancelado"
        FAILED = "failed", "Fallido"
        UNCERTAIN = "uncertain", "Incierto"

    event = models.ForeignKey(NotificationEvent, on_delete=models.CASCADE, related_name="jobs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="telegram_jobs")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveSmallIntegerField(default=0)
    run_after = models.DateTimeField(default=timezone.now)
    locked_until = models.DateTimeField(null=True, blank=True)
    lock_token = models.UUIDField(null=True, blank=True)
    send_started_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    telegram_message_id = models.BigIntegerField(null=True, blank=True)
    last_error = models.CharField(max_length=500, blank=True)
    cancel_reason = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "user"], name="one_telegram_job_per_event_user")]
        indexes = [models.Index(fields=["status", "run_after"], name="telegram_job_status_run_idx")]


class ProcessedUpdate(models.Model):
    update_id = models.BigIntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
