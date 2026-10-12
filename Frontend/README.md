# Frontend web

Sitio público React/Vite conectado parcialmente a la API Django para cargar proyectos, publicaciones, eventos y perfil institucional, inscribir personas a eventos publicados y recibir consultas. La sesión web permite consultar/actualizar proyectos y gestionar el perfil institucional y borradores del CMS.

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

Las listas públicas, los formularios indicados y el inicio/cierre de sesión ya consumen la API. El panel administrativo conserva vistas demostrativas: reuniones, minutas, miembros, gestión de eventos y archivos, así como la edición y reordenamiento de secciones, no están conectados. El CMS sí carga y guarda el perfil institucional y publicaciones en borrador; la acción de publicar pasa por la capacidad del servidor. Las estadísticas del inicio, la junta directiva, documentos y archivos históricos conservan contenido de muestra. No uses esas acciones como si persistieran en Django.

La sección **Proyectos** ya consulta `GET /projects/` al entrar al panel y persiste cambios de estado con `PATCH /projects/{id}/`. Si la API no responde, mantiene la lista demostrativa y avisa que las acciones quedan locales. La creación, el avance y la visibilidad siguen siendo demostrativos porque la interfaz actual no captura los identificadores y campos del modelo que hacen falta para guardarlos correctamente. La conexión usa las validaciones y permisos existentes del servidor; el panel no debe asumir que un botón visible concede autorización.

El mapa de conexiones, sus límites y criterios ACID están en [Docs/ESTADO_INTEGRACION.md](../Docs/ESTADO_INTEGRACION.md).
