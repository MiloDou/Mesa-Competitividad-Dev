# Casos iniciales de aceptación e integración

Estos casos sirven para comprobar los flujos de la entrega con una base local y cuentas sintéticas. **No se consideran ejecutados** hasta registrar fecha, commit, rol usado, respuesta observada y evidencia.

## Ejecución de pruebas automatizadas

Registro de ejecución en el árbol de trabajo actual (datos sintéticos; sin servicios externos):

| Comando | Resultado observado | Alcance directo | Límite |
| --- | --- | --- | --- |
| `cd Backend && .venv/bin/python manage.py test --verbosity 1` | **Aprobado:** 24 pruebas, 15.618 s; base temporal SQLite; sistema Django sin incidencias | API REST con `APIClient`: login, rotación/revocación de sesión, privacidad de contactos y proyectos, roles, archivos privados, reuniones/minutas, votos, notificaciones, CMS/eventos, permisos de borrador/publicación CMS, auditoría y respaldos | No valida concurrencia en PostgreSQL, despliegue, SMTP, Expo ni tráfico entre dispositivos reales |
| `cd Mobile && npm test -- --runInBand` | **Aprobado:** 4 suites, 26 pruebas | Adaptador móvil comprueba que login no reutiliza token, logout manda Bearer, refresh rota credenciales y reintenta, y refresh rechazado limpia la sesión; además, 22 pruebas existentes de componentes/contraste | `fetch` se simula en Jest; esto no es una sesión móvil conectada a un servidor en vivo |
| `cd Mobile && npm run typecheck` | **Aprobado** | Tipos TypeScript del cliente y pruebas móviles incluidas por la configuración | No comprueba comportamiento en runtime |
| `cd Frontend && npx tsc --noEmit && npm run build` | **Aprobado:** `tsc` sin errores; Vite transformó 61 módulos y completó el build | Valida tipado y que el bundle web se genera con las integraciones actuales | No es una prueba de flujos ni confirma conexión a un backend en vivo |
| `git diff --check` | **Aprobado** tras los cambios y pruebas descritos | Detecta errores de whitespace en el árbol de trabajo | No comprueba comportamiento |

La primera inspección del adaptador halló que logout no adjuntaba el token requerido; las pruebas nuevas cubren el caso y pasan tras el cambio. Las pruebas Django verifican directamente endpoints con su cliente HTTP de prueba y base temporal, no sobre la base local `Backend/db.sqlite3`. Los escenarios PA-01 a PA-12 de abajo siguen pendientes de comprobación manual/entre sistemas en vivo; no se reportan como ejecutados.

## Comprobación local de servicio

El 11 de octubre de 2026 (hora local de Guatemala), se inició el backend con una base SQLite temporal separada de `Backend/db.sqlite3`. `GET http://127.0.0.1:18000/api/health/` respondió **HTTP 200** con `{"status":"ok","database":"ok"}`. Esto confirma disponibilidad de ese proceso y conexión a esa base temporal durante la comprobación; no es una medición de disponibilidad de producción ni sustituye los escenarios PA-01 a PA-12. El flujo administrativo de punta a punta no se marcó como probado en navegador.

## Casos de aceptación

| ID | Requisito | Preparación y pasos | Resultado esperado | Evidencia a registrar |
| --- | --- | --- | --- | --- |
| PA-01 | Sitio público consume contenido | Iniciar API y web; cargar contenido sintético; abrir proyectos, publicaciones y eventos | Las secciones conectadas muestran respuestas de la API; un listado vacío no se presenta como dato guardado | Captura, respuesta de red y recurso en API |
| PA-02 | Autenticación móvil válida | Crear una cuenta sintética con perfil y representación vigente; configurar `EXPO_PUBLIC_API_BASE_URL`; ingresar en Mobile | Login recibe sesión; aparece el perfil y se cargan recursos que el servidor permite | Rol/capacidades ficticias, captura y respuestas de API |
| PA-03 | Credenciales inválidas | Desde Mobile, ingresar correo/contraseña inválidos | No se abre la sesión y se muestra error; no se registra token en código/fixtures | Mensaje observado y HTTP 401 |
| PA-04 | Consulta móvil de reuniones | Con sesión de miembro vigente, abrir Reuniones y el detalle | Solo aparecen reuniones visibles para la cuenta y sus datos devueltos por la API | Captura y respuesta de `GET /meetings/` |
| PA-05 | Consulta de iniciativas | Con sesión autorizada, abrir Iniciativas; repetir sin sesión con proyecto público publicado | La app muestra únicamente lo que devuelven `/projects/` o `/public/projects/`; sin API conserva datos identificados como demostración | Captura y respuesta del endpoint |
| PA-06 | Registrar voto | Con miembro vigente y votación abierta, seleccionar opción y confirmar una vez | La API confirma el voto y la app muestra éxito después del acuse; la lista se actualiza | Respuesta de cast, `client_request_id` ficticio y estado posterior |
| PA-07 | Reintentar el mismo voto | Reenviar el mismo `client_request_id` y opción desde una prueba controlada | La API responde idempotentemente sin duplicar el voto; un UUID con otra opción se rechaza | Conteo antes/después y respuestas API |
| PA-08 | Resultados cerrados | Cerrar una votación sintética y abrir resultados desde Mobile | La app presenta los conteos y porcentajes del endpoint; no infiere ganador/quórum | Respuesta `GET /votings/{id}/results/` y captura |
| PA-09 | Bandeja y documento autorizado | Con miembro autorizado, abrir avisos y metadatos de documentos | La bandeja y los metadatos provienen del servidor; no se indica que el archivo se haya descargado | Respuestas API y captura |
| PA-10 | Panel de proyectos | Iniciar sesión web; abrir Proyectos y cambiar estado de un registro de prueba | La lista procede de `GET /projects/`; el cambio procede de `PATCH`; se informa error de permiso/red sin fingir éxito | HTTP, auditoría/historial disponible y captura |
| PA-11 | Controles de acceso | Repetir `GET /projects/`, `/meetings/`, `/documents/` y cast con cuenta sin capacidad o sin representación | La API limita datos/acciones; el cliente no busca rutas alternativas ni muestra confirmación falsa | Respuestas 401/403/colección vacía según regla API |
| PA-12 | Respaldo de demostración sin API | Detener backend y abrir web y Mobile | Las vistas que ya disponían de muestra siguen abriendo y la UI identifica contenido local; ninguna escritura local afirma haber sido guardada en servidor | Captura de ambos clientes |

## Matriz de trazabilidad del Entregable No. 2

| Requisito del corte | Backend/API | Web | Mobile | Estado y siguiente evidencia |
| --- | --- | --- | --- | --- |
| Sitio institucional y CMS | Perfil, publicaciones, eventos, medios y rutas públicas implementadas | Lectura pública conectada; panel actualiza perfil y crea/edita/publica publicaciones; secciones, eventos y medios aún conservan flujos locales | No aplica como CMS | Parcial; ejecutar PA-01 en navegador y comprobar que una publicación guardada aparezca en el sitio |
| Autenticación y roles | Sesiones, refresh, acumulación técnica de capacidades y restricciones en servidor | Login/logout conectados; operaciones protegidas por API | Login/logout/refresh conectados; token vive en memoria | Integración parcial; comprobar PA-02/03/11. Política de roles requiere validación de la Mesa; almacenamiento seguro móvil queda pendiente |
| Gestión de proyectos/iniciativas | CRUD, permisos, confidencialidad e historial | Lista y estado conectados; creación, avance y visibilidad siguen locales | Consulta de proyectos permitidos y públicos | Parcial; comprobar PA-05 y PA-10; integrar campos restantes |
| Reuniones y/o minutas | Convocatorias, invitados, minutas, acuerdos y aprobación | Vistas administrativas aún locales | Consulta de reuniones conectada; minutas no | Parcial; comprobar PA-04 y conectar programación/gestión web a las rutas API existentes |
| Base de datos | Modelos/migraciones con SQLite local y configuración PostgreSQL | Consume API | Consume API | Implementado en desarrollo; adjuntar `/api/health/` y migraciones aplicadas |
| Backend/API | Endpoints, validación, permisos, esquema OpenAPI y pruebas de backend en código | Consume rutas públicas, login y proyectos | Consume autenticación y rutas de miembro | Implementado; guardar enlace/esquema y resultados de pruebas automatizadas existentes |
| Aplicación móvil | API ofrece contratos requeridos | No aplica | Expo integra sesión, reuniones, proyectos, votación, bandeja y metadatos | Integración inicial; comprobar PA-02 a PA-09 |
| Consulta de reuniones desde aplicación | `/meetings/` filtra por autorización | No aplica | Conectada con Bearer token y presenta detalle | Implementado en cliente; falta evidencia de ejecución PA-04 |
| Flujo inicial de votación | Cast idempotente y resultados cerrados | Panel administrativo de votaciones aún de muestra | Selección, UUID, cast y resultados cerrados conectados | Implementado en cliente; falta evidencia de ejecución PA-06 a PA-08 |
| Integración entre móvil y sistema | API compartida y permisos server-side | Proyectos y contenido público comparten API | Consulta y voto usan los mismos recursos | Parcial; ejecutar PA-04, PA-06 y PA-10 con la misma base sintética |
| Seguridad implementada | Autenticación, permisos, confidencialidad, límite de voto, sesiones y auditoría | Adjunta token y utiliza API | Adjunta token y usa control de acceso del servidor | Parcial; ejecutar PA-03/PA-07/PA-11; token móvil no persiste entre reinicios |
| Arquitectura, diagramas, MER y diccionario | Modelos de código fuente | — | — | Versión resumida en [ARQUITECTURA_ACTUAL.md](ARQUITECTURA_ACTUAL.md); falta comparar sistemáticamente contra todos los diagramas/versiones académicas |

La matriz de 75 requerimientos de la documentación académica sigue siendo la fuente completa y debe actualizarse requisito por requisito. Esta tabla cubre solo los puntos expresos del corte del 14 de octubre; no reemplaza ni reclasifica requisitos restantes.

## Medición de rendimiento y disponibilidad

Los valores de rendimiento y disponibilidad provienen de los requerimientos fuente; aún no hay un entorno de despliegue compartido para medirlos. El siguiente protocolo hace repetible la verificación, pero **no representa resultados ya obtenidos**:

| Requisito | Procedimiento propuesto | Criterio de aceptación | Estado |
| --- | --- | --- | --- |
| Carga inicial del portal menor de 3 s | En el navegador objetivo y una conexión acordada, medir 30 cargas sin caché del mismo build; guardar la exportación de Performance/Network y calcular mediana y p95 | p95 < 3 s; acordar con docente/cliente qué evento exacto define “carga inicial” antes de cerrar el resultado | Pendiente: ambiente y medición |
| Búsqueda de directorio y generación de PDF menor de 4 s | Ejecutar 30 consultas de directorio y 30 descargas de PDF con la misma base sintética, registrar duración HTTP y status, separar calentamiento y errores | p95 < 4 s para cada operación | Pendiente: datos/carga representativos y medición |
| Disponibilidad de 99.5% anual | Una sonda externa consulta `/api/health/` cada minuto en el entorno publicado y conserva intervalos, errores y ventanas de mantenimiento | `intervalos exitosos / intervalos totales >= 0.995`; para afirmar el valor anual se requiere el periodo anual completo | Pendiente: despliegue y monitoreo |

No se ejecutaron estas mediciones en la máquina local; pruebas unitarias, compilación y disponibilidad de un proceso local no demuestran un SLA productivo.
