"""Vinculación de chats privados con cuentas: tickets, aprobación, consentimiento y comandos del bot."""
import logging
import secrets
from datetime import timedelta

import requests
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.models import digest_token
from common.audit import record_event
from telegram_notifications import client
from telegram_notifications.models import DeliveryJob, LinkTicket, TelegramLink

logger = logging.getLogger(__name__)

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 8
TICKET_TTL = timedelta(minutes=15)
CURRENT_STATUSES = [TelegramLink.Status.PENDING_CONSENT, TelegramLink.Status.ACTIVE, TelegramLink.Status.PAUSED]

CONSENT_TEXT = (
    "Tu cuenta de la Mesa de Competitividad fue vinculada a este chat. "
    "¿Aceptas recibir avisos de actividades del sistema por Telegram? Puedes desvincularte en cualquier momento con /desvincular."
)
CONSENT_MARKUP = {"inline_keyboard": [[
    {"text": "Acepto", "callback_data": "consent:yes"},
    {"text": "No acepto", "callback_data": "consent:no"},
]]}
HELP_TEXT = "Comandos: /start, /estado, /pausar, /reanudar, /desvincular."
STATUS_TEXT = {
    TelegramLink.Status.PENDING_CONSENT: "Vínculo pendiente de tu consentimiento.",
    TelegramLink.Status.ACTIVE: "Avisos activos.",
    TelegramLink.Status.PAUSED: "Avisos en pausa. Usa /reanudar para volver a recibirlos.",
}
NOT_LINKED_TEXT = "Este chat no está vinculado. Usa /start para obtener un código de vinculación."


def normalize_code(code):
    return (code or "").strip().upper()


def issue_ticket(chat_id, telegram_name=""):
    """Emite un código nuevo para el chat y descarta sus tickets sin usar y los vencidos."""
    now = timezone.now()
    LinkTicket.objects.filter(Q(chat_id=chat_id) | Q(expires_at__lte=now), used_at__isnull=True).delete()
    code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
    LinkTicket.objects.create(code_digest=digest_token(code), chat_id=chat_id, telegram_name=telegram_name[:120], expires_at=now + TICKET_TTL)
    return code


def approve(request, code, user):
    """Crea el vínculo pendiente de consentimiento. Llamar dentro de transaction.atomic."""
    now = timezone.now()
    ticket = LinkTicket.objects.select_for_update().filter(code_digest=digest_token(normalize_code(code))).first()
    if ticket is None or ticket.used_at or ticket.expires_at <= now:
        raise ValidationError({"code": "Código inválido, vencido o ya utilizado."})
    if not user.is_active:
        raise ValidationError({"user": "La cuenta está inactiva."})
    try:
        with transaction.atomic():
            link = TelegramLink.objects.create(user=user, chat_id=ticket.chat_id, approved_by=request.user)
    except IntegrityError:
        raise ValidationError({"detail": "La cuenta o el chat ya tienen un vínculo vigente."}) from None
    ticket.used_at = now
    ticket.save(update_fields=["used_at"])
    record_event(request, "telegram_link.approve", link, f"Vínculo de Telegram aprobado para {user.email}")
    return link


def send_consent(link):
    """Envía la solicitud de consentimiento; devuelve False si Telegram no la aceptó."""
    try:
        client.send_message(link.chat_id, CONSENT_TEXT, CONSENT_MARKUP)
    except (client.TelegramError, requests.RequestException):
        logger.exception("No se pudo enviar el consentimiento del vínculo %s", link.pk)
        return False
    return True


def revoke(link, reason, request=None):
    """Revoca el vínculo y cancela sus entregas pendientes. Idempotente."""
    if link.status == TelegramLink.Status.REVOKED:
        return False
    link.status = TelegramLink.Status.REVOKED
    link.revoked_at = timezone.now()
    link.save(update_fields=["status", "revoked_at", "updated_at"])
    DeliveryJob.objects.filter(user_id=link.user_id, status=DeliveryJob.Status.PENDING).update(
        status=DeliveryJob.Status.CANCELLED, cancel_reason=reason[:120], updated_at=timezone.now()
    )
    record_event(request, "telegram_link.revoke", link, reason, user_override=None if request else link.user)
    return True


def _reply(chat_id, text, reply_markup=None):
    payload = {"method": "sendMessage", "chat_id": chat_id, "text": text}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return payload


def _current_link(chat_id):
    return TelegramLink.objects.select_for_update().filter(chat_id=chat_id, status__in=CURRENT_STATUSES).first()


def handle_update(update):
    """Procesa un update de Telegram y devuelve la respuesta del webhook (o None). Llamar dentro de transaction.atomic."""
    if "callback_query" in update:
        return _handle_callback(update["callback_query"])
    message = update.get("message") or {}
    chat = message.get("chat") or {}
    if chat.get("type") != "private":
        return None
    chat_id = chat["id"]
    words = (message.get("text") or "").split()
    command = words[0].split("@")[0].lower() if words else ""
    link = _current_link(chat_id)

    if command == "/start":
        if link is None:
            code = issue_ticket(chat_id, (message.get("from") or {}).get("first_name", ""))
            return _reply(chat_id, f"Tu código de vinculación es {code}. Entrégalo a la administración de la Mesa; vence en 15 minutos.")
        if link.status == TelegramLink.Status.PENDING_CONSENT:
            return _reply(chat_id, CONSENT_TEXT, CONSENT_MARKUP)
        return _reply(chat_id, f"Este chat ya está vinculado. {STATUS_TEXT[link.status]}")
    if command not in {"/estado", "/pausar", "/reanudar", "/desvincular"}:
        return _reply(chat_id, HELP_TEXT)
    if link is None:
        return _reply(chat_id, NOT_LINKED_TEXT)
    if command == "/desvincular":
        revoke(link, "Desvinculado desde Telegram")
        return _reply(chat_id, "Chat desvinculado. Ya no recibirás avisos.")
    if command == "/pausar" and link.status == TelegramLink.Status.ACTIVE:
        link.status = TelegramLink.Status.PAUSED
        link.save(update_fields=["status", "updated_at"])
    elif command == "/reanudar" and link.status == TelegramLink.Status.PAUSED and link.consent_at:
        link.status = TelegramLink.Status.ACTIVE
        link.save(update_fields=["status", "updated_at"])
    return _reply(chat_id, STATUS_TEXT[link.status])


def _handle_callback(query):
    message = query.get("message") or {}
    chat = message.get("chat") or {}
    data = query.get("data")
    if chat.get("type") != "private" or data not in {"consent:yes", "consent:no"}:
        return None
    link = _current_link(chat["id"])
    if link is None:
        text = NOT_LINKED_TEXT
    elif link.status != TelegramLink.Status.PENDING_CONSENT:
        text = STATUS_TEXT[link.status]
    elif data == "consent:yes":
        link.status = TelegramLink.Status.ACTIVE
        link.consent_at = timezone.now()
        link.save(update_fields=["status", "consent_at", "updated_at"])
        record_event(None, "telegram_link.consent", link, "Consentimiento aceptado", user_override=link.user)
        text = "Gracias. Recibirás avisos por este chat. Usa /pausar o /desvincular cuando quieras."
    else:
        revoke(link, "Consentimiento rechazado")
        text = "Entendido. No recibirás avisos y el vínculo fue retirado."
    return {"method": "editMessageText", "chat_id": chat["id"], "message_id": message.get("message_id"), "text": text}
