# Frontend web

Sitio público React/Vite conectado parcialmente a la API Django para cargar proyectos, publicaciones, eventos, perfil institucional y contenido de landing. La sesión web permite consultar/actualizar proyectos y gestionar el CMS, incluyendo estructura de secciones, datos de contacto, miembros y entidades. Para que los cambios sean compartidos, el API y PostgreSQL deben estar desplegados y `VITE_API_BASE_URL` configurada.

La recuperación de contraseña web utiliza las rutas existentes de la API: desde el acceso administrativo, «Olvidé mi contraseña» solicita un enlace y `/reset-password?uid=…&token=…` permite elegir y confirmar la nueva contraseña. El servidor valida el enlace y la contraseña y revoca las sesiones anteriores; la pantalla también elimina la sesión local después del cambio. La respuesta de solicitud es igual para correos registrados y desconocidos. Si falla la conexión, se muestra un error.

## Correo de recuperación y vista previa

La entrega se prepara y verifica localmente. La configuración que debe aplicar el compañero al desplegar, la prueba sin SMTP externo y los pendientes del backend están en [la guía de entrega de recuperación](../Docs/DESPLIEGUE_VERCEL.md#entrega-de-recuperación-de-contraseña-password-recovery).

El envío real depende del backend. Su configuración de ejemplo usa correo ficticio y no entrega mensajes. En un backend de pruebas se necesitan `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`/`EMAIL_USE_SSL` y `DEFAULT_FROM_EMAIL` de un remitente autorizado. Las credenciales se configuran de forma privada en el backend; nunca se agregan al frontend ni a variables `VITE_*`.

`PASSWORD_RESET_URL` en ese backend debe ser la URL web de pruebas seguida de `/reset-password`. El frontend no elige el destino del correo. Para probar localmente puede mantenerse `http://localhost:5173/reset-password`; el enlace es temporal y deja de servir al cambiar la contraseña. La vigencia la determina Django en el servidor.

Con la integración Git de Vercel habilitada, una rama distinta de la rama de producción puede generar un despliegue Preview al subir commits. En Preview, `VITE_API_BASE_URL` debe apuntar a un backend de pruebas accesible por HTTPS y ese backend debe incluir el origen exacto de la vista previa en `CORS_ALLOWED_ORIGINS`. Configura allí `PASSWORD_RESET_URL` con la URL estable de la rama y `/reset-password`. `vercel.json` ya redirige las rutas a la aplicación para abrir directamente los enlaces de recuperación. Una rama de Git no aísla la base de datos ni el correo: usa un backend y cuentas de prueba. Este cambio no publica la rama ni modifica la configuración de Vercel o del backend.

La API pública comunicada por el equipo es `https://mesa-competitividad-api.vercel.app/api/v1/`. El 19 de octubre de 2026, una consulta de lectura a `https://mesa-competitividad-api.vercel.app/api/health/` respondió HTTP 200 con `status: ok` y `database: ok`. En Production, el valor de `VITE_API_BASE_URL` es `https://mesa-competitividad-api.vercel.app/api/v1`. Preview requiere un backend y una base de pruebas separados: no debe apuntar a la base de producción. Su responsable debe preparar cuentas sintéticas, SMTP de pruebas y el origen autorizado de Preview. La comprobación de estado no verifica el envío de correo ni el flujo completo de recuperación.

Para comprobar el flujo, solicita un enlace para una cuenta sintética activa y otro para un correo inexistente; ambos deben mostrar el mismo mensaje. Abre el correo de la cuenta de prueba, verifica contraseñas distintas y luego confirma una contraseña válida de al menos 12 caracteres. Comprueba el inicio de sesión con la nueva contraseña, el rechazo de la anterior y del enlace ya utilizado. Abrir `/reset-password` sin parámetros debe mostrar que el enlace está incompleto. Los parámetros se retiran de la dirección al abrir la pantalla; si recargas, vuelve a abrir el enlace del correo.

El frontend aún no tiene runner ni script de pruebas unitarias. La compilación y la revisión de tipos son verificaciones distintas; incorporar un runner queda como tarea separada.

## Ejecutar localmente

1. Inicia el backend siguiendo [Backend/README.md](../Backend/README.md) en `http://127.0.0.1:8000`.
2. Desde `Frontend/`, ejecuta `npm ci` y `npm run dev`.
3. Abre `http://localhost:5173`. Si configuras otra URL para Vite, agrega ese origen a `CORS_ALLOWED_ORIGINS` en `Backend/.env` y reinicia Django.

La base de la API se configura con `VITE_API_BASE_URL`; por defecto es `http://127.0.0.1:8000/api/v1`. Puedes copiar `.env.example` a `.env.local` y cambiar esa variable si el backend usa otro host o puerto. Agrega el origen de Vite a `CORS_ALLOWED_ORIGINS` en `Backend/.env` cuando corresponda y reinicia ambos servidores.

## Comprobación manual

- En Network del navegador, revisa `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`; las listas públicas provienen del backend y no muestran el contenido de demostración cuando la respuesta es exitosa pero está vacía.
- Envía una inscripción desde el evento publicado que requiera registro y confirma `POST /public/events/{slug}/register/` con respuesta 201.
- Envía el formulario de contacto (incluye teléfono) y confirma `POST /public/contact/` con respuesta 201. El backend requiere SMTP para mandar correo; guardar la solicitud no depende del correo.
- Inicia sesión con una cuenta backend de rol Comisión o Editor; confirma `POST /auth/login/`. Al salir se llama `POST /auth/logout/`. Access y refresh se guardan en `sessionStorage` y se eliminan al salir. Las cuentas Lector aún no tienen una vista web de solo lectura integrada.
- `npm run build` compila el bundle; `npx tsc --noEmit` revisa tipos.

## Preparar una demostración local

La base SQLite local empieza sin contenido público. Desde la raíz del repositorio, carga ejemplos ficticios e idempotentes (puedes repetir el comando sin duplicarlos):

```bash
cd Backend
.venv/bin/python manage.py seed_demo_data
```

El comando crea o actualiza un proyecto público, una publicación y un evento futuros para probar las secciones del sitio. Solo se ejecuta con `DEBUG=true` y SQLite; no crea inscripciones, mensajes de contacto ni datos personales. Para simular los formularios desde la web, usa datos ficticios y un correo bajo el dominio reservado `.invalid`.

Para preparar una cuenta local, ejecuta `python manage.py seed_roles` y `python manage.py createsuperuser` desde `Backend/`. Después asigna explícitamente el rol requerido a esa cuenta desde la consola Django, por ejemplo para Comisión:

```bash
python manage.py shell -c "from accounts.models import User, Role; user = User.objects.get(email='admin@example.invalid'); user.roles.add(Role.objects.get(key='commission'))"
```

Sustituye el correo ficticio por el de la cuenta local que creaste. Esto concede permisos de Comisión a esa cuenta; no lo ejecutes con una cuenta de producción sin autorización.

## Alcance actual

Proyectos, agenda, noticias e instituciones consultan exclusivamente registros publicados por API; una respuesta válida sin registros se muestra vacía. Summit, las actas ficticias y la cronología marcada como demostración se mantienen fuera de la respuesta pública hasta contar con información oficial; el JSON original se conserva para revisión en el CMS. El contacto público solo muestra el correo confirmado `mesadequetzaltenango@gmail.com`. Personas y contenido de secciones se leen de `/public/landing-content/`; las instituciones se sirven desde `/public/institutions/` y se sincronizan con las entidades guardadas en el editor mediante `/landing-content/`. La sincronización depende del API y PostgreSQL desplegados y de `VITE_API_BASE_URL` configurada.

El panel conserva vistas locales para reuniones, minutas y votaciones. La vista Documentos lee, carga, descarga autenticada, edita metadatos y archiva documentos enlazados a proyectos y minutas usando `/documents/` y `/minutes/`. La inscripción y el contacto mantienen formularios pendientes; no deben considerarse envíos confirmados.

La sección **Proyectos** consulta `GET /projects/` al entrar al panel y con **Actualizar desde API**. Comisión puede elegir si un proyecto nuevo queda privado o se publica; el formulario publica por la acción del servidor y muestra el proyecto creado aunque la publicación falle. La edición, publicación y archivo esperan la respuesta del servidor antes de actualizar la lista. El porcentaje no se persiste: se deriva del estado recibido. Si la API no responde al abrir el panel, se muestra una lista de demostración y un aviso; las acciones de escritura se deshabilitan para no aparentar persistencia. La conexión usa las validaciones y permisos existentes del servidor; el panel no debe asumir que un botón visible concede autorización.

El mapa de conexiones, sus límites y criterios ACID están en [Docs/ESTADO_INTEGRACION.md](../Docs/ESTADO_INTEGRACION.md).
