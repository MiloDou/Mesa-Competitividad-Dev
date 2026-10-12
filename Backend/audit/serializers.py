from rest_framework import serializers

from audit.models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.display_name", read_only=True, allow_null=True)

    class Meta:
        model = AuditEvent
        fields = ["id", "actor", "actor_name", "actor_roles", "action", "object_type", "object_id", "summary", "changes", "ip_address", "created_at"]
