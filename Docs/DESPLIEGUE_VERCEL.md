# Despliegue de frontend y API con Vercel

## Proyecto web existente

El proyecto `mesa-competitividad-dev` está conectado a `MiloDou/Mesa-Competitividad-Dev`, usa `Frontend/` como raíz y Vercel reportó su deployment Production más reciente para el commit `85e243c` el 17 de octubre de 2026. El dominio de producción observado es `https://mesa-competitividad-dev-pi.vercel.app`. `Frontend/vercel.json` configura Vite, `npm run build`, `dist` y el rewrite SPA.

Actualización de la observación el 20 de octubre de 2026: GitHub registra el proyecto web `mesacompetitividad` del equipo `milos-projects-bdef8013`, conectado a este repositorio. Su último despliegue de producción registrado corresponde a `92fcb41` (PR #42), del 19 de octubre a las 16:26 de Guatemala, en `https://mesacompetitividad-jyiarth3v-milos-projects-bdef8013.vercel.app/`. La URL específica requiere acceso autorizado en Vercel. El proyecto personal `davidix888/mesa-competitividad-dev`, observado con despliegues del 11 de octubre, es distinto y no debe usarse para inferir el estado del proyecto del equipo. Los dominios y el estado del párrafo anterior documentan la observación histórica del 17 de octubre.

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

## Entrega de recuperación de contraseña (`password-recovery`)

El cambio entregable conecta la web a los endpoints existentes de Django. Incluye «Olvidé mi contraseña» en el acceso administrativo y la pantalla `/reset-password`. No requiere cambios de modelos ni migraciones. El despliegue, SMTP y la validación con correo real quedan a cargo del responsable de infraestructura. Ninguna clave de Brevo forma parte del commit.

### Prueba local sin correo externo

Prepara una base SQLite local y una cuenta sintética según `Backend/README.md`; no uses una base compartida. Desde `Backend/`, con las dependencias instaladas, puedes configurar el proceso en PowerShell:

```powershell
$env:DB_ENGINE = "sqlite"
$env:EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
$env:DEFAULT_FROM_EMAIL = "no-reply@example.test"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
$env:PASSWORD_RESET_URL = "http://localhost:5173/reset-password"
python manage.py runserver
```

En otra terminal, inicia `npm run dev` desde `Frontend/` y abre `http://localhost:5173`. Sin `VITE_API_BASE_URL`, el cliente usa la API local `http://127.0.0.1:8000/api/v1`. Si existe un archivo local que define esa variable, revisa que también apunte a localhost. El backend de consola muestra el enlace sintético en su terminal y no envía correo. Usa este modo exclusivamente con datos de prueba; no copies enlaces de recuperación reales a logs, capturas ni documentación.

### Configuración que debe aplicar el compañero al desplegar

1. **Frontend / Preview de `password-recovery`:** usar el proyecto del equipo `mesacompetitividad`, revisar la vinculación existente con Git, Root Directory `Frontend`, build `npm run build` y salida `dist`. Configurar `VITE_API_BASE_URL` con la base HTTPS de un backend de pruebas separado, sin `/` final. Aplicar la variable a Preview, preferiblemente limitada a esta rama, y generar un nuevo despliegue. No conectar Preview a la base de producción; el proyecto API mantiene esos builds omitidos hasta disponer de recursos de prueba independientes.
2. **Backend:** configurar estas variables de forma privada en el entorno de pruebas correspondiente. El usuario y la clave son los de SMTP; no usar la contraseña de la cuenta Brevo ni una clave API.

   | Variable | Valor |
   | --- | --- |
   | `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` |
   | `EMAIL_HOST` | `smtp-relay.brevo.com` |
   | `EMAIL_PORT` | `587` |
   | `EMAIL_USE_TLS` | `true` |
   | `EMAIL_USE_SSL` | `false` |
   | `EMAIL_HOST_USER` | Login SMTP mostrado por Brevo |
   | `EMAIL_HOST_PASSWORD` | Clave SMTP guardada de forma privada |
   | `DEFAULT_FROM_EMAIL` | Remitente verificado en Brevo |
   | `PASSWORD_RESET_URL` | URL estable de la web de pruebas seguida de `/reset-password` |
   | `CORS_ALLOWED_ORIGINS` | Conservar los orígenes autorizados y agregar el origen HTTPS exacto de Preview, sin rutas |

3. **Destino del enlace:** Django usa un único `PASSWORD_RESET_URL` por configuración. Cambiarlo en un backend compartido afecta los enlaces solicitados por todos sus clientes. No apuntar el backend de producción a una rama de pruebas sin coordinación y aprobación. No aceptar una URL de retorno enviada libremente por el cliente.
4. **Aplicación de variables:** generar un nuevo despliegue de los proyectos afectados después de configurar sus variables. Mantener el rewrite SPA existente en `Frontend/vercel.json` para que el enlace abra directamente `/reset-password`.
5. **Aceptación:** con una cuenta sintética activa, solicitar el enlace, comprobar su recepción, definir la contraseña nueva y verificar el inicio de sesión con ella. La contraseña anterior y el enlace reutilizado deben rechazarse; las sesiones y dispositivos anteriores quedan revocados. Probar correo desconocido (mismo mensaje), enlace inválido/vencido, contraseña corta/numérica/común y confirmación distinta. No dar por validado SMTP únicamente porque la API responda 200 a la solicitud: el backend registra los fallos de envío y conserva una respuesta genérica.
6. **Paso a producción:** hacerlo después de validar Preview, con autorización del equipo. Usar los valores definitivos de Production y comprobar nuevamente el enlace enviado. Para revertir, restaurar el despliegue y las variables anteriores; una reversión de código no recupera contraseñas ni sesiones ya revocadas.

### Corrección de backend local excluida de la entrega

En la revisión local se reprodujo un HTTP 500 al rechazar una contraseña que incumple los validadores de Django. La corrección de `Backend/accounts/views.py` convierte esa excepción en una respuesta de validación HTTP 400; las pruebas puntuales están en `Backend/accounts/tests.py`. Por indicación del usuario, ambos archivos deben permanecer fuera del commit entregable y no subirse. El responsable del backend debe coordinar esa corrección por separado antes de considerar validado el manejo de contraseñas rechazadas en el entorno desplegado.

Prueba puntual ejecutada localmente con la corrección: `python manage.py test accounts.tests.AuthenticationApiTests -k password_reset`. Las tres pruebas usan datos sintéticos y correo en memoria. Sus resultados no demuestran que la API desplegada contenga esa corrección ni que SMTP esté configurado.
