from rest_framework.permissions import BasePermission


class HasCapability(BasePermission):
    """Require a capability declared by a view's action_capabilities map."""

    def has_permission(self, request, view):
        capability = getattr(view, "action_capabilities", {}).get(getattr(view, "action", ""))
        if capability is None or not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_capability(capability)

    def has_object_permission(self, request, view, obj):
        object_check = getattr(view, "has_capability_for_object", None)
        if object_check is None:
            return True
        return object_check(request.user, getattr(view, "action", ""), obj)
