from django.conf import settings
from django.db import models
from accounts.models import AuthSession


class DeviceToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens")
    auth_session = models.ForeignKey(AuthSession, on_delete=models.CASCADE, related_name="device_tokens", null=True, blank=True)
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=24, blank=True)
    device_label = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=60)
    title = models.CharField(max_length=180)
    body = models.CharField(max_length=500)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class PushOutbox(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="push_jobs")
    status = models.CharField(max_length=16, default="pending")
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
