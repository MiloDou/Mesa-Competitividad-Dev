"""Recordatorios y ciclo de votaciones (Persona B).

``generate_due(now)`` es el hook que el procesador llama en cada ciclo (``process_once``).
Hace dos cosas, ambas repetibles sin crear duplicados:

1. Avanza el ciclo de votaciones con los servicios existentes (``refresh_voting``), para que una
   votación programada se abra y una vencida se cierre a tiempo aunque nadie consulte la API.
2. Registra los recordatorios que ya vencieron con ``record_event``: reuniones, votaciones,
   acuerdos (``Agreement.due_at``) y temas de seguimiento (``FollowUpTopic.due_at``).

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
from datetime import datetime, time, timedelta

from django.db import transaction
from django.utils import timezone

from meetings.models import Agreement, Meeting, Minute
from notifications.services import commission_user_ids, member_user_ids
from telegram_notifications import events
from telegram_notifications.contracts import cancel_jobs, record_event
from telegram_notifications.models import NotificationEvent
from projects.models import FollowUpTopic
from voting.models import Voting
from voting.services import refresh_voting

logger = logging.getLogger(__name__)

# Horas de antelación de cada recordatorio. Ajustables; la Mesa no ha fijado estos valores.
MEETING_WINDOWS_HOURS = (24, 1)
VOTING_WINDOWS_HOURS = (24, 2)
# Tiempo, después de su vencimiento, durante el cual todavía se genera un recordatorio.
GRACE = timedelta(minutes=30)
# Acuerdos y temas de seguimiento vencen en una fecha sin hora. El recordatorio sale a esta hora
# local (America/Guatemala) tantos días antes de la fecha. Ajustables; la Mesa no los ha fijado.
DATE_REMINDER_DAYS = (3, 1)
DATE_REMINDER_TIME = time(8, 0)


def generate_due(now=None):
    """Avanza votaciones y registra los recordatorios vencidos. Devuelve cuántos eventos nuevos creó."""
    now = now or timezone.now()
    advance_votings()
    return _meeting_reminders(now) + _voting_reminders(now) + _agreement_reminders(now) + _followup_reminders(now)


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


def _register(event_type, resource_type, resource_id, target_at, hours, due_at, recipients, key=None, data=None):
    key = key if key is not None else events.occurrence_key(target_at, hours)
    data = data if data is not None else {"window_hours": hours}
    is_new = not NotificationEvent.objects.filter(
        event_type=event_type, resource_type=resource_type, resource_id=str(resource_id), occurrence_key=key,
    ).exists()
    with transaction.atomic():
        record_event(event_type, resource_type, resource_id, key, recipients, data=data, run_after=due_at)
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


def _date_reminder_at(due_date, days):
    """Instante local en que vence el recordatorio de una fecha sin hora."""
    return timezone.make_aware(datetime.combine(due_date - timedelta(days=days), DATE_REMINDER_TIME))


def _due_date_windows(due_date, floor_at, now):
    due = []
    for days in DATE_REMINDER_DAYS:
        due_at = _date_reminder_at(due_date, days)
        if due_at <= now < due_at + GRACE and due_at >= floor_at:
            due.append((days, due_at))
    return due


def _date_reminders(event_type, resource_type, items, now):
    """Recordatorio al responsable (``Member`` con cuenta). La clave lleva fecha y responsable,
    así que cambiar cualquiera de los dos deja el viejo inválido y permite uno nuevo."""
    created = 0
    for item in items:
        for days, due_at in _due_date_windows(item.due_at, item.created_at, now):
            key = events.occurrence_key(item.due_at, item.responsible_id, days)
            recipients = list(member_user_ids([item.responsible]))
            created += _register(event_type, resource_type, item.pk, None, None, due_at, recipients, key=key, data={"days_before": days})
    return created


def _date_range(now):
    today = timezone.localtime(now).date()
    return today, today + timedelta(days=max(DATE_REMINDER_DAYS))


def _agreement_reminders(now):
    start, end = _date_range(now)
    agreements = Agreement.objects.filter(
        deleted_at__isnull=True, status__in=events.AGREEMENT_OPEN_STATUSES, responsible__isnull=False,
        due_at__gte=start, due_at__lte=end, minute__deleted_at__isnull=True, minute__status=Minute.Status.APPROVED,
    ).select_related("responsible")
    return _date_reminders("agreement.reminder", "agreement", agreements, now)


def _followup_reminders(now):
    start, end = _date_range(now)
    topics = FollowUpTopic.objects.filter(
        deleted_at__isnull=True, completed_at__isnull=True, responsible__isnull=False,
        due_at__gte=start, due_at__lte=end, project__deleted_at__isnull=True,
    ).select_related("responsible")
    return _date_reminders("followup.reminder", "followup", topics, now)
