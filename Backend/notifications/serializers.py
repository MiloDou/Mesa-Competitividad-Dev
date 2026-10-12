from rest_framework import serializers

from notifications.models import DeviceToken, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "kind", "title", "body", "payload", "created_at", "read_at"]


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ["id", "token", "platform", "device_label", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "is_active", "created_at", "updated_at"]

    def validate_token(self, value):
        if not (value.startswith("ExponentPushToken[") or value.startswith("ExpoPushToken[")) or not value.endswith("]"):
            raise serializers.ValidationError("El token no tiene el formato Expo esperado.")
        return value
