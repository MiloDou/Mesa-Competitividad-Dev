from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from common.audit import record_event
from common.viewsets import CapabilityViewSet
from directory.models import CommissionMembership
from projects.models import Project
from voting.models import Vote, Voting
from voting.serializers import CastVoteResponseSerializer, CastVoteSerializer, VotingSerializer, VotingSummarySerializer
from voting.services import cast_vote, close_voting, open_voting, refresh_voting, schedule_voting, voting_results


class VotingViewSet(CapabilityViewSet):
    queryset = Voting.objects.filter(deleted_at__isnull=True).select_related("commission", "project", "agreement__minute__meeting")
    read_capability = "voting.read"
    write_capability = "voting.manage"
    serializer_class = VotingSerializer
    action_capabilities = {"open": "voting.open_close", "close": "voting.open_close", "cast": "vote.cast", "results": "voting.read", "schedule": "voting.manage", "pending": "voting.read"}

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        member = getattr(user, "member", None)
        if member and member.is_active:
            queryset = queryset.annotate(member_has_voted=Exists(Vote.objects.filter(voting_id=OuterRef("pk"), member=member)))
        if not user.has_capability("confidentiality.read"):
            queryset = queryset.filter(
                Q(project__isnull=True) | Q(project__confidentiality__in=[Project.Confidentiality.PUBLIC, Project.Confidentiality.INTERNAL]),
            ).filter(
                Q(agreement__isnull=True) | Q(agreement__minute__status="approved", agreement__minute__meeting__confidentiality__in=["public", "internal"]),
            )
        if user.has_capability("directory.read") or user.has_capability("voting.manage"):
            return queryset
        if not member or not member.is_active:
            return queryset.none()
        today = timezone.localdate()
        commission_ids = CommissionMembership.objects.filter(member=member, starts_at__lte=today, commission__is_active=True).filter(Q(ends_at__isnull=True) | Q(ends_at__gte=today)).values_list("commission_id", flat=True)
        return queryset.filter(
            commission_id__in=commission_ids,
            status__in=[Voting.Status.SCHEDULED, Voting.Status.OPEN, Voting.Status.CLOSED],
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        visible_votings = [refresh_voting(voting) for voting in (page if page is not None else queryset)]
        if page is not None:
            serializer = self.get_serializer(visible_votings, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(self.get_serializer(visible_votings, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        voting = self.get_object()
        refresh_voting(voting)
        return Response(self.get_serializer(voting).data)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        member = getattr(request.user, "member", None)
        if not member or not member.is_active:
            return Response({"count": 0, "next": None, "previous": None, "results": []})
        today = timezone.localdate()
        commission_ids = CommissionMembership.objects.filter(
            member=member, starts_at__lte=today, commission__is_active=True,
        ).filter(Q(ends_at__isnull=True) | Q(ends_at__gte=today)).values_list("commission_id", flat=True)
        for voting in self.get_queryset().filter(commission_id__in=commission_ids, status=Voting.Status.SCHEDULED):
            refresh_voting(voting)
        queryset = self.filter_queryset(self.get_queryset()).filter(
            commission_id__in=commission_ids,
            status=Voting.Status.OPEN,
            member_has_voted=False,
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(queryset, many=True).data)

    def perform_create(self, serializer):
        voting = serializer.save(created_by=self.request.user)
        record_event(self.request, "voting.create", voting, "Votación creada")

    def perform_update(self, serializer):
        voting = serializer.save()
        record_event(self.request, "voting.update", voting, "Votación configurada", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        if instance.status in {Voting.Status.OPEN, Voting.Status.CLOSED} or instance.votes.exists():
            raise PermissionDenied("Una votación abierta, cerrada o con votos no se puede archivar.")
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
        record_event(self.request, "voting.archive", instance, "Votación archivada")

    @action(detail=True, methods=["post"])
    def open(self, request, pk=None):
        voting = open_voting(self.get_object(), request.user)
        return Response(self.get_serializer(voting).data)

    @action(detail=True, methods=["post"])
    def schedule(self, request, pk=None):
        voting = self.get_object()
        serializer = self.get_serializer(voting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        voting = serializer.save(status=Voting.Status.DRAFT)
        voting = schedule_voting(voting, voting.opens_at, voting.closes_at)
        record_event(request, "voting.schedule", voting, "Votación programada")
        return Response(self.get_serializer(voting).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        voting = close_voting(self.get_object(), request.user)
        return Response(self.get_serializer(voting).data)

    @extend_schema(request=CastVoteSerializer, responses={201: CastVoteResponseSerializer})
    @action(detail=True, methods=["post"])
    def cast(self, request, pk=None):
        voting = self.get_object()
        serializer = CastVoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vote, created = cast_vote(user=request.user, voting=voting, **serializer.validated_data)
        if created:
            record_event(request, "voting.cast", vote, "Voto emitido")
        return Response({"status": "recorded", "cast_at": vote.cast_at}, status=status.HTTP_201_CREATED)

    @extend_schema(responses=VotingSummarySerializer)
    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        voting = self.get_object()
        return Response(voting_results(voting))
