## 1. Decisiones (las necesito antes de empezar A4)

**1.1 ¿Cuándo caduca un aviso?**
Hoy, un aviso que no se pudo entregar caduca 24 h después de la hora en que debía enviarse (`run_after`). El plan decía medirlo desde el evento, pero con ese criterio un recordatorio programado con días de antelación caducaría antes de enviarse.
- A) Mantener: 24 h desde la hora programada. **(Recomendado)**
- B) Medirlo desde el evento, como en el plan.

Respuesta: A

**1.2 ¿Cuánto espera el bot a que Telegram responda?**
Cada envío espera a Telegram hasta 10 s. El procesador corta un lote a los 8 s, pero un envío que ya empezó puede alargarlo hasta unos 18 s. La duración máxima de una función en Vercel depende de tu plan y de `maxDuration`.
- A) Bajar la espera de cada envío a 5 s, para que el lote no pase de unos 13 s. **(Recomendado)**
- B) Dejarla en 10 s.

Respuesta: A

**1.3 ¿Hay un bot de pruebas?**
Puedo hacer una prueba manual opcional con un bot de pruebas tuyo (no el real), con su token en `Backend/.env`, que no se sube al repositorio. Solo la haría con tu aprobación explícita en ese momento.
- A) Sí, crearé un bot de pruebas (paso 3.2).
- B) No, basta con las pruebas automáticas con Telegram simulado.

Respuesta: A

---

## 2. Datos del proyecto (no son secretos)

**2.1 URL pública del backend en Vercel** (por ejemplo `https://algo.vercel.app`; sin token):

Respuesta: en la carpeta de  backend se  encuentra un .env.example de vercel usa lo que esta ahi es lo que se usa para el despliege que tenemos hasta el momento porque aun no hemos comprado un dominio como tal. 

**2.2 ¿Cómo se aplican hoy las migraciones en la base de producción?** (comando local con `DATABASE_URL` de producción, paso de build en Vercel, lo hace otra persona…):

Respuesta: no entendi esto, me lo explicas mejor porfavor? 

**2.3 ¿Quién en producción tiene el rol `commission`?** Solo ese rol puede aprobar vínculos. Basta con confirmar que tú lo tienes o que sabes quién lo tiene; no hace falta poner correos.

Respuesta: Son las personas que forman parte de la commision de tecnologia de la mesa y son los encargados de administrar todo el sistema administrativo son los que se van a quedar y hacer responsables del sistema despues de entregado

**2.4 Coordinación con Persona B.** El motor ya busca `telegram_notifications/policies.py` (`authorize_and_render`) y `reminders.py` (`generate_due`). Mientras B no los entregue, el bot responde comandos pero **no envía ningún aviso**: falla cerrado, a propósito. Pregúntale a B en qué estado van y para cuándo los espera.

Respuesta: esto es lo que a implementado la persoa B 
Lo que entregó

- B1: events.py (catálogo de eventos de reuniones y votaciones, con los campos que sí ameritan aviso) y templates.py (mensajes en texto plano y botones solo con URLs https).
- B3: policies.authorize_and_render(job), con la misma firma que espera el motor. Devuelve un Message o None y vuelve a comprobar todo contra la base de datos justo antes de enviar. Reutiliza las reglas de acceso que ya existen (visible_meetings_for, is_eligible_member y el queryset de VotingViewSet). Deja fuera los recordatorios de votación a quien ya votó y los recordatorios de reuniones que se reprogramaron.

La rama sale de mi commit de A3 (d167bd7) y solo agrega archivos nuevos, así que no choca con nada nuestro.

Pruebas

- Rama de B con nuestro motor: 71 pruebas pasan.
- Prueba integral en una copia temporal (no está en el repo):
  - Registré un evento y lo procesé con la política real y Telegram simulado. El aviso llegó solo al chat del invitado; el de otra comisión no lo recibió.
  - Un trabajo cancelado antes del envío no se mandó.
  - Con esto queda cubierta la comprobación intermedia que pide la guía.

Lo que hay que corregir

1. events.occurrence_key depende de la zona horaria (es de B, bug confirmado). El mismo instante da claves distintas en UTC y en hora local:
2026-10-27T21:34:34+00:00|24   vs   2026-10-27T15:34:34-06:00|24
   La política compara esta clave para descartar recordatorios viejos. Si el generador arma la clave con una fecha en hora local (por ejemplo, la que devuelve un serializer) y la política la arma con la fecha leída de la base, que está en UTC, pasan dos cosas: el recordatorio se descarta sin aviso y además se crean eventos duplicados. La solución es convertir a UTC dentro de occurrence_key cualquier fecha que tenga zona horaria (part.astimezone(datetime.timezone.utc)) y agregar una prueba para eso.
2. Una prueba mía, ya corregida: test_missing_policy_hook_sends_nothing daba por hecho que policies.py no existía, así que fallaba en cuanto se unía la rama de B. Ahora simula que falta el módulo. Cambié Backend/telegram_notifications/tests/test_delivery.py en feature/bot-telegram: las 12 pruebas de delivery pasan, pero el cambio está sin commit.

---

## 3. Crear el bot en BotFather (puedes hacerlo ya)

### 3.1 Bot real
1. En Telegram abre **@BotFather** (con la palomita azul de verificación).
2. Envía `/newbot`.
   - **Nombre visible:** por ejemplo `Avisos Mesa de Competitividad Xela`.
   - **Usuario:** tiene que terminar en `bot`, por ejemplo `MesaCompetitividadXelaBot`.
1. BotFather responde con un **token** de la forma `123456789:AA...`. Guárdalo en tu gestor de contraseñas. **No lo pegues en el chat conmigo ni en ningún archivo del repositorio.** 
2. Configúralo con estos comandos de BotFather:
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

ya configure el token del bot de prueba en el .env.example de la carpeta del backend, si hice un bot de prueba e hice el real y guarde sus credenciales para despues
---

## 4. Generar los dos secretos (puedes hacerlo ya)

En una terminal, ejecuta **dos veces** (una por secreto):
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```
- El primer valor es `TELEGRAM_WEBHOOK_SECRET`: Telegram lo manda en cada llamada al webhook. Este formato usa solo los caracteres que Telegram acepta.
- El segundo es `TELEGRAM_PROCESS_SECRET`: el Worker de Cloudflare lo usa para llamar al procesador.

Guárdalos en el gestor de contraseñas junto al token. Deben ser **distintos entre sí**.
