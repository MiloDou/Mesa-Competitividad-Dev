from django.db import migrations


def grant_editor_publish(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Capability = apps.get_model("accounts", "Capability")
    database = schema_editor.connection.alias
    editor = Role.objects.using(database).filter(key="editor").first()
    publish = Capability.objects.using(database).filter(key="content.publish").first()
    if editor and publish:
        editor.capabilities.add(publish)


def revoke_editor_publish(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Capability = apps.get_model("accounts", "Capability")
    database = schema_editor.connection.alias
    editor = Role.objects.using(database).filter(key="editor").first()
    publish = Capability.objects.using(database).filter(key="content.publish").first()
    if editor and publish:
        editor.capabilities.remove(publish)


class Migration(migrations.Migration):
    dependencies = [("accounts", "0004_add_confidentiality_read_capability")]
    operations = [migrations.RunPython(grant_editor_publish, revoke_editor_publish)]
