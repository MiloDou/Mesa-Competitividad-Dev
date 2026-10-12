# Contrato de API del Backend

Base local: `http://127.0.0.1:8000/api/v1/`. OpenAPI fuente de verdad: `/api/schema/`; Swagger UI: `/api/docs/`. La API pagina colecciones con `page` y devuelve `count`, `next`, `previous` y `results`.

## Autenticación y respuestas

En rutas privadas envía `Authorization: Bearer <access>`. `POST /auth/login/` devuelve access/refresh tokens y perfil; el access dura 20 minutos y el refresh se rota, con vida de 30 días. `POST /auth/logout/` revoca la sesión del token utilizado y desactiva sus tokens push. Al cambiar/restablecer una contraseña se revocan las sesiones y dispositivos de la cuenta.

Los errores de DRF tienen esta forma:

```json
{"error":{"code":"validation_error","detail":{"field":["Descripción del error"]}}}
```

El código HTTP sigue la semántica REST: 400 validación, 401 falta de sesión, 403 sin capacidad, 404 fuera del ámbito visible y 429 límite de solicitudes. Las rutas `/public/`, `/auth/login/`, `/auth/refresh/`, `/auth/password-reset/`, `/auth/password-reset/confirm/`, `/health/` y el esquema son públicas.

## Identidad, directorio y permisos

| Método y ruta | Acceso | Uso |
| --- | --- | --- |
| `POST /auth/login/`, `/auth/refresh/`, `/auth/logout/`; `GET /auth/me/` | Login/refresh públicos; logout/me requieren sesión | Entrar, rotar tokens, revocar la sesión y leer el perfil. |
| `POST /auth/password-reset/`, `/auth/password-reset/confirm/` | Público con límite por IP | Solicitar enlace y definir una contraseña nueva; la respuesta de solicitud no revela si existe el correo. |
| `/users/`, `/positions/`, `/position-assignments/` | `users.manage` (Comisión) | Gestionar cuentas, roles, cargos e historial de asignación. Borrar un usuario lo desactiva y revoca sus sesiones. |
| `/institutions/`, `/commissions/`, `/members/`, `/commission-memberships/` | Lectura: `directory.read`; escritura: `directory.write` | Directorio interno, consentimiento de publicación y periodos de representación. Cerrar una pertenencia preserva su historial. |
| `GET /public/institutions/`, `/public/members/` | Público | Solo miembros activos con autorización para perfil; email/teléfono aparecen únicamente con consentimiento de contacto. |

Las capacidades se asignan inicialmente a cuatro roles (`commission`, `editor`, `reader`, `member`). En cuentas con varios roles se suman capacidades; en el caso móvil también se exige un perfil `Member` activo y una pertenencia vigente a la comisión. Ver la matriz y salvedad al final.

## Proyectos, seguimiento y archivos

| Método y ruta | Acceso | Uso |
| --- | --- | --- |
| `/projects/` | `projects.read`; escribir `projects.write`; publicar `projects.publish`; consultar confidencial temporal: `confidentiality.read` (Comisión) | Proyectos con estados de borrador, activo, pausado, completado y archivado. Público y Uso Interno son los niveles predeterminados; solo Comisión puede consultar o asignar Confidencial Temporal. El miembro móvil queda limitado a sus comisiones vigentes, sin acceso temporal confidencial, y a proyectos realmente públicos. |
| `POST /projects/{id}/publish/` | `projects.publish` | Solo publica una iniciativa clasificada pública que no esté en borrador ni archivada. |
| `/project-history/`, `/follow-up-topics/`, `/project-assignments/` | `projects.read`; escritura con `projects.write` | Historial de cambios y seguimiento. Las asignaciones guardan varios responsables por proyecto y su vigencia; para retirarlos se establece fecha final, no se borra el historial. |
| `/documents/` | `documents.read` / `documents.write`; consultar confidencial temporal: `confidentiality.read` (Comisión) | Metadatos y carga `multipart/form-data`; cada documento pertenece a exactamente un proyecto o minuta. Público y Uso Interno son los niveles predeterminados; solo Comisión puede consultar o asignar Confidencial Temporal. |
| `GET /documents/{id}/download/` | `documents.read` y ámbito autorizado; `confidentiality.read` para archivos temporales | Descarga con autorización del servidor; nunca se publica `MEDIA_ROOT`. |
| `GET /public/projects/` | Público | Solo proyectos públicos publicados, no borradores ni archivados. Incluye temas de seguimiento no archivados, descripción y estado de avance para consulta cívica. |

## Reuniones, minutas y acuerdos

| Método y ruta | Acceso | Uso |
| --- | --- | --- |
| `/meetings/`, `/attendance/` | Lectura `meetings.read`; escritura `meetings.write` | Reuniones con agenda, fecha, modalidad, enlace y lista de invitados. `invited_member_ids` acepta miembros vigentes de la comisión; si se omite al crear, se invita a todos los miembros vigentes. La respuesta móvil incluye `is_invited` y no expone la lista de otros miembros. Solo se registra asistencia de convocados. Crear o reprogramar una convocatoria notifica a sus invitados. |
| `/minutes/` | Lectura `meetings.read`; borrador `meetings.write` | Crear/editar borradores; el cliente no puede cambiar el estado aprobado mediante un `PATCH`. |
| `POST /minutes/{id}/approve/` | `minutes.approve` (Comisión) | Aprueba y registra autor/fecha; desde entonces el modelo bloquea cambios. |
| `GET /minutes/{id}/pdf/` | `meetings.read` y ámbito de la comisión | Exporta la minuta y acuerdos a PDF. Miembros móviles solo ven minutas aprobadas. |
| `/agreements/` | Lectura `meetings.read`; escritura `meetings.write` | Acuerdos asociados a una minuta activa aprobada. |

## Votaciones

| Método y ruta | Acceso | Uso |
| --- | --- | --- |
| `/votings/` | Lectura `voting.read`; crear/configurar `voting.manage` | Crear y configurar una votación vinculada exactamente a un proyecto o acuerdo (`project` o `agreement`), definir opciones/fechas y mantenerla en borrador. Incluye el resumen ejecutivo del tema y `member_has_voted`; el miembro no recibe borradores aún no programados ni temas temporalmente confidenciales. |
| `GET /votings/pending/` | `voting.read` + miembro con representación vigente | Bandeja de votaciones abiertas que todavía no tienen voto de esa cuenta. |
| `POST /votings/{id}/schedule/` | `voting.manage` | Programa una votación con apertura futura y cierre opcional posterior. |
| `POST /votings/{id}/open/`, `/close/` | `voting.open_close` (Comisión) | Abre o cierra el proceso y encola los avisos móviles correspondientes. |
| `POST /votings/{id}/cast/` | `vote.cast` + miembro/representación vigente | Recibe `{ "option": "…", "client_request_id": "UUID" }` obligatorio. Repetir el mismo UUID y opción devuelve el mismo acuse sin duplicar el voto; reutilizarlo con otra selección se rechaza. Una restricción única en base de datos protege el proceso por miembro y UUID; los votos no se editan ni borran. |
| `GET /votings/{id}/results/` | `voting.read` | Devuelve conteos y porcentajes de los votos emitidos por opción solo cuando el proceso está cerrado. No adjudica ganadores, quórum ni aprobación. |

Quórum, aprobación, desempate y publicación de una conclusión siguen pendientes de definición por la Mesa. El comando `python manage.py process_votings` debe ejecutarse periódicamente para activar procesos programados y cerrar los vencidos.

## Contenido público, eventos y contacto

| Método y ruta | Acceso | Uso |
| --- | --- | --- |
| `/publications/` | Lectura `content.read`; borradores `content.write`; publicar `content.publish` | CMS; el editor no puede publicar ni modificar contenido ya publicado. El contenido se valida como texto plano/JSON sin HTML. |
| `GET /public/publications/` y `GET /public/publications/{slug}/` | Público | Solo contenido publicado y no archivado. |
| `/site-profile/`, `/site-profile/{id}/` | Lectura `content.read`; actualización `content.write` | Editar misión, visión, objetivos, sectores, marco de trabajo y referencias al logotipo/banner institucional. El registro `main` se crea en la migración. |
| `/media-assets/`, `/media-assets/{id}/download/` | `content.read` / `content.write` | Cargar imágenes PNG/JPEG válidas de hasta 5 MB. El backend corrige orientación, redimensiona al máximo de 1920 px y optimiza compresión. Los archivos se guardan privados y solo se sirven por la ruta pública cuando están enlazados a contenido publicado o al perfil institucional. |
| `GET /public/site-profile/` | Público | Datos institucionales, misión/visión, sectores y URLs seguras de logotipo/banner. |
| `/events/` | Lectura `events.read`; edición `events.write`; publicar/cancelar `events.publish` | Gestión de eventos con agenda, modalidad presencial/virtual/híbrida, ubicación/enlace, imagen e inscripción. Publicar está reservado a Comisión y exige al menos diez días naturales antes del inicio. |
| `GET /events/{id}/registrations/`, `DELETE /events/{id}/registrations/{registration_id}/` | `events.registrations` (Comisión) | Consultar inscripciones privadas y cancelarlas sin borrar historial. |
| `GET /public/events/`, `/public/events/{slug}/` | Público | Eventos publicados. |
| `GET /public/media-assets/{id}/download/` | Público | Descarga de una imagen enlazada a contenido público vigente; imágenes de borradores y archivadas responden 404. |
| `POST /public/events/{slug}/register/` | Público con límite de solicitudes | Guarda nombre, correo e institución; impide duplicados y exceder capacidad. |
| `POST /public/contact/` | Público, máximo 10 solicitudes por hora/IP | Guarda nombre, correo, teléfono obligatorio, asunto opcional y mensaje; el aviso por email requiere SMTP configurado. |
| `/contact-requests/` | `contact.manage` (Comisión) | Revisar y actualizar estado de solicitudes; los datos personales no se exponen a Editor/Lector. |

## Avisos, dispositivos y auditoría

| Método y ruta | Acceso | Uso |
| --- | --- | --- |
| `/notifications/`, `/notifications/{id}/` | Sesión; solo la cuenta propietaria | Leer avisos, incluyendo convocatorias y apertura/cierre de votación. |
| `POST /notifications/{id}/mark_read/`, `/notifications/mark_all_read/` | Sesión | Marcar lectura. |
| `/devices/` | Sesión; solo dispositivos propios | Registrar/reactivar token Expo y desactivarlo al cerrar sesión o borrar el registro. |
| `GET /audit-events/` | `audit.read` (Comisión) | Consultar bitácora inmutable, con actor, roles del actor al momento de la acción, marca de tiempo y cambios; no se puede editar ni borrar mediante API. Los votos se auditan sin almacenar su opción en la bitácora. |

El envío push requiere configurar Expo y correr `python manage.py deliver_push` periódicamente. Los avisos permanecen consultables en la bandeja aunque push esté desactivado.

## Matriz resumida de roles

| Rol | Acceso resumido |
| --- | --- |
| Comisión | Gestión completa, consultar/autorizar información temporal confidencial, publicar, abrir/cerrar votaciones, aprobar minutas, usuarios, contactos, registros y auditoría. |
| Editor | Crear/editar borradores y operaciones internas asignadas; no administra usuarios, no publica contenido y no abre/cierra votaciones. |
| Lector | Consulta de información interna, sin operaciones de escritura. |
| Miembro | Consulta móvil de su comisión, documentos autorizados, avisos y voto con representación vigente. |
| Público | Contenido publicado, proyectos autorizados y miembros con consentimiento; contacto e inscripción con registro y límites. |

La suma de capacidades entre varios roles es una decisión técnica provisional. La documentación fuente marca pendiente cómo combinar roles simultáneos y el caso de un administrador que también vota; validar esa política antes de usar cuentas reales. La capacidad de votar además exige que la cuenta esté asociada a un miembro y a una representación vigente.

## Límites de verificación

La API, las migraciones, permisos, SQLite local, el comando de respaldo SQLite y contratos OpenAPI tienen pruebas. La interfaz web y móvil todavía no está conectada. SMTP, Expo Push, PostgreSQL, almacenamiento privado durable, escaneo antimalware y disponibilidad 99.5% dependen de infraestructura y configuración externa. La periodicidad/retención de respaldos, `pg_dump` en PostgreSQL y una restauración real aún deben verificarse en el entorno donde se despliegue.
