from datetime import timedelta
import tempfile

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from io import BytesIO
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import Role, User
from directory.models import Institution
from portal.models import ContentAsset, ContactRequest, Event, LandingContent, Publication, SiteProfile


class PublicPortalApiTests(TransactionTestCase):
    def setUp(self):
        call_command("seed_roles", verbosity=0)
        SiteProfile.objects.get_or_create(key="main")
        self.user = User.objects.create_user("public@example.test", "Long-Unique-Passphrase-2026!", first_name="Paula", last_name="Pública")
        self.user.roles.add(Role.objects.get(key="member"))

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

    def test_landing_content_is_saved_and_public_response_filters_private_fields(self):
        editor = User.objects.create_user("landing-editor@example.test", "Long-Unique-Passphrase-2026!", first_name="Elena", last_name="Editora")
        editor.roles.add(Role.objects.get(key="editor"))
        client = APIClient()
        client.force_authenticate(editor)

        first = client.put("/api/v1/landing-content/", {
            "content": {
                "site_sections": [
                    {"id": "hero", "type": "hero", "visible": True, "data": {"title": "Bienvenidos"}},
                    {"id": "draft", "type": "custom", "visible": False, "data": {"title": "Oculto"}},
                ],
                "members": [
                    {"name": "Miembro activo", "email": "private@example.test", "role": "comision", "position": "Presidenta", "status": "activo", "photo": "data:image/jpeg;base64," + ("A" * 300_000)},
                    {"name": "Miembro inactivo", "email": "inactive@example.test", "status": "inactivo"},
                ],
                "entities": [{"id": "entity-1", "name": "Institución pública", "category": "Sector Público", "status": "activo"}],
                "custom_positions": ["Presidenta"],
            },
        }, format="json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(LandingContent.objects.get(key="main").content["site_sections"][0]["data"]["title"], "Bienvenidos")
        institution = Institution.objects.get(landing_key="entity-1")
        self.assertEqual(institution.name, "Institución pública")
        self.assertEqual(institution.sector, "Sector Público")
        public_institutions = APIClient().get("/api/v1/public/institutions/")
        self.assertEqual(public_institutions.status_code, 200)
        self.assertEqual(public_institutions.data["count"], 1)
        self.assertEqual(public_institutions.data["results"][0]["category"], "Sector Público")
        self.assertEqual(public_institutions.data["results"][0]["status"], "activo")

        client.put("/api/v1/landing-content/", {"content": {"site_sections": [{"id": "hero", "type": "hero", "visible": True, "data": {"title": "Actualizado"}}]}}, format="json")
        stored = LandingContent.objects.get(key="main").content
        self.assertEqual(stored["members"][0]["name"], "Miembro activo")
        self.assertEqual(stored["site_sections"][0]["data"]["title"], "Actualizado")

        public = APIClient().get("/api/v1/public/landing-content/")
        self.assertEqual(public.status_code, 200)
        self.assertEqual(len(public.data["content"]["site_sections"]), 1)
        self.assertEqual(public.data["content"]["members"], [{"name": "Miembro activo", "position": "Presidenta", "status": "activo"}])
        self.assertLess(len(public.content), 20_000)
        self.assertNotIn("custom_positions", public.data["content"])

    def test_public_landing_restores_saved_summit_content_without_changing_saved_json(self):
        original_sections = [
            {"id": "hero", "type": "hero", "visible": True, "data": {"eyebrow": "Contenido de demostración", "cta2": "Summit 2026"}},
            {"id": "summit", "type": "event", "visible": True, "data": {
                "name": "Summit de Competitividad 2026", "description": "Descripción actualizada",
                "date": "29 de octubre de 2026", "imageUrl": "https://example.test/summit.jpg",
                "private_note": "No debe publicarse",
            }},
            {"id": "timeline", "type": "timeline", "visible": True, "data": {
                "m5_label": "Hito confirmado", "m5_desc": "Información institucional", "m6_label": "Summit",
                "m6_desc": "Un evento pendiente de confirmación", "m6_img": "https://example.test/summit.jpg",
            }},
            {"id": "contact", "type": "contact", "visible": True, "data": {
                "email": "mesadequetzaltenango@gmail.com", "phone": "+502 0000-0000", "hours": "Horario de prueba", "address": "Dirección de prueba",
            }},
        ]
        landing = LandingContent.objects.create(key="main", content={"site_sections": original_sections})

        response = APIClient().get("/api/v1/public/landing-content/")

        self.assertEqual(response.status_code, 200)
        hero_data = response.data["content"]["site_sections"][0]["data"]
        event_data = response.data["content"]["site_sections"][1]["data"]
        timeline_data = response.data["content"]["site_sections"][2]["data"]
        self.assertEqual(hero_data["cta2"], "Summit 2026")
        self.assertEqual(hero_data["eyebrow"], "")
        self.assertEqual([section["type"] for section in response.data["content"]["site_sections"]], ["hero", "event", "timeline", "contact"])
        self.assertEqual(event_data, {
            "name": "Summit de Competitividad 2026",
            "description": "Descripción actualizada",
            "date": "29 de octubre de 2026",
            "imageUrl": "https://example.test/summit.jpg",
        })
        self.assertEqual(timeline_data["m6_label"], "Summit")
        self.assertEqual(timeline_data["m6_desc"], "Un evento pendiente de confirmación")
        self.assertEqual(response.data["content"]["site_sections"][3]["data"], {
            "email": "mesadequetzaltenango@gmail.com",
            "phone": "+502 0000-0000",
            "hours": "Horario de prueba",
        })
        self.assertNotIn("address", response.data["content"]["site_sections"][3]["data"])
        self.assertNotIn("demostración", str(response.data["content"]).lower())
        landing.refresh_from_db()
        self.assertEqual(landing.content["site_sections"], original_sections)

    def test_editor_can_publish_content(self):
        editor = User.objects.create_user("publisher@example.test", "Long-Unique-Passphrase-2026!", first_name="Eva", last_name="Editora")
        editor.roles.add(Role.objects.get(key="editor"))
        publication = Publication.objects.create(
            title="Aviso de prueba", slug="aviso-de-prueba", author=editor, updated_by=editor,
        )
        client = APIClient()
        client.force_authenticate(editor)
        response = client.post(f"/api/v1/publications/{publication.pk}/publish/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], Publication.Status.PUBLISHED)
        self.assertTrue(editor.has_capability("content.publish"))

    def test_landing_content_requires_content_capability_and_valid_payload(self):
        client = APIClient()
        self.assertEqual(client.get("/api/v1/landing-content/").status_code, 401)
        client.force_authenticate(self.user)
        self.assertEqual(client.put("/api/v1/landing-content/", {"content": {"site_sections": "no-es-lista"}}, format="json").status_code, 403)

        editor = User.objects.create_user("landing-invalid-editor@example.test", "Long-Unique-Passphrase-2026!", first_name="Luis", last_name="Editor")
        editor.roles.add(Role.objects.get(key="editor"))
        client.force_authenticate(editor)
        invalid = client.put("/api/v1/landing-content/", {"content": {"site_sections": "no-es-lista"}}, format="json")
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(LandingContent.objects.count(), 0)

    @override_settings(STORAGES={
        "default": {"BACKEND": "common.storage.UnavailableStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    })
    def test_landing_cms_works_while_file_uploads_and_downloads_fail_closed(self):
        editor = User.objects.create_user("storage-editor@example.test", "Long-Unique-Passphrase-2026!", first_name="Eva", last_name="Editora")
        editor.roles.add(Role.objects.get(key="editor"))
        client = APIClient()
        client.force_authenticate(editor)

        content = BytesIO()
        Image.new("RGB", (8, 8), (12, 34, 56)).save(content, format="PNG")
        upload = SimpleUploadedFile("logo.png", content.getvalue(), content_type="image/png")
        rejected_upload = client.post("/api/v1/media-assets/", {
            "title": "Logo de prueba", "file": upload,
        }, format="multipart")
        self.assertEqual(rejected_upload.status_code, 503)
        self.assertEqual(ContentAsset.objects.count(), 0)

        asset = ContentAsset.objects.create(
            title="Archivo no disponible", file="content-assets/missing.png", uploaded_by=editor,
        )
        profile, _ = SiteProfile.objects.get_or_create(key="main")
        profile.logo_asset = asset
        profile.save(update_fields=["logo_asset"])
        rejected_download = APIClient().get(f"/api/v1/public/media-assets/{asset.pk}/download/")
        self.assertEqual(rejected_download.status_code, 503)

        saved = client.put("/api/v1/landing-content/", {
            "content": {"site_sections": [{"id": "hero", "type": "hero", "data": {"title": "Sitio conectado"}}]},
        }, format="json")
        self.assertEqual(saved.status_code, 200)
        public_landing = APIClient().get("/api/v1/public/landing-content/")
        self.assertEqual(public_landing.status_code, 200)
        self.assertEqual(public_landing.data["content"]["site_sections"][0]["data"]["title"], "Sitio conectado")

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

    def test_cms_editor_saves_and_publishes_content(self):
        editor = User.objects.create_user("publication-editor@example.test", "Long-Unique-Passphrase-2026!", first_name="Elena", last_name="Editora")
        editor.roles.add(Role.objects.get(key="editor"))
        editor_client = APIClient()
        editor_client.force_authenticate(editor)
        created = editor_client.post("/api/v1/publications/", {
            "title": "Aviso de prueba", "slug": "aviso-de-prueba", "summary": "Resumen sintético",
            "body": "Contenido de prueba sin HTML.", "section": "news",
        }, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["status"], Publication.Status.DRAFT)
        updated = editor_client.patch(f"/api/v1/publications/{created.data['id']}/", {
            "summary": "Resumen actualizado",
        }, format="json")
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["summary"], "Resumen actualizado")
        self.assertEqual(editor_client.post(f"/api/v1/publications/{created.data['id']}/publish/").status_code, 200)
        self.assertEqual(APIClient().get("/api/v1/public/publications/aviso-de-prueba/").status_code, 200)

        commission = User.objects.create_user("publication-commission@example.test", "Long-Unique-Passphrase-2026!", first_name="Celia", last_name="Comisión")
        commission.roles.add(Role.objects.get(key="commission"))
        commission_client = APIClient()
        commission_client.force_authenticate(commission)
        self.assertEqual(commission_client.post(f"/api/v1/publications/{created.data['id']}/publish/").status_code, 200)
        public_content = APIClient().get("/api/v1/public/publications/aviso-de-prueba/")
        self.assertEqual(public_content.status_code, 200)
        self.assertEqual(public_content.data["summary"], "Resumen actualizado")
