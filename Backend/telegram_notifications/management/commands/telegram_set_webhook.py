from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from telegram_notifications import client


class Command(BaseCommand):
    help = "Registra en Telegram la URL del webhook con el secreto TELEGRAM_WEBHOOK_SECRET."

    def add_arguments(self, parser):
        parser.add_argument("url", help="URL pública https del webhook, por ejemplo https://<backend>/api/v1/telegram/webhook/")

    def handle(self, *args, **options):
        url = options["url"]
        if not url.startswith("https://"):
            raise CommandError("La URL debe empezar con https://.")
        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_WEBHOOK_SECRET:
            raise CommandError("Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_WEBHOOK_SECRET en el entorno.")
        try:
            client.call("setWebhook", {"url": url, "secret_token": settings.TELEGRAM_WEBHOOK_SECRET, "allowed_updates": ["message", "callback_query"]})
        except client.TelegramError as exc:
            raise CommandError(str(exc)) from None
        self.stdout.write(self.style.SUCCESS(f"Webhook registrado en {url}"))
