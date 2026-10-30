"""Recordatorios y ciclo de votaciones (Persona B).

``generate_due(now)`` es el hook que el procesador llama en cada ciclo (``process_once``).
Hace dos cosas, ambas repetibles sin crear duplicados:

1. Avanza el ciclo de votaciones con los servicios existentes (``refresh_voting``), para que una
   votación programada se abra y una vencida se cierre a tiempo aunque nadie consulte la API.
2. Registra los recordatorios que ya vencieron con ``record_event``.

Reglas de los recordatorios:
- Un recordatorio vence a ``fecha_objetivo - ventana`` y solo se genera durante ``GRACE`` después
  de ese instante. Así una reunión no recibe un aviso de "24 horas" cuando faltan 2.
- No se genera una ventana que ya había pasado cuando el recurso se creó (reunión creada con menos de
  24 h de antelación) ni una anterior a la apertura de la votación.
- ``run_after`` es el instante en que vencía el recordatorio, de modo que la caducidad de 24 h del
  motor se mide desde ahí.
- La clave de ocurrencia lleva la fecha objetivo: si se reprograma, nace otra y la vieja queda inválida
  (``policies`` la descarta al enviar y los productores pueden cancelarla con ``cancel_reminders``).
- Ejecutar el generador varias veces no duplica: el evento y cada trabajo son únicos. Si alguien se
  vincula dentro de la ventana, la siguiente ejecución le agrega su trabajo.
"""
import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from meetings.models import Meeting
from notifications.services import commission_user_ids, member_user_ids
from telegram_notifications import events
from telegram_notifications.contracts import cancel_jobs, record_event
from telegram_notifications.models import NotificationEvent
from voting.models import Voting
from voting.services import refresh_voting

logger = logging.getLogger(__name__)

# Horas de antelación de cada recordatorio. Ajustables; la Mesa no ha fijado estos valores.
MEETING_WINDOWS_HOURS = (24, 1)
VOTING_WINDOWS_HOURS = (24, 2)
# Tiempo, después de su vencimiento, durante el cual todavía se genera un recordatorio.
GRACE = timedelta(minutes=30)


def generate_due(now=None):
    """Avanza votaciones y registra los recordatorios vencidos. Devuelve cuántos eventos nuevos creó."""
    now = now or timezone.now()
    advance_votings()
    return _meeting_reminders(now) + _voting_reminders(now)


def cancel_reminders(resource_type, resource_id, reason=""):
    """Cancela los recordatorios pendientes de un recurso (reprogramación, cancelación o cierre)."""
    return cancel_jobs(resource_type, resource_id, event_types=[f"{resource_type}.reminder"], reason=reason)


def advance_votings():
    """Abre las votaciones programadas y cierra las vencidas con ``refresh_voting``; un fallo no frena al resto."""
    pending = Voting.objects.filter(status__in=[Voting.Status.SCHEDULED, Voting.Status.OPEN], deleted_at__isnull=True).order_by("id")
    changed = 0
    for voting in pending.iterator():
        before = voting.status
        try:
            changed += refresh_voting(voting).status != before
        except Exception:
            logger.exception("No se pudo avanzar la votación %s", voting.pk)
    return changed


def _due_windows(windows, target_at, floor_at, now):
    """Ventanas (horas, instante de vencimiento) que corresponde generar ahora."""
    due = []
    for hours in windows:
        due_at = target_at - timedelta(hours=hours)
        if due_at <= now < due_at + GRACE and due_at >= floor_at:
            due.append((hours, due_at))
    return due


def _register(event_type, resource_type, resource_id, target_at, hours, due_at, recipients):
    key = events.occurrence_key(target_at, hours)
    is_new = not NotificationEvent.objects.filter(
        event_type=event_type, resource_type=resource_type, resource_id=str(resource_id), occurrence_key=key,
    ).exists()
    with transaction.atomic():
        record_event(event_type, resource_type, resource_id, key, recipients, data={"window_hours": hours}, run_after=due_at)
    return int(is_new)


def _meeting_reminders(now):
    horizon = now + timedelta(hours=max(MEETING_WINDOWS_HOURS))
    meetings = Meeting.objects.filter(deleted_at__isnull=True, scheduled_at__gt=now, scheduled_at__lte=horizon)
    created = 0
    for meeting in meetings:
        for hours, due_at in _due_windows(MEETING_WINDOWS_HOURS, meeting.scheduled_at, meeting.created_at, now):
            recipients = list(member_user_ids(meeting.invited_members.all()))
            created += _register("meeting.reminder", "meeting", meeting.pk, meeting.scheduled_at, hours, due_at, recipients)
    return created


def _voting_reminders(now):
    horizon = now + timedelta(hours=max(VOTING_WINDOWS_HOURS))
    votings = Voting.objects.filter(
        deleted_at__isnull=True, status=Voting.Status.OPEN, opens_at__isnull=False, closes_at__gt=now, closes_at__lte=horizon,
    ).select_related("commission")
    created = 0
    for voting in votings:
        for hours, due_at in _due_windows(VOTING_WINDOWS_HOURS, voting.closes_at, voting.opens_at, now):
            # Solo a quien aún no votó; ``policies`` lo vuelve a comprobar justo antes de enviar.
            recipients = list(commission_user_ids(voting.commission).exclude(member__votes__voting_id=voting.pk))
            created += _register("voting.reminder", "voting", voting.pk, voting.closes_at, hours, due_at, recipients)
    return created
