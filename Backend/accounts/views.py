import logging

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from accounts.models import AuthSession, Position, PositionAssignment, User, digest_token
from accounts.serializers import (
    EmptySerializer, LoginSerializer, PasswordResetConfirmSerializer, PasswordResetMessageSerializer, PasswordResetRequestSerializer,
    PositionAssignmentSerializer, PositionSerializer, RefreshSerializer, TokenResponseSerializer, UserSerializer, UserWriteSerializer,
)
from common.audit import record_event
from common.viewsets import CapabilityViewSet

logger = logging.getLogger(__name__)


def token_payload(session, access, refresh):
    return {
        "access": access,
        "refresh": refresh,
        "token_type": "Bearer",
        "expires_in": max(0, int((session.access_expires_at - timezone.now()).total_seconds())),
        "user": UserSerializer(session.user).data,
    }


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle
        self.throttle_scope = "auth"
        return [ScopedRateThrottle()]

    @extend_schema(request=LoginSerializer, responses={200: TokenResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        session, access, refresh = AuthSession.issue(user, serializer.validated_data.get("device_label", ""))
        record_event(request, "auth.login", session, "Inicio de sesión", user_override=user)
        return Response(token_payload(session, access, refresh))


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle
        self.throttle_scope = "auth"
        return [ScopedRateThrottle()]

    @extend_schema(request=RefreshSerializer, responses={200: TokenResponseSerializer})
    @transaction.atomic
    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            session = AuthSession.objects.select_for_update().select_related("user").get(
                refresh_digest=digest_token(serializer.validated_data["refresh"]),
                revoked_at__isnull=True,
                refresh_expires_at__gt=timezone.now(),
            )
        except AuthSession.DoesNotExist:
            raise AuthenticationFailed("Refresh token inválido o expirado.")
        if not session.user.is_active:
            raise AuthenticationFailed("La cuenta está deshabilitada.")
        access, refresh = session.rotate()
        return Response(token_payload(session, access, refresh))


class LogoutView(APIView):
    serializer_class = EmptySerializer

    @extend_schema(responses={204: None})
    def post(self, request):
        session = request.auth
        if session and not session.revoked_at:
            session.revoked_at = timezone.now()
            session.save(update_fields=["revoked_at"])
            session.device_tokens.filter(is_active=True).update(is_active=False)
            record_event(request, "auth.logout", session, "Cierre de sesión")
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle
        self.throttle_scope = "auth"
        return [ScopedRateThrottle()]

    @extend_schema(request=PasswordResetRequestSerializer, responses={200: PasswordResetMessageSerializer})
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            url = f"{settings.PASSWORD_RESET_URL}?uid={uid}&token={token}"
            try:
                send_mail(
                    "Restablecimiento de contraseña",
                    f"Use este enlace para elegir una nueva contraseña: {url}\nSi no solicitó el cambio, ignore este mensaje.",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("No se pudo enviar un correo de restablecimiento de contraseña.")
        return Response({"detail": "Si la cuenta existe, recibirá instrucciones por correo."})


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle
        self.throttle_scope = "auth"
        return [ScopedRateThrottle()]

    @extend_schema(request=PasswordResetConfirmSerializer, responses={204: None})
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (ValueError, TypeError, User.DoesNotExist):
            raise AuthenticationFailed("Enlace de restablecimiento inválido o vencido.")
        if not default_token_generator.check_token(user, token):
            raise AuthenticationFailed("Enlace de restablecimiento inválido o vencido.")
        validate_password(password, user)
        user.set_password(password)
        user.save(update_fields=["password", "updated_at"])
        user.auth_sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        user.device_tokens.filter(is_active=True).update(is_active=False)
        record_event(request, "auth.password_reset", user, "Contraseña restablecida", user_override=user)
        return Response(status=204)


class UserViewSet(CapabilityViewSet):
    queryset = User.objects.prefetch_related("roles").all()
    read_capability = "users.manage"
    write_capability = "users.manage"
    serializer_class = UserWriteSerializer

    def get_serializer_class(self):
        return UserWriteSerializer if self.action in {"create", "update", "partial_update"} else UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        record_event(self.request, "user.create", user, "Cuenta creada", {"roles": list(user.roles.values_list("key", flat=True))})

    def perform_update(self, serializer):
        user = serializer.save()
        record_event(self.request, "user.update", user, "Cuenta actualizada", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.auth_sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        instance.device_tokens.filter(is_active=True).update(is_active=False)
        instance.save(update_fields=["is_active"])
        record_event(self.request, "user.deactivate", instance, "Cuenta deshabilitada")


class PositionViewSet(CapabilityViewSet):
    queryset = Position.objects.all()
    read_capability = "users.manage"
    write_capability = "users.manage"
    serializer_class = PositionSerializer

    def perform_create(self, serializer):
        item = serializer.save()
        record_event(self.request, "position.create", item, "Cargo creado")

    def perform_update(self, serializer):
        item = serializer.save()
        record_event(self.request, "position.update", item, "Cargo actualizado")


class PositionAssignmentViewSet(CapabilityViewSet):
    queryset = PositionAssignment.objects.select_related("user", "position", "assigned_by").all()
    read_capability = "users.manage"
    write_capability = "users.manage"
    serializer_class = PositionAssignmentSerializer

    def perform_create(self, serializer):
        assignment = serializer.save(assigned_by=self.request.user)
        record_event(self.request, "position.assign", assignment, "Cargo asignado")

    def perform_update(self, serializer):
        assignment = serializer.save()
        record_event(self.request, "position.assignment.update", assignment, "Asignación de cargo actualizada")

    def perform_destroy(self, instance):
        if instance.starts_at > timezone.localdate():
            raise ValidationError("No se elimina una asignación futura; ajuste su periodo para conservar el historial.")
        if instance.ends_at is None or instance.ends_at > timezone.localdate():
            instance.ends_at = timezone.localdate()
            instance.save(update_fields=["ends_at"])
            record_event(self.request, "position.assignment.end", instance, "Asignación de cargo cerrada")
