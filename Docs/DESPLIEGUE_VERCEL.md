# Despliegue web con Vercel

## Configuración versionada

`Frontend/vercel.json` fija el framework Vite, `npm run build`, la carpeta `dist` y el rewrite de rutas SPA. El build se valida con `cd Frontend && npm run build`.

## Configuración pendiente en la cuenta Vercel

La vinculación de GitHub y estos ajustes pertenecen al proyecto de Vercel y no se pueden establecer desde los archivos del repositorio:

1. Autorizar la aplicación Vercel para el repositorio `MiloDou/Mesa-Competitividad-Dev` desde la cuenta propietaria.
2. Importar o conectar ese repositorio en Vercel.
3. En **Settings → Build and Deployment**, establecer **Root Directory** en `Frontend`.
4. En **Settings → Git**, seleccionar `develop` como **Production Branch**.
5. Confirmar en el proyecto los comandos y salida declarados en `Frontend/vercel.json`.

Con la integración instalada, Vercel debe crear despliegues de preview para ramas/PRs y actualizar producción cuando se integren cambios a `develop`. La ejecución real de estos despliegues depende de la conexión y permisos en la cuenta Vercel.

## API requerida para producción

`Frontend/src/api/client.ts` usa `VITE_API_BASE_URL` y, si no se establece, apunta a `http://127.0.0.1:8000/api/v1`. Ese valor solo sirve en desarrollo local. Antes de desplegar, configura `VITE_API_BASE_URL` en Vercel para Preview y Production con la URL HTTPS pública del backend, por ejemplo `https://api.ejemplo.org/api/v1` cuando el equipo tenga un dominio de API real. No se debe publicar un valor `localhost`, una URL ficticia ni credenciales.

La URL pública del backend comunicada por el equipo es `https://mesa-competitividad-api.vercel.app/api/v1/`; usa `https://mesa-competitividad-api.vercel.app/api/v1` como valor de `VITE_API_BASE_URL`. El 19 de octubre de 2026, `https://mesa-competitividad-api.vercel.app/api/health/` respondió HTTP 200 con `status: ok` y `database: ok`. Esta consulta solo confirma el estado de la API y su base de datos; no verifica SMTP, CORS ni recuperación completa de contraseña. Coordina con el responsable del backend el origen permitido y las cuentas sintéticas para la vista previa de `password-recovery` antes de realizar pruebas que modifiquen contraseñas. Sin `VITE_API_BASE_URL`, el sitio estático puede desplegarse, pero intentará conectar con la API local.

## Flujo del equipo

1. Actualizar la rama local desde `develop`.
2. Crear una rama para el cambio.
3. Subir la rama y abrir un PR hacia `develop`.
4. Revisar el enlace de Preview que publique Vercel una vez conectada la integración.
5. Integrar el PR solo después de validar el Preview; Vercel tomará `develop` como producción según la configuración indicada arriba.

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

1. **Frontend / Preview de `password-recovery`:** conectar el repositorio al proyecto correcto y revisar Root Directory `Frontend`, build `npm run build` y salida `dist`. Configurar `VITE_API_BASE_URL` con la base HTTPS del backend elegido, sin `/` final; para la API comunicada por el equipo es `https://mesa-competitividad-api.vercel.app/api/v1`. Aplicar la variable a Preview, preferiblemente limitada a esta rama, y generar un nuevo despliegue. Si el backend usa datos reales, coordinar primero una cuenta de prueba autorizada o un backend separado.
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

## Comprobación actual

El archivo de configuración y el build local pueden comprobarse en CI. No se afirma que GitHub esté vinculado a un proyecto Vercel ni que exista un despliegue hasta confirmar el acceso en la cuenta y observar una URL y estado de deployment reales.
