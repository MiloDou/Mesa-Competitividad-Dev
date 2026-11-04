from django.db import migrations, models


def copy_landing_entities(apps, schema_editor):
    LandingContent = apps.get_model("portal", "LandingContent")
    Institution = apps.get_model("directory", "Institution")
    database = schema_editor.connection.alias
    landing = LandingContent.objects.using(database).filter(key="main").first()
    if not landing or not isinstance(landing.content, dict):
        return

    entities = landing.content.get("entities", [])
    for entity in entities:
        if not isinstance(entity, dict):
            continue
        key = str(entity.get("id") or "").strip()
        name = str(entity.get("name") or "").strip()
        if not key or not name:
            continue

        institution = Institution.objects.using(database).filter(landing_key=key).first()
        if institution is None:
            institution = Institution.objects.using(database).filter(name=name, landing_key__isnull=True).first()
        if institution is None:
            institution = Institution(landing_key=key, name=name)
        institution.landing_key = key
        institution.name = name
        institution.sector = str(entity.get("category") or institution.sector or "")[:100]
        institution.is_active = entity.get("status") != "inactivo"
        institution.presentation_data = entity
        institution.save(using=database)


class Migration(migrations.Migration):
    dependencies = [
        ("directory", "0001_initial"),
        ("portal", "0004_landingcontent"),
    ]

    operations = [
        migrations.AddField(
            model_name="institution",
            name="landing_key",
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="institution",
            name="presentation_data",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(copy_landing_entities, migrations.RunPython.noop),
    ]
