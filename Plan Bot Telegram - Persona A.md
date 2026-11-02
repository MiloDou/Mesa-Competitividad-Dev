# Plan — Bot Telegram, Persona A (motor, vinculación, entrega y despliegue)

## Contexto
La guía `Bot Telegram.pdf` reparte el bot de avisos de Telegram, pensado para 30–50 integrantes. A German (Persona A) le toca el motor: persistencia, vinculación, cola de entrega, el procesador que activa Cloudflare y el despliegue. Persona B se encarga de los productores de eventos, las políticas de destinatarios y autorización, las plantillas y los recordatorios. El objetivo es que el motor reciba comandos y entregue trabajos de forma recuperable. Se prueba con componentes simulados, así que no hace falta esperar a B.

Decisiones ya tomadas:
- **Vinculación:** con `/start`, el bot genera un código de un solo uso. Un administrador lo aprueba por la API junto con la cuenta institucional y después el bot pide consentimiento.
- **Permiso de aprobación:** se reutiliza `users.manage`. No se tocan roles ni capabilities.
- **Rama:** `feature/bot-telegram`, que parte de develop en `afc69c8`.
- **Caducidad:** un aviso caduca 24 h después de su `run_after`, no del evento (respuesta 1.1 = A).
- **Timeout HTTP:** 5 s por envío (respuesta 1.2 = A).
- **Bot de pruebas:** sí existe (respuesta 1.3 = A). Su token va solo en `Backend/.env`.
- **Datos de producción (respuestas de Milo, 2026-11-01):** la API está en `https://mesa-competitividad-api.vercel.app` y el frontend en `https://mesa-competitividad-dev-pi.vercel.app`. El proyecto API **despliega `develop` a producción** y su build ejecuta `migrate` solo con `VERCEL_ENV=production`. Todavía no hay ninguna cuenta `commission` en producción; se crea con `createsuperuser`. Django no usa la Data API de Supabase.
- **`voting/access.py`:** Milo (responsable del backend) autorizó a German a extraer `visible_votings_for`.
- **RLS:** las tablas del bot tienen RLS activo en PostgreSQL (`0002_enable_rls`), sin `FORCE` ni políticas, para que la Data API de Supabase no exponga los `chat_id`.
- **Trabajo en la rama:** el bot se termina en `feature/bot-telegram`, que se mantiene al día con `develop`; se lleva a `develop` solo cuando esté completo.

## Estado (2026-11-02)
| Fase | Estado | Commit |
|---|---|---|
| A1 Modelos y contrato | Hecho | `932ab24` |
| A2 Webhook, vinculación y comandos | Hecho | `932ab24` |
| A3 Cola y entrega | Hecho | `d167bd7` |
| A4 Procesador, Worker y operación | Hecho | `ef286d8` |
| Sincronización con develop | Hecho | `348922e` (merge de `2226335`) |
| A5 Verificación real (Postgres y bot de pruebas) | Hecho el 2026-10-30, sin cambios de código | `25905a6` |
| Integración de la rama de B (B1–B4) | Hecho | `f024ed5` |
| Sincronización con develop (Brevo, favicon y splash) | Hecho | `0f1e816` |
| A6 Integración con B y validación de extremo a extremo | Hecho el 2026-11-02 | `029b46e`, `c9f16c3`, `71720a7`, `8925069`, `51bd3ec` |
| A7 Despliegue | Pendiente (ver A7) | — |

**Pruebas (2026-11-02):** `manage.py test telegram_notifications voting meetings accounts` da **137 OK** en SQLite y en Postgres 16. `makemigrations --check` no detecta cambios.

**Qué trajo develop (`afc69c8..2226335`):** la recuperación de contraseña por correo con Brevo (`accounts/email.py`, plantillas, `accounts/views.py`, pantalla `/reset-password` en Frontend), la agenda final del Summit en la landing y documentación de despliegue. No cambió modelos, migraciones, `settings.py`, `api/urls.py`, `meetings`, `voting` ni `directory`. El único conflicto estuvo en `Backend/VERCEL_ENV_VARIABLES.example`, porque ambos agregaban un bloque al final; se conservaron los dos. El motor no necesitó adaptarse.

**Verificación tras el merge:** `makemigrations --check` sin cambios; `manage.py test telegram_notifications accounts` da 45 OK (SQLite). En una copia temporal de este estado más `origin/feature/bot-telegram-events` (B1 y B3) se fusiona sin conflictos y `manage.py test telegram_notifications` da 80 OK.

**Lista de pruebas de A5 original:** ya está cubierta por las 41 pruebas escritas durante A1–A4 (`test_contracts`, `test_linking`, `test_webhook`, `test_delivery`, `test_process`). Por eso A5 se redefine abajo como integración y verificación real.

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

## Pruebas unitarias del motor (cubiertas en A1–A4)
Telegram siempre simulado; nunca contra el servicio real.
- **`test_contracts`:** `record_event` idempotente y solo para vínculos activos; `run_after`; `cancel_jobs`; un vínculo vigente por cuenta y por chat.
- **`test_linking`:** código inválido, vencido o reutilizado; cuenta o chat ya vinculados; usuario inactivo; aprobación sin `users.manage` (403); consentimiento sí/no; comandos repetidos; `/reanudar` sin consentimiento previo; listado y revocación.
- **`test_webhook`:** secreto ausente, incorrecto o sin configurar (403); `update_id` repetido; chat no privado; error interno → 200 y log.
- **`test_delivery`:** reserva doble; reserva vencida con y sin `send_started_at`; 429; 403; red y 5xx con espera progresiva; timeout de lectura → `uncertain`; política `None`, vínculo en pausa y evento viejo; hook ausente; presupuesto de tiempo.
- **`test_process`:** secreto del procesador; interruptor apagado; hooks ausentes; ciclo completo; error en recordatorios; comando de gestión; `status` con `users.manage`; `telegram_set_webhook`.

## A5. Verificación real del motor (hecho)
1. **Postgres (hecho el 2026-10-29 sobre `4afa223`):** Postgres 16 efímero (`podman run --rm … -p 127.0.0.1:55432:5432 docker.io/library/postgres:16`). `telegram_notifications accounts` da 45 OK, y `telegram_notifications` combinado con `origin/feature/bot-telegram-events` (`c2bb65b`) da 80 OK. Hay que exportar `DB_ENGINE=postgres` además de `DATABASE_URL`, porque `Backend/.env` fija `DB_ENGINE=sqlite` y sin esa variable las pruebas corren en SQLite.
2. **Prueba manual con el bot de pruebas** (requiere aprobación explícita en ese momento):
   - Token en `Backend/.env`; `TELEGRAM_ENABLED=true` solo en esa terminal; base SQLite local.
   - `runserver` y un túnel HTTPS temporal (por ejemplo `cloudflared tunnel --url http://localhost:8000`); `telegram_set_webhook <url-del-túnel>/api/v1/telegram/webhook/`.
   - Recorrer `/start` → aprobar con un usuario `commission` local → «Acepto» → `/estado`, `/pausar`, `/reanudar`, `/desvincular`.
   - Encolar un aviso sintético con `record_event` desde `manage.py shell` y entregarlo con `telegram_process`. Mientras B no esté integrado, se sustituye `authorize_and_render` en esa sesión de shell; no se agrega código al repositorio.
   - Al terminar: `deleteWebhook` del bot de pruebas y cerrar el túnel.
3. **Resultado:** anotar en `Backend/realizado.md` lo comprobado y lo que falló, sin tokens ni chat_id reales.

**Hecho el 2026-10-30** (detalle en `Backend/realizado.md` §5). El modo automático bloqueó el túnel público, así que se sustituyó por un relé local de `getUpdates` que entrega cada update a la vista real del webhook con la cabecera secreta (solo tráfico saliente; no se configuró webhook). Todo el flujo pasó. Quedan dos pendientes:
- Validar con un webhook real en el despliegue (A7).
- Mejora de UX: `_handle_callback` no llama a `answerCallbackQuery`, así que el botón «Acepto» se queda cargando y el usuario lo pulsa varias veces. El estado no se altera.

No hay cambios de código previstos en A5. Si aparece un fallo, se corrige con su prueba de regresión.

## A6. Integración con Persona B (hecho el 2026-11-02)
- **Rama de B integrada** (`f024ed5`): B1–B4 para reuniones y votaciones, con `occurrence_key` en UTC.
- **`answerCallbackQuery`** (`029b46e`): la vista del webhook responde el botón después de cerrar la transacción, así que «Acepto» ya no se queda cargando. Si Telegram falla, solo se registra.
- **`voting/access.py`** (`c9f16c3`): `visible_votings_for(user, queryset=None)` contiene la regla de `VotingViewSet.get_queryset`. La vista pasa su queryset base y conserva la anotación `member_has_voted`; `policies.py` ya no instancia el ViewSet. Las pruebas de `voting` siguen igual, y se agregaron pruebas de la regla y de paridad con la API.
- **RLS** (`71720a7`): `0002_enable_rls` hace `ENABLE ROW LEVEL SECURITY` en las 5 tablas del bot, solo en PostgreSQL y con reversa (`DISABLE`). Se verificó en Postgres 16 con un rol dueño sin superusuario: Django lee y escribe, `anon` ve 0 filas y la migración funciona hacia atrás y hacia adelante.
- **Validación de extremo a extremo** (`8925069`, `tests/test_end_to_end.py`): Telegram simulado, con todo lo demás real (webhook, aprobación por API, productores de B, recordatorios, políticas y `process_once`). Cubre los puntos 1–9 de la sección 9 de la guía:
  - vinculación de dos cuentas y recepción solo en el chat autorizado;
  - reprogramación y cancelación sin recordatorios viejos;
  - recordatorio de voto solo a quien no votó;
  - recuperación tras una interrupción, sin duplicados (y `uncertain` si el envío ya había empezado);
  - revocación antes del envío;
  - 50 personas atendidas en dos ciclos con 250 ms por envío;
  - caducidad de avisos viejos tras una restauración.
- **Pendiente de alcance de B según la guía (B2/B4):** no hay productores para proyectos, documentos, ni minutas y acuerdos, ni recordatorios de acuerdos o seguimientos. Ningún aviso lleva botones; la URL base del frontend ya se conoce. Hay que decidir si se implementan antes de llevar la rama a `develop` y quién lo hace.

## A7. Despliegue (cada paso con aprobación explícita)
Los pasos operativos detallados están en `Pendientes German - Bot Telegram.md` (secciones 3–9) y `Backend/telegram_notifications/README.md`. Ajustes tras revisar develop:
- **Migraciones (respuesta a 2.2):** no hay que aplicarlas a mano. Según `Docs/DESPLIEGUE_VERCEL.md`, el Build Command de Vercel ejecuta `python manage.py migrate --noinput` cuando `VERCEL_ENV=production`; `0001_initial` de `telegram_notifications` se aplica sola en el primer despliegue de producción que incluya la app. Solo crea tablas nuevas. El respaldo previo de la base sigue siendo recomendable.
- **Sin Preview de la API:** el proyecto API omite los builds de Preview, así que la única prueba previa real es la local de A5.2. Las variables `TELEGRAM_*` van solo en Production.
- **Orden (actualizado el 2026-11-02):**
  1. Las variables `TELEGRAM_*` ya están en Vercel, en Production. Los valores reales no están en ningún archivo del proyecto.
  2. Respaldo de Supabase **antes** de fusionar, porque `develop` es producción (`Encargo Supabase - Bot Telegram.md` §2).
  3. PR `feature/bot-telegram` → `develop`. El build migra solo (`0001`, `0002`).
  4. Comprobaciones:
     - `webhook/` sin cabecera → 403 y `process/` sin cabecera → 401;
     - en Supabase, RLS activo (`Encargo Supabase` §3).
  5. `telegram_set_webhook` desde una terminal local.
  6. Worker de Cloudflare: lo despliega un agente externo con `Encargo Cloudflare - Bot Telegram.md`, y German carga el secreto en el panel.
  7. Crear una cuenta `commission` en producción.
  8. Revisar `/status`.
  9. Encender `TELEGRAM_ENABLED=true` y hacer Redeploy.
- **Reversión:** `TELEGRAM_ENABLED=false` y Redeploy apagan los envíos sin perder datos.

## Pendiente o fuera de alcance
- Productores, políticas, plantillas y recordatorios corresponden a Persona B.
- La pantalla de aprobación en el Frontend no se incluye: la comisión de tecnología (rol `commission`) usa la API. Se agrega si la Mesa la pide.
- Crear el bot real, configurar secretos en Vercel y Cloudflare, publicar el Worker, hacer push y abrir PR: cada paso requiere aprobación explícita.
