from django.test import TestCase

from audit.models import AuditEvent


class AuditEventImmutabilityTests(TestCase):
    def test_audit_events_cannot_be_updated_or_deleted(self):
        event = AuditEvent.objects.create(
            action="test.record",
            object_type="test.object",
            object_id="1",
            summary="Evento sintético",
        )

        event.summary = "Texto alterado"
        with self.assertRaises(ValueError):
            event.save()
        with self.assertRaises(TypeError):
            AuditEvent.objects.filter(pk=event.pk).update(summary="Texto alterado")
        with self.assertRaises(TypeError):
            AuditEvent.objects.filter(pk=event.pk).delete()
