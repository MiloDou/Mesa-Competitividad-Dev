from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from directory.models import CommissionMembership
from directory.models import Member

from meetings.models import Agreement, Attendance, Meeting, Minute


class MeetingSerializer(serializers.ModelSerializer):
    invited_member_ids = serializers.PrimaryKeyRelatedField(
        source="invited_members",
        queryset=Member.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True,
    )
    is_invited = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            "id", "commission", "title", "description", "agenda", "scheduled_at", "ends_at",
            "modality", "location", "meeting_link", "confidentiality", "created_by", "created_at",
            "updated_at", "deleted_at", "invited_member_ids", "is_invited",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "deleted_at"]

    def get_is_invited(self, meeting) -> bool:
        user = self.context.get("request").user if self.context.get("request") else None
        member = getattr(user, "member", None) if user else None
        return bool(member and meeting.invited_members.filter(pk=member.pk).exists())

    def validate_agenda(self, value):
        if not isinstance(value, list) or len(value) > 50 or any(not isinstance(item, str) or not item.strip() for item in value):
            raise serializers.ValidationError("La agenda debe ser una lista de hasta 50 temas de texto no vacío.")
        return [item.strip() for item in value]

    def validate_commission(self, commission):
        if not commission.is_active:
            raise serializers.ValidationError("No se pueden programar reuniones en una comisión inactiva.")
        return commission

    def validate(self, attrs):
        commission = attrs.get("commission", getattr(self.instance, "commission", None))
        scheduled_at = attrs.get("scheduled_at", getattr(self.instance, "scheduled_at", None))
        invitees = attrs.get("invited_members")
        if self.instance and invitees is None and ({"commission", "scheduled_at"} & set(attrs)):
            invitees = list(self.instance.invited_members.all())
            attrs["invited_members"] = invitees
        if not self.instance and invitees is None and commission and scheduled_at:
            meeting_date = timezone.localtime(scheduled_at).date()
            invitees = list(Member.objects.filter(
                is_active=True,
                commission_memberships__commission=commission,
                commission_memberships__starts_at__lte=meeting_date,
            ).filter(
                Q(commission_memberships__ends_at__isnull=True)
                | Q(commission_memberships__ends_at__gte=meeting_date)
            ).distinct())
            attrs["invited_members"] = invitees
        if invitees is not None:
            if not invitees:
                raise serializers.ValidationError({"invited_member_ids": "La convocatoria debe incluir al menos un miembro."})
            if len({member.pk for member in invitees}) != len(invitees):
                raise serializers.ValidationError({"invited_member_ids": "No repita miembros en la convocatoria."})
            if not commission or not scheduled_at:
                raise serializers.ValidationError({"invited_member_ids": "Indique la comisión y fecha antes de convocar miembros."})
            meeting_date = timezone.localtime(scheduled_at).date()
            for member in invitees:
                current_membership = CommissionMembership.objects.filter(
                    member=member,
                    commission=commission,
                    starts_at__lte=meeting_date,
                ).filter(Q(ends_at__isnull=True) | Q(ends_at__gte=meeting_date)).exists()
                if not member.is_active or not current_membership:
                    raise serializers.ValidationError({"invited_member_ids": f"El miembro {member.pk} no representa esta comisión en la fecha de la reunión."})
        return attrs


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = "__all__"
        read_only_fields = ["id", "recorded_by", "recorded_at"]

    def validate(self, attrs):
        meeting = attrs.get("meeting", getattr(self.instance, "meeting", None))
        member = attrs.get("member", getattr(self.instance, "member", None))
        if meeting and member:
            meeting_date = timezone.localtime(meeting.scheduled_at).date()
            valid = CommissionMembership.objects.filter(member=member, commission=meeting.commission, starts_at__lte=meeting_date).filter(
                Q(ends_at__isnull=True) | Q(ends_at__gte=meeting_date)
            ).exists()
            if not valid:
                raise serializers.ValidationError({"member": "El miembro no tenía una representación vigente en esta comisión el día de la reunión."})
            if not meeting.invited_members.filter(pk=member.pk).exists():
                raise serializers.ValidationError({"member": "Solo se registra asistencia para miembros convocados."})
        return attrs

    def validate_meeting(self, meeting):
        if meeting.deleted_at:
            raise serializers.ValidationError("No se registra asistencia en una reunión archivada.")
        return meeting


class MinuteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Minute
        fields = "__all__"
        read_only_fields = ["id", "status", "created_by", "approved_by", "approved_at", "created_at", "updated_at", "deleted_at"]

    def validate_meeting(self, value):
        if value.deleted_at:
            raise serializers.ValidationError("No se puede crear una minuta para una reunión archivada.")
        existing = Minute.objects.filter(meeting=value, deleted_at__isnull=True)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Esta reunión ya tiene una minuta activa.")
        return value


class AgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agreement
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "deleted_at"]

    def validate(self, attrs):
        minute = attrs.get("minute", getattr(self.instance, "minute", None))
        if minute and (minute.deleted_at or minute.status != Minute.Status.APPROVED):
            raise serializers.ValidationError({"minute": "Los acuerdos se deben asociar a una minuta aprobada y activa."})
        responsible = attrs.get("responsible", getattr(self.instance, "responsible", None))
        if minute and responsible:
            meeting_date = timezone.localtime(minute.meeting.scheduled_at).date()
            if not CommissionMembership.objects.filter(member=responsible, commission=minute.meeting.commission, starts_at__lte=meeting_date).filter(
                Q(ends_at__isnull=True) | Q(ends_at__gte=meeting_date)
            ).exists():
                raise serializers.ValidationError({"responsible": "El responsable debe representar esta comisión en la fecha de la reunión."})
        return attrs
