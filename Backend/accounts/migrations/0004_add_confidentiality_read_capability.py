from django.db import migrations


def add_confidentiality_read_capability(apps, schema_editor):
    Capability = apps.get_model("accounts", "Capability")
    Role = apps.get_model("accounts", "Role")
    database = schema_editor.connection.alias
    capability, _ = Capability.objects.using(database).get_or_create(
        key="confidentiality.read",
        defaults={"label": "Consultar iniciativas y documentos temporalmente confidenciales"},
    )
    commission = Role.objects.using(database).filter(key="commission").first()
    if commission:
        through = Role.capabilities.through
        through.objects.using(database).get_or_create(role_id=commission.pk, capability_id=capability.pk)


class Migration(migrations.Migration):
    dependencies = [("accounts", "0003_remove_generic_push_broadcast")]

    operations = [migrations.RunPython(add_confidentiality_read_capability, migrations.RunPython.noop)]
