from datetime import date, datetime, timedelta, timezone, timezone as dt_timezone

from django.test import SimpleTestCase

from telegram_notifications import events, templates
from telegram_notifications.templates import TemplateError, render

START = datetime(2026, 10, 29, 14, 0, tzinfo=dt_timezone.utc)  # 08:00 en Guatemala (UTC-6)
END = datetime(2026, 10, 29, 16, 30, tzinfo=dt_timezone.utc)


class CatalogTests(SimpleTestCase):
    def test_every_event_has_a_template_and_matching_key(self):
        self.assertEqual(set(events.EVENTS), set(templates.RENDERERS))
        for key, spec in events.EVENTS.items():
            self.assertEqual(key, spec.event_type)

    def test_minimal_data_keeps_only_allowed_fields(self):
        self.assertEqual(events.minimal_data("meeting.reminder", {"window_hours": 24, "email": "a@b.test"}), {"window_hours": 24})
        self.assertEqual(events.minimal_data("voting.opened", {"title": "x"}), {})
        with self.assertRaises(ValueError):
            events.minimal_data("otro.evento", {})

    def test_only_relevant_meeting_changes_count(self):
        self.assertFalse(events.is_relevant_meeting_change(["description", "agenda", "title"]))
        self.assertEqual(events.relevant_meeting_changes(["location", "agenda", "scheduled_at"]), ["location", "scheduled_at"])

    def test_occurrence_key_is_stable_and_bounded(self):
        self.assertEqual(events.occurrence_key(START, 24), "2026-10-29T14:00:00+00:00|24")
        self.assertEqual(events.occurrence_key(START, 24), events.occurrence_key(START, 24))
        self.assertNotEqual(events.occurrence_key(START, 24), events.occurrence_key(END, 24))
        self.assertEqual(len(events.occurrence_key("x" * 500)), 64)
        self.assertEqual(events.occurrence_key(None), "")

    def test_occurrence_key_is_the_same_for_one_instant_in_any_timezone(self):
        guatemala = START.astimezone(timezone(timedelta(hours=-6)))
        self.assertEqual(guatemala.isoformat(), "2026-10-29T08:00:00-06:00")
        self.assertEqual(events.occurrence_key(guatemala, 24), events.occurrence_key(START, 24))
        self.assertEqual(events.occurrence_key(guatemala, 24), "2026-10-29T14:00:00+00:00|24")
        self.assertNotEqual(events.occurrence_key(guatemala + timedelta(minutes=1), 24), events.occurrence_key(START, 24))

    def test_occurrence_key_leaves_dates_and_naive_values_unchanged(self):
        self.assertEqual(events.occurrence_key(date(2026, 10, 29), 1), "2026-10-29|1")
        self.assertEqual(events.occurrence_key(datetime(2026, 10, 29, 8, 0)), "2026-10-29T08:00:00")


class MeetingTemplateTests(SimpleTestCase):
    def test_created_shows_local_time_and_details(self):
        message = render("meeting.created", {"title": "Sesión ordinaria", "scheduled_at": START, "ends_at": END, "modality": "hybrid", "location": "Sala 2", "meeting_link": "https://meet.example.test/abc"})
        self.assertIn("Nueva reunión\nSesión ordinaria", message.text)
        self.assertIn("jueves 29 de octubre de 2026, 08:00", message.text)
        self.assertIn("Finaliza: jueves 29 de octubre de 2026, 10:30", message.text)
        self.assertIn("Modalidad: Híbrida", message.text)
        self.assertIn("Lugar: Sala 2", message.text)
        self.assertIn("Enlace: https://meet.example.test/abc", message.text)
        self.assertEqual(message.buttons, [])

    def test_location_and_link_follow_modality(self):
        virtual = render("meeting.created", {"title": "A", "scheduled_at": START, "modality": "virtual", "location": "Sala 2", "meeting_link": "https://meet.example.test/abc"})
        self.assertNotIn("Lugar", virtual.text)
        self.assertIn("Enlace", virtual.text)
        in_person = render("meeting.created", {"title": "A", "scheduled_at": START, "modality": "in_person", "location": "Sala 2", "meeting_link": "https://meet.example.test/abc"})
        self.assertIn("Lugar", in_person.text)
        self.assertNotIn("Enlace", in_person.text)

    def test_updated_names_only_known_changes(self):
        message = render("meeting.updated", {"title": "A", "scheduled_at": START, "changed": ["scheduled_at", "location", "agenda"]})
        self.assertIn("Cambió: fecha y hora, lugar.", message.text)
        self.assertNotIn("agenda", message.text)

    def test_cancelled_and_invited(self):
        self.assertIn("Estaba programada para el jueves 29 de octubre de 2026, 08:00.", render("meeting.cancelled", {"title": "A", "scheduled_at": START}).text)
        self.assertIn("Fuiste incluido en una reunión", render("meeting.invited", {"title": "A", "scheduled_at": START}).text)

    def test_reminder_pluralizes_hours(self):
        self.assertIn("Comienza en 1 hora.", render("meeting.reminder", {"title": "A", "scheduled_at": START, "window_hours": 1}).text)
        self.assertIn("Comienza en 24 horas.", render("meeting.reminder", {"title": "A", "scheduled_at": START, "window_hours": 24}).text)


class VotingTemplateTests(SimpleTestCase):
    def test_voting_messages(self):
        self.assertEqual(render("voting.closed", {"title": "Plan 2027"}).text, "Votación cerrada\nPlan 2027")
        opened = render("voting.opened", {"title": "Plan 2027", "closes_at": END}).text
        self.assertIn("Cierra: jueves 29 de octubre de 2026, 10:30", opened)
        self.assertIn("emitir tu voto", opened)
        scheduled = render("voting.scheduled", {"title": "Plan 2027", "opens_at": START, "closes_at": END}).text
        self.assertIn("Abre:", scheduled)
        self.assertIn("Cierra:", scheduled)

    def test_reminder_does_not_claim_results(self):
        text = render("voting.reminder", {"title": "Plan 2027", "closes_at": END, "window_hours": 2}).text
        self.assertIn("Aún no registras tu voto. Cierra en 2 horas", text)
        self.assertNotIn("resultado", render("voting.closed", {"title": "Plan 2027"}).text.lower())


class SafetyTests(SimpleTestCase):
    def test_title_is_cleaned_and_truncated(self):
        message = render("voting.closed", {"title": "Línea\x00 uno\n\n  <b>dos</b> " + "x" * 300})
        title = message.text.split("\n")[1]
        self.assertNotIn("\x00", title)
        self.assertLessEqual(len(title), templates.TITLE_LIMIT)
        self.assertTrue(title.endswith("…"))

    def test_only_https_urls_become_buttons(self):
        context = {"title": "A", "url": "https://mesa.example.test/votaciones/1"}
        self.assertEqual(render("voting.closed", context).buttons, [(templates.BUTTON_LABEL, "https://mesa.example.test/votaciones/1")])
        self.assertEqual(render("voting.closed", {**context, "url": "http://mesa.example.test"}).buttons, [])
        self.assertEqual(render("voting.closed", {**context, "url": "javascript:alert(1)"}).buttons, [])

    def test_missing_or_invalid_data_raises_template_error(self):
        with self.assertRaises(TemplateError):
            render("meeting.created", {"title": "A"})
        with self.assertRaises(TemplateError):
            render("voting.reminder", {"title": "A", "closes_at": END})
        with self.assertRaises(TemplateError):
            render("meeting.reminder", {"title": "A", "scheduled_at": START, "window_hours": "pronto"})
        with self.assertRaises(TemplateError):
            render("otro.evento", {"title": "A"})
