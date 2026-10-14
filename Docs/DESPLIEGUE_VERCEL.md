# Despliegue de frontend y API con Vercel

## Proyecto web existente

El proyecto `mesa-competitividad-dev` ya está conectado a `MiloDou/Mesa-Competitividad-Dev`, usa `Frontend/` como raíz y despliega `develop` a producción. El dominio de producción observado es `https://mesa-competitividad-dev-pi.vercel.app`. `Frontend/vercel.json` configura Vite, `npm run build`, `dist` y el rewrite SPA.

En la revisión del 14 de octubre de 2026, el proyecto no tenía variables de entorno. La ruta publicada `/api/health/` devuelve el frontend SPA, lo cual confirma que todavía no hay API conectada a ese dominio. El CMS ya tiene código para leer y guardar contenido de landing a través de Django; aún no llega al sitio publicado. Cuando el proyecto API tenga dominio, configura `VITE_API_BASE_URL` en **Production**:

```text
VITE_API_BASE_URL=https://<dominio-api-de-vercel>/api/v1
```

Después de guardar la variable, crea un nuevo deployment del frontend para que Vite la incorpore al bundle. Configura **Preview** solo con una API/base de datos de prueba independiente; no uses la base de producción desde previews. Para desarrollo local usa `Frontend/.env.local`. Vite expone las variables `VITE_*` al navegador; nunca guardes secretos ahí.

## Proyecto API Django

Crear un segundo proyecto conectado al mismo repositorio, con nombre sugerido `mesa-competitividad-api`, directorio raíz `Backend/` y rama de producción `develop`. Mantener el proyecto web con raíz `Frontend/`; cada proyecto despliega su propia carpeta. La documentación actual de Vercel indica que detecta Django a partir de `manage.py` y resuelve WSGI desde `WSGI_APPLICATION`; no hace falta un adaptador adicional. La API se sirve desde `/api/v1/`, el estado desde `/api/health/` y la documentación OpenAPI desde `/api/schema/`.

### Servicios gratuitos elegidos

- **Supabase** para PostgreSQL. El contenido editable de la landing se guarda como JSON en PostgreSQL y no requiere Storage. Los archivos binarios usan Storage privado solo si se configura; sin esas credenciales, las operaciones de carga y descarga responden HTTP 503 y no guardan archivos en el filesystem temporal de Vercel.
- **Vercel Hobby** para desplegar. El [plan es gratis](https://vercel.com/docs/plans/hobby), con 4 CPU-horas, 360 GB-horas y 1 millón de invocaciones al mes; al superar límites, el uso puede quedar pausado hasta el siguiente periodo. Vercel lo permite solo para uso personal/no comercial. Confirma que el uso de esta Mesa cumple esas condiciones antes de producción; si no, hace falta un host gratis cuyas condiciones permitan el uso previsto.

### Supabase configurado

El proyecto `Landing Page & CMS` ya existe en Supabase con ref `hbllnxysfwmjofuyyfom`, en el plan **Free**. El bucket `mesa-private` está creado y es privado. Las migraciones de Django aún deben ejecutarse contra PostgreSQL antes de que la API pueda servir datos. No habilites add-ons ni cambies de plan.

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

Configura las variables en **Production**; añade Preview solo si va a usar recursos separados o si aceptas que esa versión comparta los datos de producción. `Backend/config/settings.py` rechaza Vercel si faltan base de datos, clave privada o hosts permitidos. En Vercel usa SQLite solo localmente; no introduzcas credenciales en `VITE_*` ni las escribas en el repositorio o el chat.

### Migrar y comprobar

Antes del primer uso, ejecuta las migraciones Django contra la base recién creada usando la URL de producción obtenida de manera segura desde Vercel (por ejemplo, con `vercel env pull` hacia un archivo local ignorado por Git): `python manage.py migrate --noinput`. No copies ese archivo al repositorio ni al frontend. La base empieza vacía: no migres el SQLite local ni sus usuarios sin una decisión explícita y un plan de transferencia seguro. Crea la cuenta administradora inicial directamente en PostgreSQL con el procedimiento seguro de Django.

Después de crear los recursos, asignar variables y publicar los cambios, verifica `GET /api/health/` (debe mostrar base conectada) y `GET /api/schema/`. Desde el sitio, comprueba `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`; carga/descarga un archivo privado solo con una cuenta de prueba autorizada. No marques la integración lista hasta que el backend, la base y el bucket respondan en el deployment y el navegador no registre errores CORS.

## Bloqueos de persistencia y operaciones

- El panel Vercel observado no tenía variables de entorno y todavía no tiene un proyecto de API. Supabase ya tiene el proyecto y el bucket privado, pero la base aún requiere las migraciones de Django. Por eso el frontend todavía no alcanza los datos de producción.
- Las migraciones de Django crean las tablas del API, incluido el registro JSON para las secciones de la landing. Los documentos y recursos multimedia requieren Storage privado; no uses rutas públicas ni expongas llaves de servidor en web/móvil. Sin Storage, esas operaciones devuelven HTTP 503 y los cambios de landing que no dependan de archivos pueden persistir en PostgreSQL.
- `process_votings` y `deliver_push` son tareas periódicas. No se programan con la configuración actual; se requiere un scheduler antes de prometer cierres automáticos o push oportunos.
- Configura las claves solo en **Vercel → Settings → Environment Variables**. Nunca en el código, `.env.example` o variables `VITE_*`.

## Verificación final

Tras crear el proyecto API y configurar los servicios y variables, valida el deployment con `GET /api/health/` y `GET /api/schema/`. Luego define `VITE_API_BASE_URL`, redepliega la web y comprueba en el navegador `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`. No marques la integración lista hasta que health reporte la base conectada y las llamadas del frontend respondan sin errores CORS.
