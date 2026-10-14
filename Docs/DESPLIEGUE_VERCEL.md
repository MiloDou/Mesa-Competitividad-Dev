# Despliegue de frontend y API con Vercel

## Proyecto web existente

El proyecto `mesa-competitividad-dev` ya está conectado a `MiloDou/Mesa-Competitividad-Dev`, usa `Frontend/` como raíz y despliega `develop` a producción. El dominio de producción observado es `https://mesa-competitividad-dev-pi.vercel.app`. `Frontend/vercel.json` configura Vite, `npm run build`, `dist` y el rewrite SPA.

En la revisión del 13 de octubre de 2026, el proyecto no tenía variables de entorno. La ruta publicada `/api/health/` devuelve el frontend SPA, lo cual confirma que todavía no hay API conectada a ese dominio. Cuando el proyecto API tenga dominio, configura `VITE_API_BASE_URL` en **Production**:

```text
VITE_API_BASE_URL=https://<dominio-api-de-vercel>/api/v1
```

Después de guardar la variable, crea un nuevo deployment del frontend para que Vite la incorpore al bundle. Configura **Preview** solo con una API/base de datos de prueba independiente; no uses la base de producción desde previews. Para desarrollo local usa `Frontend/.env.local`. Vite expone las variables `VITE_*` al navegador; nunca guardes secretos ahí.

## Proyecto API Django

Vercel ya admite Django sin un adaptador. Crear un segundo proyecto conectado al mismo repositorio, con nombre sugerido `mesa-competitividad-api`, directorio raíz `Backend/` y rama de producción `develop`. Mantener el proyecto web con raíz `Frontend/`; cada proyecto despliega su propia carpeta. La API se sirve desde `/api/v1/`, el estado desde `/api/health/` y la documentación OpenAPI desde `/api/schema/`.

### Servicios gratuitos elegidos

- **Supabase Free** para PostgreSQL y Storage privado. La [tarifa vigente](https://supabase.com/pricing) indica 500 MB de base, 1 GB de archivos, 5 GB de egreso y máximo 50 MB por archivo. Los proyectos gratis se pausan tras una semana de inactividad; no incluyen backups automáticos. Para evitar que la API apunte a almacenamiento local efímero, el backend exige la configuración S3 privada en Vercel.
- **Vercel Hobby** para desplegar. El [plan es gratis](https://vercel.com/docs/plans/hobby), con 4 CPU-horas, 360 GB-horas y 1 millón de invocaciones al mes; al superar límites, el uso puede quedar pausado hasta el siguiente periodo. Vercel lo permite solo para uso personal/no comercial. Confirma que el uso de esta Mesa cumple esas condiciones antes de producción; si no, hace falta un host gratis cuyas condiciones permitan el uso previsto.

### Preparar Supabase

1. Crea un solo proyecto con el plan **Free** y una contraseña PostgreSQL privada. No habilites add-ons ni cambies a un plan pagado.
2. En **Connect**, copia la URI del **Transaction pooler** (puerto `6543`), sustituye la contraseña y exige SSL con `sslmode=require`. Conserva el usuario, host y puerto exactos que proporciona el panel; la clave debe codificarse para URL si contiene caracteres reservados.
3. En **Storage**, crea un bucket llamado `mesa-private` como **privado**. En la configuración S3, habilita el endpoint y genera un par S3 para uso server-side. Estas llaves tienen acceso amplio a los buckets y nunca deben llegar al navegador.
4. Copia el endpoint y región tal como aparecen en Storage. La URL suele tener forma `https://<project-ref>.supabase.co/storage/v1/s3`.

El plan gratuito sirve para demo/entrega de volumen pequeño, no es una promesa de disponibilidad: Supabase puede pausar el proyecto inactivo y no ofrece respaldo automático en Free.

### Variables de Vercel

La plantilla de [`VERCEL_ENV_VARIABLES.example`](../Backend/VERCEL_ENV_VARIABLES.example) contiene valores ficticios. Añade las variables reales en **Settings → Environment Variables** del proyecto API; no las guardes en Git ni como variables `VITE_*`.

- `DJANGO_SECRET_KEY`: clave aleatoria privada, distinta de la local.
- `DJANGO_DEBUG=false`.
- `DJANGO_ALLOWED_HOSTS`: hostname asignado al proyecto API, sin esquema ni ruta.
- `DATABASE_URL`: URI de Transaction pooler de Supabase con `sslmode=require`.
- `CORS_ALLOWED_ORIGINS`: `https://mesa-competitividad-dev-pi.vercel.app` (añade solo otros dominios web aprobados).
- `CSRF_TRUSTED_ORIGINS`: orígenes HTTPS del sitio/panel.
- `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_REGION`, `SUPABASE_S3_BUCKET`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`: endpoint, región y credenciales de servidor de Storage.

Configura las variables en **Production**; añade Preview solo si va a usar recursos separados o si aceptas que esa versión comparta los datos de producción. `Backend/config/settings.py` rechaza Vercel si faltan base de datos, clave, host o almacenamiento. En Vercel usa SQLite solo localmente; los archivos se sirven a través de endpoints Django que preservan permisos, aunque estén en un bucket privado.

### Migrar y comprobar

Antes del primer uso, ejecuta las migraciones Django contra la base recién creada usando la URL de producción obtenida de manera segura desde Vercel (por ejemplo, con `vercel env pull` hacia un archivo local ignorado por Git): `python manage.py migrate --noinput`. No copies ese archivo al repositorio ni al frontend.

Después de crear los recursos, asignar variables y publicar los cambios, verifica `GET /api/health/` (debe mostrar base conectada) y `GET /api/schema/`. Desde el sitio, comprueba `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`; carga/descarga un archivo privado solo con una cuenta de prueba autorizada. No marques la integración lista hasta que el backend, la base y el bucket respondan en el deployment y el navegador no registre errores CORS.

## Bloqueos de persistencia y operaciones

- El panel Vercel observado no tenía variables de entorno y todavía no tiene un proyecto de API. La cuenta Supabase no estaba iniciada y aún no se han creado ni conectado recursos Supabase.
- Los documentos y archivos del CMS requieren el bucket privado configurado arriba; no uses rutas públicas ni expongas las llaves S3 en web/móvil.
- `process_votings` y `deliver_push` son tareas periódicas. No se programan con la configuración actual; se requiere un scheduler antes de prometer cierres automáticos o push oportunos.
- Configura las claves solo en **Vercel → Settings → Environment Variables**. Nunca en el código, `.env.example` o variables `VITE_*`.

## Verificación final

Tras crear el proyecto API y configurar los servicios y variables, valida el deployment con `GET /api/health/` y `GET /api/schema/`. Luego define `VITE_API_BASE_URL`, redepliega la web y comprueba en el navegador `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`. No marques la integración lista hasta que health reporte la base conectada y las llamadas del frontend respondan sin errores CORS.
