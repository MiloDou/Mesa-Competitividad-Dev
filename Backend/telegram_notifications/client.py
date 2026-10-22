import requests
from django.conf import settings

API_URL = "https://api.telegram.org/bot{token}/{method}"
TIMEOUT_SECONDS = 10


class TelegramError(Exception):
    def __init__(self, status, description="", retry_after=None):
        super().__init__(f"Telegram {status}: {description}")
        self.status = status
        self.description = description
        self.retry_after = retry_after


def call(method, payload):
    """Llama a la Bot API. Lanza TelegramError ante respuesta no ok; los errores de red se propagan."""
    response = requests.post(API_URL.format(token=settings.TELEGRAM_BOT_TOKEN, method=method), json=payload, timeout=TIMEOUT_SECONDS)
    try:
        body = response.json()
    except ValueError:
        raise TelegramError(response.status_code, "Respuesta no JSON") from None
    if not body.get("ok"):
        retry_after = (body.get("parameters") or {}).get("retry_after")
        raise TelegramError(body.get("error_code", response.status_code), body.get("description", ""), retry_after)
    return body["result"]


def send_message(chat_id, text, reply_markup=None):
    payload = {"chat_id": chat_id, "text": text, "disable_web_page_preview": True}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return call("sendMessage", payload)
