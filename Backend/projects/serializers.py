from pathlib import Path
import mimetypes
from zipfile import BadZipFile, ZipFile

from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from projects.models import Document, FollowUpTopic, Project, ProjectAssignment, ProjectHistory


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at", "deleted_at"]

    def validate(self, attrs):
        current = self.instance
        public = attrs.get("is_public", getattr(current, "is_public", False))
        confidentiality = attrs.get("confidentiality", getattr(current, "confidentiality", Project.Confidentiality.INTERNAL))
        user = self.context["request"].user
        if confidentiality == Project.Confidentiality.TEMPORARY and not user.has_capability("confidentiality.read"):
            raise serializers.ValidationError({"confidentiality": "Solo la Comisión puede gestionar información temporalmente confidencial."})
        if public and confidentiality != Project.Confidentiality.PUBLIC:
            raise serializers.ValidationError({"is_public": "Solo un proyecto con confidencialidad pública puede publicarse."})
        if (public or confidentiality == Project.Confidentiality.PUBLIC) and not user.has_capability("projects.publish"):
            raise serializers.ValidationError({"is_public": "Se requiere permiso de publicación de proyectos."})
        return attrs


class PublicProjectSerializer(serializers.ModelSerializer):
    follow_up_topics = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "code", "title", "summary", "description", "sector", "status", "starts_at", "target_date", "follow_up_topics", "updated_at"]

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_follow_up_topics(self, project):
        return [
            {
                "title": topic.title,
                "description": topic.description,
                "due_at": topic.due_at,
                "progress": "completed" if topic.completed_at else "in_progress",
                "completed_at": topic.completed_at,
            }
            for topic in project.follow_up_topics.all()
        ]


class ProjectHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.display_name", read_only=True)

    class Meta:
        model = ProjectHistory
        fields = ["id", "actor_name", "field_name", "old_value", "new_value", "created_at"]


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectAssignment
        fields = "__all__"
        read_only_fields = ["id", "assigned_by", "created_at"]

    def validate(self, attrs):
        project = attrs.get("project", getattr(self.instance, "project", None))
        member = attrs.get("member", getattr(self.instance, "member", None))
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        if project and project.deleted_at:
            raise serializers.ValidationError({"project": "No se asignan responsables a un proyecto archivado."})
        if project and project.commission_id and member and starts_at:
            from directory.models import CommissionMembership
            from django.db.models import Q
            if not CommissionMembership.objects.filter(
                member=member,
                commission_id=project.commission_id,
                starts_at__lte=starts_at,
            ).filter(Q(ends_at__isnull=True) | Q(ends_at__gte=starts_at)).exists():
                raise serializers.ValidationError({"member": "El responsable debe representar la comisión del proyecto en la fecha de asignación."})
        responsibility = attrs.get("responsibility")
        if responsibility is not None:
            attrs["responsibility"] = responsibility.strip()
            if not attrs["responsibility"]:
                raise serializers.ValidationError({"responsibility": "Indique la responsabilidad asignada."})
        return attrs


class FollowUpTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpTopic
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "deleted_at"]


class DocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "project", "minute", "title", "description", "original_name", "content_type", "size_bytes", "confidentiality", "uploaded_by", "uploaded_at", "download_url", "file"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at", "original_name", "content_type", "size_bytes", "download_url"]
        extra_kwargs = {"file": {"write_only": True}}

    def get_download_url(self, document) -> str:
        return f"/api/v1/documents/{document.pk}/download/"

    def validate(self, attrs):
        file = attrs.get("file")
        parent_project = attrs.get("project", getattr(self.instance, "project", None))
        parent_minute = attrs.get("minute", getattr(self.instance, "minute", None))
        if bool(parent_project) == bool(parent_minute):
            raise serializers.ValidationError("Cada documento debe pertenecer a un proyecto o una minuta, exactamente a uno.")
        if parent_project and parent_project.deleted_at:
            raise serializers.ValidationError({"project": "No se puede adjuntar un documento a un proyecto archivado."})
        if parent_minute and parent_minute.deleted_at:
            raise serializers.ValidationError({"minute": "No se puede adjuntar un documento a una minuta archivada."})
        confidentiality = attrs.get("confidentiality", getattr(self.instance, "confidentiality", Project.Confidentiality.INTERNAL))
        if confidentiality == Project.Confidentiality.TEMPORARY and not self.context["request"].user.has_capability("confidentiality.read"):
            raise serializers.ValidationError({"confidentiality": "Solo la Comisión puede gestionar documentos temporalmente confidenciales."})
        if file:
            if file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                raise serializers.ValidationError({"file": f"El archivo excede {settings.MAX_UPLOAD_SIZE_MB} MB."})
            extension = Path(file.name).suffix.lower()
            if extension not in Document.ALLOWED_EXTENSIONS:
                raise serializers.ValidationError({"file": "Tipo de archivo no permitido."})
            header = file.read(16)
            file.seek(0)
            signatures = {
                ".pdf": lambda data: data.startswith(b"%PDF-"),
                ".png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
                ".jpg": lambda data: data.startswith(b"\xff\xd8\xff"),
                ".jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
                ".doc": lambda data: data.startswith(bytes.fromhex("D0CF11E0A1B11AE1")),
                ".xls": lambda data: data.startswith(bytes.fromhex("D0CF11E0A1B11AE1")),
                ".docx": lambda data: data.startswith(b"PK\x03\x04"),
                ".xlsx": lambda data: data.startswith(b"PK\x03\x04"),
            }
            if not signatures[extension](header):
                raise serializers.ValidationError({"file": "El contenido no coincide con el formato declarado."})
            if extension in {".docx", ".xlsx"}:
                try:
                    with ZipFile(file) as archive:
                        names = set(archive.namelist())
                except BadZipFile:
                    raise serializers.ValidationError({"file": "El archivo comprimido de Office no es válido."})
                required_entry = "word/document.xml" if extension == ".docx" else "xl/workbook.xml"
                if "[Content_Types].xml" not in names or required_entry not in names:
                    raise serializers.ValidationError({"file": "El archivo no tiene una estructura válida de Office."})
                file.seek(0)
        return attrs

    def create(self, validated_data):
        file = validated_data["file"]
        validated_data.update(original_name=file.name[:255], content_type=(mimetypes.guess_type(file.name)[0] or "application/octet-stream")[:120], size_bytes=file.size)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        file = validated_data.get("file")
        if file:
            validated_data.update(original_name=file.name[:255], content_type=(mimetypes.guess_type(file.name)[0] or "application/octet-stream")[:120], size_bytes=file.size)
        return super().update(instance, validated_data)


class DocumentMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "project", "minute", "title", "description", "original_name", "content_type", "size_bytes", "confidentiality", "uploaded_by", "uploaded_at"]
