# Encargo: Worker de Cloudflare del bot de Telegram

Este documento es para el agente que tiene acceso a la cuenta de Cloudflare del proyecto. Incluye todo lo necesario para hacer el trabajo sin preguntar. Si algo no coincide con lo que se describe aquí, **detente e informa**: no improvises.

## 1. Qué es y para qué sirve

- El backend (Django) está desplegado en Vercel: `https://mesa-competitividad-api.vercel.app`.
- El bot de Telegram envía avisos a partir de una cola guardada en la base de datos. Algo tiene que despertar al backend **cada minuto** para que procese esa cola. Ese "reloj" es este Worker.
- El Worker no tiene lógica propia. Cada minuto hace `POST https://mesa-competitividad-api.vercel.app/api/v1/telegram/process/` con la cabecera `Authorization: Bearer <TELEGRAM_PROCESS_SECRET>`. Toda la lógica (qué se envía, a quién, reintentos y límites) está en el backend.
- No necesitas acceso a GitHub, Vercel, Supabase ni Telegram.

## 2. Archivos (fuente de verdad, no los modifiques)

Están en el repositorio, en `Backend/telegram_notifications/cloudflare/`. Si no tienes el repositorio, crea una carpeta con estos dos archivos **idénticos**.

`wrangler.toml`:
```toml
# El secreto se guarda con: npx wrangler secret put TELEGRAM_PROCESS_SECRET
name = "mesa-telegram-cron"
main = "worker.js"
compatibility_date = "2026-10-01"

[triggers]
crons = ["* * * * *"]

# Guarda los console.log de cada ejecución para revisarlos en el panel (Observability / Logs).
[observability]
enabled = true

[vars]
PROCESS_URL = "https://mesa-competitividad-api.vercel.app/api/v1/telegram/process/"
```

`worker.js`:
```js
// Reloj del bot: cada minuto llama al procesador del backend con el secreto compartido.
export default {
  async scheduled(event, env) {
    const response = await fetch(env.PROCESS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.TELEGRAM_PROCESS_SECRET}` },
    });
    const body = await response.text();
    console.log(response.status, body.slice(0, 500));
    if (!response.ok) throw new Error(`Procesador respondió ${response.status}`);
  },
};
```

## 3. Reglas

1. **No cambies** el nombre del Worker, el cron, la URL, el método ni el `throw`. Que el Worker falle con un estado distinto de 2xx es intencional, porque así el error se ve en los logs.
2. **No manejes el secreto.** `TELEGRAM_PROCESS_SECRET` lo carga German en el panel. No lo pidas, no lo leas, no lo imprimas ni lo pongas en `[vars]` o en ningún archivo. `wrangler secret list` muestra solo nombres y sí puedes usarlo.
3. No llames al procesador con ninguna credencial. Solo puedes hacer el `POST` **sin cabecera** de la sección 4, que sirve para saber si el backend ya está desplegado.
4. No crees rutas, dominios personalizados, KV, D1, colas ni otros Workers. No actives planes de pago.
5. No hagas commits, push ni PR en el repositorio.
6. Usa Wrangler 4 (`npx wrangler@4 ...`). Para iniciar sesión usa el método con el que ya estás conectado a la cuenta (OAuth o API token). Si necesitas un API token, la plantilla **Edit Cloudflare Workers** basta.

## 4. Etapa 1: preparación (hazla ya)

1. Confirma la cuenta: `npx wrangler@4 whoami`. Anota el nombre o correo de la cuenta.
2. Desde la carpeta de los dos archivos, ejecuta `npx wrangler@4 deploy --dry-run`. Debe terminar sin errores y mostrar `PROCESS_URL`.
3. Comprueba si el backend ya tiene la ruta:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://mesa-competitividad-api.vercel.app/api/v1/telegram/process/
   ```
   - `404`: el backend todavía no tiene el bot desplegado. Es lo esperado hoy. **No despliegues**: informa y espera.
   - `401`: el backend ya está listo. Puedes pasar a la etapa 2 **solo si German ya te dio la orden**.

**Entrega de la etapa 1:** la cuenta usada, la versión de Wrangler, el resultado del dry-run (OK o el error textual) y el código HTTP del paso 3.

## 5. Etapa 2: despliegue (solo cuando German diga «backend listo»)

1. Repite el `curl` del paso 4.3. Tiene que dar `401`; si da `404`, detente.
2. Despliega: `npx wrangler@4 deploy`. La salida debe mencionar `mesa-telegram-cron` y el trigger `schedule: * * * * *`.
   - Si Wrangler pide registrar un subdominio `workers.dev` porque la cuenta es nueva, registra uno neutro, por ejemplo `mesa-xela`. El Worker no recibe tráfico por esa URL.
3. Avisa a German con el texto exacto: **«Worker desplegado; falta cargar el secreto»**. Él lo carga en *Workers & Pages → mesa-telegram-cron → Settings → Variables and Secrets → Add → Type: Secret → Name: `TELEGRAM_PROCESS_SECRET`*. Hasta entonces cada ejecución falla con `403`, y eso es lo esperado.
4. Cuando German confirme, ejecuta `npx wrangler@4 secret list`: debe aparecer `TELEGRAM_PROCESS_SECRET` (solo el nombre).
5. Observa al menos 3 ejecuciones seguidas con `npx wrangler@4 tail mesa-telegram-cron --format pretty` (unos 3 minutos), o en el panel en *Observability / Logs*.

Cómo interpretar cada log (`<código> <cuerpo>`):

| Log | Significado | Acción |
|---|---|---|
| `200 {"enabled":false}` | Correcto: el bot está desplegado pero apagado | Ninguna; es el estado esperado al principio |
| `200 {"enabled":true,...}` | Correcto: el bot está encendido | Ninguna |
| `403` con cuerpo vacío | El secreto falta o no coincide con el de Vercel | Avisar a German. No intentes corregirlo |
| `403` con HTML | Lo bloqueó el firewall de Vercel, no es un problema del secreto | Avisar a German con un extracto del HTML (sin cabeceras) |
| `404` | El backend no tiene la ruta (despliegue revertido o ausente) | Avisar a German |
| `5xx` o timeout | Error del backend | Avisar a German con la hora en UTC y el cuerpo truncado |

**Entrega de la etapa 2:** la salida resumida del deploy, la lista de secretos (solo nombres) y las 3 líneas de log observadas, con su hora en UTC.

## 6. Reversión (solo si German lo pide)

- **Detener el reloj sin borrar nada:** en el panel, *mesa-telegram-cron → Settings → Triggers*, elimina el Cron Trigger. Vuelve a aparecer con el próximo `wrangler deploy`.
- **Borrar todo:** `npx wrangler@4 delete mesa-telegram-cron` (elimina también el secreto).
- Para apagar los envíos del bot **no hace falta tocar Cloudflare**: German pone `TELEGRAM_ENABLED=false` en Vercel.

## 7. Datos útiles

- Son 1440 ejecuciones al día, muy por debajo del plan gratuito de Workers. El tiempo que el Worker espera la respuesta del backend no cuenta como CPU.
- El backend tarda como máximo unos 13 s por ejecución.
- Si dos ejecuciones se solapan no hay problema: el backend reserva cada envío con un bloqueo y nunca envía dos veces el mismo aviso.

## 8. Formato del informe final

```
Cuenta: <nombre/correo>
Wrangler: <versión>
Etapa 1: dry-run <OK|error>, POST sin cabecera = <código>
Etapa 2: deploy <OK|error>, secreto listado <sí|no>
Logs (UTC): <hora> <código> <cuerpo> ×3
Incidencias: <ninguna | descripción>
```
