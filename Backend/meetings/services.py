from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from meetings.models import Minute


@transaction.atomic
def approve_minute(minute, actor):
    minute = Minute.objects.select_for_update().get(pk=minute.pk)
    if minute.status != Minute.Status.DRAFT:
        raise ValidationError({"status": "La minuta ya fue aprobada."})
    minute.status = Minute.Status.APPROVED
    minute.approved_by = actor
    minute.approved_at = timezone.now()
    minute.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
    return minute
