from django.conf import settings
from django.db import models


class Institution(models.Model):
    name = models.CharField(max_length=180, unique=True)
    sector = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Commission(models.Model):
    name = models.CharField(max_length=180, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Member(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="member", null=True, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="members")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    title = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    public_contact_consent = models.BooleanField(default=False)
    public_profile_consent = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def display_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class CommissionMembership(models.Model):
    member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name="commission_memberships")
    commission = models.ForeignKey(Commission, on_delete=models.PROTECT, related_name="memberships")
    starts_at = models.DateField()
    ends_at = models.DateField(null=True, blank=True)
    representative_institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="representations", null=True, blank=True)
    role_label = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
        constraints = [
            models.CheckConstraint(condition=models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=models.F("starts_at")), name="commission_membership_dates_valid"),
            models.UniqueConstraint(fields=["member", "commission"], condition=models.Q(ends_at__isnull=True), name="one_active_membership_per_commission"),
        ]

    @property
    def is_current(self):
        from django.utils import timezone
        today = timezone.localdate()
        return self.starts_at <= today and (self.ends_at is None or self.ends_at >= today)
