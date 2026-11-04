"""Activa RLS en las tablas del bot (solo PostgreSQL / Supabase).

Sin políticas, la Data API de Supabase (roles anon y authenticated) no ve ninguna fila, por
ejemplo los chat_id. Sin FORCE, el dueño de las tablas (el rol con el que Django migra y
consulta) no se ve afectado. En SQLite no hace nada.
"""
from django.db import migrations

MODELS = ["TelegramLink", "LinkTicket", "NotificationEvent", "DeliveryJob", "ProcessedUpdate"]


def set_row_level_security(action):
    def run(apps, schema_editor):
        if schema_editor.connection.vendor != "postgresql":
            return
        for name in MODELS:
            table = schema_editor.quote_name(apps.get_model("telegram_notifications", name)._meta.db_table)
            schema_editor.execute(f"ALTER TABLE IF EXISTS {table} {action} ROW LEVEL SECURITY")

    return run


class Migration(migrations.Migration):
    dependencies = [("telegram_notifications", "0001_initial")]

    operations = [migrations.RunPython(set_row_level_security("ENABLE"), set_row_level_security("DISABLE"))]
