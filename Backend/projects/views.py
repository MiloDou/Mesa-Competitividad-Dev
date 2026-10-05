from django.http import FileResponse
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.viewsets import ReadOnlyModelViewSet

from common.audit import record_event
from common.viewsets import CapabilityReadOnlyViewSet, CapabilityViewSet
from projects.access import visible_documents_for, visible_projects_for
from meetings.models import Minute
from projects.models import Document, FollowUpTopic, Project, ProjectAssignment, ProjectHistory
from projects.serializers import (
    DocumentMetadataSerializer, DocumentSerializer, FollowUpTopicSerializer, ProjectAssignmentSerializer, ProjectHistorySerializer,
    ProjectSerializer, PublicProjectSerializer,
)


class ProjectViewSet(CapabilityViewSet):
    queryset = Project.objects.filter(deleted_at__isnull=True).select_related("lead_member", "institution", "commission")
    read_capability = "projects.read"
    write_capability = "projects.write"
    serializer_class = ProjectSerializer
    action_capabilities = {"publish": "projects.publish"}

    def get_queryset(self):
        return visible_projects_for(self.request.user).select_related("lead_member", "institution", "commission")

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        record_event(self.request, "project.create", project, "Proyecto creado")

    def perform_update(self, serializer):
        before = {key: getattr(serializer.instance, key) for key in serializer.validated_data}
        project = serializer.save(updated_by=self.request.user)
        changes = {}
        for field, value in serializer.validated_data.items():
            old_value = getattr(before[field], "pk", before[field])
            new_value = getattr(value, "pk", value)
            if str(old_value) != str(new_value):
                changes[field] = {"from": str(old_value), "to": str(new_value)}
                ProjectHistory.objects.create(project=project, actor=self.request.user, field_name=field, old_value=str(old_value), new_value=str(new_value))
        record_event(self.request, "project.update", project, "Proyecto actualizado", {"fields": sorted(changes)})

    def perform_destroy(self, instance):
        if instance.is_public and not self.request.user.has_capability("projects.publish"):
            raise PermissionDenied("Solo Comisión puede archivar un proyecto publicado.")
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
        record_event(self.request, "project.archive", instance, "Proyecto archivado")

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        project = self.get_object()
        if project.status in {Project.Status.DRAFT, Project.Status.ARCHIVED}:
            return Response({"error": {"code": "validation_error", "detail": {"status": "Solo se pueden publicar proyectos activos, pausados o completados."}}}, status=status.HTTP_400_BAD_REQUEST)
        if project.confidentiality != Project.Confidentiality.PUBLIC:
            return Response({"error": {"code": "validation_error", "detail": {"confidentiality": "Cambie la clasificación a pública antes de publicar."}}}, status=status.HTTP_400_BAD_REQUEST)
        project.is_public = True
        project.updated_by = request.user
        project.save(update_fields=["is_public", "updated_by", "updated_at"])
        record_event(request, "project.publish", project, "Proyecto publicado")
        return Response(self.get_serializer(project).data)


class PublicProjectViewSet(ReadOnlyModelViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Project.objects.filter(deleted_at__isnull=True, is_public=True, confidentiality=Project.Confidentiality.PUBLIC).exclude(status__in=[Project.Status.DRAFT, Project.Status.ARCHIVED]).prefetch_related(
        Prefetch("follow_up_topics", queryset=FollowUpTopic.objects.filter(deleted_at__isnull=True)),
    )
    serializer_class = PublicProjectSerializer


class ProjectHistoryViewSet(CapabilityReadOnlyViewSet):
    queryset = ProjectHistory.objects.select_related("actor", "project").all()
    read_capability = "projects.read"
    serializer_class = ProjectHistorySerializer

    def get_queryset(self):
        return ProjectHistory.objects.filter(project__in=visible_projects_for(self.request.user)).select_related("actor", "project")


class ProjectAssignmentViewSet(CapabilityViewSet):
    queryset = ProjectAssignment.objects.select_related("project", "member", "assigned_by").all()
    read_capability = "projects.read"
    write_capability = "projects.write"
    serializer_class = ProjectAssignmentSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_queryset(self):
        return ProjectAssignment.objects.filter(project__in=visible_projects_for(self.request.user)).select_related("project", "member", "assigned_by")

    def perform_create(self, serializer):
        assignment = serializer.save(assigned_by=self.request.user)
        record_event(self.request, "project.assignment.create", assignment, "Responsable asignado al proyecto")

    def perform_update(self, serializer):
        assignment = serializer.save()
        record_event(self.request, "project.assignment.update", assignment, "Asignación de proyecto actualizada", {"fields": sorted(serializer.validated_data.keys())})


class FollowUpTopicViewSet(CapabilityViewSet):
    queryset = FollowUpTopic.objects.filter(deleted_at__isnull=True).select_related("project", "responsible")
    read_capability = "projects.read"
    write_capability = "projects.write"
    serializer_class = FollowUpTopicSerializer

    def get_queryset(self):
        return FollowUpTopic.objects.filter(deleted_at__isnull=True, project__in=visible_projects_for(self.request.user)).select_related("project", "responsible")

    def perform_create(self, serializer):
        item = serializer.save(created_by=self.request.user)
        record_event(self.request, "project.followup.create", item, "Tema de seguimiento creado")

    def perform_update(self, serializer):
        item = serializer.save()
        record_event(self.request, "project.followup.update", item, "Tema de seguimiento actualizado", {"fields": sorted(serializer.validated_data.keys())})


class DocumentViewSet(CapabilityViewSet):
    queryset = Document.objects.filter(deleted_at__isnull=True).select_related("project", "minute")
    read_capability = "documents.read"
    write_capability = "documents.write"
    serializer_class = DocumentSerializer

    def get_serializer_class(self):
        return DocumentSerializer if self.action in {"create", "update", "partial_update"} else DocumentMetadataSerializer

    def get_queryset(self):
        return visible_documents_for(self.request.user).select_related("project", "minute")

    def perform_create(self, serializer):
        minute = serializer.validated_data.get("minute")
        project = serializer.validated_data.get("project")
        if project and not visible_projects_for(self.request.user).filter(pk=project.pk).exists():
            raise PermissionDenied("No puede cargar documentos en este proyecto.")
        if minute and not self.request.user.has_capability("meetings.write"):
            raise PermissionDenied("Se requiere permiso para gestionar documentos de minutas.")
        document = serializer.save(uploaded_by=self.request.user)
        record_event(self.request, "document.upload", document, "Documento cargado", {"size_bytes": document.size_bytes})

    def perform_update(self, serializer):
        document = serializer.save()
        record_event(self.request, "document.update", document, "Documento actualizado", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
        record_event(self.request, "document.archive", instance, "Documento archivado")


class DocumentDownloadView(APIView):
    @extend_schema(responses={200: OpenApiResponse(response=OpenApiTypes.BINARY, description="Documento privado descargado")})
    def get(self, request, pk):
        if not request.user.has_capability("documents.read"):
            raise PermissionDenied("No tiene permiso para descargar documentos.")
        document = get_object_or_404(Document.objects.select_related("project", "minute__meeting"), pk=pk, deleted_at__isnull=True)
        if not visible_documents_for(request.user).filter(pk=document.pk).exists():
            raise PermissionDenied("No tiene permiso para acceder a este documento.")
        return FileResponse(document.file.open("rb"), as_attachment=True, filename=document.original_name or document.file.name.rsplit("/", 1)[-1])
