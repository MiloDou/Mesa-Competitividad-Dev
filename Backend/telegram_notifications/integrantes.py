"""Integrantes de Telegram: personas sin cuenta en la plataforma que la Comisión registra para recibir avisos.

Cada integrante se guarda como un usuario interno que no puede iniciar sesión (sin contraseña y con
un correo del dominio reservado ``.invalid``) y con el rol de solo lectura ``reader``. Así el motor,
las políticas y las plantillas existentes se reutilizan sin cambios. Un integrante recibe:

- los avisos generales de la Mesa (``GENERAL_EVENT_TYPES``), nunca los personales ni nada
  confidencial (``_shareable`` lo comprueba otra vez justo antes de enviar);
- los avisos que la Comisión escribe a mano (``ANNOUNCEMENT``), que llegan a todo chat activo.
"""
import logging
import re
import secrets
import uuid

import requests
from django.db import transaction

from accounts.models import Role, User
from common.audit import record_event as audit
from meetings.models import Agreement, Meeting, Minute
from projects.models import Document, Project
from telegram_notifications import client, linking
from telegram_notifications.contracts import Message, record_event
from telegram_notifications.models import DeliveryJob, TelegramLink
from voting.models import Voting

logger = logging.getLogger(__name__)

EMAIL_DOMAIN = "integrantes.telegram.invalid"
ROLE_KEY = "reader"
NAME_LIMIT = 100  # User.first_name
ANNOUNCEMENT = "mesa.announcement"
ANNOUNCEMENT_LIMIT = 2000
ANNOUNCEMENT_TITLE = "Aviso de la Mesa de Competitividad"
CONFIDENTIAL = "temporary_confidential"

# Avisos informativos de la Mesa. Quedan fuera los personales: invitación individual, asignaciones,
# recordatorios de voto y de vencimientos, que solo tienen sentido para una cuenta concreta.
GENERAL_EVENT_TYPES = frozenset({
    "meeting.created", "meeting.updated", "meeting.cancelled", "meeting.reminder",
    "voting.scheduled", "voting.opened", "voting.closed",
    "project.status_changed", "project.published", "project.archived",
    "document.uploaded", "document.updated", "document.removed",
    "minute.approved", "agreement.status_changed",
})

CONSENT_TEXT = (
    "La Comisión de la Mesa de Competitividad registró este chat para recibir los avisos de la Mesa. "
    "¿Aceptas recibirlos por Telegram? Puedes darte de baja cuando quieras con /desvincular."
)
REMOVED_TEXT = "La Comisión de la Mesa de Competitividad te dio de baja de los avisos por Telegram. Ya no recibirás mensajes."

# Campos de confidencialidad a revisar por tipo de recurso: si alguno es confidencial, no se envía.
_CONFIDENTIALITY_FIELDS = {
    "meeting": (Meeting, ("confidentiality",)),
    "minute": (Minute, ("meeting__confidentiality",)),
    "agreement": (Agreement, ("minute__meeting__confidentiality",)),
    "project": (Project, ("confidentiality",)),
    "document": (Document, ("confidentiality", "project__confidentiality", "minute__meeting__confidentiality")),
    "voting": (Voting, ("project__confidentiality", "agreement__minute__meeting__confidentiality")),
}
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")


def is_integrante(user):
    return user.email.endswith("@" + EMAIL_DOMAIN)


def links():
    return TelegramLink.objects.filter(user__email__endswith="@" + EMAIL_DOMAIN)


def general_recipient_ids(event_type):
    """Integrantes activos que deben recibir este tipo de evento (``record_event`` filtra el vínculo activo)."""
    if event_type not in GENERAL_EVENT_TYPES:
        return set()
    return set(User.objects.filter(is_active=True, email__endswith="@" + EMAIL_DOMAIN).values_list("pk", flat=True))


def clean_name(value):
    return " ".join(_CONTROL_CHARS.sub(" ", str(value or "")).split())[:NAME_LIMIT]


def clean_announcement(value):
    lines = [" ".join(_CONTROL_CHARS.sub(" ", line).split()) for line in str(value or "").splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def register(request, name, code):
    """Crea el integrante y su vínculo pendiente de consentimiento. Si el código no sirve, no queda nada creado."""
    with transaction.atomic():
        user = User.objects.create_user(f"integrante-{secrets.token_hex(8)}@{EMAIL_DOMAIN}", None, first_name=name)
        user.roles.add(Role.objects.get(key=ROLE_KEY))
        link = linking.approve(request, code, user)
    return link, linking.send_consent(link, CONSENT_TEXT)


def remove(request, link):
    """Da de baja al integrante: revoca el vínculo, cancela lo pendiente y desactiva su usuario interno."""
    with transaction.atomic():
        changed = linking.revoke(link, "Eliminado por la Comisión", request)
        User.objects.filter(pk=link.user_id).update(is_active=False)
    if changed:
        try:
            client.send_message(link.chat_id, REMOVED_TEXT)
        except (client.TelegramError, requests.RequestException):
            logger.warning("No se pudo avisar la baja al chat del vínculo %s", link.pk)
    return changed


def announce(request, text):
    """Encola un aviso manual para todos los chats activos. Devuelve cuántos lo recibirán."""
    recipients = TelegramLink.objects.filter(status=TelegramLink.Status.ACTIVE, user__is_active=True).values_list("user_id", flat=True)
    with transaction.atomic():
        event = record_event(ANNOUNCEMENT, "announcement", uuid.uuid4().hex, "", list(recipients), data={"text": text})
        count = DeliveryJob.objects.filter(event=event).count()
        audit(request, "telegram.announcement", event, f"Aviso por Telegram enviado a {count} chats")
    return count


def wrap(render):
    """Envuelve el hook de políticas de B: rinde los avisos manuales y filtra lo que llega a integrantes."""

    def render_for_job(job):
        if job.event.event_type == ANNOUNCEMENT:
            text = (job.event.data or {}).get("text")
            return Message(f"{ANNOUNCEMENT_TITLE}\n\n{text}") if job.user.is_active and text else None
        message = render(job)
        if message is not None and is_integrante(job.user):
            if job.event.event_type not in GENERAL_EVENT_TYPES or not _shareable(job.event):
                return None
        return message

    return render_for_job


def _shareable(event):
    model, fields = _CONFIDENTIALITY_FIELDS.get(event.resource_type, (None, None))
    if model is None or not str(event.resource_id).isdigit():
        return False
    values = model.objects.filter(pk=int(event.resource_id)).values_list(*fields).first()
    return values is not None and CONFIDENTIAL not in values
