# Frontend web

Sitio público React/Vite conectado a la API Django para cargar proyectos y publicaciones públicas, inscribir personas a eventos publicados, recibir consultas, e iniciar y cerrar sesión administrativa.

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
