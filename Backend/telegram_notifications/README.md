# Bot de avisos de Telegram

Envía avisos oficiales de la Mesa a cuentas vinculadas por chat privado. Los secretos solo van a Vercel, a Cloudflare o a un `Backend/.env` local; **nunca al repositorio**.

## Piezas
- `webhook/`: recibe los updates de Telegram (comandos y consentimiento).
- `process/`: un ciclo de trabajo. Lo llama cada minuto el Worker de `cloudflare/`.
- `status/`: diagnóstico para quien tenga `users.manage`.
- Hooks de Persona B: `policies.authorize_and_render(job)` y `reminders.generate_due(now)`. Mientras no existan, el bot responde comandos pero **no envía avisos**.

## Variables
| Variable | Uso |
|---|---|
| `TELEGRAM_ENABLED` | `true` activa el procesador. Con `false`, `process/` no hace nada. |
| `TELEGRAM_BOT_TOKEN` | Token de BotFather. |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram lo manda en cada llamada al webhook. |
| `TELEGRAM_PROCESS_SECRET` | El Worker lo manda como `Authorization: Bearer ...`. |
| `TELEGRAM_FRONTEND_URL` | Base https de la web; los avisos llevan un botón que la abre. Vacía o sin https: avisos sin botón. No es secreta. |

Para generar cada secreto: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`. Los dos secretos deben ser distintos entre sí.

## Puesta en marcha
1. **BotFather:** `/newbot`. Luego `/setjoingroups` → `Disable` y `/setcommands`: `start`, `estado`, `pausar`, `reanudar`, `desvincular`.
2. **Vercel** (solo en Production): las cinco variables, con `TELEGRAM_ENABLED=false`. Después, Redeploy. El build aplica las migraciones. `0002_enable_rls` activa RLS en las tablas del bot (solo PostgreSQL), sin `FORCE` ni políticas: Django, que es el dueño de las tablas, no se ve afectado, y la Data API de Supabase no ve ninguna fila. En Supabase, el Security Advisor marcará «RLS Enabled No Policy»; es intencional.
   - Comprobación: `curl -i -X POST https://<backend>/api/v1/telegram/webhook/` debe responder 403.
3. **Webhook**, desde tu máquina y con las variables solo en esa terminal:
   ```bash
   cd Backend
   export TELEGRAM_BOT_TOKEN='...' TELEGRAM_WEBHOOK_SECRET='...'
   .venv/bin/python manage.py telegram_set_webhook https://<backend>/api/v1/telegram/webhook/
   unset TELEGRAM_BOT_TOKEN TELEGRAM_WEBHOOK_SECRET
   ```
   El comando registra `secret_token` y `allowed_updates=["message","callback_query"]`.
4. **Worker** (en `cloudflare/`; revisa `PROCESS_URL` en `wrangler.toml`):
   ```bash
   npx wrangler login
   npx wrangler secret put TELEGRAM_PROCESS_SECRET
   npx wrangler deploy
   ```
   En los logs del Worker debe aparecer una ejecución por minuto con respuesta 200.
5. **Encendido:** `TELEGRAM_ENABLED=true` y Redeploy.

## Vincular una cuenta
1. La persona escribe `/start` al bot y recibe un código de 8 caracteres, válido 15 min.
2. Una cuenta con `users.manage` aprueba el código:
   ```bash
   API=https://<backend>/api/v1
   ACCESS=$(curl -s "$API/auth/login/" -H 'Content-Type: application/json' \
     -d '{"email":"<correo>","password":"<contraseña>"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["access"])')
   curl -s "$API/telegram/links/approve/" -H "Authorization: Bearer $ACCESS" \
     -H 'Content-Type: application/json' -d '{"code":"<CÓDIGO>","user":<id de la cuenta>}'
   ```
   Al terminar, cierra la sesión con `curl -s -X POST "$API/auth/logout/" -H "Authorization: Bearer $ACCESS"`. No guardes `$ACCESS` en ningún archivo.
3. La persona pulsa **Acepto** en Telegram. Con eso el vínculo queda `active`.

## Integrantes de Telegram (sin cuenta)
Para integrantes de la Mesa que no tienen cuenta en la plataforma. Se gestiona desde el panel administrativo, sección **Avisos por Telegram**, visible solo para Comisión (`users.manage`; Editor recibe 403).

1. La persona escribe `/start` al bot y le pasa el código a alguien de la Comisión.
2. La Comisión lo registra en **Registrar nuevo integrante de Telegram** con nombre y código.
3. La persona pulsa **Acepto** y queda `active`.

Qué recibe un integrante:
- **Avisos generales** (`integrantes.GENERAL_EVENT_TYPES`): reuniones nuevas, cambios, cancelaciones y recordatorios; votaciones programadas, abiertas y cerradas; cambios de proyectos; documentos; minutas aprobadas y estados de acuerdos. Llegan solos en cuanto el panel o la API generan esos eventos; no hay que configurar nada más.
- **Nunca** lo confidencial (`temporary_confidential` en el recurso, su proyecto o su reunión; se revisa otra vez justo antes de enviar) ni los avisos personales (invitación individual, asignaciones, recordatorio de voto, vencimientos).
- **Avisos manuales** de **Enviar aviso a los integrantes**: llegan a todo chat activo, también a cuentas vinculadas, con el título «Aviso de la Mesa de Competitividad». Quedan en la auditoría (`telegram.announcement`).

**Eliminar** revoca el vínculo, cancela lo pendiente, desactiva al integrante y le avisa por Telegram. Para volver a darlo de alta se registra de nuevo con un código nuevo.

Por dentro cada integrante es un usuario interno que no puede iniciar sesión: correo `integrante-<hex>@integrantes.telegram.invalid`, sin contraseña y con rol `reader`. Aparece en `GET /users/`, pero el panel no muestra esa lista. No guardes nombres reales en capturas, logs ni en el repositorio.

## Diagnóstico
- `GET /api/v1/telegram/status/` muestra: el interruptor, los hooks instalados, los conteos por estado y los últimos trabajos `uncertain` o `failed`.
- `uncertain` significa que no se sabe si Telegram entregó el mensaje. Esos trabajos **no se reintentan solos**, para no duplicar avisos.
- Prueba local sin Worker: `.venv/bin/python manage.py telegram_process` ejecuta el mismo ciclo. Con `TELEGRAM_ENABLED=true` y un token real, **envía de verdad**: úsalo solo con el bot de pruebas.
- Apagado de emergencia: `TELEGRAM_ENABLED=false` y Redeploy. Corta todos los envíos sin perder datos.

## Respaldo y restauración
Al restaurar una copia, la cola puede contener avisos viejos que no deben salir.
1. Pon `TELEGRAM_ENABLED=false` **antes** de restaurar y haz Redeploy.
2. Restaura la base.
3. Revisa `status/`. Cancela los pendientes que no deban salir, por ejemplo desde `manage.py shell`:
   ```python
   from telegram_notifications.models import DeliveryJob
   DeliveryJob.objects.filter(status__in=["pending", "sending"]).update(status="cancelled", cancel_reason="Restauración", lock_token=None)
   ```
   Si no los cancelas, los que tengan más de 24 h desde su hora programada caducarán solos al procesarse.
4. Reactiva con `TELEGRAM_ENABLED=true`.
