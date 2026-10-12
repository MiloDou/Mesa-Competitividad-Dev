from django.db import migrations


def remove_broadcast_capability(apps, schema_editor):
    Capability = apps.get_model("accounts", "Capability")
    Capability.objects.using(schema_editor.connection.alias).filter(key="notifications.broadcast").delete()


def restore_broadcast_capability(apps, schema_editor):
    Capability = apps.get_model("accounts", "Capability")
    Role = apps.get_model("accounts", "Role")
    database = schema_editor.connection.alias
    capability, _ = Capability.objects.using(database).get_or_create(
        key="notifications.broadcast",
        defaults={"label": "Emitir avisos institucionales"},
    )
    commission = Role.objects.using(database).filter(key="commission").first()
    if commission:
        through = Role.capabilities.through
        through.objects.using(database).get_or_create(role_id=commission.pk, capability_id=capability.pk)


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_seed_initial_roles")]

    operations = [
        migrations.RunPython(remove_broadcast_capability, restore_broadcast_capability),
    ]
