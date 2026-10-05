from audit.models import AuditEvent


def record_event(request, action, instance, summary="", changes=None, user_override=None):
    remote_addr = request.META.get("REMOTE_ADDR") if request else None
    actor = user_override or (getattr(request, "user", None) if request else None)
    authenticated_actor = actor if actor and actor.is_authenticated else None
    return AuditEvent.objects.create(
        actor=authenticated_actor,
        actor_roles=list(authenticated_actor.roles.order_by("key").values_list("key", flat=True)) if authenticated_actor else [],
        action=action,
        object_type=instance._meta.label_lower,
        object_id=str(instance.pk),
        summary=summary[:500],
        changes=changes or {},
        ip_address=remote_addr,
    )
