# Integración funcional y criterios ACID

Este documento registra qué cliente consume cada contrato y cómo se conserva la integridad de los datos. La fuente autoritativa de permisos, validaciones y persistencia es la API; los datos locales de demostración no confirman operaciones del sistema.

## Estado de conexión

| Flujo | Backend/API | Sitio web | App móvil | Estado verificable |
| --- | --- | --- | --- | --- |
| Contenido público/CMS | `/public/projects/`, instituciones normalizadas, publicaciones, eventos y perfil; editor visual de la landing en `/landing-content/` y `/public/landing-content/` | La landing muestra solo registros públicos de API; noticias, agenda y entidades no usan datos de demostración. El editor guarda secciones, miembros y entidades por API; las entidades también se sincronizan con `directory.Institution` | Consulta pública de iniciativas | Código integrado; migración y datos productivos requieren verificación tras despliegue |
| Inicio de sesión y roles | `/auth/login/`, `/auth/refresh/`, `/auth/me/`, `/auth/logout/`; permisos por capacidad | Login/logout conectados; la API protege las operaciones del panel | Login, refresh y logout conectados; refresh token en SecureStore nativo y access token en memoria | Parcial |
| Proyectos/iniciativas | CRUD privado, publicación y archivo lógico | Lista, alta, edición (incluye responsable y avance), cambio de visibilidad, publicación y archivo conectados. El detalle consulta documentos y permite cargarlos, descargarlos y archivarlos. | Pantallas con datos de demostración; la app nativa todavía no consulta proyectos | Web conectada; responsable y avance persisten en la API y el portal solo muestra proyectos publicados |
| Reuniones y minutas | `/meetings/`, `/minutes/`, `/agreements/`, PDF y aprobación; el servidor filtra por permisos y representación | Calendario y alta, edición y archivo conectados a `/meetings/`; minutas y asistencia aún no | Inicio y lista consultan `/meetings/` con la sesión autenticada; detalle sin adjuntos, minutas ni asistencia | Parcial |
| Votación | `/votings/`, `/votings/{id}/cast/`, resultados al cierre | Panel aún usa datos locales | Consulta, voto idempotente y resultados cerrados conectados | Parcial |
| Avisos/documentos | Bandeja, dispositivos y descargas protegidas | Gestor conectado para listar, cargar, editar metadatos, descargar y archivar documentos vinculados a proyectos o minutas | Pantallas con datos de demostración; bandeja, descarga y push no conectados | Parcial |

La configuración móvil lee `EXPO_PUBLIC_API_BASE_URL`; `Mobile/.env.example` da el valor inicial de Android Emulator (`http://10.0.2.2:8000/api/v1`). Para iOS Simulator se puede usar `127.0.0.1`; un teléfono físico requiere la IP LAN de la computadora, un `runserver` ligado a la interfaz local y esa IP en `DJANGO_ALLOWED_HOSTS`. `Backend/.env.example` agrega el host estándar del emulador y `Frontend/.env.example` configura el sitio con `127.0.0.1`. No incluyas tokens ni credenciales en estas variables. La app nativa guarda el refresh token con SecureStore y renueva la sesión al abrir; el access token vive en memoria. En web usa almacenamiento local del navegador. El correo de contacto configurado es `mesadequetzaltenango@gmail.com`; esto no configura el SMTP requerido para invitaciones ni recuperación de contraseña.

### Arranque integrado de desarrollo

1. En `Backend/`, copia `.env.example` a `.env`, instala `requirements.txt`, ejecuta `python manage.py migrate`, `python manage.py seed_roles` y `python manage.py seed_demo_data`.
2. Arranca el backend con `python manage.py runserver`. El comando de datos de demostración es idempotente y solo admite SQLite con `DEBUG=true`.
3. En `Frontend/`, copia `.env.example` a `.env.local`, ejecuta `npm ci` y `npm run dev`.
4. En `Mobile/`, copia `.env.example` a `.env`, ejecuta `npm ci` y `npm start`. Para usar el login real, prepara una cuenta local con el rol y representación necesarios; el botón de demostración permanece disponible por separado.
5. El `DEBUG`, la base SQLite y los ejemplos son solo para desarrollo. SMTP, PostgreSQL compartido, Expo Push, HTTPS, dominio y operación 99.5% requieren valores y servicios del entorno real; esta configuración local no sustituye una puesta en producción.

## Criterios ACID de integración

- **Atomicidad:** los clientes llaman a las acciones de API previstas para completar cada operación. No simulan una escritura exitosa con estado local. Una acción que el backend realiza dentro de una transacción sigue siendo responsabilidad del backend; el cliente no puede hacer atómica una secuencia de varias peticiones HTTP.
- **Consistencia:** se muestran los datos y errores que devuelve el servidor. Los permisos, la vigencia de representación, confidencialidad, aprobación de minutas y reglas de votación se validan en el servidor. La interfaz no debe reinterpretar una respuesta denegada como una operación exitosa.
- **Aislamiento:** en particular, no se debe emitir un segundo voto como una nueva operación por un reintento de red. La API exige `client_request_id` UUID para que el mismo envío pueda repetirse idempotentemente; el identificador se conserva durante los reintentos de una misma intención de voto.
- **Durabilidad:** una confirmación de voto solo se presenta después de recibir respuesta satisfactoria de la API; la lista se vuelve a consultar después. La actualización de estado de proyectos espera la respuesta del servidor. Para durabilidad operativa se requiere la base configurada y respaldos/restauración comprobados en el entorno compartido.

## Operaciones y errores

1. La API responde con el recurso guardado o un error HTTP estructurado. Los clientes no deben modificar contratos ni inventar identificadores persistentes.
2. Ante falta de red, mostrar el error o estado vacío y permitir reintentar; no presentar contenido ficticio como si fuera un dato guardado o publicado.
3. Ante `401`, solicitar inicio de sesión o renovar la sesión según el flujo existente. Ante `403`, explicar que la cuenta no tiene permiso; no intentar una ruta alternativa para eludir el control.
4. Ante validación `400`, mostrar el detalle de campo devuelto por el servidor. Ante error temporal, permitir reintentar la misma operación con las protecciones idempotentes disponibles.
5. No almacenar contraseñas, tokens o información personal en fixtures, logs ni código fuente.

## Preparación de integración local

1. Configurar `Backend/.env` desde `.env.example`, aplicar migraciones y arrancar Django según [Backend/README.md](../Backend/README.md).
2. Para el sitio, definir `VITE_API_BASE_URL` solo si el backend no está en su dirección local por defecto. Para Mobile, definir `EXPO_PUBLIC_API_BASE_URL` con un host alcanzable desde el dispositivo.
3. Cargar solo los datos ficticios preparados para desarrollo y ejecutar cada flujo con cuentas de prueba de rol adecuado.
4. Registrar en la matriz de trazabilidad el requisito, pantalla, ruta API, rol de prueba y evidencia observada. No convertir estados locales de demostración en evidencia de persistencia.

## Pendientes antes de afirmar integración completa

- Conectar la consulta móvil de iniciativas, avisos y documentos; implementar la descarga móvil mediante la ruta autenticada del backend.
- Integrar creación/aprobación de minutas y asistencia, además del flujo móvil de archivos multimedia; la programación web de reuniones ya usa la API. La landing, miembros y entidades tienen endpoints, pero su persistencia en producción sigue sin verificarse.
- Conectar minutas, asistencia y adjuntos de reuniones en los clientes; el gestor web de documentos ya consume documentos vinculados a minutas existentes en la API.
- Pruebas de aceptación de extremo a extremo para los flujos que se integren y registro de evidencias en la matriz de trazabilidad.
- Confirmación de las reglas institucionales de quórum, aprobación, desempate y publicación de resultados.
- Cotejar los diagramas resumidos de [ARQUITECTURA_ACTUAL.md](ARQUITECTURA_ACTUAL.md) con la matriz fuente de 75 requisitos y las versiones académicas previas fuera del repositorio.
