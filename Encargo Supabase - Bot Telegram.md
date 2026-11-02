# Encargo: base de producción (Supabase) para el bot de Telegram

Este documento es para la persona **owner del proyecto de Supabase** (o alguien con acceso al *SQL Editor* y a *Database → Backups*). German no puede conectarse al proyecto. Todo lo que se pide es de lectura, salvo el respaldo y la reversión de emergencia del paso 3.4.

**Reglas:** no compartas cadenas de conexión, contraseñas ni claves (`anon`, `service_role` o `publishable`). Las consultas de este documento devuelven solo metadatos, sin correos ni `chat_id`; si alguna devuelve datos personales, no los copies.

## 1. Contexto en tres líneas

- El proyecto API de Vercel (`mesa-competitividad-api`) **despliega `develop` a producción**, y su Build Command ejecuta `python manage.py migrate --noinput` cuando `VERCEL_ENV=production`. Por eso, en cuanto el PR del bot se fusione en `develop`, se aplicarán solas las migraciones `telegram_notifications.0001_initial` (5 tablas nuevas) y `0002_enable_rls`.
- `0002_enable_rls` ejecuta `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en las 5 tablas del bot. Lo hace **sin `FORCE` y sin políticas**: Django, que es dueño de las tablas, sigue leyendo y escribiendo con normalidad, y la Data API (PostgREST, con las claves `anon` o `authenticated`) no puede ver ninguna fila. No toca tablas de otras apps.
- Las tablas del bot son `telegram_notifications_telegramlink` (guarda el `chat_id` de cada persona), `telegram_notifications_linkticket`, `telegram_notifications_notificationevent`, `telegram_notifications_deliveryjob` y `telegram_notifications_processedupdate`.

## 2. Antes de fusionar el PR del bot en `develop`

### 2.1 Respaldo (obligatorio)

Hay dos opciones; usa la **A** si tu plan de Supabase tiene respaldos diarios.

**A. Respaldo del panel:** en *Database → Backups*, anota la fecha y hora del último respaldo diario. Debe ser del mismo día de la fusión.

**B. Respaldo manual** con el comando del proyecto, que usa `pg_dump` y lo verifica con `pg_restore --list`:
```bash
cd Backend
export DB_ENGINE=postgres DB_SSLMODE=require
export DATABASE_URL='<cadena del Session pooler, puerto 5432>'
.venv/bin/python manage.py backup_backend --output-dir ~/respaldos-mesa
unset DATABASE_URL
```
- Usa el **Session pooler** (puerto 5432), no el Transaction pooler (6543) que usa Vercel: `pg_dump` necesita una sesión completa.
- `pg_dump` debe ser de una versión igual o mayor que la del servidor. Puedes consultarla en el SQL Editor con `select version();`.
- Guarda el `.zip` fuera del repositorio y no lo subas a ningún sitio compartido.

### 2.2 Diagnóstico de la Data API (solo lectura)

1. En el panel, abre *Project Settings → Data API* (en algunos paneles se llama *API*). Anota si la Data API está **activada** y qué **Exposed schemas** tiene, por ejemplo `public`.
2. En el SQL Editor ejecuta:
   ```sql
   -- Cuántas tablas de public no tienen RLS
   select count(*) as tablas_public_sin_rls
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

   -- ¿Las claves públicas tienen permiso de lectura sobre la tabla de usuarios?
   select has_table_privilege('anon', 'public.accounts_user', 'select') as anon_lee_usuarios,
          has_table_privilege('authenticated', 'public.accounts_user', 'select') as authenticated_lee_usuarios;
   ```

**Por qué importa (y queda fuera del alcance del bot):** si la Data API está activa con `public` expuesto, y `anon_lee_usuarios` es `true` en una tabla sin RLS, cualquiera que tenga la clave `anon` puede leer esa tabla por `https://<proyecto>.supabase.co/rest/v1/accounts_user`. Esto afecta a **todas** las tablas de Django, no solo a las del bot. El repositorio no usa la Data API: no hay `supabase-js` ni llamadas a `rest/v1` en Backend, Frontend ni Mobile, y Django se conecta directo por el pooler. La recomendación es **desactivar la Data API** o quitar `public` de *Exposed schemas*. Esa decisión la toma el owner; la migración del bot protege sus tablas en cualquier caso.

## 3. Después del primer despliegue de producción que incluya el bot

German avisa cuando `https://mesa-competitividad-api.vercel.app/api/v1/telegram/status/` deje de dar `404`.

### 3.1 Migraciones aplicadas
```sql
select name from django_migrations where app = 'telegram_notifications' order by id;
```
Resultado esperado: `0001_initial` y `0002_enable_rls`.

### 3.2 RLS activo y dueño correcto
```sql
select c.relname as tabla,
       c.relrowsecurity as rls,
       c.relforcerowsecurity as force_rls,
       pg_get_userbyid(c.relowner) as owner
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'telegram\_notifications\_%'
order by 1;

select count(*) as politicas from pg_policies where tablename like 'telegram\_notifications\_%';
```
Resultado esperado:
- 5 filas, con `rls = true` y `force_rls = false`.
- `owner` es el mismo rol del `DATABASE_URL` de Vercel. En el pooler, el usuario `postgres.<ref>` corresponde al rol `postgres`. Si el dueño fuera otro rol, avisa a German **antes** de encender el bot.
- `politicas = 0`, a propósito.

### 3.3 Security Advisor
En *Advisors → Security Advisor*, las 5 tablas del bot deben aparecer, como mucho, con el aviso informativo **«RLS Enabled No Policy»**. Es intencional: **no agregues políticas**. Ya no deben aparecer en «RLS Disabled in Public».

### 3.4 Reversión de emergencia (solo si hace falta)
Si en los logs de Vercel aparecen errores `permission denied` o de `row-level security` sobre tablas `telegram_notifications_*`:
```sql
alter table if exists public.telegram_notifications_telegramlink disable row level security;
alter table if exists public.telegram_notifications_linkticket disable row level security;
alter table if exists public.telegram_notifications_notificationevent disable row level security;
alter table if exists public.telegram_notifications_deliveryjob disable row level security;
alter table if exists public.telegram_notifications_processedupdate disable row level security;
```
No borra datos. Avisa a German con la hora del error.

## 4. Cuenta `commission` en producción

Solo las cuentas con rol `commission` (permiso `users.manage`) pueden aprobar vínculos del bot, y hoy no existe ninguna en producción. Antes del encendido, crea al menos una con el procedimiento habitual del equipo. `createsuperuser` asigna `commission` automáticamente. Para hacerlo, ejecuta el comando contra la base de producción con las variables solo en esa terminal, igual que en el paso 2.1 B:
```bash
.venv/bin/python manage.py createsuperuser
```
Avisa solo que ya existe, sin compartir el correo.

## 5. Qué devolver a German

```
2.1 Respaldo: <A panel: fecha/hora | B manual: OK, fecha/hora>
2.2 Data API: <activada|desactivada>; exposed schemas: <...>; tablas_public_sin_rls: <n>; anon_lee_usuarios: <true|false>
3.1 Migraciones: <lista>
3.2 RLS: <5 filas rls=true force=false | diferencias>; owner: <rol>; politicas: <n>
3.3 Advisor: <avisos de las tablas telegram_*>
4. Cuenta commission: <creada|pendiente>
```
