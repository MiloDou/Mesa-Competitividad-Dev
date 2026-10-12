from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from common.permissions import HasCapability


class CapabilityViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasCapability]
    action_capabilities = {}

    def get_permissions(self):
        self.action_capabilities = {
            **getattr(self, "action_capabilities", {}),
            "list": getattr(self, "read_capability", None),
            "retrieve": getattr(self, "read_capability", None),
            "metadata": getattr(self, "read_capability", None),
            "create": getattr(self, "write_capability", None),
            "update": getattr(self, "write_capability", None),
            "partial_update": getattr(self, "write_capability", None),
            "destroy": getattr(self, "write_capability", None),
        }
        return super().get_permissions()

    def perform_destroy(self, instance):
        from common.audit import record_event
        if hasattr(instance, "deleted_at"):
            from django.utils import timezone
            instance.deleted_at = timezone.now()
            instance.save(update_fields=["deleted_at"])
            record_event(self.request, f"{instance._meta.model_name}.archive", instance, "Registro archivado")
        elif hasattr(instance, "is_active"):
            instance.is_active = False
            instance.save(update_fields=["is_active"])
            record_event(self.request, f"{instance._meta.model_name}.deactivate", instance, "Registro deshabilitado")
        else:
            raise PermissionDenied("Este registro es histórico y no se puede eliminar.")


class CapabilityReadOnlyViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, HasCapability]
    read_capability = None

    def get_permissions(self):
        self.action_capabilities = {"list": self.read_capability, "retrieve": self.read_capability}
        return super().get_permissions()
