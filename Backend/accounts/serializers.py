from django.contrib.auth import authenticate, password_validation
from django.utils import timezone
from rest_framework import serializers

from accounts.models import AuthSession, Position, PositionAssignment, Role, User


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "key", "name"]


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    display_name = serializers.CharField(read_only=True)
    member_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "display_name", "phone", "roles", "member_id", "is_active", "date_joined"]
        read_only_fields = ["id", "date_joined"]

    def get_member_id(self, user) -> int | None:
        return getattr(getattr(user, "member", None), "id", None)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    device_label = serializers.CharField(required=False, allow_blank=True, max_length=120)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"].lower(), password=attrs["password"])
        if not user or not user.is_active:
            raise serializers.ValidationError("Correo o contraseña incorrectos.")
        attrs["user"] = user
        return attrs


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField(trim_whitespace=False)


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    token_type = serializers.CharField()
    expires_in = serializers.IntegerField()
    user = UserSerializer()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)


class PasswordResetMessageSerializer(serializers.Serializer):
    detail = serializers.CharField()


class EmptySerializer(serializers.Serializer):
    pass


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=12)
    role_ids = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True, source="roles", required=False)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone", "is_active", "password", "role_ids"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        password_validation.validate_password(value, self.instance)
        return value

    def create(self, validated_data):
        roles = validated_data.pop("roles", [])
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        password = validated_data.pop("password", None)
        revoke_sessions = bool(password) or validated_data.get("is_active") is False
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        if revoke_sessions:
            instance.auth_sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
            instance.device_tokens.filter(is_active=True).update(is_active=False)
        if roles is not None:
            instance.roles.set(roles)
        return instance


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = "__all__"


class PositionAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionAssignment
        fields = "__all__"
        read_only_fields = ["assigned_by"]
