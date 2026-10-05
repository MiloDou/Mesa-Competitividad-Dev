import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from notifications.models import PushOutbox


class Command(BaseCommand):
    help = "Envía notificaciones push en cola a dispositivos Expo registrados."

    def handle(self, *args, **options):
        if not settings.EXPO_PUSH_ENABLED:
            raise CommandError("Habilite EXPO_PUSH_ENABLED y configure el proveedor Expo antes de enviar push.")
        delivered = failed = skipped = 0
        jobs = PushOutbox.objects.filter(status="pending", attempts__lt=5).select_related("notification__user")[:200]
        for job in jobs:
            tokens = list(job.notification.user.device_tokens.filter(is_active=True, user__is_active=True).values_list("token", flat=True))
            if not tokens:
                job.status = "skipped"
                job.last_error = "No hay dispositivos activos."
                job.save(update_fields=["status", "last_error"])
                skipped += 1
                continue
            messages = [{"to": token, "title": job.notification.title, "body": job.notification.body, "data": job.notification.payload, "sound": "default"} for token in tokens]
            headers = {"Accept": "application/json", "Content-Type": "application/json"}
            if settings.EXPO_ACCESS_TOKEN:
                headers["Authorization"] = f"Bearer {settings.EXPO_ACCESS_TOKEN}"
            try:
                response = requests.post(settings.EXPO_PUSH_URL, json=messages, headers=headers, timeout=12)
                response.raise_for_status()
                tickets = response.json().get("data", [])
                errors = [ticket.get("details", {}).get("error", ticket.get("message", "provider_error")) for ticket in tickets if ticket.get("status") != "ok"]
                for index, ticket in enumerate(tickets):
                    if ticket.get("details", {}).get("error") == "DeviceNotRegistered" and index < len(tokens):
                        from notifications.models import DeviceToken
                        DeviceToken.objects.filter(token=tokens[index]).update(is_active=False)
                if errors or len(tickets) != len(tokens):
                    raise ValueError("El proveedor rechazó uno o más dispositivos.")
            except Exception as exc:
                job.attempts += 1
                job.status = "failed" if job.attempts >= 5 else "pending"
                job.last_error = type(exc).__name__
                job.save(update_fields=["attempts", "status", "last_error"])
                failed += 1
            else:
                job.attempts += 1
                job.status = "sent"
                job.sent_at = timezone.now()
                job.last_error = ""
                job.save(update_fields=["attempts", "status", "sent_at", "last_error"])
                delivered += 1
        self.stdout.write(f"Push: enviados={delivered}, fallidos={failed}, sin_dispositivo={skipped}.")
