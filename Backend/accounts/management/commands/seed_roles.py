from django.core.management.base import BaseCommand

from accounts.models import Capability, Role
from common.capabilities import CAPABILITIES, ROLE_CAPABILITIES, ROLE_NAMES


class Command(BaseCommand):
    help = "Crea o actualiza los roles y capacidades iniciales documentados."

    def handle(self, *args, **options):
        capabilities = {
            key: Capability.objects.update_or_create(key=key, defaults={"label": label})[0]
            for key, label in CAPABILITIES.items()
        }
        for key, permission_keys in ROLE_CAPABILITIES.items():
            role, _ = Role.objects.update_or_create(key=key, defaults={"name": ROLE_NAMES[key]})
            role.capabilities.set([capabilities[item] for item in permission_keys])
        self.stdout.write(self.style.SUCCESS(f"Roles listos: {len(ROLE_NAMES)}; capacidades: {len(CAPABILITIES)}."))
