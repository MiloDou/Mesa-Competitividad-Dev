# Despliegue de frontend y API con Vercel

## Proyecto web existente

El proyecto `mesa-competitividad-dev` está conectado a `MiloDou/Mesa-Competitividad-Dev`, usa `Frontend/` como raíz y Vercel reportó su deployment Production más reciente para el commit `85e243c` el 17 de octubre de 2026. El dominio de producción observado es `https://mesa-competitividad-dev-pi.vercel.app`. `Frontend/vercel.json` configura Vite, `npm run build`, `dist` y el rewrite SPA.

`VITE_API_BASE_URL` está configurada en **Production** y el frontend fue redeplegado para incorporarla al bundle. La API está publicada en `https://mesa-competitividad-api.vercel.app`; su health endpoint responde HTTP 200 y confirma la conexión a PostgreSQL. En la verificación del 17 de octubre, ambos proyectos tenían deployment Production exitoso en el commit `85e243c`.

```text
VITE_API_BASE_URL=https://<dominio-api-de-vercel>/api/v1
```

Después de cambiar esta variable, crea un nuevo deployment del frontend para que Vite la incorpore al bundle. No configures **Preview** contra la base de producción. Para desarrollo local usa `Frontend/.env.local`. Vite expone las variables `VITE_*` al navegador; nunca guardes secretos ahí.

## Proyecto API Django

El proyecto `mesa-competitividad-api` ya está conectado al mismo repositorio, usa `Backend/` como raíz y despliega `develop` a producción. Vercel detecta Django a partir de `manage.py` y resuelve WSGI desde `WSGI_APPLICATION`; no hace falta un adaptador adicional. La API se sirve desde `/api/v1/`, el estado desde `/api/health/` y la documentación OpenAPI desde `/api/schema/`. El proyecto omite builds de Preview hasta contar con una base de datos de prueba independiente.

### Servicios gratuitos elegidos

- **Supabase** para PostgreSQL. El contenido editable de la landing se guarda como JSON en PostgreSQL y no requiere Storage. Los archivos binarios usan Storage privado solo si se configura; sin esas credenciales, las operaciones de carga y descarga responden HTTP 503 y no guardan archivos en el filesystem temporal de Vercel.
- **Vercel Hobby** para desplegar. El [plan es gratis](https://vercel.com/docs/plans/hobby), con 4 CPU-horas, 360 GB-horas y 1 millón de invocaciones al mes; al superar límites, el uso puede quedar pausado hasta el siguiente periodo. Vercel lo permite solo para uso personal/no comercial. Confirma que el uso de esta Mesa cumple esas condiciones antes de producción; si no, hace falta un host gratis cuyas condiciones permitan el uso previsto.

### Supabase configurado

El proyecto `Landing Page & CMS` existe en Supabase con ref `hbllnxysfwmjofuyyfom`, en el plan **Free**. El bucket `mesa-private` está creado y es privado. La API de producción confirma conexión a PostgreSQL. No se importó SQLite local.

Para conectar la base, en **Connect** copia la URI del **Transaction pooler** (puerto `6543`), conserva usuario/host/puerto exactos y exige SSL con `sslmode=require`. La contraseña es privada; codifícala para URL si contiene caracteres reservados. El bucket es opcional para la landing. Las llaves S3 de Supabase son credenciales de servidor con acceso amplio: no las generes ni guardes si no se habilitarán archivos binarios.

El plan gratuito sirve para demo/entrega de volumen pequeño, no es una promesa de disponibilidad: Supabase puede pausar el proyecto inactivo y no ofrece respaldo automático en Free.

### Variables de Vercel

La plantilla de [`VERCEL_ENV_VARIABLES.example`](../Backend/VERCEL_ENV_VARIABLES.example) contiene valores ficticios. Añade las variables reales en **Settings → Environment Variables** del proyecto API; no las guardes en Git ni como variables `VITE_*`.

- `DJANGO_SECRET_KEY`: clave aleatoria privada, distinta de la local.
- `DJANGO_DEBUG=false`.
- `DJANGO_ALLOWED_HOSTS`: hostname asignado al proyecto API, sin esquema ni ruta.
- `DATABASE_URL`: URI de Transaction pooler de Supabase con `sslmode=require`.
- `CORS_ALLOWED_ORIGINS`: `https://mesa-competitividad-dev-pi.vercel.app` (añade solo otros dominios web aprobados).
- `CSRF_TRUSTED_ORIGINS`: orígenes HTTPS del sitio/panel.
- Las cinco variables `SUPABASE_S3_*` solo son necesarias si se habilitan archivos binarios. Deben definirse todas juntas; si no se define ninguna, la API deja esas rutas desactivadas y mantiene la landing JSON operativa.

Las variables de producción están configuradas en **Vercel → Settings → Environment Variables**. `Backend/config/settings.py` rechaza Vercel si faltan base de datos, clave privada o hosts permitidos. No copies las credenciales de producción a **Preview**; para habilitar previews crea primero recursos separados. En Vercel usa SQLite solo localmente; no introduzcas credenciales en `VITE_*` ni las escribas en el repositorio o el chat.

### Migrar y comprobar

El Build Command de Vercel ejecuta `python manage.py migrate --noinput` solo cuando `VERCEL_ENV=production`; Django aplica únicamente las migraciones pendientes. No copies la base SQLite local ni sus usuarios sin una decisión explícita y un plan de transferencia seguro.

Verificación del 17 de octubre de 2026: `/api/health/` y las rutas públicas de landing, proyectos, publicaciones, eventos y perfil respondieron HTTP 200; proyectos devolvió el registro publicado “Modernización del aeropuerto”. La escritura administrativa de landing devolvió 401 sin sesión. Las cargas/descargas de archivos requieren almacenamiento privado duradero.

## Bloqueos de persistencia y operaciones

- El CMS debe distinguir contenido público real de las secciones sin registros; no se deben presentar fichas demo como proyectos del sistema. La verificación actual encontró un proyecto público en la API.
- Las migraciones de Django crean las tablas del API, incluido el registro JSON para las secciones de la landing. Los documentos y recursos multimedia requieren Storage privado; no uses rutas públicas ni expongas llaves de servidor en web/móvil. Sin Storage, esas operaciones devuelven HTTP 503 y los cambios de landing que no dependan de archivos pueden persistir en PostgreSQL.
- `process_votings` y `deliver_push` son tareas periódicas. No se programan con la configuración actual; se requiere un scheduler antes de prometer cierres automáticos o push oportunos.
- Configura las claves solo en **Vercel → Settings → Environment Variables**. Nunca en el código, `.env.example` o variables `VITE_*`.

## Verificación final

Tras crear el proyecto API y configurar los servicios y variables, valida el deployment con `GET /api/health/` y `GET /api/schema/`. Luego define `VITE_API_BASE_URL`, redepliega la web y comprueba en el navegador `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`. No marques la integración lista hasta que health reporte la base conectada y las llamadas del frontend respondan sin errores CORS.
