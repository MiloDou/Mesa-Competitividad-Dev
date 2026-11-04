from django.db import migrations, models


def copy_linked_member_name(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    database = schema_editor.connection.alias
    for project in Project.objects.using(database).select_related("lead_member").iterator():
        member = project.lead_member
        if member:
            project.responsible_name = f"{member.first_name} {member.last_name}".strip()
            project.save(using=database, update_fields=["responsible_name"])


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0003_alter_document_confidentiality_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="responsible_name",
            field=models.CharField(blank=True, max_length=220),
        ),
        migrations.RunPython(copy_linked_member_name, migrations.RunPython.noop),
    ]
