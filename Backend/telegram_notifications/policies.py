"""Autorización final y contenido de cada aviso (Persona B).

``authorize_and_render(job)`` es el hook que el motor llama justo antes de enviar. Devuelve
un ``Message`` o ``None``; con ``None`` el motor cancela la entrega. Regla general: ante la
duda, no enviar. Se revalida todo con el estado vigente de la base de datos, porque entre
el evento y el envío pudo cambiar la membresía, la invitación, el voto o la propia reunión.

No se reimplementan reglas de acceso cuando ya existen: se reutilizan ``visible_meetings_for``
y el queryset de ``VotingViewSet``. La única excepción es una reunión archivada (cancelada),
que ``visible_meetings_for`` excluye por diseño; ver ``_could_see_meeting`` y su prueba de paridad.

Los errores inesperados no se ocultan: se propagan y el motor deja el trabajo en ``failed``.
"""
import logging
from types import SimpleNamespace

from django.utils import timezone

from directory.models import CommissionMembership
from meetings.access import visible_meetings_for
from meetings.models import Meeting
from telegram_notifications import events, templates
from voting.models import Vote, Voting
from voting.services import is_eligible_member

logger = logging.getLogger(__name__)

VOTING_REQUIRED_STATUS = {
    "voting.scheduled": Voting.Status.SCHEDULED,
    "voting.opened": Voting.Status.OPEN,
    "voting.closed": Voting.Status.CLOSED,
    "voting.reminder": Voting.Status.OPEN,
}


def authorize_and_render(job):
    """Hook del motor: ``Message`` si el aviso sigue permitido; ``None`` si debe cancelarse."""
    event = job.event
    user = job.user
    spec = events.EVENTS.get(event.event_type)
    if spec is None or spec.resource_type != event.resource_type or not user.is_active:
        return None
    builder = _BUILDERS.get(event.resource_type)
    context = builder(user, event) if builder else None
    if context is None:
        return None
    try:
        return templates.render(event.event_type, context)
    except templates.TemplateError:
        logger.warning("Plantilla sin datos suficientes para el evento %s", event.pk)
        return None


def _resource_pk(event):
    try:
        return int(event.resource_id)
    except (TypeError, ValueError):
        return None


def _positive_int(value):
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        return None
    return value


def _member(user):
    member = getattr(user, "member", None)
    return member if member is not None and member.is_active else None


# --- Reuniones ---------------------------------------------------------------------------


def _could_see_meeting(user, meeting):
    """Misma regla que ``visible_meetings_for`` pero sin excluir reuniones archivadas.

    Solo se usa para avisar una cancelación. ``test_could_see_meeting_matches_visible_meetings_for``
    comprueba que no se desvíe de la función original.
    """
    if user.has_capability("directory.read") or user.has_capability("meetings.write"):
        return True
    member = _member(user)
    if member is None:
        return False
    if meeting.confidentiality not in (Meeting.Confidentiality.PUBLIC, Meeting.Confidentiality.INTERNAL):
        return False
    if not meeting.commission.is_active:
        return False
    in_commission = CommissionMembership.objects.active_on(member=member).filter(commission_id=meeting.commission_id).exists()
    return in_commission and meeting.invited_members.filter(pk=member.pk).exists()


def _meeting_context(user, event):
    if not user.has_capability("meetings.read"):
        return None
    pk = _resource_pk(event)
    meeting = Meeting.objects.select_related("commission").filter(pk=pk).first() if pk else None
    if meeting is None or meeting.scheduled_at <= timezone.now():
        return None
    if event.event_type == "meeting.cancelled":
        if meeting.deleted_at is None or not _could_see_meeting(user, meeting):
            return None
    elif meeting.deleted_at is not None or not visible_meetings_for(user).filter(pk=meeting.pk).exists():
        return None

    data = event.data or {}
    window_hours = None
    if event.event_type == "meeting.reminder":
        window_hours = _positive_int(data.get("window_hours"))
        # La clave incluye la fecha: si la reunión se reprogramó, el recordatorio quedó viejo.
        if window_hours is None or event.occurrence_key != events.occurrence_key(meeting.scheduled_at, window_hours):
            return None
    return {
        "title": meeting.title,
        "scheduled_at": meeting.scheduled_at,
        "ends_at": meeting.ends_at,
        "modality": meeting.modality,
        "location": meeting.location,
        "meeting_link": meeting.meeting_link,
        "changed": data.get("changed") if isinstance(data.get("changed"), list) else [],
        "window_hours": window_hours,
    }


# --- Votaciones --------------------------------------------------------------------------


def _visible_votings(user):
    """Votaciones que el usuario puede consultar por la API (misma regla del ``VotingViewSet``)."""
    from voting.views import VotingViewSet

    view = VotingViewSet()
    view.request = SimpleNamespace(user=user)
    return view.get_queryset()


def _voting_context(user, event):
    if not user.has_capability("voting.read"):
        return None
    pk = _resource_pk(event)
    if not pk:
        return None
    voting = _visible_votings(user).filter(pk=pk).first()
    if voting is None or voting.status != VOTING_REQUIRED_STATUS[event.event_type]:
        return None

    window_hours = None
    if event.event_type == "voting.reminder":
        window_hours = _positive_int((event.data or {}).get("window_hours"))
        if window_hours is None or voting.closes_at is None or voting.closes_at <= timezone.now():
            return None
        if event.occurrence_key != events.occurrence_key(voting.closes_at, window_hours):
            return None
        # Solo recuerda a quien todavía puede votar y no lo ha hecho.
        member = _member(user)
        if member is None or not user.has_capability("vote.cast") or not is_eligible_member(user, voting):
            return None
        if Vote.objects.filter(voting=voting, member=member).exists():
            return None
    return {
        "title": voting.title,
        "opens_at": voting.opens_at,
        "closes_at": voting.closes_at,
        "window_hours": window_hours,
    }


_BUILDERS = {"meeting": _meeting_context, "voting": _voting_context}
