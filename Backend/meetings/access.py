from django.db.models import Q
from django.utils import timezone

from directory.models import CommissionMembership
from meetings.models import Meeting


def visible_meetings_for(user):
    queryset = Meeting.objects.filter(deleted_at__isnull=True)
    if user.has_capability("directory.read") or user.has_capability("meetings.write"):
        return queryset
    member = getattr(user, "member", None)
    if not member or not member.is_active:
        return queryset.none()
    commission_ids = CommissionMembership.objects.active_on(member=member).values_list("commission_id", flat=True)
    return queryset.filter(
        commission_id__in=commission_ids,
        commission__is_active=True,
        invited_members=member,
        confidentiality__in=[Meeting.Confidentiality.PUBLIC, Meeting.Confidentiality.INTERNAL],
    )
