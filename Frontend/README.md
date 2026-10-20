# Frontend web

Sitio público React/Vite conectado a la API Django para cargar proyectos y publicaciones públicas, inscribir personas a eventos publicados, recibir consultas, e iniciar y cerrar sesión administrativa.

La recuperación de contraseña web utiliza las rutas existentes de la API: desde el acceso administrativo, «Olvidé mi contraseña» solicita un enlace y `/reset-password?uid=…&token=…` permite elegir y confirmar la nueva contraseña. El servidor valida el enlace y la contraseña y revoca las sesiones anteriores; la pantalla también elimina la sesión local después del cambio. La respuesta de solicitud es igual para correos registrados y desconocidos. Si falla la conexión, se muestra un error.

## Correo de recuperación y vista previa

La entrega se prepara y verifica localmente. La configuración que debe aplicar el compañero al desplegar, la prueba sin SMTP externo y los pendientes del backend están en [la guía de entrega de recuperación](../Docs/DESPLIEGUE_VERCEL.md#entrega-de-recuperación-de-contraseña-password-recovery).

El envío real depende del backend. Su configuración de ejemplo usa correo ficticio y no entrega mensajes. En un backend de pruebas se necesitan `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`/`EMAIL_USE_SSL` y `DEFAULT_FROM_EMAIL` de un remitente autorizado. Las credenciales se configuran de forma privada en el backend; nunca se agregan al frontend ni a variables `VITE_*`.

`PASSWORD_RESET_URL` en ese backend debe ser la URL web de pruebas seguida de `/reset-password`. El frontend no elige el destino del correo. Para probar localmente puede mantenerse `http://localhost:5173/reset-password`; el enlace es temporal y deja de servir al cambiar la contraseña. La vigencia la determina Django en el servidor.

Con la integración Git de Vercel habilitada, una rama distinta de la rama de producción puede generar un despliegue Preview al subir commits. En Preview, `VITE_API_BASE_URL` debe apuntar a un backend de pruebas accesible por HTTPS y ese backend debe incluir el origen exacto de la vista previa en `CORS_ALLOWED_ORIGINS`. Configura allí `PASSWORD_RESET_URL` con la URL estable de la rama y `/reset-password`. `vercel.json` ya redirige las rutas a la aplicación para abrir directamente los enlaces de recuperación. Una rama de Git no aísla la base de datos ni el correo: usa un backend y cuentas de prueba. Este cambio no publica la rama ni modifica la configuración de Vercel o del backend.

La API pública comunicada por el equipo es `https://mesa-competitividad-api.vercel.app/api/v1/`. El 19 de octubre de 2026, una consulta de lectura a `https://mesa-competitividad-api.vercel.app/api/health/` respondió HTTP 200 con `status: ok` y `database: ok`. Para conectar la vista previa, el valor de `VITE_API_BASE_URL` es `https://mesa-competitividad-api.vercel.app/api/v1`. Antes de probar cambios de contraseña, el responsable del backend debe confirmar si ese despliegue permite pruebas con cuentas sintéticas, configurar SMTP y autorizar el origen de Preview. La comprobación de estado no verifica el envío de correo ni el flujo completo de recuperación.

Para comprobar el flujo, solicita un enlace para una cuenta sintética activa y otro para un correo inexistente; ambos deben mostrar el mismo mensaje. Abre el correo de la cuenta de prueba, verifica contraseñas distintas y luego confirma una contraseña válida de al menos 12 caracteres. Comprueba el inicio de sesión con la nueva contraseña, el rechazo de la anterior y del enlace ya utilizado. Abrir `/reset-password` sin parámetros debe mostrar que el enlace está incompleto. Los parámetros se retiran de la dirección al abrir la pantalla; si recargas, vuelve a abrir el enlace del correo.

El frontend aún no tiene runner ni script de pruebas unitarias. La compilación y la revisión de tipos son verificaciones distintas; incorporar un runner queda como tarea separada.

## Ejecutar localmente

1. Inicia el backend siguiendo [Backend/README.md](../Backend/README.md) en `http://127.0.0.1:8000`.
2. Desde `Frontend/`, ejecuta `npm ci` y `npm run dev`.
3. Abre `http://localhost:5173`. Si configuras otra URL para Vite, agrega ese origen a `CORS_ALLOWED_ORIGINS` en `Backend/.env` y reinicia Django.

La base de la API se configura con `VITE_API_BASE_URL`; por defecto es `http://127.0.0.1:8000/api/v1`. Si cambias el host o puerto del backend, crea `Frontend/.env.local` con esa variable y reinicia Vite.

## Comprobación manual

- En Network del navegador, revisa `GET /public/projects/`, `GET /public/publications/` y `GET /public/events/`; las listas públicas provienen del backend y no muestran el contenido de demostración cuando la respuesta es exitosa pero está vacía.
- Envía una inscripción desde el evento publicado que requiera registro y confirma `POST /public/events/{slug}/register/` con respuesta 201.
- Envía el formulario de contacto (incluye teléfono) y confirma `POST /public/contact/` con respuesta 201. El backend requiere SMTP para mandar correo; guardar la solicitud no depende del correo.
- Inicia sesión con una cuenta backend de rol Comisión o Editor; confirma `POST /auth/login/`. Al salir se llama `POST /auth/logout/`. Access y refresh se guardan en `sessionStorage` y se eliminan al salir. Las cuentas Lector aún no tienen una vista web de solo lectura integrada.
- `npm run build` compila el bundle; `npx tsc --noEmit` revisa tipos.

Para preparar una cuenta local, ejecuta `python manage.py seed_roles` y `python manage.py createsuperuser` desde `Backend/`. Después asigna explícitamente el rol requerido a esa cuenta desde la consola Django, por ejemplo para Comisión:

```bash
python manage.py shell -c "from accounts.models import User, Role; user = User.objects.get(email='admin@example.invalid'); user.roles.add(Role.objects.get(key='commission'))"
```

Sustituye el correo ficticio por el de la cuenta local que creaste. Esto concede permisos de Comisión a esa cuenta; no lo ejecutes con una cuenta de producción sin autorización.

## Alcance actual

Las listas públicas, los formularios indicados y el inicio/cierre de sesión ya consumen la API. El panel administrativo todavía contiene vistas con datos locales de demostración; reuniones, minutas, miembros, configuración del sitio y operaciones de edición/publicación de proyectos no están conectadas. Las estadísticas del inicio, la descripción institucional, la junta directiva, documentos y archivos históricos también conservan contenido de muestra. No uses esas acciones como si persistieran en Django.
