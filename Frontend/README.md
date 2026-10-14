# Frontend web

Sitio público React/Vite conectado parcialmente a la API Django para cargar proyectos, publicaciones, eventos, perfil institucional y contenido de landing. La sesión web permite consultar/actualizar proyectos y gestionar el CMS, incluyendo estructura de secciones, datos de contacto, miembros y entidades. Para que los cambios sean compartidos, el API y PostgreSQL deben estar desplegados y `VITE_API_BASE_URL` configurada.

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

Proyectos y agenda consultan los registros publicados por API; una respuesta válida sin registros se muestra vacía. Las noticias y la información visual del Summit se leen de `/public/landing-content/`, donde el editor del sitio publica `site_sections`. Las publicaciones de API, si existen, también aparecen en noticias. Sin un evento publicado, la inscripción del Summit se muestra como no disponible. Personas y entidades se cargan desde `/public/landing-content/`; el CMS las lee y guarda mediante `/landing-content/`. La sincronización depende del API y PostgreSQL desplegados y de `VITE_API_BASE_URL` configurada.

El panel conserva vistas locales para reuniones, minutas, votaciones y archivos. La web no incluye actualmente un panel para editar el perfil institucional o las publicaciones. El formulario de inscripción no guarda en el backend y el formulario de contacto aún conserva una respuesta de éxito de respaldo; ambos flujos están pendientes y no deben considerarse envíos confirmados.

La sección **Proyectos** ya consulta `GET /projects/` al entrar al panel y persiste cambios de estado con `PATCH /projects/{id}/`. Si la API no responde, mantiene la lista demostrativa y avisa que las acciones quedan locales. La creación, el avance y la visibilidad siguen siendo demostrativos porque la interfaz actual no captura los identificadores y campos del modelo que hacen falta para guardarlos correctamente. La conexión usa las validaciones y permisos existentes del servidor; el panel no debe asumir que un botón visible concede autorización.

El mapa de conexiones, sus límites y criterios ACID están en [Docs/ESTADO_INTEGRACION.md](../Docs/ESTADO_INTEGRACION.md).
