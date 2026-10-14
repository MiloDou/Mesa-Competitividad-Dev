# Backend / API

API REST para la administración de la Mesa, el sitio público y la aplicación móvil. La implementación es un monolito modular en Django 5.2 y Django REST Framework; cada dominio tiene modelos, validaciones y rutas separados. El [sitio React](../Frontend/README.md) consume parte de las rutas públicas, autenticación y proyectos. Expo consume autenticación, reuniones, proyectos autorizados, votaciones, bandeja de avisos y metadatos de documentos. Otros flujos administrativos y de publicación siguen siendo demostrativos; consulta [Docs/ESTADO_INTEGRACION.md](../Docs/ESTADO_INTEGRACION.md) para el detalle.

## Requisitos y componentes

- Python 3.12 o compatible con Django 5.2.
- SQLite para desarrollo local.
- PostgreSQL 16 para un entorno compartido o de producción.
- Django REST Framework, drf-spectacular, django-cors-headers, psycopg, django-storages/boto3, ReportLab y requests; las versiones exactas están fijadas en `requirements.txt`.

| Módulo | Responsabilidad |
| --- | --- |
| `accounts` | Usuario por correo, roles/capacidades, cargos, autenticación revocable y restablecimiento de contraseña. |
| `directory` | Instituciones, comisiones, miembros, consentimiento de publicación e historial de representación. |
| `projects` | Proyectos, clasificación de confidencialidad, historial, seguimiento y archivos privados. |
| `meetings` | Reuniones, agenda, asistencia, minutas inmutables al aprobarse, acuerdos y PDF. |
| `voting` | Programación, apertura/cierre, un voto por miembro y conteos visibles después del cierre. |
| `portal` | Perfil institucional del CMS, texto y medios, publicaciones, eventos/inscripciones y solicitudes de contacto. |
| `notifications` | Bandeja de avisos, tokens Expo, cola de envío y avisos por convocatoria/votación. |
| `audit` | Bitácora append-only para acciones operativas sensibles. |

## Preparación local

Desde la raíz del repositorio, en Linux/macOS:

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_roles
python manage.py createsuperuser
python manage.py runserver
```

En PowerShell, cambia la activación por `.venv\Scripts\Activate.ps1`. El archivo `.env.example` configura SQLite, correo ficticio y notificaciones push desactivadas. No uses sus valores de desarrollo en un despliegue real. La migración inicial crea los cuatro roles; `seed_roles` los vuelve a sincronizar de forma segura.

Android Emulator llega al equipo anfitrión mediante `10.0.2.2`; ese host ya está permitido en la plantilla local. Para usar un teléfono físico, agrega la IP LAN del equipo a `DJANGO_ALLOWED_HOSTS` en `Backend/.env` e inicia con `python manage.py runserver 0.0.0.0:8000`. Permite ese puerto solo en la red local de desarrollo; no uses el servidor Django de desarrollo en producción.

- API: `http://127.0.0.1:8000/api/v1/`
- OpenAPI JSON/YAML: `http://127.0.0.1:8000/api/schema/`
- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- Estado y conexión a base de datos: `http://127.0.0.1:8000/api/health/`
- Contrato en español: [`../Docs/API_BACKEND.md`](../Docs/API_BACKEND.md)

Las rutas requieren `Authorization: Bearer <access>` salvo las rutas públicas, inicio/restablecimiento de sesión, documentación y health. El access token vence en 20 minutos; el refresh token se rota al usarlo, vence en 30 días y ambos se persisten solo como hashes. Cerrar sesión revoca esa sesión y desactiva los tokens push asociados a sus dispositivos. Solo Comisión puede asignar o consultar Confidencial Temporal; Público y Uso Interno son los niveles predeterminados para proyectos y documentos.

## PostgreSQL local

Con Docker Compose disponible, crea `Backend/.env` desde el ejemplo, define una contraseña local y cambia `DB_ENGINE=postgres`. Desde `Backend/`:

```bash
docker compose up -d postgres
python manage.py migrate
python manage.py runserver
```

Compose enlaza PostgreSQL solo a `127.0.0.1:5432` y conserva los datos en un volumen local. Para apagarlo: `docker compose down`; para borrar el volumen local junto con sus datos: `docker compose down -v`.

## Despliegue gratuito en Vercel y Supabase

La guía de configuración está en [`Docs/DESPLIEGUE_VERCEL.md`](../Docs/DESPLIEGUE_VERCEL.md). En Vercel, el proyecto API usa `Backend/` como raíz; Supabase Free provee PostgreSQL y un bucket privado de Storage. En producción el backend exige ambos servicios y nunca usa el filesystem temporal de las funciones para los archivos cargados. La cuenta gratuita de Supabase pausa proyectos tras una semana sin actividad, tiene 500 MB de base y 1 GB de archivos; Vercel Hobby es solo para uso personal/no comercial y tiene cuotas mensuales.

## Pruebas y tareas periódicas

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
python manage.py spectacular --validate --file /tmp/mesa-openapi.yaml
```

En desarrollo, SQLite basta para estas pruebas. `select_for_update`, la restricción de un voto y el límite de capacidad de eventos están diseñados para PostgreSQL; conviene repetir la suite contra PostgreSQL antes de desplegar.

Ejecuta estos comandos periódicamente (por ejemplo, cada minuto en un scheduler del entorno):

```bash
python manage.py process_votings
python manage.py deliver_push
```

El primero activa votaciones programadas y cierra las vencidas. El segundo entrega la cola a Expo si `EXPO_PUSH_ENABLED=true`; si está desactivado, termina indicando que falta configuración. Los tokens de dispositivo se registran por cuenta en `POST /api/v1/devices/`. La app también puede consultar su bandeja con `GET /api/v1/notifications/`.

El comando de respaldo se puede programar diariamente en un directorio privado fuera del repositorio:

```bash
python manage.py backup_backend --output-dir /ruta/privada/backups
```

Genera un ZIP con la base de datos y `private_uploads/`, un manifiesto SHA-256 y permisos de archivo `0600`. Para SQLite usa la copia consistente de SQLite; para PostgreSQL requiere `pg_dump` que pueda conectarse al servidor y `pg_restore` que reconozca su formato. Antes de guardar el ZIP, valida el catálogo con `pg_restore --list`. Configura `PG_DUMP_PATH` y `PG_RESTORE_PATH` si el `PATH` del sistema elige utilidades incompatibles; la suite prueba SQLite y el uso de PostgreSQL con `pg_dump` está verificado en una instancia local. Para ejecutarlo a diario a las 02:17 con cron, agrega una entrada como esta y sustituye las rutas:

```cron
17 2 * * * /ruta/al/Backend/.venv/bin/python /ruta/al/Backend/manage.py backup_backend --output-dir /var/backups/mesa
```

Configura además la retención, cifrado en reposo y una copia fuera del equipo. Un respaldo no se considera recuperable hasta ensayar su restauración en un entorno aislado.

Para validar una restauración, extrae el ZIP en un directorio temporal. Restaura `database.sqlite3` sobre una copia local detenida, o usa la versión compatible de `pg_restore` con `pg_restore --no-owner --dbname=<base-vacía> database.dump` para PostgreSQL. Copia el contenido de `media/` a `Backend/private_uploads/`, arranca la versión correspondiente del backend y verifica `/api/health/` y los archivos. Conserva intacto el original hasta comprobar el resultado.

## Correo, archivos y seguridad

- Contacto y restablecimiento de contraseña guardan sus solicitudes. El correo no sale con la configuración local ficticia; configura `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, servidor SMTP, remitente, `CONTACT_NOTIFICATION_EMAIL` y `PASSWORD_RESET_URL` para usarlo.
- Las notificaciones push están en cola y desactivadas hasta configurar el proveedor. Los tokens y solicitudes reales no deben escribirse en fixtures, logs o documentación.
- Los documentos aceptan PDF, DOC/DOCX, XLS/XLSX, PNG y JPEG hasta 20 MB; las imágenes del CMS aceptan PNG/JPEG hasta 5 MB, se reorientan y redimensionan a un máximo de 1920 px y se optimizan con Pillow. Se valida extensión/firma y estructura OpenXML para Office; se guardan bajo `private_uploads/`. Solo Comisión puede asignar y consultar el nivel Confidencial Temporal. Los medios del CMS solo se sirven públicamente cuando están asociados a contenido publicado o al perfil institucional. En producción configura almacenamiento privado y respaldos durables.
- Usa HTTPS, una clave Django aleatoria, `DEBUG=false`, `DJANGO_ALLOWED_HOSTS` y PostgreSQL con `DB_SSLMODE=require` como mínimo en producción. Para validar el certificado del servidor usa `verify-full` y `DB_SSLROOTCERT` cuando la autoridad no esté instalada en el sistema. El proceso de este repositorio no configura despliegue, SMTP, almacenamiento de objetos ni escaneo antimalware; disponibilidad 99.5% y tiempos de respuesta deben medirse en la infraestructura real.

## Decisiones que siguen pendientes

El backend deja como decisiones de la Mesa el quórum, la regla de aprobación, el desempate y cualquier conclusión derivada de los votos. Solo calcula conteos exactos al cerrar. Los permisos de varios roles se acumulan por capacidad como comportamiento técnico provisional; la política institucional sobre combinaciones debe validarse antes de producción. La autorización individual de publicación de datos de contacto se conserva en el directorio.
