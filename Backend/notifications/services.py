from django.db import transaction

from notifications.models import Notification, PushOutbox


def commission_user_ids(commission):
    from django.db.models import Q
    from django.utils import timezone
    from accounts.models import User

    today = timezone.localdate()
    return User.objects.filter(
        is_active=True,
        member__is_active=True,
        member__user__is_active=True,
        member__commission_memberships__commission=commission,
        member__commission_memberships__starts_at__lte=today,
    ).filter(
        Q(member__commission_memberships__ends_at__isnull=True)
        | Q(member__commission_memberships__ends_at__gte=today)
    ).distinct()


def member_user_ids(members):
    from accounts.models import User

    member_ids = members.values_list("id", flat=True) if hasattr(members, "values_list") else [member.id for member in members]
    return User.objects.filter(is_active=True, member__is_active=True, member__id__in=member_ids)


def enqueue_notification(user, kind, title, body, payload=None):
    with transaction.atomic():
        notification = Notification.objects.create(user=user, kind=kind, title=title, body=body, payload=payload or {})
        PushOutbox.objects.create(notification=notification)
    return notification


def enqueue_for_users(users, kind, title, body, payload=None):
    ids = list(users.values_list("id", flat=True)) if hasattr(users, "values_list") else [user.id for user in users]
    if not ids:
        return 0
    rows = [Notification(user_id=user_id, kind=kind, title=title, body=body, payload=payload or {}) for user_id in ids]
    created = Notification.objects.bulk_create(rows)
    PushOutbox.objects.bulk_create([PushOutbox(notification=item) for item in created])
    return len(created)
