from django.conf import settings
from django.db import models


class AuditEventQuerySet(models.QuerySet):
    def update(self, **kwargs):
        raise TypeError("Los eventos de auditoría no se pueden modificar.")

    def delete(self):
        raise TypeError("Los eventos de auditoría no se pueden eliminar.")


class AuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="audit_events", null=True, blank=True)
    actor_roles = models.JSONField(default=list, blank=True)
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=120)
    object_id = models.CharField(max_length=80, blank=True)
    summary = models.CharField(max_length=500, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = AuditEventQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Los eventos de auditoría son inmutables.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Los eventos de auditoría no se pueden eliminar.")
