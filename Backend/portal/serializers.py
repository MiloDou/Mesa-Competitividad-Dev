import json

from rest_framework import serializers
from django.utils.html import strip_tags

from django.urls import reverse
from drf_spectacular.utils import extend_schema_field
from portal.image_utils import InvalidImage, optimize_uploaded_image
from portal.models import ContentAsset, ContactRequest, Event, EventRegistration, Publication, SiteProfile


class LandingContentUpdateSerializer(serializers.Serializer):
    content = serializers.DictField()

    def validate_content(self, value):
        allowed_keys = {"site_sections", "members", "entities", "custom_positions"}
        unknown_keys = set(value) - allowed_keys
        if unknown_keys:
            raise serializers.ValidationError("El CMS envió campos no permitidos.")
        for key in ("site_sections", "members", "entities", "custom_positions"):
            if key in value and not isinstance(value[key], list):
                raise serializers.ValidationError({key: "El contenido debe ser una lista."})
        if len(value.get("site_sections", [])) > 40:
            raise serializers.ValidationError({"site_sections": "La landing admite hasta 40 secciones."})
        if len(value.get("members", [])) > 200 or len(value.get("entities", [])) > 200:
            raise serializers.ValidationError("El CMS admite hasta 200 miembros o entidades.")
        for key in ("site_sections", "members", "entities"):
            if any(not isinstance(item, dict) for item in value.get(key, [])):
                raise serializers.ValidationError({key: "Cada elemento debe ser un objeto."})
        if len(value.get("custom_positions", [])) > 100:
            raise serializers.ValidationError({"custom_positions": "Se admiten hasta 100 cargos personalizados."})
        if any(not isinstance(item, str) or len(item) > 120 for item in value.get("custom_positions", [])):
            raise serializers.ValidationError({"custom_positions": "Cada cargo debe ser un texto de hasta 120 caracteres."})
        if len(json.dumps(value, ensure_ascii=False).encode("utf-8")) > 4 * 1024 * 1024:
            raise serializers.ValidationError("El contenido supera el límite de 4 MB.")
        return value


class LandingContentResponseSerializer(serializers.Serializer):
    content = serializers.DictField()
    updated_at = serializers.DateTimeField(allow_null=True)


class ContentAssetSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ContentAsset
        fields = ["id", "title", "alt_text", "original_name", "content_type", "size_bytes", "uploaded_by", "uploaded_at", "download_url", "file"]
        read_only_fields = ["id", "original_name", "content_type", "size_bytes", "uploaded_by", "uploaded_at", "download_url"]

    def get_download_url(self, asset) -> str:
        return reverse("media-asset-download", kwargs={"pk": asset.pk})

    def validate(self, attrs):
        upload = attrs.get("file")
        if not upload:
            return attrs
        if upload.size > 5 * 1024 * 1024:
            raise serializers.ValidationError({"file": "La imagen supera el límite de 5 MB."})
        name = upload.name.lower()
        signatures = {
            ".png": b"\x89PNG\r\n\x1a\n",
            ".jpg": b"\xff\xd8\xff",
            ".jpeg": b"\xff\xd8\xff",
        }
        extension = next((ext for ext in signatures if name.endswith(ext)), None)
        if not extension:
            raise serializers.ValidationError({"file": "Solo se admiten imágenes PNG y JPEG."})
        header = upload.read(16)
        upload.seek(0)
        if not header.startswith(signatures[extension]):
            raise serializers.ValidationError({"file": "El contenido no coincide con una imagen PNG o JPEG."})
        try:
            attrs["file"] = optimize_uploaded_image(upload)
        except InvalidImage as exc:
            raise serializers.ValidationError({"file": str(exc)}) from exc
        return attrs

    def create(self, validated_data):
        upload = validated_data["file"]
        validated_data.update(
            original_name=upload.name[:255],
            content_type="image/png" if upload.name.lower().endswith(".png") else "image/jpeg",
            size_bytes=upload.size,
        )
        return super().create(validated_data)


class PublicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publication
        fields = "__all__"
        read_only_fields = ["id", "status", "published_at", "author", "updated_by", "created_at", "updated_at", "deleted_at"]

    def validate_blocks(self, value):
        if not isinstance(value, list) or len(value) > 100:
            raise serializers.ValidationError("El contenido debe ser una lista de hasta 100 bloques.")
        if any(not isinstance(block, dict) for block in value):
            raise serializers.ValidationError("Cada bloque debe ser un objeto JSON.")
        self._validate_plain_content(value)
        return value

    def validate_body(self, value):
        self._validate_plain_content(value)
        return value

    def _validate_plain_content(self, value):
        if isinstance(value, str):
            if strip_tags(value) != value or value.strip().lower().startswith("javascript:"):
                raise serializers.ValidationError("Use texto plano; no se admite HTML ni URLs JavaScript.")
        elif isinstance(value, dict):
            for child in value.values():
                self._validate_plain_content(child)
        elif isinstance(value, list):
            for child in value:
                self._validate_plain_content(child)


class PublicContentAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ContentAsset
        fields = ["id", "title", "alt_text", "content_type", "url"]

    def get_url(self, asset) -> str:
        return f"/api/v1/public/media-assets/{asset.pk}/download/"


class PublicPublicationSerializer(serializers.ModelSerializer):
    assets = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = ["id", "title", "slug", "summary", "body", "section", "blocks", "assets", "published_at"]

    @extend_schema_field(PublicContentAssetSerializer(many=True))
    def get_assets(self, publication):
        return PublicContentAssetSerializer(publication.assets.filter(deleted_at__isnull=True), many=True, context=self.context).data


class SiteProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteProfile
        fields = ["id", "key", "name", "summary", "mission", "vision", "objectives", "represented_sectors", "work_framework", "logo_asset", "banner_asset", "updated_by", "updated_at"]
        read_only_fields = ["id", "key", "updated_by", "updated_at"]

    def validate(self, attrs):
        for field in ("objectives", "represented_sectors"):
            value = attrs.get(field, getattr(self.instance, field, []))
            if not isinstance(value, list) or len(value) > 50 or any(not isinstance(item, str) or not item.strip() or len(item) > 240 for item in value):
                raise serializers.ValidationError({field: "Use una lista de hasta 50 textos de máximo 240 caracteres."})
        return attrs


class PublicSiteProfileSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    class Meta:
        model = SiteProfile
        fields = ["name", "summary", "mission", "vision", "objectives", "represented_sectors", "work_framework", "logo", "banner", "updated_at"]

    def _asset(self, asset):
        if not asset or asset.deleted_at:
            return None
        return PublicContentAssetSerializer(asset, context=self.context).data

    @extend_schema_field(PublicContentAssetSerializer)
    def get_logo(self, profile):
        return self._asset(profile.logo_asset)

    @extend_schema_field(PublicContentAssetSerializer)
    def get_banner(self, profile):
        return self._asset(profile.banner_asset)


class EventSerializer(serializers.ModelSerializer):
    registration_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["id", "status", "created_by", "created_at", "updated_at", "deleted_at", "registration_count"]

    def validate(self, attrs):
        agenda = attrs.get("agenda", getattr(self.instance, "agenda", []))
        if not isinstance(agenda, list) or len(agenda) > 50 or any(not isinstance(item, str) or not item.strip() for item in agenda):
            raise serializers.ValidationError({"agenda": "La agenda debe ser una lista de hasta 50 temas de texto no vacío."})
        starts = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts and ends and ends < starts:
            raise serializers.ValidationError({"ends_at": "La fecha de finalización debe ser posterior al inicio."})
        return attrs


class PublicEventSerializer(serializers.ModelSerializer):
    registration_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, event) -> str:
        if event.image_asset_id and event.image_asset.deleted_at is None:
            return f"/api/v1/public/media-assets/{event.image_asset_id}/download/"
        return event.image_url

    class Meta:
        model = Event
        fields = ["id", "title", "slug", "description", "image_url", "starts_at", "ends_at", "modality", "location", "meeting_link", "agenda", "registration_required", "capacity", "registration_count"]


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ["id", "name", "email", "institution", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_email(self, value):
        return value.strip().lower()


class ContactRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = ["name", "email", "phone", "subject", "message"]
        extra_kwargs = {
            "phone": {"required": True, "allow_blank": False},
            "subject": {"required": False, "default": "Consulta"},
        }


class SubmissionResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    id = serializers.IntegerField()


class ContactRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = "__all__"
        read_only_fields = ["id", "submitted_at", "handled_by", "handled_at"]
