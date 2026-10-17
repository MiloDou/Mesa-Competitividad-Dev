from django.db import migrations, models


def initialize_progress_from_status(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Project.objects.using(schema_editor.connection.alias).filter(status="completed").update(progress=100)


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0004_project_responsible_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="progress",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.RunPython(initialize_progress_from_status, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.CheckConstraint(
                condition=models.Q(progress__gte=0, progress__lte=100),
                name="project_progress_between_0_100",
            ),
        ),
    ]
