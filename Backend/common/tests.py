import hashlib
import json
import stat
import tempfile
import zipfile
from pathlib import Path
from types import SimpleNamespace
from unittest import skipUnless
from unittest.mock import patch

from django.core.management import call_command
from django.db import connection
from django.test import TransactionTestCase, override_settings


@skipUnless(connection.vendor == "sqlite", "La copia SQLite se prueba solo con SQLite.")
class BackendBackupTests(TransactionTestCase):
    def test_backup_contains_database_and_private_media_with_restricted_permissions(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            media_root = root / "private_uploads"
            (media_root / "content-assets").mkdir(parents=True)
            (media_root / "content-assets" / "synthetic.png").write_bytes(b"synthetic private media")
            backup_root = root / "backups"

            with override_settings(MEDIA_ROOT=media_root):
                call_command("backup_backend", output_dir=str(backup_root), verbosity=0)

            [archive_path] = backup_root.glob("mesa-backup-*.zip")
            self.assertEqual(stat.S_IMODE(archive_path.stat().st_mode), 0o600)
            with zipfile.ZipFile(archive_path) as archive:
                manifest = json.loads(archive.read("manifest.json"))
                self.assertEqual(manifest["database_engine"], "sqlite")
                database_backup = archive.read("database.sqlite3")
                self.assertTrue(database_backup.startswith(b"SQLite format 3"))
                self.assertEqual(manifest["database_sha256"], hashlib.sha256(database_backup).hexdigest())
                self.assertEqual(archive.read("media/content-assets/synthetic.png"), b"synthetic private media")
                self.assertEqual(manifest["media_files"][0]["path"], "content-assets/synthetic.png")


class PostgresBackupCommandTests(TransactionTestCase):
    def test_postgres_backup_uses_pg_dump_with_configured_tls_and_password(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            media_root = root / "private_uploads"
            output_dir = root / "backups"
            database_settings = {
                "NAME": "mesa_validation",
                "USER": "mesa_validator",
                "PASSWORD": "synthetic-database-password",
                "HOST": "127.0.0.1",
                "PORT": "5432",
                "OPTIONS": {"sslmode": "verify-full", "sslrootcert": "/etc/ssl/test-ca.pem"},
            }

            def fake_postgres_tool(command, **kwargs):
                if command[0] == "/usr/bin/pg_dump":
                    dump_path = Path(command[command.index("--file") + 1])
                    dump_path.write_bytes(b"synthetic PostgreSQL custom dump")
                return SimpleNamespace(returncode=0)

            with (
                override_settings(MEDIA_ROOT=media_root),
                patch.object(connection, "vendor", "postgresql"),
                patch.object(connection, "settings_dict", database_settings),
                patch("common.management.commands.backup_backend.shutil.which", side_effect={"pg_dump": "/usr/bin/pg_dump", "pg_restore": "/usr/bin/pg_restore"}.get),
                patch("common.management.commands.backup_backend.subprocess.run", side_effect=fake_postgres_tool) as run_postgres_tool,
            ):
                call_command("backup_backend", output_dir=str(output_dir), verbosity=0)

            [archive_path] = output_dir.glob("mesa-backup-*.zip")
            with zipfile.ZipFile(archive_path) as archive:
                manifest = json.loads(archive.read("manifest.json"))
                database_backup = archive.read("database.dump")
                self.assertEqual(manifest["database_engine"], "postgresql")
                self.assertEqual(manifest["database_sha256"], hashlib.sha256(database_backup).hexdigest())
                self.assertEqual(database_backup, b"synthetic PostgreSQL custom dump")

            command_kwargs = run_postgres_tool.call_args_list[0].kwargs
            self.assertEqual(command_kwargs["env"]["PGPASSWORD"], "synthetic-database-password")
            self.assertEqual(command_kwargs["env"]["PGSSLMODE"], "verify-full")
            self.assertEqual(command_kwargs["env"]["PGSSLROOTCERT"], "/etc/ssl/test-ca.pem")
            verification_command = run_postgres_tool.call_args_list[1].args[0]
            self.assertEqual(verification_command[1:2], ["--list"])
