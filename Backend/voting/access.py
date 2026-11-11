from django.db.models import Q

from directory.models import CommissionMembership
from projects.models import Project
from voting.models import Voting


def visible_votings_for(user, queryset=None):
    """Votaciones que ``user`` puede consultar. ``queryset`` es una base opcional (la vista pasa la suya)."""
    if queryset is None:
        queryset = Voting.objects.filter(deleted_at__isnull=True)
    if not user.has_capability("confidentiality.read"):
        queryset = queryset.filter(
            Q(project__isnull=True) | Q(project__confidentiality__in=[Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL]),
        ).filter(
            Q(agreement__isnull=True) | Q(agreement__minute__status="approved", agreement__minute__meeting__confidentiality__in=["public", "internal"]),
        )
    if user.has_capability("directory.read") or user.has_capability("voting.manage"):
        return queryset
    member = getattr(user, "member", None)
    if not member or not member.is_active:
        return queryset.none()
    commission_ids = CommissionMembership.objects.active_on(member=member).values_list("commission_id", flat=True)
    return queryset.filter(
        commission_id__in=commission_ids,
        status__in=[Voting.Status.SCHEDULED, Voting.Status.OPEN, Voting.Status.CLOSED],
    )
