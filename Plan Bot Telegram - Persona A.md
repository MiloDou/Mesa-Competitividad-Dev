# Plan — Bot Telegram, Persona A (motor, vinculación, entrega y despliegue)

## Contexto
La guía `Bot Telegram.pdf` reparte el bot de avisos de Telegram, pensado para 30–50 integrantes. A German (Persona A) le toca el motor: persistencia, vinculación, cola de entrega, el procesador que activa Cloudflare y el despliegue. Persona B se encarga de los productores de eventos, las políticas de destinatarios y autorización, las plantillas y los recordatorios. El objetivo es que el motor reciba comandos y entregue trabajos de forma recuperable. Se prueba con componentes simulados, así que no hace falta esperar a B.

Decisiones ya tomadas:
- **Vinculación:** con `/start`, el bot genera un código de un solo uso. Un administrador lo aprueba por la API junto con la cuenta institucional y después el bot pide consentimiento.
- **Permiso de aprobación:** se reutiliza `users.manage`. No se tocan roles ni capabilities.
- **Rama:** `feature/bot-telegram`, que parte de develop en `afc69c8`.

## Paso 0 (tras aprobar)
Copiar este plan a `/home/Gerlo/Proyectos/Mesa-Competitividad-Dev/Plan Bot Telegram - Persona A.md`, junto al PDF, y **detenerme para que German lo revise**. No implemento nada hasta su confirmación. No se hace commit de ese archivo salvo que German lo pida.

## Lo que se reutiliza del código existente
- **Patrón de cola:** `notifications/services.py` (outbox) y `notifications/management/commands/deliver_push.py`. Se toma el patrón pero se corrige una carencia: hoy no reserva filas, así que dos ejecuciones simultáneas pueden enviar duplicados.
- **Cliente HTTP:** `requests`, que ya es dependencia (`Backend/requirements.txt`). No se agrega ninguna dependencia nueva.
- **Permisos:** `common/permissions.py` (`HasCapability` con `action_capabilities`) y `User.has_capability` (`accounts/models.py:82`).
- **Auditoría:** `common/audit.py:record_event` para registrar aprobaciones y revocaciones.
- **Tokens:** se guarda el código como digest SHA-256 y se compara con `hmac.compare_digest`, igual que `accounts/authentication.py`.
- **Pruebas:** el estilo de `notifications/tests.py` (`TestCase`, `call_command("seed_roles")`, `APIClient.force_authenticate`, `patch` de `requests.post`).

## Archivos (todos de Persona A, salvo los compartidos señalados)
Módulo nuevo `Backend/telegram_notifications/`:

| Archivo | Contenido |
|---|---|
| `apps.py`, `__init__.py` | App Django |
| `models.py` + `migrations/0001_initial.py` | Modelos (abajo). No importa nada de B. |
| `contracts.py` | Contrato con B: `record_event`, `cancel_jobs`, `Message` y la resolución de los hooks de B |
| `client.py` | Cliente Telegram: `send_message` y `set_webhook`, con errores tipados |
| `linking.py` | Tickets, aprobación, consentimiento y comandos |
| `delivery.py` | Reserva, recuperación, entrega, limpieza y `process_once()` |
| `views.py`, `urls.py` | Webhook, procesador y endpoints administrativos |
| `management/commands/telegram_process.py` | Ejecución manual o de respaldo de `process_once()` |
| `management/commands/telegram_set_webhook.py` | Registra el webhook con su secreto |
| `cloudflare/worker.js`, `cloudflare/wrangler.toml` | Worker con cron que llama al procesador |
| `tests/test_linking.py`, `tests/test_webhook.py`, `tests/test_delivery.py`, `tests/test_process.py` | Pruebas de A. B agrega las suyas en el mismo paquete `tests/`. |
| `README.md` | Guía de configuración, despliegue, diagnóstico, respaldo y recuperación |

**Archivos compartidos** (ediciones mínimas, que aprueban junto con este plan):
- `Backend/config/settings.py`: agregar `"telegram_notifications"` a `INSTALLED_APPS` y leer `TELEGRAM_ENABLED` (por defecto `false`), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` y `TELEGRAM_PROCESS_SECRET`.
- `Backend/api/urls.py`: una línea, `path("telegram/", include("telegram_notifications.urls"))`.
- `Backend/VERCEL_ENV_VARIABLES.example`: las 4 variables con valores ficticios.
- `Docs/API_BACKEND.md`: una sección breve con las rutas nuevas.

**No toco:** módulos de negocio, roles, capabilities, el Frontend, Mobile ni los archivos de B (`policies.py`, `templates.py`, `reminders.py`, `producers.py`).

## A1. Modelos
- **`TelegramLink`**: `user` (FK), `chat_id` (BigInteger), `status` (`pending_consent`/`active`/`paused`/`revoked`/`blocked`), `approved_by`, `consent_at`, `revoked_at` y marcas de tiempo.
  - Dos `UniqueConstraint` parciales: una por `user` y otra por `chat_id`, cuando el estado es `pending_consent`, `active` o `paused`. Así cada cuenta tiene como máximo un chat vigente y viceversa, y se conserva el historial.
- **`LinkTicket`**: `code_digest` (único), `chat_id`, `telegram_name` (para que el admin identifique a la persona), `expires_at` (15 min), `used_at` y `created_at`.
- **`NotificationEvent`**: `event_type`, `resource_type`, `resource_id`, `occurrence_key`, `data` (JSON) y `created_at`.
  - Restricción única sobre (`event_type`, `resource_type`, `resource_id`, `occurrence_key`) para que el registro sea idempotente.
- **`DeliveryJob`**: `event` (FK), `user` (FK), `status` (`pending`/`sending`/`sent`/`cancelled`/`failed`/`uncertain`), `attempts`, `run_after`, `locked_until`, `lock_token`, `send_started_at`, `sent_at`, `telegram_message_id`, `last_error`, `cancel_reason` y marcas de tiempo.
  - Restricción única sobre (`event`, `user`).
  - Índice sobre (`status`, `run_after`).
- **`ProcessedUpdate`**: `update_id` (único) y `created_at`. Sirve para reconocer actualizaciones repetidas de Telegram. La guía no lo nombra, pero es la forma más simple de cubrir ese requisito.

## Contrato con Persona B (`contracts.py`)
Este es el borrador que se fija con B en el punto de inicio:
```python
record_event(event_type, resource_type, resource_id, occurrence_key, recipients, data=None, run_after=None) -> NotificationEvent
#   recipients: iterable de User o de ids. Crea trabajos solo para quien tenga un vínculo activo. Es idempotente.
#   Debe llamarse dentro de la transacción de negocio de B. No hace llamadas de red.
cancel_jobs(resource_type, resource_id, event_types=None, reason="") -> int
#   Invalida trabajos pendientes, por ejemplo al reprogramar o cancelar.
@dataclass Message: text: str; buttons: list[tuple[str, str]] = []   # (etiqueta, URL autorizada)
# Hooks que implementa B, resueltos con import diferido:
policies.authorize_and_render(job) -> Message | None   # None = cancelar la entrega
reminders.generate_due(now) -> int                     # crea eventos vencidos usando record_event
```
Si el módulo de B todavía no existe, el procesador **no envía nada**: los trabajos quedan pendientes y el diagnóstico lo indica. Es fallo cerrado. En las pruebas, los hooks se sustituyen con `patch`.

## A2. Webhook, vinculación y comandos
- **Webhook:** `POST /api/v1/telegram/webhook/`, con `AllowAny` y sin autenticación de usuario. Valida la cabecera `X-Telegram-Bot-Api-Secret-Token` con `compare_digest`; si no coincide, responde 403.
  - Si `update_id` ya está en `ProcessedUpdate`, responde 200 sin hacer nada.
  - Solo atiende chats privados. Ante un error interno igual responde 200, para que Telegram no reintente en bucle, y lo registra en el log.
- **`/start`:** si el chat ya tiene un vínculo, responde con su estado. Si no, genera un código aleatorio de 8 caracteres (`secrets`) que sustituye a cualquier ticket vigente de ese chat, guarda su digest y responde: «entrega este código al administrador; vence en 15 min».
- **Aprobación:** `POST /api/v1/telegram/links/approve/` con `{code, user}` y permiso `users.manage`.
  - Rechaza el código inexistente, vencido o ya usado, el usuario inactivo y la cuenta o el chat que ya tengan un vínculo vigente.
  - En una sola transacción crea el vínculo en `pending_consent`, marca el ticket como usado y registra la auditoría.
  - Después envía el mensaje de consentimiento con los botones «Acepto» / «No acepto».
- **Consentimiento:** el `callback_query` `consent:yes` deja el vínculo en `active` con `consent_at`; `consent:no` lo deja en `revoked`.
- **Comandos:** `/estado`, `/pausar` (→ `paused`), `/reanudar` (→ `active`, solo si había consentimiento) y `/desvincular` (→ `revoked` y cancela los trabajos pendientes). Todos son idempotentes: repetir un comando no falla ni duplica nada.
- **Administración:** `GET /api/v1/telegram/links/` y `POST /api/v1/telegram/links/{id}/revoke/`, con `users.manage`.

## A3. Cola y entrega (`delivery.py`)
1. **Recuperar** los trabajos en `sending` cuya reserva venció.
   - Sin `send_started_at`, vuelven a `pending`.
   - Con `send_started_at`, pasan a `uncertain`. Nunca se reenvía a ciegas.
2. **Reservar** hasta N trabajos (`pending`, `run_after <= now`) con un UPDATE condicional por fila: `filter(id=…, status=pending).update(status=sending, lock_token, locked_until)`. Funciona igual en SQLite y Postgres y es seguro con ejecuciones concurrentes.
3. Por cada trabajo reservado:
   - Comprobar el vínculo. Si no está activo, se cancela.
   - Si el evento tiene más de 24 h, se cancela como «expirado». Esto evita envíos tras restaurar un respaldo.
   - Llamar a `authorize_and_render`. Si devuelve `None`, se cancela.
   - Marcar `send_started_at` y enviar.
4. **Clasificar el resultado:**
   - OK → `sent`, guardando `message_id`.
   - 429 → reprogramar según `retry_after` y **cortar el lote**.
   - 403 bloqueado o chat inexistente → vínculo `blocked` y trabajo cancelado.
   - Error de conexión antes de enviar o 5xx → reintento con espera progresiva (1, 2, 4… min; tras 6 intentos, `failed`).
   - Timeout de lectura o corte después de enviar → `uncertain`.
5. **Límites:** tamaño de lote (40) y tiempo máximo por ejecución (8 s, para no rebasar el límite de la función serverless). Ambos son constantes ajustables.

## A4. Procesador, Worker y operación
- **Procesador:** `POST /api/v1/telegram/process/` con `Authorization: Bearer <TELEGRAM_PROCESS_SECRET>` comparado con `compare_digest`. Sin el secreto correcto responde 401/403.
  - Si `TELEGRAM_ENABLED=false`, responde `{"enabled": false}` y no hace nada.
  - Si está activo ejecuta, en orden: `reminders.generate_due` de B, recuperación, entrega y limpieza (`ProcessedUpdate` de más de 7 días, tickets vencidos de más de 1 día). Devuelve los conteos.
- **Diagnóstico:** `GET /api/v1/telegram/status/` con `users.manage`. Muestra el interruptor, los hooks de B instalados, los conteos por estado y los trabajos `uncertain` o `failed` recientes.
- **Comandos de gestión:** `telegram_process` (la misma `process_once`) y `telegram_set_webhook` (`setWebhook` con `secret_token` y `allowed_updates=["message","callback_query"]`).
- **Worker Cloudflare:** un `scheduled()` con cron cada minuto (plan gratuito) que hace POST al procesador con el secreto, guardado como *secret* del Worker. Unas 15 líneas más `wrangler.toml`.
- **README del módulo:** variables, alta del bot en BotFather, registro del webhook, despliegue del Worker, diagnóstico y el procedimiento de respaldo y restauración. Ese procedimiento consiste en restaurar con `TELEGRAM_ENABLED=false`, revisar `/status`, cancelar o expirar los pendientes y solo entonces reactivar el canal.

## A5. Pruebas (unitarias, con Telegram simulado; nunca contra el servicio real)
- **`test_linking`:** código inválido, vencido o reutilizado; cuenta o chat ya vinculados; aprobación sin `users.manage` (403); consentimiento sí/no; `/pausar`, `/reanudar` y `/desvincular` repetidos.
- **`test_webhook`:** secreto ausente o incorrecto (403); `update_id` repetido procesado una sola vez; chat no privado ignorado.
- **`test_delivery`:**
  - Una reserva doble no entrega dos veces.
  - Una reserva vencida, con y sin `send_started_at`, termina en `pending` o `uncertain` según corresponda.
  - Un 429 reprograma y corta el lote; un 403 bloquea el vínculo.
  - Un error de red produce reintento con espera; un timeout de lectura produce `uncertain`.
  - Un hook que devuelve `None` cancela; un vínculo en pausa cancela; un evento viejo expira.
  - `record_event` es idempotente.
- **`test_process`:** sin token o con token incorrecto (401/403); interruptor apagado sin envíos; hooks de B ausentes sin envíos.

## Verificación
- `cd Backend && python manage.py makemigrations --check --dry-run`, tras generar `0001_initial`.
- `python manage.py test telegram_notifications`. Solo se ejecuta este paquete, como pide AGENTS.md.
- Repetir esas pruebas contra Postgres (`compose.yaml`) por las restricciones parciales y las reservas.
- Opcional y solo con aprobación: una prueba manual con un bot de pruebas creado por German (token en `.env` local, nunca en el repo), usando `telegram_process` y el webhook mediante un túnel.

## Pendiente o fuera de alcance
- Productores, políticas, plantillas y recordatorios corresponden a Persona B. La prueba integral (sección 9 de la guía) se hace en conjunto.
- La pantalla de aprobación en el Frontend no se incluye: el admin usa la API. Se agrega si la Mesa la pide.
- Antes del primer despliegue hay que crear el bot real, configurar los secretos en Vercel y en Cloudflare y publicar el Worker. Cada uno de esos pasos requiere aprobación explícita.
