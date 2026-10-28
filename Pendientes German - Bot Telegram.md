# Bot de Telegram: lo que German tiene que hacer

Este archivo reúne todo lo que necesito de ti para cerrar A4 y A5 y poner el bot en producción. Ningún paso requiere pasarme secretos: el token y las claves solo van a Vercel, a Cloudflare o a tu `.env` local, **nunca al chat, al repositorio ni a este archivo**.

Llena las respuestas de las secciones 1 y 2 en este mismo archivo (donde dice `Respuesta:`) y avísame. Las secciones 3 a 8 son pasos de despliegue: las haces cuando yo termine A4 y tú hayas hecho push. Ahí te indico cuándo empezar.

---

## 1. Decisiones (las necesito antes de empezar A4)

**1.1 ¿Cuándo caduca un aviso?**
Hoy, un aviso que no se pudo entregar caduca 24 h después de la hora en que debía enviarse (`run_after`). El plan decía medirlo desde el evento, pero con ese criterio un recordatorio programado con días de antelación caducaría antes de enviarse.
- A) Mantener: 24 h desde la hora programada. **(Recomendado)**
- B) Medirlo desde el evento, como en el plan.

Respuesta:

**1.2 ¿Cuánto espera el bot a que Telegram responda?**
Cada envío espera a Telegram hasta 10 s. El procesador corta un lote a los 8 s, pero un envío que ya empezó puede alargarlo hasta unos 18 s. La duración máxima de una función en Vercel depende de tu plan y de `maxDuration`.
- A) Bajar la espera de cada envío a 5 s, para que el lote no pase de unos 13 s. **(Recomendado)**
- B) Dejarla en 10 s.

Respuesta:

**1.3 ¿Hay un bot de pruebas?**
Puedo hacer una prueba manual opcional con un bot de pruebas tuyo (no el real), con su token en `Backend/.env`, que no se sube al repositorio. Solo la haría con tu aprobación explícita en ese momento.
- A) Sí, crearé un bot de pruebas (paso 3.2).
- B) No, basta con las pruebas automáticas con Telegram simulado.

Respuesta:

---

## 2. Datos del proyecto (no son secretos)

**2.1 URL pública del backend en Vercel** (por ejemplo `https://algo.vercel.app`; sin token):

Respuesta:

**2.2 ¿Cómo se aplican hoy las migraciones en la base de producción?** (comando local con `DATABASE_URL` de producción, paso de build en Vercel, lo hace otra persona…):

Respuesta:

**2.3 ¿Quién en producción tiene el rol `commission`?** Solo ese rol puede aprobar vínculos. Basta con confirmar que tú lo tienes o que sabes quién lo tiene; no hace falta poner correos.

Respuesta:

**2.4 Coordinación con Persona B.** El motor ya busca `telegram_notifications/policies.py` (`authorize_and_render`) y `reminders.py` (`generate_due`). Mientras B no los entregue, el bot responde comandos pero **no envía ningún aviso**: falla cerrado, a propósito. Pregúntale a B en qué estado van y para cuándo los espera.

Respuesta:

---

## 3. Crear el bot en BotFather (puedes hacerlo ya)

### 3.1 Bot real
1. En Telegram abre **@BotFather** (con la palomita azul de verificación).
2. Envía `/newbot`.
   - **Nombre visible:** por ejemplo `Avisos Mesa de Competitividad Xela`.
   - **Usuario:** tiene que terminar en `bot`, por ejemplo `MesaCompetitividadXelaBot`.
3. BotFather responde con un **token** de la forma `123456789:AA...`. Guárdalo en tu gestor de contraseñas. **No lo pegues en el chat conmigo ni en ningún archivo del repositorio.**
4. Configúralo con estos comandos de BotFather:
   - `/setjoingroups` → elige el bot → `Disable`. El bot solo funciona en chats privados.
   - `/setcommands` → elige el bot → pega:
     ```
     start - Vincular o ver estado
     estado - Ver si los avisos están activos
     pausar - Pausar avisos
     reanudar - Reanudar avisos
     desvincular - Dejar de recibir avisos
     ```
   - `/setdescription` → por ejemplo: `Avisos oficiales de la Mesa de Competitividad de Quetzaltenango. Escribe /start para vincular tu cuenta.`
   - Opcional: `/setuserpic` con el logo.
5. Si el token llega a filtrarse: en BotFather, `/revoke`, y actualizas la variable en Vercel.

### 3.2 Bot de pruebas (solo si respondiste A en 1.3)
1. Repite `/newbot` con otro usuario, por ejemplo `MesaXelaPruebasBot`.
2. En `Backend/.env` (ya está ignorado por git) agrega:
   ```
   TELEGRAM_BOT_TOKEN=<token del bot de pruebas>
   ```
3. Avísame que está listo, sin pasarme el token.

---

## 4. Generar los dos secretos (puedes hacerlo ya)

En una terminal, ejecuta **dos veces** (una por secreto):
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```
- El primer valor es `TELEGRAM_WEBHOOK_SECRET`: Telegram lo manda en cada llamada al webhook. Este formato usa solo los caracteres que Telegram acepta.
- El segundo es `TELEGRAM_PROCESS_SECRET`: el Worker de Cloudflare lo usa para llamar al procesador.

Guárdalos en el gestor de contraseñas junto al token. Deben ser **distintos entre sí**.

---

## 5. Variables en Vercel (después de que A4 esté en la rama desplegada)

En Vercel → proyecto del **backend** → Settings → Environment Variables, entorno **Production**:

| Variable | Valor |
|---|---|
| `TELEGRAM_ENABLED` | `false` (todavía apagado) |
| `TELEGRAM_BOT_TOKEN` | token del bot real |
| `TELEGRAM_WEBHOOK_SECRET` | primer secreto del paso 4 |
| `TELEGRAM_PROCESS_SECRET` | segundo secreto del paso 4 |

- Márcalas como *Sensitive* si tu plan lo permite.
- No las pongas en Preview, para que las ramas de prueba no hablen con el bot real.
- Después: **Redeploy** de producción. Las variables nuevas no aplican sin un nuevo despliegue.

Comprobación: `https://<backend>/api/v1/telegram/webhook/` sin cabecera debe responder **403**. Eso significa que el endpoint existe y rechaza las llamadas sin secreto.

---

## 6. Migración en producción

Aplica las migraciones de la app nueva con el método que indicaste en 2.2. El equivalente local es:
```bash
cd Backend && .venv/bin/python manage.py migrate telegram_notifications
```
Antes, haz el respaldo que acostumbres de la base. La migración solo **crea tablas nuevas**; no toca las existentes.

Comprobación: `python manage.py showmigrations telegram_notifications` muestra `[X] 0001_initial`.

---

## 7. Registrar el webhook en Telegram

Desde tu máquina, con las variables de producción solo en esa terminal (no en archivos):
```bash
cd Backend
export TELEGRAM_BOT_TOKEN='<token real>'
export TELEGRAM_WEBHOOK_SECRET='<primer secreto>'
.venv/bin/python manage.py telegram_set_webhook https://<backend>/api/v1/telegram/webhook/
unset TELEGRAM_BOT_TOKEN TELEGRAM_WEBHOOK_SECRET
```
El comando lo escribo yo en A4. El nombre y los argumentos exactos quedarán en `Backend/telegram_notifications/README.md`.

Comprobación (sustituye el token en la URL y no compartas la salida si muestra el token):
```bash
curl -s "https://api.telegram.org/bot<token>/getWebhookInfo"
```
Debe mostrar tu URL, `pending_update_count` bajo y sin `last_error_message`.

---

## 8. Worker de Cloudflare (el reloj que dispara los envíos)

1. Crea una cuenta gratuita en https://dash.cloudflare.com si no tienes una.
2. En la carpeta que dejaré (`Backend/telegram_notifications/cloudflare/`):
   ```bash
   npx wrangler login
   npx wrangler secret put TELEGRAM_PROCESS_SECRET   # pega el segundo secreto cuando lo pida
   npx wrangler deploy
   ```
3. Revisa que `wrangler.toml` tenga la URL de tu backend en `PROCESS_URL`. La dejaré como marcador para que pongas la tuya.
4. Comprobación: en el panel de Cloudflare → Workers → el worker → *Logs* o *Cron events*, verás una ejecución por minuto con respuesta 200. Mientras `TELEGRAM_ENABLED=false`, el procesador responde sin enviar nada.

---

## 9. Encendido y prueba real (con tu aprobación, al final)

1. En Vercel, cambia `TELEGRAM_ENABLED` a `true` y haz Redeploy.
2. Desde **tu** Telegram abre el bot y envía `/start`. Recibirás un código de 8 caracteres que vence en 15 min.
3. Aprueba el vínculo de tu cuenta con un usuario `commission`: `POST /api/v1/telegram/links/approve/` con `{"code": "...", "user": <id>}`. Si para entonces no hay pantalla en el panel, te dejo el `curl` exacto en el README.
4. En Telegram pulsa **Acepto**. `/estado` debe responder «Avisos activos.».
5. `GET /api/v1/telegram/status/` (con sesión `commission`) debe mostrar el interruptor encendido y si los hooks de B están instalados.
6. Prueba `/pausar`, `/reanudar` y `/desvincular`.

Si algo sale mal: pon `TELEGRAM_ENABLED=false` y haz Redeploy. Eso apaga todos los envíos sin perder datos.

---

## 10. Qué me devuelves

Cuando termines, solo dime en el chat:
- Respuestas de las secciones 1 y 2 (o «ya llené el archivo»).
- Qué pasos de 3 a 9 hiciste y si alguna comprobación falló, copiando el mensaje de error **sin tokens ni secretos**.

## Orden resumido
| Cuándo | Pasos |
|---|---|
| Ya | 1, 2, 3, 4 |
| Después de que yo termine A4 y tú hagas push y despliegues | 5, 6, 7, 8 |
| Al final, con todo verde | 9 |
