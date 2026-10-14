# Integración funcional y criterios ACID

Este documento registra qué cliente consume cada contrato y cómo se conserva la integridad de los datos. La fuente autoritativa de permisos, validaciones y persistencia es la API; los datos locales de demostración no confirman operaciones del sistema.

## Estado de conexión

| Flujo | Backend/API | Sitio web | App móvil | Estado verificable |
| --- | --- | --- | --- | --- |
| Contenido público/CMS | `/public/projects/`, publicaciones, eventos y perfil; editor visual de la landing en `/landing-content/` y `/public/landing-content/` | El editor lee y guarda secciones, miembros y entidades por API. La landing también consume el conjunto de demostración de proyectos, agenda y ponentes guardado en las secciones del CMS cuando todavía no hay registros publicados en las tablas relacionales | Consulta pública de iniciativas | Parcial |
| Inicio de sesión y roles | `/auth/login/`, `/auth/refresh/`, `/auth/me/`, `/auth/logout/`; permisos por capacidad | Login/logout conectados; la API protege las operaciones del panel | Login, refresh y logout conectados; sesión en memoria hasta cerrar la app | Parcial |
| Proyectos/iniciativas | CRUD privado y publicación; consulta pública de publicados | Lista y actualización de estado conectadas; creación, avance y visibilidad conservan el flujo demostrativo | Lista de proyectos autorizados y pública conectadas; no hay edición móvil | Parcial |
| Reuniones y minutas | `/meetings/`, `/minutes/`, `/agreements/`, PDF y aprobación | Panel aún usa datos locales | Consulta de reuniones conectada; minutas y asistencia aún no | Parcial |
| Votación | `/votings/`, `/votings/{id}/cast/`, resultados al cierre | Panel aún usa datos locales | Consulta, voto idempotente y resultados cerrados conectados | Parcial |
| Avisos/documentos | Bandeja, dispositivos y descargas protegidas | No integrado en el panel | Bandeja y metadatos de documentos conectados; push y descarga no | Parcial |

La configuración móvil lee `EXPO_PUBLIC_API_BASE_URL`; `Mobile/.env.example` da el valor inicial de Android Emulator (`http://10.0.2.2:8000/api/v1`). Para iOS Simulator se puede usar `127.0.0.1`; un teléfono físico requiere la IP LAN de la computadora, un `runserver` ligado a la interfaz local y esa IP en `DJANGO_ALLOWED_HOSTS`. `Backend/.env.example` agrega el host estándar del emulador y `Frontend/.env.example` configura el sitio con `127.0.0.1`. No incluyas tokens ni credenciales en estas variables. La sesión de Mobile se mantiene en memoria: al cerrar la app se requiere volver a iniciar sesión.

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
2. Ante falta de red, conservar el contenido de muestra que ya existía y marcarlo como demostración; nunca presentarlo como un dato recién guardado.
3. Ante `401`, solicitar inicio de sesión o renovar la sesión según el flujo existente. Ante `403`, explicar que la cuenta no tiene permiso; no intentar una ruta alternativa para eludir el control.
4. Ante validación `400`, mostrar el detalle de campo devuelto por el servidor. Ante error temporal, permitir reintentar la misma operación con las protecciones idempotentes disponibles.
5. No almacenar contraseñas, tokens o información personal en fixtures, logs ni código fuente.

## Preparación de integración local

1. Configurar `Backend/.env` desde `.env.example`, aplicar migraciones y arrancar Django según [Backend/README.md](../Backend/README.md).
2. Para el sitio, definir `VITE_API_BASE_URL` solo si el backend no está en su dirección local por defecto. Para Mobile, definir `EXPO_PUBLIC_API_BASE_URL` con un host alcanzable desde el dispositivo.
3. Cargar solo los datos ficticios preparados para desarrollo y ejecutar cada flujo con cuentas de prueba de rol adecuado.
4. Registrar en la matriz de trazabilidad el requisito, pantalla, ruta API, rol de prueba y evidencia observada. No convertir estados locales de demostración en evidencia de persistencia.

## Pendientes antes de afirmar integración completa

- Persistencia segura de la sesión móvil entre reinicios y descarga autenticada de documentos.
- Integrar programación de reuniones, creación/aprobación de minutas y el flujo de archivos multimedia en los paneles; la landing, miembros y entidades ya tienen endpoints, pero su persistencia en producción sigue sin verificarse.
- Evitar presentar como persistidos los campos de avance, creación y visibilidad de proyectos que aún se editan localmente en el panel.
- Pruebas de aceptación de extremo a extremo para los flujos que se integren y registro de evidencias en la matriz de trazabilidad.
- Confirmación de las reglas institucionales de quórum, aprobación, desempate y publicación de resultados.
- Cotejar los diagramas resumidos de [ARQUITECTURA_ACTUAL.md](ARQUITECTURA_ACTUAL.md) con la matriz fuente de 75 requisitos y las versiones académicas previas fuera del repositorio.
