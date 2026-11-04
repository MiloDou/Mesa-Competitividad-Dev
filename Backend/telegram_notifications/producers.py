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

Etapa 2 (proyectos, documentos, minutas y acuerdos): mismo patrón. Destinatarios propuestos:
- proyecto (estado, publicación, archivo): miembros de su comisión + asignados vigentes;
- asignación de proyecto: solo el miembro asignado;
- documento: los mismos del proyecto, o los invitados de la reunión si es de una minuta;
- minuta aprobada: los invitados de la reunión;
- acuerdo: el responsable al asignarlo; responsable + invitados al cambiar de estado.

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


# --- Proyectos ---------------------------------------------------------------------------
# Destinatarios de un aviso de proyecto: los miembros de su comisión y sus asignados vigentes.
# ``policies`` vuelve a comprobar con ``visible_projects_for`` que cada uno pueda verlo.


def _project_audience(project):
    from accounts.models import User
    from projects.models import ProjectAssignment

    today = timezone.localdate()
    assigned = ProjectAssignment.objects.filter(project=project, starts_at__lte=today).exclude(ends_at__lt=today).values_list("member_id", flat=True)
    ids = set(User.objects.filter(is_active=True, member__is_active=True, member__id__in=assigned).values_list("pk", flat=True))
    if project.commission_id:
        ids.update(commission_user_ids(project.commission).values_list("pk", flat=True))
    return User.objects.filter(pk__in=ids)


def snapshot_project(project):
    """Estado relevante del proyecto ANTES de guardar un cambio; ``None`` si el canal está apagado."""
    if not settings.TELEGRAM_ENABLED:
        return None
    return {name: getattr(project, name) for name in events.PROJECT_RELEVANT_FIELDS}


def project_updated(project, before):
    if before is not None:
        _run("project.updated", _project_updated, project, before)


def _project_updated(project, before):
    key = events.occurrence_key(project.updated_at)
    if project.status != before["status"]:
        data = events.minimal_data("project.status_changed", {"status": project.status})
        record_event("project.status_changed", "project", project.pk, key, _project_audience(project), data=data)
    if project.is_public and not before["is_public"]:
        record_event("project.published", "project", project.pk, key, _project_audience(project))


def project_published(project):
    _run("project.published", lambda: record_event(
        "project.published", "project", project.pk, events.occurrence_key(project.updated_at), _project_audience(project),
    ))


def project_archived(project):
    _run("project.archived", _project_archived, project)


def _project_archived(project):
    cancel_jobs("project", project.pk, ["project.status_changed", "project.published", "project.assigned"], "Proyecto archivado")
    record_event("project.archived", "project", project.pk, "", _project_audience(project))


def snapshot_assignment(assignment):
    return assignment.member_id if settings.TELEGRAM_ENABLED else None


def project_assigned(assignment, previous_member_id=None):
    """Avisa solo al miembro asignado; en una edición, solo si cambió el miembro."""
    if assignment.member_id != previous_member_id:
        _run("project.assigned", _project_assigned, assignment)


def _project_assigned(assignment):
    if assignment.ends_at is not None and assignment.ends_at < timezone.localdate():
        return
    key = events.occurrence_key(assignment.pk, assignment.member_id)
    data = events.minimal_data("project.assigned", {"assignment_id": assignment.pk})
    recipients = member_user_ids([assignment.member])
    record_event("project.assigned", "project", assignment.project_id, key, recipients, data=data)


# --- Documentos --------------------------------------------------------------------------


def _document_audience(document):
    if document.project_id:
        return _project_audience(document.project)
    # Documento de minuta: los invitados a la reunión (``policies`` exige minuta aprobada).
    return member_user_ids(document.minute.meeting.invited_members.all())


def document_uploaded(document):
    _run("document.uploaded", lambda: record_event("document.uploaded", "document", document.pk, "", _document_audience(document)))


def snapshot_document(document):
    """Título del documento ANTES de guardar; ``None`` si el canal está apagado."""
    return {"title": document.title} if settings.TELEGRAM_ENABLED else None


def document_updated(document, before, fields):
    """``fields`` son los campos enviados en la edición: si trae ``file`` hay una nueva versión."""
    if before is not None:
        _run("document.updated", _document_updated, document, before, set(fields))


def _document_updated(document, before, fields):
    changed = sorted(({"file"} & fields) | ({"title"} if document.title != before["title"] else set()))
    if changed:
        data = events.minimal_data("document.updated", {"changed": changed})
        record_event("document.updated", "document", document.pk, events.occurrence_key(timezone.now()), _document_audience(document), data=data)


def document_removed(document):
    _run("document.removed", _document_removed, document)


def _document_removed(document):
    cancel_jobs("document", document.pk, ["document.uploaded", "document.updated"], "Documento retirado")
    record_event("document.removed", "document", document.pk, "", _document_audience(document))


# --- Minutas y acuerdos ------------------------------------------------------------------


def minute_approved(minute):
    _run("minute.approved", lambda: record_event(
        "minute.approved", "minute", minute.pk, "", member_user_ids(minute.meeting.invited_members.all()),
    ))


def snapshot_agreement(agreement):
    if not settings.TELEGRAM_ENABLED:
        return None
    return {"responsible_id": agreement.responsible_id, "status": agreement.status}


def agreement_created(agreement):
    _run("agreement.created", _agreement_changed, agreement, {"responsible_id": None, "status": agreement.status})


def agreement_updated(agreement, before):
    if before is not None:
        _run("agreement.updated", _agreement_changed, agreement, before)


def _agreement_changed(agreement, before):
    if agreement.responsible_id and agreement.responsible_id != before["responsible_id"]:
        key = events.occurrence_key("responsable", agreement.responsible_id)
        record_event("agreement.assigned", "agreement", agreement.pk, key, member_user_ids([agreement.responsible]))
    if agreement.status != before["status"]:
        # El estado interesa al responsable y a quienes estuvieron en la reunión.
        recipients = member_user_ids(agreement.minute.meeting.invited_members.all())
        if agreement.responsible_id:
            recipients = recipients | member_user_ids([agreement.responsible])
        data = events.minimal_data("agreement.status_changed", {"status": agreement.status})
        record_event("agreement.status_changed", "agreement", agreement.pk, events.occurrence_key(agreement.updated_at), recipients, data=data)
        if agreement.status not in events.AGREEMENT_OPEN_STATUSES:
            cancel_jobs("agreement", agreement.pk, ["agreement.reminder"], "Acuerdo cerrado")
