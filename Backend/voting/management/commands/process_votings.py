from django.core.management.base import BaseCommand

from voting.models import Voting
from voting.services import refresh_voting


class Command(BaseCommand):
    help = "Activa votaciones programadas y cierra las vencidas. Ejecútese periódicamente."

    def handle(self, *args, **options):
        polls = Voting.objects.filter(status__in=[Voting.Status.SCHEDULED, Voting.Status.OPEN]).order_by("id")
        changed = 0
        for voting in polls.iterator():
            before = voting.status
            after = refresh_voting(voting)
            changed += before != after.status
        self.stdout.write(f"Procesos de votación actualizados: {changed}.")
