"""Productores de eventos de notificación (Persona B).

Los módulos de negocio (``meetings``, ``voting``) llaman a estas funciones con una línea, dentro de
su propia transacción, justo después de guardar el cambio. Reglas:

- Nunca llaman a Telegram: solo registran el evento con ``record_event`` (que no usa la red).
- Con ``TELEGRAM_ENABLED=false`` no hacen nada: cero efectos, cero consultas.
- Un fallo aquí se registra en el log y nunca rompe ni revierte la operación de negocio: cada
  productor corre dentro de un savepoint.
- Solo se avisa de lo relevante (ver ``events.MEETING_RELEVANT_FIELDS``) y de reuniones futuras.
- Al reprogramar, cancelar o cerrar se cancelan los trabajos pendientes que ya no aplican.

Este módulo no importa ``reminders`` (que importa ``voting.services``) para evitar un ciclo.
"""
import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from notifications.services import commission_user_ids, member_user_ids
from telegram_notifications import events
from telegram_notifications.contracts import cancel_jobs, record_event

logger = logging.getLogger(__name__)

MEETING_NOTICE_TYPES = ["meeting.created", "meeting.updated", "meeting.invited", "meeting.reminder"]
VOTING_NOTICE_TYPES = ["voting.scheduled", "voting.opened", "voting.reminder"]


def _run(label, func, *args):
    """Ejecuta un productor aislado en un savepoint. Apagado o con error, no afecta la operación."""
    if not settings.TELEGRAM_ENABLED:
        return
    try:
        with transaction.atomic():
            func(*args)
    except Exception:
        logger.exception("No se pudo registrar el evento de Telegram (%s)", label)


def _is_future(moment):
    return moment is not None and moment > timezone.now()


# --- Reuniones ---------------------------------------------------------------------------


def snapshot_meeting(meeting):
    """Estado relevante de la reunión ANTES de guardar un cambio; ``None`` si el canal está apagado."""
    if not settings.TELEGRAM_ENABLED:
        return None
    return {
        "fields": {name: getattr(meeting, name) for name in events.MEETING_RELEVANT_FIELDS},
        "invited": set(meeting.invited_members.values_list("pk", flat=True)),
    }


def meeting_created(meeting):
    _run("meeting.created", _meeting_created, meeting)


def _meeting_created(meeting):
    if _is_future(meeting.scheduled_at):
        record_event("meeting.created", "meeting", meeting.pk, "", member_user_ids(meeting.invited_members.all()))


def meeting_updated(meeting, before):
    """Compara con el estado previo: avisa solo de cambios relevantes y de invitados nuevos."""
    if before is not None:
        _run("meeting.updated", _meeting_updated, meeting, before)


def _meeting_updated(meeting, before):
    if not _is_future(meeting.scheduled_at):
        return
    changed = events.relevant_meeting_changes([name for name, old in before["fields"].items() if getattr(meeting, name) != old])
    new_members = set(meeting.invited_members.values_list("pk", flat=True)) - before["invited"]
    if "scheduled_at" in changed:
        cancel_jobs("meeting", meeting.pk, ["meeting.reminder"], "Reunión reprogramada")
    if changed:
        # Quien acaba de ser invitado recibe solo la invitación, no también el cambio.
        already_invited = meeting.invited_members.exclude(pk__in=new_members)
        data = events.minimal_data("meeting.updated", {"changed": changed})
        record_event("meeting.updated", "meeting", meeting.pk, events.occurrence_key(meeting.updated_at), member_user_ids(already_invited), data=data)
    if new_members:
        key = events.occurrence_key("invitados", *sorted(new_members))
        record_event("meeting.invited", "meeting", meeting.pk, key, member_user_ids(meeting.invited_members.filter(pk__in=new_members)))


def meeting_cancelled(meeting):
    _run("meeting.cancelled", _meeting_cancelled, meeting)


def _meeting_cancelled(meeting):
    cancel_jobs("meeting", meeting.pk, MEETING_NOTICE_TYPES, "Reunión cancelada")
    if _is_future(meeting.scheduled_at):
        record_event("meeting.cancelled", "meeting", meeting.pk, "", member_user_ids(meeting.invited_members.all()))


# --- Votaciones --------------------------------------------------------------------------


def voting_scheduled(voting):
    _run("voting.scheduled", _voting_event, "voting.scheduled", voting, events.occurrence_key(voting.opens_at, voting.closes_at))


def voting_opened(voting):
    _run("voting.opened", _voting_event, "voting.opened", voting, "")


def voting_closed(voting):
    _run("voting.closed", _voting_closed, voting)


def _voting_event(event_type, voting, key):
    record_event(event_type, "voting", voting.pk, key, commission_user_ids(voting.commission))


def _voting_closed(voting):
    cancel_jobs("voting", voting.pk, VOTING_NOTICE_TYPES, "Votación cerrada")
    _voting_event("voting.closed", voting, "")
