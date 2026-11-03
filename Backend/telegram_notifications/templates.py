"""Plantillas de mensajes de Telegram (Persona B).

``render(event_type, context)`` recibe datos ya autorizados por ``policies`` y devuelve un
``Message`` en texto plano (el cliente no usa parse_mode, así que ningún carácter del título
puede alterar el formato). Ante datos faltantes o tipos desconocidos lanza ``TemplateError``;
la política debe interpretarlo como "no enviar".

Contexto esperado (solo lo necesario para cada tipo):
    reuniones: title, scheduled_at, [ends_at, modality, location, meeting_link, changed, window_hours]
    votaciones: title, [opens_at, closes_at, window_hours]
    proyectos: title, [status | responsibility, starts_at]
    documentos: title, parent, [changed]
    minutas: title (de la reunión), scheduled_at
    acuerdos: title, meeting_title, [due_at, status, days_before]
    seguimiento: title, project_title, due_at, days_before
    común: [url] enlace https autorizado para el botón.
"""
import re

from django.utils import timezone

from telegram_notifications.contracts import Message

DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]
MODALITY_LABELS = {"in_person": "Presencial", "virtual": "Virtual", "hybrid": "Híbrida"}
CHANGE_LABELS = {
    "scheduled_at": "fecha y hora",
    "ends_at": "hora de finalización",
    "modality": "modalidad",
    "location": "lugar",
    "meeting_link": "enlace",
}
TITLE_LIMIT = 120
BUTTON_LABEL = "Abrir en la plataforma"
CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]+")


class TemplateError(ValueError):
    """No se puede construir el mensaje con los datos recibidos."""


def clean_text(value, limit=TITLE_LIMIT):
    """Quita caracteres de control, normaliza espacios y recorta."""
    text = " ".join(CONTROL_CHARS.sub(" ", str(value or "")).split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def format_datetime(value):
    local = timezone.localtime(value) if timezone.is_aware(value) else value
    return f"{DAYS[local.weekday()]} {local.day} de {MONTHS[local.month - 1]} de {local.year}, {local:%H:%M}"


def _hours(value):
    hours = int(value)
    return "1 hora" if hours == 1 else f"{hours} horas"


def _require(context, *keys):
    missing = [key for key in keys if not context.get(key)]
    if missing:
        raise TemplateError(f"Faltan datos para el mensaje: {', '.join(missing)}")


def _meeting_details(context):
    lines = [f"Fecha: {format_datetime(context['scheduled_at'])}"]
    if context.get("ends_at"):
        lines.append(f"Finaliza: {format_datetime(context['ends_at'])}")
    modality = context.get("modality")
    if modality in MODALITY_LABELS:
        lines.append(f"Modalidad: {MODALITY_LABELS[modality]}")
    if context.get("location") and modality != "virtual":
        lines.append(f"Lugar: {clean_text(context['location'], 240)}")
    if context.get("meeting_link") and modality != "in_person":
        lines.append(f"Enlace: {clean_text(context['meeting_link'], 500)}")
    return lines


def _meeting_message(heading, context, *extra):
    _require(context, "title", "scheduled_at")
    return [heading, clean_text(context["title"]), *extra, *_meeting_details(context)]


def _meeting_created(context):
    return _meeting_message("Nueva reunión", context)


def _meeting_updated(context):
    changed = [CHANGE_LABELS[field] for field in context.get("changed") or [] if field in CHANGE_LABELS]
    extra = [f"Cambió: {', '.join(changed)}."] if changed else []
    return _meeting_message("Reunión actualizada", context, *extra)


def _meeting_invited(context):
    return _meeting_message("Fuiste incluido en una reunión", context)


def _meeting_cancelled(context):
    _require(context, "title", "scheduled_at")
    return ["Reunión cancelada", clean_text(context["title"]), f"Estaba programada para el {format_datetime(context['scheduled_at'])}."]


def _meeting_reminder(context):
    _require(context, "window_hours")
    return _meeting_message("Recordatorio de reunión", context, f"Comienza en {_hours(context['window_hours'])}.")


def _voting_scheduled(context):
    _require(context, "title")
    lines = ["Votación programada", clean_text(context["title"])]
    if context.get("opens_at"):
        lines.append(f"Abre: {format_datetime(context['opens_at'])}")
    if context.get("closes_at"):
        lines.append(f"Cierra: {format_datetime(context['closes_at'])}")
    return lines


def _voting_opened(context):
    _require(context, "title")
    lines = ["Votación abierta", clean_text(context["title"])]
    if context.get("closes_at"):
        lines.append(f"Cierra: {format_datetime(context['closes_at'])}")
    lines.append("Ingresa a la plataforma para emitir tu voto.")
    return lines


def _voting_closed(context):
    _require(context, "title")
    return ["Votación cerrada", clean_text(context["title"])]


def _voting_reminder(context):
    _require(context, "title", "closes_at", "window_hours")
    return [
        "Recordatorio de votación",
        clean_text(context["title"]),
        f"Aún no registras tu voto. Cierra en {_hours(context['window_hours'])} ({format_datetime(context['closes_at'])}).",
    ]


# --- Etapa 2: proyectos, documentos, minutas, acuerdos y seguimiento ---------------------

PROJECT_STATUS_LABELS = {"draft": "Borrador", "active": "En curso", "paused": "Pausado", "completed": "Completado", "archived": "Archivado"}
AGREEMENT_STATUS_LABELS = {"pending": "Pendiente", "in_progress": "En seguimiento", "completed": "Cumplido", "cancelled": "Cancelado"}
DOCUMENT_CHANGE_LABELS = {"file": "archivo", "title": "título"}


def format_date(value):
    """Fecha sin hora: «viernes 6 de noviembre de 2026»."""
    return f"{DAYS[value.weekday()]} {value.day} de {MONTHS[value.month - 1]} de {value.year}"


def _days(value):
    days = int(value)
    return "mañana" if days == 1 else f"en {days} días"


def _status_label(labels, value):
    if value not in labels:
        raise TemplateError(f"Estado desconocido: {value}")
    return labels[value]


def _project_status_changed(context):
    _require(context, "title", "status")
    return ["Proyecto actualizado", clean_text(context["title"]), f"Nuevo estado: {_status_label(PROJECT_STATUS_LABELS, context['status'])}."]


def _project_published(context):
    _require(context, "title")
    return ["Proyecto publicado", clean_text(context["title"]), "Ya aparece en el sitio público de la Mesa."]


def _project_archived(context):
    _require(context, "title")
    return ["Proyecto archivado", clean_text(context["title"])]


def _project_assigned(context):
    _require(context, "title", "responsibility", "starts_at")
    return [
        "Te asignaron a un proyecto",
        clean_text(context["title"]),
        f"Responsabilidad: {clean_text(context['responsibility'])}",
        f"Desde: {format_date(context['starts_at'])}",
    ]


def _document_lines(heading, context, *extra):
    _require(context, "title", "parent")
    return [heading, clean_text(context["title"]), *extra, f"En: {clean_text(context['parent'], 200)}"]


def _document_uploaded(context):
    return _document_lines("Nuevo documento", context)


def _document_updated(context):
    changed = [DOCUMENT_CHANGE_LABELS[field] for field in context.get("changed") or [] if field in DOCUMENT_CHANGE_LABELS]
    extra = [f"Cambió: {', '.join(changed)}."] if changed else []
    return _document_lines("Documento actualizado", context, *extra)


def _document_removed(context):
    return _document_lines("Documento retirado", context)


def _minute_approved(context):
    _require(context, "title", "scheduled_at")
    return ["Minuta aprobada", clean_text(context["title"]), f"Reunión del {format_datetime(context['scheduled_at'])}."]


def _agreement_lines(heading, context, *extra):
    _require(context, "title", "meeting_title")
    lines = [heading, clean_text(context["title"]), *extra]
    if context.get("due_at"):
        lines.append(f"Vence: {format_date(context['due_at'])}")
    lines.append(f"Reunión: {clean_text(context['meeting_title'])}")
    return lines


def _agreement_assigned(context):
    return _agreement_lines("Te asignaron un acuerdo", context)


def _agreement_status_changed(context):
    _require(context, "status")
    return _agreement_lines("Acuerdo actualizado", context, f"Nuevo estado: {_status_label(AGREEMENT_STATUS_LABELS, context['status'])}.")


def _agreement_reminder(context):
    _require(context, "title", "due_at", "days_before")
    return ["Recordatorio de acuerdo", clean_text(context["title"]), f"Vence {_days(context['days_before'])} ({format_date(context['due_at'])})."]


def _followup_reminder(context):
    _require(context, "title", "project_title", "due_at", "days_before")
    return [
        "Recordatorio de seguimiento",
        clean_text(context["title"]),
        f"Proyecto: {clean_text(context['project_title'])}",
        f"Vence {_days(context['days_before'])} ({format_date(context['due_at'])}).",
    ]


RENDERERS = {
    "meeting.created": _meeting_created,
    "meeting.updated": _meeting_updated,
    "meeting.invited": _meeting_invited,
    "meeting.cancelled": _meeting_cancelled,
    "meeting.reminder": _meeting_reminder,
    "voting.scheduled": _voting_scheduled,
    "voting.opened": _voting_opened,
    "voting.closed": _voting_closed,
    "voting.reminder": _voting_reminder,
    "project.status_changed": _project_status_changed,
    "project.published": _project_published,
    "project.archived": _project_archived,
    "project.assigned": _project_assigned,
    "document.uploaded": _document_uploaded,
    "document.updated": _document_updated,
    "document.removed": _document_removed,
    "minute.approved": _minute_approved,
    "agreement.assigned": _agreement_assigned,
    "agreement.status_changed": _agreement_status_changed,
    "agreement.reminder": _agreement_reminder,
    "followup.reminder": _followup_reminder,
}


def render(event_type, context):
    """Devuelve el ``Message`` del evento. Solo admite botones con URL https."""
    renderer = RENDERERS.get(event_type)
    if renderer is None:
        raise TemplateError(f"Sin plantilla para {event_type}")
    try:
        lines = renderer(context)
    except (KeyError, TypeError, ValueError) as exc:
        if isinstance(exc, TemplateError):
            raise
        raise TemplateError(f"Datos inválidos para {event_type}") from exc
    url = context.get("url") or ""
    buttons = [(BUTTON_LABEL, url)] if url.startswith("https://") else []
    return Message(text="\n".join(lines), buttons=buttons)
