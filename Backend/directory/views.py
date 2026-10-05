from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet

from common.audit import record_event
from common.viewsets import CapabilityViewSet
from directory.models import Commission, CommissionMembership, Institution, Member
from directory.serializers import (
    CommissionMembershipSerializer, CommissionSerializer, InstitutionSerializer, MemberSerializer,
    PublicInstitutionSerializer, PublicMemberSerializer,
)


class InstitutionViewSet(CapabilityViewSet):
    queryset = Institution.objects.all()
    read_capability = "directory.read"
    write_capability = "directory.write"
    serializer_class = InstitutionSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        record_event(self.request, "institution.create", instance, "Institución creada")

    def perform_update(self, serializer):
        instance = serializer.save()
        record_event(self.request, "institution.update", instance, "Institución actualizada")


class CommissionViewSet(CapabilityViewSet):
    queryset = Commission.objects.all()
    read_capability = "directory.read"
    write_capability = "directory.write"
    serializer_class = CommissionSerializer

    def perform_create(self, serializer):
        item = serializer.save()
        record_event(self.request, "commission.create", item, "Comisión creada")

    def perform_update(self, serializer):
        item = serializer.save()
        record_event(self.request, "commission.update", item, "Comisión actualizada")


class MemberViewSet(CapabilityViewSet):
    queryset = Member.objects.select_related("institution", "user").all()
    read_capability = "directory.read"
    write_capability = "directory.write"
    serializer_class = MemberSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        record_event(self.request, "member.create", instance, "Miembro creado")

    def perform_update(self, serializer):
        instance = serializer.save()
        record_event(self.request, "member.update", instance, "Miembro actualizado")

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        record_event(self.request, "member.deactivate", instance, "Miembro deshabilitado")


class CommissionMembershipViewSet(CapabilityViewSet):
    queryset = CommissionMembership.objects.select_related("member", "commission", "representative_institution").all()
    read_capability = "directory.read"
    write_capability = "directory.write"
    serializer_class = CommissionMembershipSerializer

    def perform_create(self, serializer):
        item = serializer.save()
        record_event(self.request, "membership.start", item, "Representación asignada")

    def perform_update(self, serializer):
        item = serializer.save()
        record_event(self.request, "membership.update", item, "Representación actualizada", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        today = timezone.localdate()
        if instance.starts_at > today:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No se elimina una representación futura; ajuste su periodo para conservar el historial.")
        if instance.ends_at is None or instance.ends_at > today:
            instance.ends_at = today
            instance.save(update_fields=["ends_at"])
            record_event(self.request, "membership.end", instance, "Representación cerrada")


class PublicInstitutionViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Institution.objects.filter(is_active=True)
    serializer_class = PublicInstitutionSerializer


class PublicMemberViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Member.objects.filter(is_active=True, public_profile_consent=True, institution__is_active=True).select_related("institution")
    serializer_class = PublicMemberSerializer
