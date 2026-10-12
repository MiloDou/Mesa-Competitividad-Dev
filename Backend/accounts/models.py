import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class Capability(models.Model):
    key = models.SlugField(max_length=80, unique=True)
    label = models.CharField(max_length=120)

    class Meta:
        ordering = ["key"]

    def __str__(self):
        return self.key


class Role(models.Model):
    key = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=80, unique=True)
    capabilities = models.ManyToManyField(Capability, related_name="roles", blank=True)

    class Meta:
        ordering = ["key"]

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El correo es obligatorio.")
        user = self.model(email=self.normalize_email(email).lower(), **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("El superusuario debe tener is_staff e is_superuser.")
        user = self.create_user(email, password, **extra_fields)
        commission, _ = Role.objects.get_or_create(key="commission", defaults={"name": "Comisión"})
        user.roles.add(commission)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return self.email

    def has_capability(self, capability_key):
        if self.is_superuser:
            return True
        return self.roles.filter(capabilities__key=capability_key).exists()

    @property
    def display_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Position(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class PositionAssignment(models.Model):
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="position_assignments")
    position = models.ForeignKey(Position, on_delete=models.PROTECT, related_name="assignments")
    starts_at = models.DateField()
    ends_at = models.DateField(null=True, blank=True)
    assigned_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="assignments_made")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
        constraints = [models.CheckConstraint(condition=models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=models.F("starts_at")), name="assignment_end_after_start")]


def digest_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthSession(models.Model):
    """Revocable opaque access/refresh tokens; only token digests are persisted."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_sessions")
    access_digest = models.CharField(max_length=64, unique=True)
    refresh_digest = models.CharField(max_length=64, unique=True)
    access_expires_at = models.DateTimeField()
    refresh_expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    device_label = models.CharField(max_length=120, blank=True)

    @classmethod
    def issue(cls, user, device_label=""):
        now = timezone.now()
        access, refresh = secrets.token_urlsafe(36), secrets.token_urlsafe(48)
        session = cls.objects.create(
            user=user,
            access_digest=digest_token(access),
            refresh_digest=digest_token(refresh),
            access_expires_at=now + timedelta(minutes=20),
            refresh_expires_at=now + timedelta(days=30),
            device_label=device_label[:120],
        )
        return session, access, refresh

    def rotate(self):
        now = timezone.now()
        access, refresh = secrets.token_urlsafe(36), secrets.token_urlsafe(48)
        self.access_digest = digest_token(access)
        self.refresh_digest = digest_token(refresh)
        self.access_expires_at = now + timedelta(minutes=20)
        self.refresh_expires_at = now + timedelta(days=30)
        self.last_used_at = now
        self.save(update_fields=["access_digest", "refresh_digest", "access_expires_at", "refresh_expires_at", "last_used_at"])
        return access, refresh
