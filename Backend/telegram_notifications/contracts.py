"""Contrato entre el motor (Persona A) y los productores/políticas (Persona B).

Hooks que implementa Persona B y el motor resuelve con import diferido:
    policies.authorize_and_render(job) -> Message | None   # None cancela la entrega
    reminders.generate_due(now) -> int                     # registra eventos vencidos con record_event
Si faltan, el procesador no envía nada (fallo cerrado).
"""
from dataclasses import dataclass, field

from django.utils import timezone

from telegram_notifications.models import DeliveryJob, NotificationEvent, TelegramLink


@dataclass
class Message:
    text: str
    buttons: list[tuple[str, str]] = field(default_factory=list)  # (etiqueta, URL autorizada)


def record_event(event_type, resource_type, resource_id, occurrence_key, recipients, data=None, run_after=None):
    """Registra un evento y sus trabajos de entrega de forma idempotente.

    Llamar dentro de la transacción de negocio; no hace llamadas de red. Solo crea
    trabajos para destinatarios (User o id) con vínculo activo.
    """
    event, _ = NotificationEvent.objects.get_or_create(
        event_type=event_type,
        resource_type=resource_type,
        resource_id=str(resource_id),
        occurrence_key=occurrence_key,
        defaults={"data": data or {}},
    )
    user_ids = {getattr(recipient, "pk", recipient) for recipient in recipients}
    active_ids = TelegramLink.objects.filter(user_id__in=user_ids, status=TelegramLink.Status.ACTIVE).values_list("user_id", flat=True)
    run_after = run_after or timezone.now()
    DeliveryJob.objects.bulk_create(
        [DeliveryJob(event=event, user_id=user_id, run_after=run_after) for user_id in active_ids],
        ignore_conflicts=True,
    )
    return event


def cancel_jobs(resource_type, resource_id, event_types=None, reason=""):
    """Cancela los trabajos pendientes de un recurso (p. ej. al reprogramar o cancelar)."""
    jobs = DeliveryJob.objects.filter(
        event__resource_type=resource_type,
        event__resource_id=str(resource_id),
        status=DeliveryJob.Status.PENDING,
    )
    if event_types:
        jobs = jobs.filter(event__event_type__in=event_types)
    return jobs.update(status=DeliveryJob.Status.CANCELLED, cancel_reason=reason[:120], updated_at=timezone.now())
