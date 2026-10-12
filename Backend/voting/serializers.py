from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from projects.models import Project
from voting.models import Voting


class VotingSubjectSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["project", "agreement"])
    id = serializers.IntegerField()
    title = serializers.CharField()
    summary = serializers.CharField(allow_blank=True)
    background = serializers.CharField(allow_blank=True)
    status = serializers.CharField()


class VotingSerializer(serializers.ModelSerializer):
    member_has_voted = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()

    class Meta:
        model = Voting
        fields = "__all__"
        read_only_fields = ["id", "status", "created_by", "created_at", "updated_at", "deleted_at"]

    @extend_schema_field(VotingSubjectSerializer)
    def get_subject(self, voting):
        if voting.project_id:
            project = voting.project
            user = getattr(self.context.get("request"), "user", None)
            if project.confidentiality == Project.Confidentiality.TEMPORARY and not (user and user.has_capability("confidentiality.read")):
                return {
                    "type": "project",
                    "id": project.pk,
                    "title": "Iniciativa confidencial temporal",
                    "summary": "Acceso restringido.",
                    "background": "",
                    "status": "restricted",
                }
            return {
                "type": "project",
                "id": project.pk,
                "title": project.title,
                "summary": project.summary or project.description[:500],
                "background": project.description,
                "status": project.status,
            }
        if voting.agreement_id:
            agreement = voting.agreement
            return {
                "type": "agreement",
                "id": agreement.pk,
                "title": agreement.title,
                "summary": agreement.description[:500],
                "background": agreement.description,
                "status": agreement.status,
            }
        return None

    def get_member_has_voted(self, voting) -> bool:
        annotated_value = getattr(voting, "member_has_voted", None)
        if annotated_value is not None:
            return annotated_value
        user = getattr(self.context.get("request"), "user", None)
        member = getattr(user, "member", None) if user else None
        return bool(member and member.is_active and voting.votes.filter(member=member).exists())

    def validate_options(self, value):
        if not isinstance(value, list) or not value or len(value) > 20 or any(not isinstance(item, str) for item in value):
            raise serializers.ValidationError("Defina entre 1 y 20 opciones.")
        normalized = [item.strip() for item in value]
        if any(not item or len(item) > 120 for item in normalized) or len(set(normalized)) != len(normalized):
            raise serializers.ValidationError("Las opciones deben ser únicas y tener de 1 a 120 caracteres.")
        return normalized

    def validate(self, attrs):
        if self.instance and self.instance.status in {Voting.Status.OPEN, Voting.Status.CLOSED}:
            raise serializers.ValidationError("Una votación abierta o cerrada no puede cambiar su configuración.")
        commission = attrs.get("commission", getattr(self.instance, "commission", None))
        project = attrs.get("project", getattr(self.instance, "project", None))
        agreement = attrs.get("agreement", getattr(self.instance, "agreement", None))
        user = getattr(self.context.get("request"), "user", None)
        if commission and not commission.is_active:
            raise serializers.ValidationError({"commission": "No se puede programar una votación en una comisión inactiva."})
        if bool(project) == bool(agreement):
            raise serializers.ValidationError("Vincule la votación con un proyecto o un acuerdo, exactamente uno.")
        if project and project.deleted_at:
            raise serializers.ValidationError({"project": "No se puede votar sobre un proyecto archivado."})
        if project and project.confidentiality == Project.Confidentiality.TEMPORARY and not (user and user.has_capability("confidentiality.read")):
            raise serializers.ValidationError({"project": "Solo Comisión puede vincular una votación con información temporalmente confidencial."})
        if project and project.commission_id and project.commission_id != commission.pk:
            raise serializers.ValidationError({"project": "El proyecto pertenece a otra comisión."})
        if agreement and (agreement.deleted_at or agreement.minute.deleted_at):
            raise serializers.ValidationError({"agreement": "No se puede votar sobre un acuerdo archivado."})
        if agreement and agreement.minute.meeting.commission_id != commission.pk:
            raise serializers.ValidationError({"agreement": "El acuerdo pertenece a otra comisión."})
        return attrs


class CastVoteSerializer(serializers.Serializer):
    option = serializers.CharField(max_length=120)
    client_request_id = serializers.UUIDField()


class CastVoteResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    cast_at = serializers.DateTimeField()


class VotingSummarySerializer(serializers.Serializer):
    voting_id = serializers.IntegerField()
    project_id = serializers.IntegerField(allow_null=True)
    agreement_id = serializers.IntegerField(allow_null=True)
    status = serializers.CharField()
    total_votes = serializers.IntegerField()
    results = serializers.DictField(child=serializers.IntegerField())
    percentages = serializers.DictField(child=serializers.FloatField())
