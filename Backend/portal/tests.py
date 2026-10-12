from datetime import timedelta
import tempfile

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from io import BytesIO
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import Role, User
from portal.models import ContentAsset, ContactRequest, Event, Publication, SiteProfile


class PublicPortalApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_roles", verbosity=0)
        cls.user = User.objects.create_user("public@example.test", "Long-Unique-Passphrase-2026!", first_name="Paula", last_name="Pública")
        cls.user.roles.add(Role.objects.get(key="member"))

    def test_event_registration_is_persisted_and_duplicate_email_is_rejected(self):
        event = Event.objects.create(
            title="Encuentro de prueba",
            slug="encuentro-prueba",
            starts_at=timezone.now() + timedelta(days=3),
            registration_required=True,
            capacity=1,
            modality=Event.Modality.VIRTUAL,
            meeting_link="https://example.test/evento",
            agenda=["Apertura", "Panel institucional"],
            status=Event.Status.PUBLISHED,
            created_by=self.user,
        )
        client = APIClient()
        public_event = client.get("/api/v1/public/events/encuentro-prueba/")
        self.assertEqual(public_event.status_code, 200)
        self.assertEqual(public_event.data["modality"], Event.Modality.VIRTUAL)
        self.assertEqual(public_event.data["agenda"], ["Apertura", "Panel institucional"])
        first = client.post("/api/v1/public/events/encuentro-prueba/register/", {
            "name": "Persona de prueba", "email": "Persona@Example.Test", "institution": "Institución de prueba"
        }, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(event.registrations.get().email, "persona@example.test")
        duplicate = client.post("/api/v1/public/events/encuentro-prueba/register/", {
            "name": "La misma persona", "email": "persona@example.test"
        }, format="json")
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(event.registrations.count(), 1)

    def test_event_publication_requires_ten_days_of_notice(self):
        commission_user = User.objects.create_user("event-commission@example.test", "Long-Unique-Passphrase-2026!", first_name="Ana", last_name="Comisión")
        commission_user.roles.add(Role.objects.get(key="commission"))
        event = Event.objects.create(
            title="Evento cercano", slug="evento-cercano", starts_at=timezone.now() + timedelta(days=9),
            created_by=commission_user,
        )
        client = APIClient()
        client.force_authenticate(commission_user)
        rejected = client.post(f"/api/v1/events/{event.pk}/publish/")
        self.assertEqual(rejected.status_code, 400)
        event.starts_at = timezone.now() + timedelta(days=11)
        event.save(update_fields=["starts_at", "updated_at"])
        accepted = client.post(f"/api/v1/events/{event.pk}/publish/")
        self.assertEqual(accepted.status_code, 200)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        CONTACT_NOTIFICATION_EMAIL="contact@example.test",
    )
    def test_contact_request_is_saved_and_sent_without_exposing_admin_queue(self):
        client = APIClient()
        missing_phone = client.post("/api/v1/public/contact/", {
            "name": "Persona de prueba", "email": "person@example.test", "message": "Consulta sin teléfono.",
        }, format="json")
        self.assertEqual(missing_phone.status_code, 400)
        response = client.post("/api/v1/public/contact/", {
            "name": "Persona de prueba", "email": "person@example.test", "phone": "+502 5555 0101",
            "message": "Mensaje sintético de la prueba.",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactRequest.objects.count(), 1)
        self.assertEqual(ContactRequest.objects.get().phone, "+502 5555 0101")
        self.assertEqual(len(mail.outbox), 1)

        client.force_authenticate(self.user)
        internal = client.get("/api/v1/contact-requests/")
        self.assertEqual(internal.status_code, 403)

    def test_cms_profile_and_image_assets_publish_through_authorized_routes(self):
        editor = User.objects.create_user("cms-editor@example.test", "Long-Unique-Passphrase-2026!", first_name="César", last_name="Editor")
        editor.roles.add(Role.objects.get(key="editor"))
        client = APIClient()
        client.force_authenticate(editor)
        profile = client.get("/api/v1/site-profile/")
        self.assertEqual(profile.status_code, 200)
        profile_id = profile.data["results"][0]["id"]
        with tempfile.TemporaryDirectory() as media_dir, override_settings(MEDIA_ROOT=media_dir):
            invalid_image = SimpleUploadedFile("fake.png", b"\x89PNG\r\n\x1a\ninvalid image", content_type="image/png")
            rejected = client.post("/api/v1/media-assets/", {
                "title": "PNG inválido", "file": invalid_image,
            }, format="multipart")
            self.assertEqual(rejected.status_code, 400)

            source_image = BytesIO()
            Image.new("RGB", (2400, 1600), (12, 34, 56)).save(source_image, format="PNG")
            image_bytes = source_image.getvalue()
            upload = SimpleUploadedFile("logo.png", image_bytes, content_type="image/png")
            uploaded = client.post("/api/v1/media-assets/", {
                "title": "Logo sintético", "alt_text": "Logotipo de prueba", "file": upload,
            }, format="multipart")
            self.assertEqual(uploaded.status_code, 201)
            asset = ContentAsset.objects.get(pk=uploaded.data["id"])
            self.assertLess(asset.size_bytes, len(image_bytes))
            with Image.open(asset.file) as stored_image:
                self.assertEqual(stored_image.size, (1920, 1280))

            self.assertEqual(client.patch(f"/api/v1/site-profile/{profile_id}/", {
                "mission": "Coordinar iniciativas de prueba.", "logo_asset": asset.pk,
            }, format="json").status_code, 200)
            public_profile = APIClient().get("/api/v1/public/site-profile/")
            self.assertEqual(public_profile.status_code, 200)
            self.assertEqual(public_profile.data["results"][0]["mission"], "Coordinar iniciativas de prueba.")
            public_logo_url = public_profile.data["results"][0]["logo"]["url"]
            self.assertEqual(APIClient().get(public_logo_url).status_code, 200)

            publication = Publication.objects.create(
                title="Aviso público", slug="aviso-publico", body="Contenido de prueba",
                status=Publication.Status.PUBLISHED, author=editor, updated_by=editor,
            )
            publication.assets.add(asset)
            public_content = APIClient().get("/api/v1/public/publications/aviso-publico/")
            self.assertEqual(public_content.status_code, 200)
            self.assertEqual(public_content.data["assets"][0]["alt_text"], "Logotipo de prueba")
