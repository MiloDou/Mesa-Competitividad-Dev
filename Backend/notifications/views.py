from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from notifications.models import DeviceToken, Notification
from notifications.serializers import DeviceTokenSerializer, NotificationSerializer
from common.audit import record_event


class NotificationViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeviceTokenViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = DeviceToken.objects.all()
    serializer_class = DeviceTokenSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        token = serializer.validated_data["token"]
        existing = DeviceToken.objects.filter(token=token).first()
        if existing:
            existing.user = self.request.user
            existing.auth_session = self.request.auth
            existing.platform = serializer.validated_data.get("platform", "")
            existing.device_label = serializer.validated_data.get("device_label", "")
            existing.is_active = True
            existing.save()
            serializer.instance = existing
            record_event(self.request, "device.register", existing, "Dispositivo registrado", {"platform": existing.platform})
            return
        device = serializer.save(user=self.request.user, auth_session=self.request.auth)
        record_event(self.request, "device.register", device, "Dispositivo registrado", {"platform": device.platform})

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        record_event(self.request, "device.unregister", instance, "Dispositivo desactivado", {"platform": instance.platform})
