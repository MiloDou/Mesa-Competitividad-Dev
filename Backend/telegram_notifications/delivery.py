"""Cola de entrega: recupera reservas vencidas, reserva trabajos y los envía clasificando el resultado.

Se ejecuta en autocommit (fuera de transaction.atomic) para que cada cambio de estado quede
guardado antes de la llamada a Telegram; así una caída nunca provoca un reenvío a ciegas.
"""
import logging
import time
import uuid
from collections import Counter
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone
from urllib3.exceptions import NewConnectionError

from telegram_notifications import client
from telegram_notifications.contracts import load_hook
from telegram_notifications.models import DeliveryJob, LinkTicket, ProcessedUpdate, TelegramLink

logger = logging.getLogger(__name__)

BATCH_SIZE = 40
TIME_BUDGET_SECONDS = 8
LOCK_TTL = timedelta(seconds=60)
MAX_ATTEMPTS = 6
MAX_AGE = timedelta(hours=24)
DEFAULT_RETRY_AFTER = 5
BLOCKED_DESCRIPTIONS = ("chat not found", "user is deactivated", "bot was blocked")

Status = DeliveryJob.Status


def recover_stale(now=None):
    """Libera reservas vencidas: sin envío iniciado vuelven a pending; con envío iniciado quedan uncertain."""
    now = now or timezone.now()
    stale = DeliveryJob.objects.filter(status=Status.SENDING, locked_until__lt=now)
    requeued = stale.filter(send_started_at__isnull=True).update(status=Status.PENDING, lock_token=None, locked_until=None, updated_at=now)
    uncertain = stale.filter(send_started_at__isnull=False).update(
        status=Status.UNCERTAIN, lock_token=None, locked_until=None, last_error="Reserva vencida tras iniciar el envío", updated_at=now
    )
    return {"requeued": requeued, "uncertain": uncertain}


def claim(now=None, limit=BATCH_SIZE):
    """Reserva hasta `limit` trabajos vencidos. El UPDATE condicional impide que dos ejecuciones tomen el mismo."""
    now = now or timezone.now()
    ids = list(DeliveryJob.objects.filter(status=Status.PENDING, run_after__lte=now).order_by("run_after", "id").values_list("id", flat=True)[:limit])
    token = uuid.uuid4()
    DeliveryJob.objects.filter(id__in=ids, status=Status.PENDING).update(
        status=Status.SENDING, lock_token=token, locked_until=now + LOCK_TTL, send_started_at=None, updated_at=now
    )
    return list(DeliveryJob.objects.filter(lock_token=token, status=Status.SENDING).select_related("event").order_by("run_after", "id"))


def deliver_due(render=None, now=None):
    """Entrega un lote. Sin el hook de políticas de B no reserva ni envía nada (fallo cerrado)."""
    render = render or load_hook("policies", "authorize_and_render")
    if render is None:
        return {"skipped": "policies.authorize_and_render no instalado"}
    started = time.monotonic()
    jobs = claim(now)
    counts = Counter()
    for index, job in enumerate(jobs):
        if time.monotonic() - started > TIME_BUDGET_SECONDS:
            counts["released"] += _release(jobs[index:])
            break
        outcome = _deliver(job, render)
        counts[outcome] += 1
        if outcome == "rate_limited":
            counts["released"] += _release(jobs[index + 1:])
            break
    return dict(counts)


def cleanup(now=None):
    """Borra updates procesados de más de 7 días y tickets vencidos hace más de 1 día."""
    now = now or timezone.now()
    updates, _ = ProcessedUpdate.objects.filter(created_at__lt=now - timedelta(days=7)).delete()
    tickets, _ = LinkTicket.objects.filter(expires_at__lt=now - timedelta(days=1)).delete()
    return {"updates": updates, "tickets": tickets}


def process_once(now=None):
    """Un ciclo del procesador: recordatorios de B, recuperación, entrega y limpieza. Apagado no hace nada."""
    if not settings.TELEGRAM_ENABLED:
        return {"enabled": False}
    now = now or timezone.now()
    result = {"enabled": True}
    generate_due = load_hook("reminders", "generate_due")
    if generate_due is None:
        result["reminders"] = "reminders.generate_due no instalado"
    else:
        # Un fallo de los recordatorios no debe frenar la entrega de lo ya encolado.
        try:
            result["reminders"] = generate_due(now)
        except Exception:
            logger.exception("reminders.generate_due falló")
            result["reminders"] = "error"
    result["recovered"] = recover_stale(now)
    result["delivery"] = deliver_due(now=now)
    result["cleanup"] = cleanup(now)
    return result


def _owned(job):
    return DeliveryJob.objects.filter(pk=job.pk, lock_token=job.lock_token, status=Status.SENDING)


def _finish(job, status, **fields):
    return _owned(job).update(status=status, lock_token=None, locked_until=None, updated_at=timezone.now(), **fields)


def _release(jobs):
    return sum(_finish(job, Status.PENDING, send_started_at=None) for job in jobs)


def _retry(job, attempts, error):
    if attempts >= MAX_ATTEMPTS:
        _finish(job, Status.FAILED, last_error=error[:500])
        return "failed"
    delay = timedelta(minutes=2 ** (attempts - 1))
    _finish(job, Status.PENDING, send_started_at=None, run_after=timezone.now() + delay, last_error=error[:500])
    return "retry"


def _failed_before_sending(exc):
    if isinstance(exc, requests.ConnectTimeout):
        return True
    reason = getattr(exc.args[0], "reason", None) if exc.args else None
    return isinstance(exc, requests.ConnectionError) and isinstance(reason, NewConnectionError)


def _deliver(job, render):
    now = timezone.now()
    link = TelegramLink.objects.filter(user_id=job.user_id, status=TelegramLink.Status.ACTIVE).first()
    if link is None:
        _finish(job, Status.CANCELLED, cancel_reason="Vínculo no activo")
        return "cancelled"
    # Se mide desde run_after (no desde el evento) para no expirar recordatorios programados con antelación.
    if now - job.run_after > MAX_AGE:
        _finish(job, Status.CANCELLED, cancel_reason="Expirado")
        return "expired"
    try:
        message = render(job)
    except Exception:
        logger.exception("authorize_and_render falló para el trabajo %s", job.pk)
        _finish(job, Status.FAILED, last_error="Error en authorize_and_render")
        return "failed"
    if message is None:
        _finish(job, Status.CANCELLED, cancel_reason="No autorizado por la política")
        return "cancelled"

    attempts = job.attempts + 1
    if not _owned(job).update(send_started_at=now, attempts=attempts, updated_at=now):
        return "lost_lock"
    markup = {"inline_keyboard": [[{"text": label, "url": url}] for label, url in message.buttons]} if message.buttons else None
    try:
        result = client.send_message(link.chat_id, message.text, markup)
    except client.TelegramError as exc:
        description = exc.description.lower()
        if exc.status == 429:
            retry_after = exc.retry_after or DEFAULT_RETRY_AFTER
            _finish(job, Status.PENDING, send_started_at=None, attempts=job.attempts, run_after=timezone.now() + timedelta(seconds=retry_after), last_error="429 Too Many Requests")
            return "rate_limited"
        if exc.status == 403 or any(text in description for text in BLOCKED_DESCRIPTIONS):
            TelegramLink.objects.filter(pk=link.pk, status=TelegramLink.Status.ACTIVE).update(status=TelegramLink.Status.BLOCKED, updated_at=timezone.now())
            _finish(job, Status.CANCELLED, cancel_reason="Chat bloqueado o inexistente", last_error=str(exc)[:500])
            return "blocked"
        if exc.status >= 500:
            return _retry(job, attempts, str(exc))
        _finish(job, Status.FAILED, last_error=str(exc)[:500])
        return "failed"
    except requests.RequestException as exc:
        if _failed_before_sending(exc):
            return _retry(job, attempts, f"Sin conexión: {exc.__class__.__name__}")
        _finish(job, Status.UNCERTAIN, last_error=f"Resultado desconocido: {exc.__class__.__name__}")
        return "uncertain"
    _finish(job, Status.SENT, sent_at=timezone.now(), telegram_message_id=result.get("message_id"))
    return "sent"
