from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.http import FileResponse, Http404
from django.utils import timezone
import logging
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, extend_schema_view

from common.audit import record_event
from common.viewsets import CapabilityViewSet
from portal.models import ContentAsset, ContactRequest, Event, EventRegistration, Publication, SiteProfile
from portal.serializers import (
    ContentAssetSerializer, ContactRequestCreateSerializer, ContactRequestSerializer, EventRegistrationSerializer, EventSerializer,
    PublicEventSerializer, PublicPublicationSerializer, PublicSiteProfileSerializer, PublicationSerializer, SiteProfileSerializer,
    SubmissionResponseSerializer,
)

logger = logging.getLogger(__name__)


class PublicationAdminViewSet(CapabilityViewSet):
    queryset = Publication.objects.filter(deleted_at__isnull=True).select_related("author", "updated_by")
    read_capability = "content.read"
    write_capability = "content.write"
    serializer_class = PublicationSerializer
    action_capabilities = {"publish": "content.publish", "archive": "content.publish"}

    def perform_destroy(self, instance):
        if instance.status == Publication.Status.PUBLISHED and not self.request.user.has_capability("content.publish"):
            raise PermissionDenied("Solo Comisión puede archivar contenido publicado.")
        super().perform_destroy(instance)

    def perform_create(self, serializer):
        publication = serializer.save(author=self.request.user, updated_by=self.request.user)
        record_event(self.request, "content.create", publication, "Contenido creado")

    def perform_update(self, serializer):
        if serializer.instance.status == Publication.Status.PUBLISHED and not self.request.user.has_capability("content.publish"):
            raise PermissionDenied("Solo Comisión puede editar contenido publicado.")
        publication = serializer.save(updated_by=self.request.user)
        record_event(self.request, "content.update", publication, "Contenido actualizado", {"fields": sorted(serializer.validated_data.keys())})

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        publication = self.get_object()
        publication.status = Publication.Status.PUBLISHED
        publication.published_at = timezone.now()
        publication.updated_by = request.user
        publication.save(update_fields=["status", "published_at", "updated_by", "updated_at"])
        record_event(request, "content.publish", publication, "Contenido publicado")
        return Response(self.get_serializer(publication).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        publication = self.get_object()
        publication.status = Publication.Status.ARCHIVED
        publication.updated_by = request.user
        publication.save(update_fields=["status", "updated_by", "updated_at"])
        record_event(request, "content.archive", publication, "Contenido archivado")
        return Response(self.get_serializer(publication).data)


class PublicPublicationViewSet(ReadOnlyModelViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Publication.objects.filter(status=Publication.Status.PUBLISHED, deleted_at__isnull=True).prefetch_related("assets")
    serializer_class = PublicPublicationSerializer
    lookup_field = "slug"


@extend_schema_view(
    cancel_registration=extend_schema(
        parameters=[OpenApiParameter(name="registration_id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        responses={204: None},
    )
)
class EventAdminViewSet(CapabilityViewSet):
    queryset = Event.objects.filter(deleted_at__isnull=True).annotate(registration_count=Count("registrations", filter=Q(registrations__cancelled_at__isnull=True)))
    read_capability = "events.read"
    write_capability = "events.write"
    serializer_class = EventSerializer
    action_capabilities = {"publish": "events.publish", "cancel": "events.publish", "registrations": "events.registrations", "cancel_registration": "events.registrations"}

    def perform_destroy(self, instance):
        if instance.status == Event.Status.PUBLISHED and not self.request.user.has_capability("events.publish"):
            raise PermissionDenied("Solo Comisión puede archivar un evento publicado.")
        super().perform_destroy(instance)

    def perform_create(self, serializer):
        event = serializer.save(created_by=self.request.user)
        record_event(self.request, "event.create", event, "Evento creado")

    def perform_update(self, serializer):
        if serializer.instance.status == Event.Status.PUBLISHED and not self.request.user.has_capability("events.publish"):
            raise PermissionDenied("Solo Comisión puede editar un evento publicado.")
        event = serializer.save()
        record_event(self.request, "event.update", event, "Evento actualizado")

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        event = self.get_object()
        if event.status != Event.Status.DRAFT:
            raise ValidationError({"status": "Solo se puede publicar un evento en borrador."})
        if event.starts_at < timezone.now() + timedelta(days=10):
            raise ValidationError({"starts_at": "Publique los eventos con al menos diez días naturales de anticipación."})
        event.status = Event.Status.PUBLISHED
        event.save(update_fields=["status", "updated_at"])
        record_event(request, "event.publish", event, "Evento publicado")
        return Response(self.get_serializer(event).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        event = self.get_object()
        event.status = Event.Status.CANCELLED
        event.save(update_fields=["status", "updated_at"])
        record_event(request, "event.cancel", event, "Evento cancelado")
        return Response(self.get_serializer(event).data)

    @action(detail=True, methods=["get"])
    def registrations(self, request, pk=None):
        event = self.get_object()
        registrations = event.registrations.filter(cancelled_at__isnull=True).order_by("created_at")
        page = self.paginate_queryset(registrations)
        serializer = EventRegistrationSerializer(page or registrations, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=True, methods=["delete"], url_path=r"registrations/(?P<registration_id>[^/.]+)")
    def cancel_registration(self, request, pk=None, registration_id=None):
        event = self.get_object()
        registration = event.registrations.filter(pk=registration_id, cancelled_at__isnull=True).first()
        if registration is None:
            from django.http import Http404
            raise Http404
        registration.cancelled_at = timezone.now()
        registration.save(update_fields=["cancelled_at"])
        record_event(request, "event.registration.cancel", registration, "Inscripción cancelada")
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicEventViewSet(ReadOnlyModelViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Event.objects.filter(status=Event.Status.PUBLISHED, deleted_at__isnull=True).select_related("image_asset").annotate(registration_count=Count("registrations", filter=Q(registrations__cancelled_at__isnull=True)))
    serializer_class = PublicEventSerializer
    lookup_field = "slug"

    @action(detail=True, methods=["post"])
    @extend_schema(request=EventRegistrationSerializer, responses={201: SubmissionResponseSerializer})
    def register(self, request, slug=None):
        event = self.get_object()
        if not event.registration_required:
            raise ValidationError({"registration": "Este evento no requiere inscripción."})
        if event.starts_at <= timezone.now():
            raise ValidationError({"event": "La inscripción está cerrada porque el evento inició."})
        serializer = EventRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                locked = Event.objects.select_for_update().get(pk=event.pk)
                if locked.status != Event.Status.PUBLISHED or locked.starts_at <= timezone.now():
                    raise ValidationError({"event": "Las inscripciones para este evento están cerradas."})
                email = serializer.validated_data["email"]
                if locked.registrations.filter(email=email, cancelled_at__isnull=True).exists():
                    raise ValidationError({"email": "Este correo ya tiene una inscripción activa."})
                if locked.capacity is not None and locked.registrations.filter(cancelled_at__isnull=True).count() >= locked.capacity:
                    raise ValidationError({"capacity": "El evento ya no tiene espacios disponibles."})
                registration = serializer.save(event=locked)
        except IntegrityError:
            raise ValidationError({"email": "Este correo ya tiene una inscripción activa."})
        record_event(request, "event.register", registration, "Inscripción recibida")
        return Response({"id": registration.id, "status": "registered"}, status=status.HTTP_201_CREATED)


class ContactRequestPublicView(ModelViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]
    http_method_names = ["post", "options", "head"]
    serializer_class = ContactRequestCreateSerializer
    queryset = ContactRequest.objects.none()

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle
        self.throttle_scope = "contact"
        return [ScopedRateThrottle()]

    @extend_schema(request=ContactRequestCreateSerializer, responses={201: SubmissionResponseSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        record_event(request, "contact.submit", item, "Solicitud de contacto recibida")
        recipient = settings.CONTACT_NOTIFICATION_EMAIL
        if recipient:
            try:
                send_mail(
                    subject=f"Nueva solicitud de contacto: {item.subject}",
                    message=f"Nombre: {item.name}\nCorreo: {item.email}\n\n{item.message}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("No se pudo enviar aviso por correo de una solicitud de contacto.")
        return Response({"status": "received", "id": item.id}, status=status.HTTP_201_CREATED)


class ContactRequestAdminViewSet(CapabilityViewSet):
    queryset = ContactRequest.objects.select_related("handled_by").all()
    read_capability = "contact.manage"
    write_capability = "contact.manage"
    serializer_class = ContactRequestSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def perform_update(self, serializer):
        item = serializer.save(handled_by=self.request.user, handled_at=timezone.now())
        record_event(self.request, "contact.manage", item, "Solicitud de contacto actualizada")


class SiteProfileViewSet(CapabilityViewSet):
    queryset = SiteProfile.objects.filter(key="main").select_related("logo_asset", "banner_asset")
    read_capability = "content.read"
    write_capability = "content.write"
    serializer_class = SiteProfileSerializer
    http_method_names = ["get", "put", "patch", "head", "options"]

    def get_queryset(self):
        return SiteProfile.objects.filter(key="main").select_related("logo_asset", "banner_asset")

    def perform_update(self, serializer):
        profile = serializer.save(updated_by=self.request.user)
        record_event(self.request, "site_profile.update", profile, "Perfil institucional actualizado", {"fields": sorted(serializer.validated_data.keys())})


class PublicSiteProfileViewSet(ReadOnlyModelViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = SiteProfile.objects.filter(key="main").select_related("logo_asset", "banner_asset")
    serializer_class = PublicSiteProfileSerializer


class ContentAssetViewSet(CapabilityViewSet):
    queryset = ContentAsset.objects.filter(deleted_at__isnull=True).select_related("uploaded_by")
    read_capability = "content.read"
    write_capability = "content.write"
    serializer_class = ContentAssetSerializer
    action_capabilities = {"download": "content.read"}

    def get_queryset(self):
        return ContentAsset.objects.filter(deleted_at__isnull=True).select_related("uploaded_by")

    def perform_create(self, serializer):
        asset = serializer.save(uploaded_by=self.request.user)
        record_event(self.request, "content_asset.create", asset, "Imagen cargada en el CMS")

    def perform_update(self, serializer):
        asset = serializer.instance
        is_public = (
            asset.publications.filter(status=Publication.Status.PUBLISHED, deleted_at__isnull=True).exists()
            or asset.events.filter(status=Event.Status.PUBLISHED, deleted_at__isnull=True).exists()
            or asset.logo_sites.filter(key="main").exists()
            or asset.banner_sites.filter(key="main").exists()
        )
        if is_public and not self.request.user.has_capability("content.publish"):
            raise PermissionDenied("Solo Comisión puede modificar una imagen ya publicada.")
        asset = serializer.save()
        record_event(self.request, "content_asset.update", asset, "Imagen del CMS actualizada")

    def perform_destroy(self, instance):
        referenced = (
            instance.publications.filter(status=Publication.Status.PUBLISHED, deleted_at__isnull=True).exists()
            or instance.events.filter(status=Event.Status.PUBLISHED, deleted_at__isnull=True).exists()
            or instance.logo_sites.filter(key="main").exists()
            or instance.banner_sites.filter(key="main").exists()
        )
        if referenced:
            raise PermissionDenied("Retire la imagen del contenido público antes de archivarla.")
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
        record_event(self.request, "content_asset.archive", instance, "Imagen del CMS archivada")

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        asset = self.get_object()
        if not asset.file or not asset.file.storage.exists(asset.file.name):
            raise Http404
        response = FileResponse(asset.file.open("rb"), as_attachment=False, filename=asset.original_name or f"imagen-{asset.pk}", content_type=asset.content_type)
        response["X-Content-Type-Options"] = "nosniff"
        return response


class PublicContentAssetView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(responses={200: OpenApiResponse(response=OpenApiTypes.BINARY, description="Imagen pública asociada a contenido visible")})
    def get(self, request, pk):
        public_asset = ContentAsset.objects.filter(pk=pk, deleted_at__isnull=True).filter(
            Q(publications__status=Publication.Status.PUBLISHED, publications__deleted_at__isnull=True)
            | Q(events__status=Event.Status.PUBLISHED, events__deleted_at__isnull=True)
            | Q(logo_sites__key="main")
            | Q(banner_sites__key="main")
        ).distinct().first()
        if not public_asset or not public_asset.file or not public_asset.file.storage.exists(public_asset.file.name):
            raise Http404
        response = FileResponse(public_asset.file.open("rb"), as_attachment=False, filename=public_asset.original_name or f"imagen-{public_asset.pk}", content_type=public_asset.content_type)
        response["X-Content-Type-Options"] = "nosniff"
        return response
