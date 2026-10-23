"""Catálogo de eventos de notificación (Persona B).

Define qué acontecimientos generan avisos, qué datos mínimos viajan en
``NotificationEvent.data`` y cómo se arma ``occurrence_key``. El contenido del mensaje
se construye al enviar, con el estado vigente del recurso (ver ``policies``), por eso
``data`` guarda solo contexto breve y nunca datos personales.

Este módulo no importa modelos de negocio ni el motor, para evitar ciclos de importación.
"""
import hashlib
from dataclasses import dataclass

# NotificationEvent.occurrence_key tiene max_length=120.
MAX_KEY_LENGTH = 120


@dataclass(frozen=True)
class EventSpec:
    event_type: str
    resource_type: str
    description: str
    data_fields: tuple = ()
    key_hint: str = ""


_SPECS = [
    EventSpec("meeting.created", "meeting", "Se creó una reunión; avisa a los invitados.", (), "vacío (una sola vez por reunión)"),
    EventSpec(
        "meeting.updated", "meeting", "Cambió algo relevante de la reunión (ver MEETING_RELEVANT_FIELDS).",
        ("changed",), "updated_at de la reunión tras el cambio",
    ),
    EventSpec("meeting.invited", "meeting", "Se agregaron invitados a una reunión ya creada.", (), "ids de usuarios nuevos, ordenados"),
    EventSpec("meeting.cancelled", "meeting", "La reunión se canceló (borrado lógico).", (), "vacío (una sola vez por reunión)"),
    EventSpec("meeting.reminder", "meeting", "Recordatorio previo a la reunión.", ("window_hours",), "scheduled_at + horas de antelación"),
    EventSpec("voting.scheduled", "voting", "Se programó una votación.", (), "opens_at + closes_at"),
    EventSpec("voting.opened", "voting", "Se abrió una votación; avisa a los elegibles.", (), "vacío (una sola vez por votación)"),
    EventSpec("voting.closed", "voting", "Se cerró una votación.", (), "vacío (una sola vez por votación)"),
    EventSpec("voting.reminder", "voting", "Votación próxima a cerrar; solo a quien no votó.", ("window_hours",), "closes_at + horas de antelación"),
]

EVENTS = {spec.event_type: spec for spec in _SPECS}

# Cambios de una reunión que justifican un aviso. Título, descripción y agenda quedan fuera
# para no generar ruido por correcciones menores.
MEETING_RELEVANT_FIELDS = frozenset({"scheduled_at", "ends_at", "modality", "location", "meeting_link"})


def get_spec(event_type):
    try:
        return EVENTS[event_type]
    except KeyError:
        raise ValueError(f"Tipo de evento desconocido: {event_type}") from None


def minimal_data(event_type, data):
    """Conserva solo los campos permitidos para el evento; descarta el resto."""
    allowed = get_spec(event_type).data_fields
    return {key: value for key, value in (data or {}).items() if key in allowed}


def relevant_meeting_changes(changed_fields):
    """Devuelve, ordenados, los campos cambiados que sí ameritan aviso."""
    return sorted(MEETING_RELEVANT_FIELDS.intersection(changed_fields or []))


def is_relevant_meeting_change(changed_fields):
    return bool(relevant_meeting_changes(changed_fields))


def occurrence_key(*parts):
    """Construye una clave estable a partir de las partes (fechas en ISO).

    Misma ocurrencia => misma clave (idempotente); una reprogramación cambia la fecha y
    por tanto genera otra. Si excede el largo permitido se reemplaza por un hash.
    """
    raw = "|".join("" if part is None else part.isoformat() if hasattr(part, "isoformat") else str(part) for part in parts)
    if len(raw) <= MAX_KEY_LENGTH:
        return raw
    return hashlib.sha256(raw.encode()).hexdigest()
