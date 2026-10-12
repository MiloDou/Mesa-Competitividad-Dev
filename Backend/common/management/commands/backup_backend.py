import hashlib
import json
import os
import shutil
import sqlite3
import stat
import subprocess
import tempfile
import zipfile
from datetime import timezone as datetime_timezone
from pathlib import Path, PurePosixPath

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = "Crea una copia protegida de la base de datos y los archivos privados del backend."

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", required=True, help="Directorio privado para guardar la copia.")

    def handle(self, *args, **options):
        output_dir = Path(options["output_dir"]).expanduser().resolve()
        try:
            if not output_dir.exists():
                output_dir.mkdir(parents=True, mode=0o700)
            if not output_dir.is_dir():
                raise CommandError("La ruta de salida no es un directorio.")
        except OSError as exc:
            raise CommandError("No se pudo preparar el directorio privado de respaldos.") from exc

        created_at = timezone.now().astimezone(datetime_timezone.utc)
        stamp = created_at.strftime("%Y%m%dT%H%M%SZ")
        archive_path = output_dir / f"mesa-backup-{stamp}.zip"
        if archive_path.exists():
            raise CommandError("Ya existe una copia con esa marca de tiempo; vuelva a ejecutar en un segundo.")

        try:
            with tempfile.TemporaryDirectory(prefix=".mesa-backup-", dir=output_dir) as temp_dir:
                database_path = Path(temp_dir) / ("database.sqlite3" if connection.vendor == "sqlite" else "database.dump")
                self._backup_database(database_path)
                manifest = {
                    "created_at": created_at.isoformat(),
                    "database_engine": connection.vendor,
                    "database_file": database_path.name,
                    "database_sha256": None,
                    "media_root": str(settings.MEDIA_ROOT.name),
                    "media_files": [],
                }
                partial_path = archive_path.with_suffix(".zip.partial")
                try:
                    with zipfile.ZipFile(partial_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                        manifest["database_sha256"] = self._add_private_file(archive, database_path, database_path.name)
                        media_root = Path(settings.MEDIA_ROOT)
                        if media_root.exists():
                            for media_file in sorted(media_root.rglob("*")):
                                if not media_file.is_file() or media_file.is_symlink():
                                    continue
                                relative_path = PurePosixPath(media_file.relative_to(media_root).as_posix())
                                archive_name = f"media/{relative_path.as_posix()}"
                                digest = self._add_private_file(archive, media_file, archive_name)
                                manifest["media_files"].append({"path": relative_path.as_posix(), "sha256": digest})
                        manifest_bytes = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")
                        self._add_bytes(archive, manifest_bytes, "manifest.json")
                    os.chmod(partial_path, stat.S_IRUSR | stat.S_IWUSR)
                    os.replace(partial_path, archive_path)
                    os.chmod(archive_path, stat.S_IRUSR | stat.S_IWUSR)
                finally:
                    if partial_path.exists():
                        partial_path.unlink()
        except CommandError:
            raise
        except Exception as exc:
            raise CommandError("No se pudo completar el respaldo; revise el almacenamiento y la conexión de la base de datos.") from exc

        self.stdout.write(self.style.SUCCESS(f"Respaldo creado: {archive_path} ({len(manifest['media_files'])} archivos privados)."))

    def _backup_database(self, target_path):
        if connection.vendor == "sqlite":
            connection.ensure_connection()
            with sqlite3.connect(target_path) as destination:
                connection.connection.backup(destination)
            return
        if connection.vendor != "postgresql":
            raise CommandError(f"El motor {connection.vendor} no tiene un método de respaldo configurado.")
        pg_dump = os.getenv("PG_DUMP_PATH") or shutil.which("pg_dump")
        if not pg_dump:
            raise CommandError("Instale pg_dump compatible con la versión del servidor PostgreSQL para crear respaldos.")
        pg_restore = os.getenv("PG_RESTORE_PATH") or shutil.which("pg_restore")
        if not pg_restore:
            raise CommandError("Instale pg_restore compatible con el formato de pg_dump para validar el respaldo.")
        database = connection.settings_dict
        command = [pg_dump, "--format=custom", "--no-owner", "--file", str(target_path), "--dbname", database["NAME"]]
        if database.get("HOST"):
            command.extend(["--host", database["HOST"]])
        if database.get("PORT"):
            command.extend(["--port", str(database["PORT"])])
        if database.get("USER"):
            command.extend(["--username", database["USER"]])
        child_env = os.environ.copy()
        if database.get("PASSWORD"):
            child_env["PGPASSWORD"] = database["PASSWORD"]
        child_env["PGSSLMODE"] = database.get("OPTIONS", {}).get("sslmode", "prefer")
        if database.get("OPTIONS", {}).get("sslrootcert"):
            child_env["PGSSLROOTCERT"] = database["OPTIONS"]["sslrootcert"]
        result = subprocess.run(command, env=child_env, capture_output=True, text=True, check=False)
        if result.returncode != 0:
            raise CommandError("pg_dump no pudo exportar la base de datos; verifique versión, credenciales y conexión.")
        verification = subprocess.run(
            [pg_restore, "--list", str(target_path)],
            env=child_env,
            capture_output=True,
            text=True,
            check=False,
        )
        if verification.returncode != 0:
            raise CommandError("pg_restore no reconoce el formato del respaldo; configure herramientas compatibles entre sí.")

    def _add_private_file(self, archive, file_path, archive_name):
        digest = hashlib.sha256()
        info = zipfile.ZipInfo(archive_name)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (stat.S_IFREG | stat.S_IRUSR | stat.S_IWUSR) << 16
        with file_path.open("rb") as source, archive.open(info, "w") as target:
            while chunk := source.read(1024 * 1024):
                digest.update(chunk)
                target.write(chunk)
        return digest.hexdigest()

    def _add_bytes(self, archive, content, archive_name):
        info = zipfile.ZipInfo(archive_name)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (stat.S_IFREG | stat.S_IRUSR | stat.S_IWUSR) << 16
        archive.writestr(info, content)
