from common.viewsets import CapabilityReadOnlyViewSet
from audit.models import AuditEvent
from audit.serializers import AuditEventSerializer


class AuditEventViewSet(CapabilityReadOnlyViewSet):
    queryset = AuditEvent.objects.select_related("actor").all()
    read_capability = "audit.read"
    serializer_class = AuditEventSerializer
