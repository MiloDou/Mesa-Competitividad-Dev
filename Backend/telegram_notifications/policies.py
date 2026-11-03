"""Autorización final y contenido de cada aviso (Persona B).

``authorize_and_render(job)`` es el hook que el motor llama justo antes de enviar. Devuelve
un ``Message`` o ``None``; con ``None`` el motor cancela la entrega. Regla general: ante la
duda, no enviar. Se revalida todo con el estado vigente de la base de datos, porque entre
el evento y el envío pudo cambiar la membresía, la invitación, el voto o la propia reunión.

No se reimplementan reglas de acceso cuando ya existen: se reutilizan ``visible_meetings_for``,
``visible_votings_for``, ``visible_projects_for`` y ``visible_documents_for``. Las únicas
excepciones son los avisos de algo archivado (reunión cancelada, proyecto archivado, documento
retirado), que esos selectores excluyen por diseño; ver ``_could_see_*`` y sus pruebas de paridad.

El botón del aviso usa ``settings.TELEGRAM_FRONTEND_URL`` (lo define Persona A). Si no está
configurado o no es https, el aviso sale sin botón. El frontend todavía no tiene rutas por
recurso, así que el botón abre la plataforma; ver ``RESOURCE_PATHS``.

Los errores inesperados no se ocultan: se propagan y el motor deja el trabajo en ``failed``.
"""
import logging

from django.conf import settings
from django.utils import timezone

from directory.models import CommissionMembership
from meetings.access import visible_meetings_for
from meetings.models import Agreement, Meeting, Minute
from projects.access import visible_documents_for, visible_projects_for
from projects.models import Document, FollowUpTopic, Project, ProjectAssignment
from telegram_notifications import events, templates
from voting.access import visible_votings_for
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
    context["url"] = _resource_url(event)
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


# Ruta del frontend para cada tipo de recurso, relativa a TELEGRAM_FRONTEND_URL. Vacía mientras
# el frontend no tenga rutas propias (hoy cambia de pestaña sin cambiar la URL).
RESOURCE_PATHS = {}


def _resource_url(event):
    """URL https del botón, o "" si no hay una base válida configurada."""
    base = (getattr(settings, "TELEGRAM_FRONTEND_URL", "") or "").strip().rstrip("/")
    if not base.startswith("https://"):
        return ""
    path = RESOURCE_PATHS.get(event.resource_type, "")
    return base + (path.format(id=event.resource_id) if path else "/")


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


def _voting_context(user, event):
    if not user.has_capability("voting.read"):
        return None
    pk = _resource_pk(event)
    if not pk:
        return None
    voting = visible_votings_for(user).filter(pk=pk).first()
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


# --- Proyectos ---------------------------------------------------------------------------

PROJECT_PUBLIC_STATUSES = (Project.Status.ACTIVE, Project.Status.PAUSED, Project.Status.COMPLETED)
SHAREABLE = (Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL)


def _active_commission_ids(member):
    return set(CommissionMembership.objects.active_on(member=member).values_list("commission_id", flat=True))


def _could_see_project(user, project):
    """Misma regla que ``visible_projects_for`` pero sin excluir proyectos archivados.

    Solo se usa para avisar un archivo. ``test_could_see_project_matches_visible_projects_for``
    comprueba que no se desvíe de la función original.
    """
    if user.has_capability("confidentiality.read"):
        return True
    if user.has_capability("directory.read") or user.has_capability("projects.write"):
        return project.confidentiality != Project.Confidentiality.TEMPORARY
    commission_active = project.commission is not None and project.commission.is_active
    is_public = (
        project.is_public and project.confidentiality == Project.Confidentiality.PUBLIC
        and commission_active and project.status in PROJECT_PUBLIC_STATUSES
    )
    member = _member(user)
    if member is None:
        return is_public
    in_commission = commission_active and project.commission_id in _active_commission_ids(member) and project.confidentiality in SHAREABLE
    return is_public or in_commission


def _active_assignment(event, user, project):
    """Asignación vigente indicada en el evento, si sigue siendo de este usuario."""
    assignment_id = _positive_int((event.data or {}).get("assignment_id"))
    if assignment_id is None:
        return None
    assignment = ProjectAssignment.objects.select_related("member").filter(pk=assignment_id, project=project).first()
    if assignment is None or assignment.member.user_id != user.pk or not assignment.member.is_active:
        return None
    if assignment.ends_at is not None and assignment.ends_at < timezone.localdate():
        return None
    if event.occurrence_key != events.occurrence_key(assignment.pk, assignment.member_id):
        return None
    return assignment


def _project_context(user, event):
    if not user.has_capability("projects.read"):
        return None
    pk = _resource_pk(event)
    project = Project.objects.select_related("commission").filter(pk=pk).first() if pk else None
    if project is None:
        return None
    if event.event_type == "project.archived":
        if project.deleted_at is None or not _could_see_project(user, project):
            return None
        return {"title": project.title}
    if project.deleted_at is not None or not visible_projects_for(user).filter(pk=project.pk).exists():
        return None

    context = {"title": project.title}
    if event.event_type == "project.status_changed":
        # Si el estado volvió a cambiar, este aviso quedó viejo: el siguiente evento lo cubre.
        if project.status != (event.data or {}).get("status"):
            return None
        context["status"] = project.status
    elif event.event_type == "project.published":
        if not project.is_public:
            return None
    elif event.event_type == "project.assigned":
        assignment = _active_assignment(event, user, project)
        if assignment is None:
            return None
        context.update(responsibility=assignment.responsibility, starts_at=assignment.starts_at)
    return context


# --- Documentos --------------------------------------------------------------------------


def _could_see_document(user, document):
    """Misma regla que ``visible_documents_for`` pero sin excluir documentos retirados.

    Solo se usa para avisar una retirada. ``test_could_see_document_matches_visible_documents_for``
    comprueba que no se desvíe de la función original.
    """
    project, minute = document.project, document.minute
    meeting = minute.meeting if minute is not None else None
    if user.has_capability("confidentiality.read"):
        return True
    if user.has_capability("directory.read") or user.has_capability("projects.write"):
        temporary = Project.Confidentiality.TEMPORARY
        return not (
            document.confidentiality == temporary
            or (project is not None and project.confidentiality == temporary)
            or (meeting is not None and meeting.confidentiality == Meeting.Confidentiality.TEMPORARY)
        )
    member = _member(user)
    if member is None:
        return False
    if minute is not None and minute.status != Minute.Status.APPROVED:
        return False
    commission_ids = _active_commission_ids(member)
    if project is not None:
        commission_active = project.commission is not None and project.commission.is_active
        in_commission = (
            commission_active and project.commission_id in commission_ids
            and project.confidentiality in SHAREABLE and document.confidentiality in SHAREABLE
        )
        is_public = (
            commission_active and project.is_public and project.confidentiality == Project.Confidentiality.PUBLIC
            and project.status in PROJECT_PUBLIC_STATUSES and document.confidentiality == Project.Confidentiality.PUBLIC
        )
        return in_commission or is_public
    return (
        meeting.commission.is_active and meeting.commission_id in commission_ids
        and meeting.invited_members.filter(pk=member.pk).exists()
        and meeting.confidentiality in (Meeting.Confidentiality.PUBLIC, Meeting.Confidentiality.INTERNAL)
        and document.confidentiality in SHAREABLE
    )


def _document_parent(user, document):
    """Nombre del recurso padre si el usuario también puede verlo; ``None`` si no."""
    if document.project_id:
        if not visible_projects_for(user).filter(pk=document.project_id).exists():
            return None
        return f"Proyecto {document.project.title}"
    minute = document.minute
    if minute.deleted_at is not None or minute.status != Minute.Status.APPROVED:
        return None
    if not visible_meetings_for(user).filter(pk=minute.meeting_id).exists():
        return None
    return f"Minuta de {minute.meeting.title}"


def _document_context(user, event):
    if not user.has_capability("documents.read"):
        return None
    pk = _resource_pk(event)
    document = Document.objects.select_related("project__commission", "minute__meeting__commission").filter(pk=pk).first() if pk else None
    if document is None:
        return None
    if event.event_type == "document.removed":
        if document.deleted_at is None or not _could_see_document(user, document):
            return None
    elif document.deleted_at is not None or not visible_documents_for(user).filter(pk=document.pk).exists():
        return None
    parent = _document_parent(user, document)
    if parent is None:
        return None
    changed = (event.data or {}).get("changed")
    return {"title": document.title, "parent": parent, "changed": changed if isinstance(changed, list) else []}


# --- Minutas y acuerdos ------------------------------------------------------------------


def _visible_minute(user, minute):
    """La minuta está aprobada y vigente, y el usuario puede ver su reunión."""
    if minute is None or minute.deleted_at is not None or minute.status != Minute.Status.APPROVED:
        return False
    return visible_meetings_for(user).filter(pk=minute.meeting_id).exists()


def _minute_context(user, event):
    if not user.has_capability("meetings.read"):
        return None
    pk = _resource_pk(event)
    minute = Minute.objects.select_related("meeting").filter(pk=pk).first() if pk else None
    if not _visible_minute(user, minute):
        return None
    return {"title": minute.meeting.title, "scheduled_at": minute.meeting.scheduled_at}


def _is_responsible(user, item):
    """El responsable se identifica por la relación con ``Member`` y su cuenta, nunca por un nombre."""
    return item.responsible is not None and item.responsible.is_active and item.responsible.user_id == user.pk


def _date_reminder_ok(event, item):
    """Recordatorio por fecha: la clave debe coincidir con la fecha y el responsable vigentes."""
    days = _positive_int((event.data or {}).get("days_before"))
    if days is None or item.due_at is None or item.due_at < timezone.localdate():
        return None
    if event.occurrence_key != events.occurrence_key(item.due_at, item.responsible_id, days):
        return None
    return days


def _agreement_context(user, event):
    if not user.has_capability("meetings.read"):
        return None
    pk = _resource_pk(event)
    agreement = Agreement.objects.select_related("minute__meeting", "responsible").filter(pk=pk, deleted_at__isnull=True).first() if pk else None
    if agreement is None or not _visible_minute(user, agreement.minute):
        return None
    context = {"title": agreement.title, "meeting_title": agreement.minute.meeting.title, "due_at": agreement.due_at}
    if event.event_type == "agreement.assigned":
        if not _is_responsible(user, agreement) or event.occurrence_key != events.occurrence_key("responsable", agreement.responsible_id):
            return None
    elif event.event_type == "agreement.status_changed":
        if agreement.status != (event.data or {}).get("status"):
            return None
        context["status"] = agreement.status
    elif event.event_type == "agreement.reminder":
        if not _is_responsible(user, agreement) or agreement.status not in events.AGREEMENT_OPEN_STATUSES:
            return None
        days = _date_reminder_ok(event, agreement)
        if days is None:
            return None
        context["days_before"] = days
    return context


# --- Temas de seguimiento ----------------------------------------------------------------


def _followup_context(user, event):
    if not user.has_capability("projects.read"):
        return None
    pk = _resource_pk(event)
    topic = FollowUpTopic.objects.select_related("project", "responsible").filter(pk=pk, deleted_at__isnull=True).first() if pk else None
    if topic is None or topic.completed_at is not None or not _is_responsible(user, topic):
        return None
    if not visible_projects_for(user).filter(pk=topic.project_id).exists():
        return None
    days = _date_reminder_ok(event, topic)
    if days is None:
        return None
    return {"title": topic.title, "project_title": topic.project.title, "due_at": topic.due_at, "days_before": days}


_BUILDERS = {
    "meeting": _meeting_context,
    "voting": _voting_context,
    "project": _project_context,
    "document": _document_context,
    "minute": _minute_context,
    "agreement": _agreement_context,
    "followup": _followup_context,
}
