from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils import timezone

from accounts.models import User
from portal.models import Event, Publication
from projects.models import FollowUpTopic, Project


class Command(BaseCommand):
    help = "Carga ejemplos sintéticos para la página pública (solo SQLite local)."

    def handle(self, *args, **options):
        if not settings.DEBUG or connection.vendor != "sqlite":
            raise CommandError("Los datos de demostración solo se cargan con DEBUG=true y SQLite local.")

        author = User.objects.filter(is_active=True).order_by("pk").first()
        if author is None:
            raise CommandError("Crea primero una cuenta local con `python manage.py createsuperuser`.")

        project, _ = Project.objects.update_or_create(
            code="DEMO-WEB-01",
            defaults={
                "title": "Conectividad para los espacios productivos de Xela",
                "summary": "Ejemplo ficticio de una iniciativa pública para mostrar el seguimiento de proyectos.",
                "description": (
                    "Iniciativa de demostración para ilustrar cómo la Mesa podría dar seguimiento "
                    "a propuestas de conectividad y coordinación entre sectores. No corresponde "
                    "a un proyecto oficial ni reporta avances reales."
                ),
                "sector": "Desarrollo económico",
                "status": Project.Status.ACTIVE,
                "confidentiality": Project.Confidentiality.PUBLIC,
                "is_public": True,
                "starts_at": timezone.localdate(),
                "target_date": timezone.localdate() + timedelta(days=120),
                "created_by": author,
                "updated_by": author,
            },
        )
        FollowUpTopic.objects.update_or_create(
            project=project,
            title="Mapeo demostrativo de necesidades de conectividad",
            defaults={
                "description": "Ejemplo ficticio de una actividad de seguimiento; no representa una gestión real.",
                "created_by": author,
            },
        )

        Publication.objects.update_or_create(
            slug="ejemplo-demostracion-mesa",
            defaults={
                "title": "Ejemplo de actualización institucional",
                "summary": "Publicación ficticia para comprobar la sección de noticias del sitio.",
                "body": (
                    "Este texto es contenido de demostración. Sirve para revisar cómo se muestran "
                    "las publicaciones provenientes de la API; no anuncia una actividad o acuerdo real."
                ),
                "section": "news",
                "status": Publication.Status.PUBLISHED,
                "published_at": timezone.now(),
                "author": author,
                "updated_by": author,
            },
        )

        starts_at = timezone.now() + timedelta(days=30)
        Event.objects.update_or_create(
            slug="encuentro-demostrativo-competitividad",
            defaults={
                "title": "Encuentro demostrativo de competitividad",
                "description": (
                    "Evento ficticio para probar la vista y el formulario de inscripción. "
                    "No es una convocatoria oficial."
                ),
                "starts_at": starts_at,
                "ends_at": starts_at + timedelta(hours=2),
                "modality": Event.Modality.IN_PERSON,
                "location": "Quetzaltenango (sede de demostración)",
                "agenda": ["Bienvenida", "Presentación de ejemplo", "Cierre"],
                "registration_required": True,
                "capacity": 60,
                "status": Event.Status.PUBLISHED,
                "created_by": author,
            },
        )

        self.stdout.write(self.style.SUCCESS("Ejemplos sintéticos de proyecto, publicación y evento listos."))
        self.stdout.write("No se crearon registros de contacto ni inscripciones con datos personales.")
