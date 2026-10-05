from datetime import timedelta

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role, User
from directory.models import Commission, CommissionMembership, Institution, Member
from meetings.models import Meeting, Minute
from notifications.models import Notification


class MeetingAndMinuteApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.commission_user = User.objects.create_user("commission@example.test", "Long-Unique-Passphrase-2026!", first_name="Camila", last_name="Comisión")
        cls.commission_user.roles.add(Role.objects.get(key="commission"))
        cls.commission = Commission.objects.create(name="Comisión operativa")
        cls.institution = Institution.objects.create(name="Institución operativa")
        member_user = User.objects.create_user("mobile@example.test", "Long-Unique-Passphrase-2026!", first_name="Marta", last_name="Miembro")
        member_user.roles.add(Role.objects.get(key="member"))
        cls.member = Member.objects.create(user=member_user, institution=cls.institution, first_name="Marta", last_name="Miembro")
        CommissionMembership.objects.create(member=cls.member, commission=cls.commission, starts_at=timezone.localdate())
        other_user = User.objects.create_user("no-invite@example.test", "Long-Unique-Passphrase-2026!", first_name="Nora", last_name="Sin Invitación")
        other_user.roles.add(Role.objects.get(key="member"))
        cls.other_member = Member.objects.create(user=other_user, institution=cls.institution, first_name="Nora", last_name="Sin Invitación")
        CommissionMembership.objects.create(member=cls.other_member, commission=cls.commission, starts_at=timezone.localdate())

    def test_convocation_creates_member_notification(self):
        client = APIClient()
        client.force_authenticate(self.commission_user)
        response = client.post("/api/v1/meetings/", {
            "commission": self.commission.pk,
            "title": "Reunión de prueba",
            "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
            "agenda": ["Revisar una iniciativa"],
            "invited_member_ids": [self.member.pk],
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["is_invited"] is False)
        self.assertTrue(Notification.objects.filter(user=self.member.user, kind="meeting_convocation").exists())
        member_client = APIClient()
        member_client.force_authenticate(self.member.user)
        member_meeting = member_client.get(f"/api/v1/meetings/{response.data['id']}/")
        self.assertEqual(member_meeting.status_code, 200)
        self.assertTrue(member_meeting.data["is_invited"])
        self.assertNotIn("invited_member_ids", member_meeting.data)
        other_client = APIClient()
        other_client.force_authenticate(self.other_member.user)
        self.assertEqual(other_client.get("/api/v1/meetings/").data["count"], 0)

    def test_approved_minute_is_immutable_and_pdf_is_generated(self):
        meeting = Meeting.objects.create(
            commission=self.commission,
            title="Sesión de prueba",
            scheduled_at=timezone.now(),
            created_by=self.commission_user,
        )
        meeting.invited_members.add(self.member)
        attendance = APIClient()
        attendance.force_authenticate(self.commission_user)
        recorded = attendance.post("/api/v1/attendance/", {
            "meeting": meeting.pk, "member": self.member.pk, "present": True,
        }, format="json")
        self.assertEqual(recorded.status_code, 201)
        client = APIClient()
        client.force_authenticate(self.commission_user)
        created = client.post("/api/v1/minutes/", {"meeting": meeting.pk, "content": "Acuerdos de prueba"}, format="json")
        self.assertEqual(created.status_code, 201)
        minute_id = created.data["id"]
        approved = client.post(f"/api/v1/minutes/{minute_id}/approve/")
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.data["status"], Minute.Status.APPROVED)

        update = client.patch(f"/api/v1/minutes/{minute_id}/", {"content": "Texto modificado"}, format="json")
        self.assertEqual(update.status_code, 403)
        minute = Minute.objects.get(pk=minute_id)
        minute.content = "Modificación directa"
        with self.assertRaises(ValueError):
            minute.save()

        pdf = client.get(f"/api/v1/minutes/{minute_id}/pdf/")
        self.assertEqual(pdf.status_code, 200)
        self.assertEqual(pdf["Content-Type"], "application/pdf")
        self.assertTrue(b"".join(pdf.streaming_content).startswith(b"%PDF-"))
