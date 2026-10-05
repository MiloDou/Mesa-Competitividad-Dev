from django.db.models import Q
from django.utils import timezone

from directory.models import CommissionMembership
from projects.models import Document, Project


def visible_projects_for(user):
    queryset = Project.objects.filter(deleted_at__isnull=True)
    if user.has_capability("confidentiality.read"):
        return queryset
    if user.has_capability("directory.read") or user.has_capability("projects.write"):
        return queryset.exclude(confidentiality=Project.Confidentiality.TEMPORARY)
    member = getattr(user, "member", None)
    if not member or not member.is_active:
        return queryset.filter(
            is_public=True,
            confidentiality=Project.Confidentiality.PUBLIC,
            commission__is_active=True,
            status__in=[Project.Status.ACTIVE, Project.Status.PAUSED, Project.Status.COMPLETED],
        )
    today = timezone.localdate()
    commission_ids = CommissionMembership.objects.filter(member=member, starts_at__lte=today).filter(
        Q(ends_at__isnull=True) | Q(ends_at__gte=today)
    ).values_list("commission_id", flat=True)
    return queryset.filter(
        Q(
            is_public=True,
            confidentiality=Project.Confidentiality.PUBLIC,
            commission__is_active=True,
            status__in=[Project.Status.ACTIVE, Project.Status.PAUSED, Project.Status.COMPLETED],
        )
        | Q(
            commission_id__in=commission_ids,
            commission__is_active=True,
            confidentiality__in=[Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL],
        )
    )


def visible_documents_for(user):
    queryset = Document.objects.filter(deleted_at__isnull=True)
    if user.has_capability("confidentiality.read"):
        return queryset
    if user.has_capability("directory.read") or user.has_capability("projects.write"):
        return queryset.exclude(confidentiality=Project.Confidentiality.TEMPORARY).exclude(
            project__confidentiality=Project.Confidentiality.TEMPORARY,
        ).exclude(minute__meeting__confidentiality="temporary_confidential")
    member = getattr(user, "member", None)
    if not member or not member.is_active:
        return queryset.none()
    today = timezone.localdate()
    commission_ids = CommissionMembership.objects.filter(member=member, starts_at__lte=today).filter(
        Q(ends_at__isnull=True) | Q(ends_at__gte=today)
    ).values_list("commission_id", flat=True)
    visible = (
        Q(
            project__commission_id__in=commission_ids,
            project__commission__is_active=True,
            project__confidentiality__in=[Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL],
            confidentiality__in=[Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL],
        )
        | Q(
            project__is_public=True,
            project__confidentiality=Project.Confidentiality.PUBLIC,
            project__status__in=[Project.Status.ACTIVE, Project.Status.PAUSED, Project.Status.COMPLETED],
            project__commission__is_active=True,
            confidentiality=Project.Confidentiality.PUBLIC,
        )
        | Q(
            minute__meeting__commission_id__in=commission_ids,
            minute__meeting__commission__is_active=True,
            minute__meeting__invited_members=member,
            minute__meeting__confidentiality__in=["public", "internal"],
            confidentiality__in=[Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL],
        )
    )
    return queryset.filter(visible & (Q(minute__isnull=True) | Q(minute__status="approved")))
