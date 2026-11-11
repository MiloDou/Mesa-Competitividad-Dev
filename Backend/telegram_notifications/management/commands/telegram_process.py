import json

from django.core.management.base import BaseCommand

from telegram_notifications.delivery import process_once


class Command(BaseCommand):
    help = "Ejecuta un ciclo del procesador de Telegram (recordatorios, recuperación, entrega y limpieza)."

    def handle(self, *args, **options):
        self.stdout.write(json.dumps(process_once(), ensure_ascii=False))
