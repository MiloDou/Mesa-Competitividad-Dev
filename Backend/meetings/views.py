from io import BytesIO
from html import escape

from django.http import FileResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from common.audit import record_event
from common.viewsets import CapabilityViewSet
from meetings.access import visible_meetings_for
from meetings.models import Agreement, Attendance, Meeting, Minute
from meetings.serializers import AgreementSerializer, AttendanceSerializer, MeetingSerializer, MinuteSerializer
from meetings.services import approve_minute
from notifications.services import enqueue_for_users, member_user_ids
from projects.models import Document


class MeetingViewSet(CapabilityViewSet):
    queryset = Meeting.objects.filter(deleted_at__isnull=True).select_related("commission")
    read_capability = "meetings.read"
    write_capability = "meetings.write"
    serializer_class = MeetingSerializer

    def get_queryset(self):
        return visible_meetings_for(self.request.user).select_related("commission")

    def perform_create(self, serializer):
        meeting = serializer.save(created_by=self.request.user)
        record_event(self.request, "meeting.create", meeting, "Reunión creada")
        enqueue_for_users(
            member_user_ids(meeting.invited_members.all()),
            "meeting_convocation",
            "Nueva convocatoria",
            meeting.title,
            {"meeting_id": meeting.id, "scheduled_at": meeting.scheduled_at.isoformat()},
        )

    def perform_update(self, serializer):
        if hasattr(serializer.instance, "minute") and serializer.instance.minute.status == Minute.Status.APPROVED:
            raise PermissionDenied("No se puede cambiar una reunión asociada a una minuta aprobada.")
        invitation_changed = "invited_members" in serializer.validated_data
        schedule_changed = "scheduled_at" in serializer.validated_data
        meeting = serializer.save()
        record_event(self.request, "meeting.update", meeting, "Reunión actualizada", {"fields": sorted(serializer.validated_data.keys())})
        if (invitation_changed or schedule_changed) and meeting.scheduled_at >= timezone.now():
            enqueue_for_users(
                member_user_ids(meeting.invited_members.all()),
                "meeting_updated",
                "Convocatoria actualizada",
                meeting.title,
                {"meeting_id": meeting.id, "scheduled_at": meeting.scheduled_at.isoformat()},
            )

    def perform_destroy(self, instance):
        if hasattr(instance, "minute") and instance.minute.status == Minute.Status.APPROVED:
            raise PermissionDenied("No se puede archivar una reunión con minuta aprobada.")
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])
        record_event(self.request, "meeting.archive", instance, "Reunión archivada")
        if instance.scheduled_at >= timezone.now():
            enqueue_for_users(member_user_ids(instance.invited_members.all()), "meeting_cancelled", "Convocatoria cancelada", instance.title, {"meeting_id": instance.id})

class AttendanceViewSet(CapabilityViewSet):
    queryset = Attendance.objects.select_related("meeting", "member", "recorded_by").all()
    read_capability = "meetings.read"
    write_capability = "meetings.write"
    serializer_class = AttendanceSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_queryset(self):
        return Attendance.objects.filter(meeting__in=visible_meetings_for(self.request.user)).select_related("meeting", "member", "recorded_by")

    def perform_create(self, serializer):
        attendance = serializer.save(recorded_by=self.request.user)
        record_event(self.request, "meeting.attendance.record", attendance, "Asistencia registrada")

    def perform_update(self, serializer):
        attendance = serializer.save(recorded_by=self.request.user)
        record_event(self.request, "meeting.attendance.update", attendance, "Asistencia corregida", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        raise PermissionDenied("Los registros de asistencia no se eliminan; actualice el registro para corregirlo.")


class MinuteViewSet(CapabilityViewSet):
    queryset = Minute.objects.select_related("meeting", "created_by", "approved_by").all()
    read_capability = "meetings.read"
    write_capability = "meetings.write"
    serializer_class = MinuteSerializer
    action_capabilities = {"approve": "minutes.approve"}

    def get_queryset(self):
        queryset = Minute.objects.filter(deleted_at__isnull=True, meeting__in=visible_meetings_for(self.request.user)).select_related("meeting", "created_by", "approved_by")
        if not self.request.user.has_capability("directory.read") and not self.request.user.has_capability("meetings.write"):
            queryset = queryset.filter(status=Minute.Status.APPROVED)
        return queryset

    def perform_create(self, serializer):
        minute = serializer.save(created_by=self.request.user)
        record_event(self.request, "minute.create", minute, "Minuta creada")

    def perform_update(self, serializer):
        if serializer.instance.status == Minute.Status.APPROVED:
            raise PermissionDenied("Una minuta aprobada es inmutable.")
        minute = serializer.save()
        record_event(self.request, "minute.update", minute, "Minuta actualizada", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        if instance.status == Minute.Status.APPROVED:
            raise PermissionDenied("Una minuta aprobada no se puede archivar.")
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])
        record_event(self.request, "minute.archive", instance, "Minuta archivada")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        minute = approve_minute(self.get_object(), request.user)
        record_event(request, "minute.approve", minute, "Minuta aprobada")
        return Response(self.get_serializer(minute).data)


class AgreementViewSet(CapabilityViewSet):
    queryset = Agreement.objects.filter(deleted_at__isnull=True).select_related("minute", "responsible")
    read_capability = "meetings.read"
    write_capability = "meetings.write"
    serializer_class = AgreementSerializer

    def get_queryset(self):
        queryset = Agreement.objects.filter(deleted_at__isnull=True, minute__meeting__in=visible_meetings_for(self.request.user)).select_related("minute", "responsible")
        if not self.request.user.has_capability("directory.read") and not self.request.user.has_capability("meetings.write"):
            queryset = queryset.filter(minute__status=Minute.Status.APPROVED)
        return queryset

    def perform_create(self, serializer):
        item = serializer.save(created_by=self.request.user)
        record_event(self.request, "agreement.create", item, "Acuerdo creado")

    def perform_update(self, serializer):
        item = serializer.save()
        record_event(self.request, "agreement.update", item, "Acuerdo actualizado", {"fields": sorted(serializer.validated_data.keys())})

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])
        record_event(self.request, "agreement.archive", instance, "Acuerdo archivado")


class MinutePdfView(APIView):
    @extend_schema(responses={200: OpenApiResponse(response=OpenApiTypes.BINARY, description="Archivo PDF de la minuta")})
    def get(self, request, pk):
        try:
            minute = self.get_queryset(request.user).select_related("meeting__commission", "approved_by").prefetch_related("agreements__responsible").get(pk=pk)
        except Minute.DoesNotExist:
            from django.http import Http404
            raise Http404
        if not visible_meetings_for(request.user).filter(pk=minute.meeting_id).exists():
            raise PermissionDenied("No tiene permiso para consultar minutas.")
        meeting = minute.meeting
        buffer = BytesIO()
        document = SimpleDocTemplate(buffer, pagesize=A4, title=f"Minuta - {meeting.title}")
        styles = getSampleStyleSheet()
        safe_title = escape(meeting.title)
        safe_commission = escape(meeting.commission.name)
        safe_content = escape(minute.content or "Sin contenido").replace("\n", "<br/>")
        story = [
            Paragraph("Mesa de Competitividad de Quetzaltenango", styles["Title"]),
            Spacer(1, 12),
            Paragraph(f"Minuta: {safe_title}", styles["Heading1"]),
            Paragraph(f"Correlativo: MIN-{minute.pk:06d}", styles["Normal"]),
            Paragraph(f"Comisión: {safe_commission}", styles["Normal"]),
            Paragraph(f"Fecha: {timezone.localtime(meeting.scheduled_at).strftime('%d/%m/%Y %H:%M')}", styles["Normal"]),
            Spacer(1, 12),
            Paragraph("Orden del día", styles["Heading2"]),
        ]
        story.extend(Paragraph(f"{index}. {escape(item)}", styles["BodyText"]) for index, item in enumerate(meeting.agenda, start=1))
        story.extend([Spacer(1, 8), Paragraph("Contenido", styles["Heading2"]), Paragraph(safe_content, styles["BodyText"]), Spacer(1, 12), Paragraph("Asistencia confirmada", styles["Heading2"])])
        attendance_rows = [["Miembro", "Institución"]]
        attendance_rows.extend([
            [escape(record.member.display_name), escape(record.member.institution.name)]
            for record in meeting.attendance.filter(present=True).select_related("member__institution").order_by("member__last_name", "member__first_name")
        ])
        attendance_table = Table(attendance_rows, repeatRows=1, colWidths=[230, 230])
        attendance_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12304A")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.4, colors.grey), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("FONTSIZE", (0, 0), (-1, -1), 8)]))
        story.extend([attendance_table, Spacer(1, 12), Paragraph("Acuerdos", styles["Heading2"])])
        rows = [["Acuerdo", "Responsable", "Vencimiento", "Estado"]]
        for agreement in minute.agreements.all():
            rows.append([agreement.title, agreement.responsible.display_name if agreement.responsible else "Sin asignar", str(agreement.due_at or "—"), agreement.get_status_display()])
        table = Table(rows, repeatRows=1, colWidths=[200, 120, 75, 75])
        table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12304A")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.4, colors.grey), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("FONTSIZE", (0, 0), (-1, -1), 8)]))
        story.append(table)
        story.append(Spacer(1, 16))
        story.append(Paragraph(f"Estado: {minute.get_status_display()}", styles["Normal"]))
        document.build(story)
        buffer.seek(0)
        record_event(request, "minute.export_pdf", minute, "Minuta exportada a PDF")
        return FileResponse(buffer, as_attachment=True, filename=f"minuta-{minute.pk}.pdf", content_type="application/pdf")

    @staticmethod
    def get_queryset(user):
        queryset = Minute.objects.filter(deleted_at__isnull=True, meeting__in=visible_meetings_for(user))
        if not user.has_capability("directory.read") and not user.has_capability("meetings.write"):
            queryset = queryset.filter(status=Minute.Status.APPROVED)
        return queryset
