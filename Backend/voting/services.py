from django.db import transaction
from django.db import IntegrityError
from django.db.models import Count
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from common.audit import record_event
from directory.models import CommissionMembership
from notifications.services import commission_user_ids, enqueue_for_users
from projects.models import Project
from voting.models import Vote, Voting


def is_eligible_member(user, voting):
    member = getattr(user, "member", None)
    if not member or not member.is_active or not voting.commission.is_active:
        return False
    today = timezone.localdate()
    return CommissionMembership.objects.filter(
        member=member,
        commission=voting.commission,
        starts_at__lte=today,
    ).filter(models_end_date_filter(today)).exists()


def models_end_date_filter(today):
    from django.db.models import Q
    return Q(ends_at__isnull=True) | Q(ends_at__gte=today)


@transaction.atomic
def open_voting(voting, actor):
    voting = Voting.objects.select_for_update().get(pk=voting.pk)
    if not voting.commission.is_active:
        raise ValidationError({"commission": "No se puede abrir una votación de una comisión inactiva."})
    if voting.status not in {Voting.Status.DRAFT, Voting.Status.SCHEDULED}:
        raise ValidationError({"status": "Solo se puede abrir una votación en borrador o programada."})
    validate_voting_subject(voting)
    if not voting.options:
        raise ValidationError({"options": "Agregue al menos una opción antes de abrir la votación."})
    if voting.closes_at and voting.closes_at <= timezone.now():
        raise ValidationError({"closes_at": "La fecha de cierre debe ser futura."})
    if voting.opens_at and voting.opens_at > timezone.now():
        raise ValidationError({"opens_at": "La votación todavía no llega a su hora de apertura; déjela programada."})
    voting.status = Voting.Status.OPEN
    voting.opens_at = voting.opens_at or timezone.now()
    voting.save(update_fields=["status", "opens_at", "updated_at"])
    enqueue_for_users(commission_user_ids(voting.commission), "voting_opened", "Votación abierta", voting.title, {"voting_id": voting.id})
    record_event(None, "voting.open", voting, "Votación abierta", user_override=actor)
    return voting


@transaction.atomic
def close_voting(voting, actor):
    voting = Voting.objects.select_for_update().get(pk=voting.pk)
    if voting.status == Voting.Status.CLOSED:
        return voting
    if voting.status != Voting.Status.OPEN:
        raise ValidationError({"status": "Solo se puede cerrar una votación abierta."})
    voting.status = Voting.Status.CLOSED
    voting.save(update_fields=["status", "updated_at"])
    enqueue_for_users(commission_user_ids(voting.commission), "voting_closed", "Votación cerrada", voting.title, {"voting_id": voting.id})
    record_event(None, "voting.close", voting, "Votación cerrada", user_override=actor)
    return voting


def refresh_voting(voting):
    """Close expired polls when accessed; no policy is inferred for quorum or outcome."""
    now = timezone.now()
    if voting.status == Voting.Status.SCHEDULED and voting.closes_at and voting.closes_at <= now:
        return close_expired_schedule(voting)
    if voting.status == Voting.Status.SCHEDULED and (voting.opens_at is None or voting.opens_at <= now):
        return open_voting(voting, None)
    if voting.status == Voting.Status.OPEN and voting.closes_at and voting.closes_at <= timezone.now():
        return close_voting(voting, None)
    return voting


@transaction.atomic
def close_expired_schedule(voting):
    voting = Voting.objects.select_for_update().get(pk=voting.pk)
    if voting.status != Voting.Status.SCHEDULED or not voting.closes_at or voting.closes_at > timezone.now():
        return voting
    voting.status = Voting.Status.CLOSED
    voting.save(update_fields=["status", "updated_at"])
    enqueue_for_users(commission_user_ids(voting.commission), "voting_closed", "Votación cerrada", voting.title, {"voting_id": voting.id})
    record_event(None, "voting.auto_close", voting, "Votación cerrada automáticamente por vencimiento")
    return voting


@transaction.atomic
def schedule_voting(voting, opens_at, closes_at):
    voting = Voting.objects.select_for_update().get(pk=voting.pk)
    now = timezone.now()
    if voting.status != Voting.Status.DRAFT:
        raise ValidationError({"status": "Solo una votación en borrador se puede programar."})
    validate_voting_subject(voting)
    if not voting.options:
        raise ValidationError({"options": "Agregue al menos una opción antes de programar la votación."})
    if opens_at is None or opens_at <= now:
        raise ValidationError({"opens_at": "La apertura programada debe ser una fecha futura."})
    if closes_at is not None and closes_at <= opens_at:
        raise ValidationError({"closes_at": "La fecha de cierre debe ser posterior a la apertura."})
    voting.opens_at = opens_at
    voting.closes_at = closes_at
    voting.status = Voting.Status.SCHEDULED
    voting.save(update_fields=["opens_at", "closes_at", "status", "updated_at"])
    enqueue_for_users(commission_user_ids(voting.commission), "voting_scheduled", "Próxima votación", voting.title, {"voting_id": voting.id, "opens_at": opens_at.isoformat()})
    return voting


@transaction.atomic
def cast_vote(*, user, voting, option, client_request_id=None):
    if client_request_id is None:
        raise ValidationError({"client_request_id": "Se requiere un identificador UUID para proteger los reintentos."})
    voting = Voting.objects.select_for_update().get(pk=voting.pk)
    if not is_eligible_member(user, voting):
        raise ValidationError({"member": "La cuenta no tiene una representación activa en esta comisión."})
    member = user.member
    existing_request = Vote.objects.filter(voting=voting, client_request_id=client_request_id).first()
    if existing_request:
        if existing_request.member_id == member.pk and existing_request.option == option:
            return existing_request, False
        raise ValidationError({"client_request_id": "El identificador ya se usó con otro voto."}, code="idempotency_conflict")
    voting = refresh_voting(voting)
    if not voting.is_open_now:
        raise ValidationError({"voting": "La votación no está abierta."})
    if option not in voting.options:
        raise ValidationError({"option": "La opción no pertenece a esta votación."})
    if Vote.objects.filter(voting=voting, member=member).exists():
        raise ValidationError({"vote": "Ya existe un voto para este miembro en esta votación."}, code="duplicate_vote")
    try:
        with transaction.atomic():
            vote = Vote.objects.create(voting=voting, member=member, option=option, client_request_id=client_request_id)
        return vote, True
    except IntegrityError:
        existing_request = Vote.objects.filter(voting=voting, client_request_id=client_request_id).first()
        if existing_request and existing_request.member_id == member.pk and existing_request.option == option:
            return existing_request, False
        if existing_request:
            raise ValidationError({"client_request_id": "El identificador ya se usó con otro voto."}, code="idempotency_conflict")
        raise ValidationError({"vote": "Ya existe un voto para este miembro en esta votación."}, code="duplicate_vote")


def voting_results(voting):
    voting = refresh_voting(voting)
    if voting.status != Voting.Status.CLOSED:
        raise ValidationError({"results": "Los resultados estarán disponibles al cerrar la votación."})
    counts = {option: 0 for option in voting.options}
    for row in voting.votes.values("option").annotate(total=Count("id")):
        counts[row["option"]] = row["total"]
    total_votes = sum(counts.values())
    percentages = {option: round(total * 100 / total_votes, 2) if total_votes else 0.0 for option, total in counts.items()}
    return {
        "voting_id": voting.id,
        "project_id": voting.project_id,
        "agreement_id": voting.agreement_id,
        "status": voting.status,
        "total_votes": total_votes,
        "results": counts,
        "percentages": percentages,
    }


def validate_voting_subject(voting):
    if bool(voting.project_id) == bool(voting.agreement_id):
        raise ValidationError("Vincule la votación con un proyecto o un acuerdo, exactamente uno.")
    if voting.project_id and voting.project.deleted_at:
        raise ValidationError({"project": "No se puede votar sobre un proyecto archivado."})
    if voting.project_id and voting.project.confidentiality == Project.Confidentiality.TEMPORARY:
        raise ValidationError({"project": "No se puede someter a voto una iniciativa temporalmente confidencial."})
    if voting.project_id and voting.project.commission_id and voting.project.commission_id != voting.commission_id:
        raise ValidationError({"project": "El proyecto pertenece a otra comisión."})
    if voting.agreement_id:
        agreement = voting.agreement
        if agreement.deleted_at or agreement.minute.deleted_at:
            raise ValidationError({"agreement": "No se puede votar sobre un acuerdo archivado."})
        if agreement.minute.meeting.commission_id != voting.commission_id:
            raise ValidationError({"agreement": "El acuerdo pertenece a otra comisión."})
