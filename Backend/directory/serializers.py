from rest_framework import serializers

from directory.models import Commission, CommissionMembership, Institution, Member


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class PublicInstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["id", "name", "sector", "description", "website"]


class PublicMemberSerializer(serializers.ModelSerializer):
    institution = serializers.CharField(source="institution.name", read_only=True)
    name = serializers.CharField(source="display_name", read_only=True)
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = ["id", "name", "title", "institution", "email", "phone"]

    def get_email(self, member) -> str:
        return member.email if member.public_contact_consent else ""

    def get_phone(self, member) -> str:
        return member.phone if member.public_contact_consent else ""


class CommissionMembershipSerializer(serializers.ModelSerializer):
    is_current = serializers.BooleanField(read_only=True)

    class Meta:
        model = CommissionMembership
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        member = attrs.get("member", getattr(self.instance, "member", None))
        commission = attrs.get("commission", getattr(self.instance, "commission", None))
        starts = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if member and commission and starts:
            other_memberships = CommissionMembership.objects.filter(member=member, commission=commission)
            if self.instance:
                other_memberships = other_memberships.exclude(pk=self.instance.pk)
            for existing in other_memberships:
                existing_end = existing.ends_at
                if (ends is None or existing.starts_at <= ends) and (existing_end is None or existing_end >= starts):
                    raise serializers.ValidationError("Los periodos de representación de un miembro no pueden superponerse.")
        return attrs
