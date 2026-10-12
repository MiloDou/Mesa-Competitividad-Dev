from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from accounts.models import AuthSession, digest_token


class DatabaseTokenAuthentication(BaseAuthentication):
    keyword = b"bearer"

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts:
            return None
        if len(parts) != 2 or parts[0].lower() != self.keyword:
            raise AuthenticationFailed("Encabezado Authorization inválido.")
        try:
            session = AuthSession.objects.select_related("user").get(
                access_digest=digest_token(parts[1].decode("utf-8")),
                revoked_at__isnull=True,
                access_expires_at__gt=timezone.now(),
            )
        except (AuthSession.DoesNotExist, UnicodeDecodeError):
            raise AuthenticationFailed("Sesión inválida o expirada.")
        if not session.user.is_active:
            raise AuthenticationFailed("La cuenta está deshabilitada.")
        AuthSession.objects.filter(pk=session.pk).update(last_used_at=timezone.now())
        return session.user, session

    def authenticate_header(self, request):
        return "Bearer"
