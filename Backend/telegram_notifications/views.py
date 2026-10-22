import logging
from secrets import compare_digest

from django.conf import settings
from django.db import IntegrityError, transaction
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from common.viewsets import CapabilityReadOnlyViewSet
from telegram_notifications import linking
from telegram_notifications.models import ProcessedUpdate, TelegramLink

logger = logging.getLogger(__name__)


class TelegramLinkSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = TelegramLink
        fields = ["id", "user", "user_email", "chat_id", "status", "approved_by", "consent_at", "revoked_at", "created_at", "updated_at"]
        read_only_fields = fields


class ApproveLinkSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())


class TelegramLinkViewSet(CapabilityReadOnlyViewSet):
    serializer_class = TelegramLinkSerializer
    read_capability = "users.manage"
    action_capabilities = {"approve": "users.manage", "revoke": "users.manage"}

    def get_queryset(self):
        queryset = TelegramLink.objects.select_related("user")
        if status_filter := self.request.query_params.get("status"):
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=False, methods=["post"])
    def approve(self, request):
        data = ApproveLinkSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        with transaction.atomic():
            link = linking.approve(request, data.validated_data["code"], data.validated_data["user"])
        consent_sent = settings.TELEGRAM_ENABLED and linking.send_consent(link)
        return Response({**TelegramLinkSerializer(link).data, "consent_sent": consent_sent}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        link = self.get_object()
        with transaction.atomic():
            linking.revoke(link, "Revocado por la administración", request)
        return Response(TelegramLinkSerializer(link).data)


class TelegramWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request):
        expected = settings.TELEGRAM_WEBHOOK_SECRET
        received = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if not expected or not compare_digest(received.encode(), expected.encode()):
            return Response(status=status.HTTP_403_FORBIDDEN)
        update = request.data if isinstance(request.data, dict) else {}
        update_id = update.get("update_id")
        if not isinstance(update_id, int):
            return Response({})
        try:
            with transaction.atomic():
                ProcessedUpdate.objects.create(update_id=update_id)
        except IntegrityError:
            return Response({})
        # Telegram reintenta ante cualquier respuesta no 2xx; los fallos internos se registran y se responde 200.
        try:
            with transaction.atomic():
                reply = linking.handle_update(update)
        except Exception:
            logger.exception("Error procesando el update de Telegram %s", update_id)
            reply = None
        return Response(reply or {})
