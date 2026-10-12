# Mesa de Competitividad de Quetzaltenango

Plataforma digital para apoyar la presencia pública y la gestión interna de la Mesa de Competitividad de Quetzaltenango. El proyecto responde a la información institucional dispersa, la dificultad de dar seguimiento a iniciativas y acuerdos, la rotación de representantes y la necesidad de comunicar convocatorias a los miembros.

> **Estado del repositorio:** `Backend/` contiene una API Django REST modular, migraciones, permisos, documentación OpenAPI y pruebas automatizadas. `Frontend/` consume algunas rutas públicas, autenticación y formularios; el panel administrativo aún contiene vistas demostrativas. `Mobile/` todavía no consume la API. PostgreSQL, SMTP y Expo Push requieren configuración; no se afirma que estén desplegados.

## Componentes y alcance

1. **Sitio institucional público:** la API ya ofrece información de la Mesa, noticias, actividades, Summit 2026, directorio con datos autorizados, iniciativas públicas, contacto e inscripción; falta conectar la interfaz web.
2. **Sistema administrativo web:** gestión de usuarios y roles, miembros e instituciones, proyectos/iniciativas y sus documentos, reuniones, minutas, acuerdos, votaciones y contenido público. La información en proceso debe respetar su nivel de confidencialidad.
3. **Aplicación móvil para miembros:** inicio de sesión, reuniones próximas, avisos/notificaciones, consulta de propuestas e iniciativas, participación en votaciones y consulta de resultados habilitados. Debe mantener flujos claros y breves; la administración completa pertenece al sistema web.

El alcance final debe actualizarse para coincidir con lo que efectivamente se construya y valide. La aplicación móvil no reemplaza el panel administrativo. Pagos, funcionalidades no aprobadas y cualquier módulo no descrito en el alcance validado quedan fuera de esta versión salvo acuerdo explícito.

## Usuarios principales

- **Administrador / Comisión:** administra accesos, configuración y operaciones autorizadas.
- **Editor:** registra y actualiza información según los permisos asignados.
- **Lector:** consulta información interna permitida.
- **Miembro:** consulta reuniones y propuestas, recibe avisos y vota cuando está habilitado.
- **Público general:** consulta el contenido institucional publicado.

Los permisos concretos deben documentarse en una matriz. Una persona puede desempeñar más de un rol; hay que definir cómo se combinan permisos y cómo se conserva el derecho a voto. Al cambiar un representante, se reasigna el acceso al cargo sin reutilizar credenciales. No se publica ningún dato personal sin autorización de su titular.

## Arquitectura y tecnologías propuestas

La API está implementada como un monolito modular Django REST Framework, con SQLite para desarrollo y PostgreSQL para entornos compartidos; sus versiones están registradas en `Backend/requirements.txt`. Las interfaces web React/Vite y móvil Expo todavía no consumen la API. SMTP, Expo Push y el despliegue productivo requieren configuración externa. El equipo aún debe validar con el docente/cliente si priorizará una web adaptable/PWA o completará la app nativa, porque los lineamientos académicos solicitan evidencia móvil.

## Requisitos destacados y decisiones pendientes

- La matriz fuente contiene 75 requerimientos en estado **Definido**; ese estado describe requisitos especificados, no funcionalidades implementadas. La copia de trabajo está fuera de este repositorio y debe incorporarse/actualizarse en `Docs/` para que GitHub conserve la trazabilidad completa.
- Trazar cada requerimiento a diseño, implementación y prueba en una matriz actualizada.
- Definir quórum, criterio de aprobación, empate y publicación de resultados de votación con la Mesa.
- Aclarar permisos simultáneos (por ejemplo, administrador que también vota) y transición de representantes.
- La API incorpora historial de representación, presupuesto/sector y responsables múltiples de proyectos, agenda/modalidad/enlace e invitados de reuniones, vigencia/opciones y porcentajes de votación, tres niveles de confidencialidad, auditoría general, borrado lógico, sesiones revocables, voto idempotente, token push, medios del CMS optimizados y avisos de convocatoria/apertura/cierre. El backend está implementado y su matriz de rutas OpenAPI valida; el sitio y la app móvil aún deben conectarse a la API, y el despliegue y las integraciones externas requieren configuración.
- Resolver la infraestructura y el método de medición asociados a los requerimientos de disponibilidad; mantener diagramas sincronizados con el sistema real.
- Convertir metas de rendimiento/disponibilidad en criterios que el equipo pueda medir.
- Validar con la Mesa qué datos de contacto pueden publicarse y qué datos reales pueden usarse en pruebas.

El checklist de la primera entrega registró **9.40/10**. La API ya tiene una implementación modular; faltan validar con la Mesa las reglas pendientes y actualizar la matriz y diagramas para que reflejen el código. Consulta [Docs/API_BACKEND.md](Docs/API_BACKEND.md), [Backend/README.md](Backend/README.md) y [Docs/LINEAMIENTOS_GITHUB.md](Docs/LINEAMIENTOS_GITHUB.md).

## Estructura del repositorio

```text
.
├── Backend/    # API REST Django modular, migraciones, pruebas y OpenAPI
├── Docs/       # lineamientos, calendario y documentación técnica/funcional
├── Frontend/   # sitio público conectado parcialmente y panel administrativo en integración
└── Mobile/     # interfaz Expo para miembros; prototipo web anterior conservado
```

`Frontend/` y `Mobile/` tienen cada uno sus propios archivos `package.json` y `package-lock.json`. La [guía del Frontend](Frontend/README.md) describe las rutas web conectadas y sus límites; la [guía de Mobile](Mobile/README.md) explica la ejecución y los límites móviles actuales.

## Calendario de trabajo

- **3 de octubre de 2026:** avance interno indicado en la asignación del equipo.
- **14 de octubre de 2026:** Entregable académico No. 2 según los lineamientos del curso.
- **18 de octubre de 2026:** fecha de entrega del equipo solicitada para este plan.
- **29 de octubre de 2026:** Summit de Competitividad 2026; la documentación propone que el sitio esté publicado al menos diez días antes.
- **4 de noviembre de 2026:** entrega final académica indicada en los lineamientos del curso.

El calendario por responsable y día está en [Docs/CALENDARIO_ENTREGA.md](Docs/CALENDARIO_ENTREGA.md). La fecha del 14 y la del 18 corresponden a hitos distintos en las fuentes; confirmar con el docente si el 18 sustituye o complementa el corte académico.

## Trabajo con agentes de IA

Los agentes de código deben seguir [AGENTS.md](AGENTS.md): cambios acotados, coordinación entre componentes, protección de datos, aprobación explícita antes de cambios de riesgo y pruebas unitarias focalizadas. [Docs/INSTRUCCIONES_IA.md](Docs/INSTRUCCIONES_IA.md) indica cómo se aplican estas reglas. El backend tiene una suite Django; Frontend y Mobile aún no tienen un runner de pruebas unitarias.

## Inicio y configuración

Se necesita Node.js LTS. Cada frontend se ejecuta por separado desde la raíz del repositorio:

```powershell
cd Frontend
npm ci
npm run dev
```

La terminal mostrará la dirección local para abrir el sitio público y su panel en el navegador. Desde la raíz del repositorio, en otra terminal, inicia la interfaz móvil React Native/Expo:

```powershell
cd Mobile
npm ci
npm start
```

Abre la app con Expo Go mediante el QR o inicia un emulador Android y presiona `a` en la terminal de Expo. La [guía de Mobile](Mobile/README.md) explica los pasos y las limitaciones de la demostración. El frontend web y la app móvil son proyectos distintos; abrir el sitio web no muestra las pantallas de Expo. Para iniciar y verificar la API, sigue [Backend/README.md](Backend/README.md); el despliegue productivo requiere infraestructura externa.

## Seguridad y datos

No subir contraseñas, tokens, claves privadas, credenciales de producción, bases con información personal ni datos confidenciales de gestiones en proceso. Añadir secretos a `.gitignore`, entregar accesos por un canal seguro y separado, y usar datos ficticios en demos salvo autorización expresa. La visibilidad pública de iniciativas y contactos requiere validación conforme a las reglas de negocio.

## Equipo

La asignación disponible identifica a Diego y David para web y a German y Pablo para móvil. **Milo es Ronaldo Emilio Méndez Mayorga**, responsable indicado para backend/API; la segunda persona de esa pareja sigue sin identificarse en las notas. Ver [Docs/CALENDARIO_ENTREGA.md](Docs/CALENDARIO_ENTREGA.md). Todo el equipo comparte la responsabilidad de integración, documentación y entrega.

## Documentación fuente

Los documentos de análisis, requisitos, arquitectura, diagramas, entrevistas y retroalimentación académica usados para elaborar los lineamientos se encuentran en la carpeta de trabajo `Proyecto/` junto al repositorio. La documentación Markdown mantenida dentro de este repositorio está en `Docs/`. Antes de editar funcionalidades, revisar las decisiones pendientes y reflejar los cambios en la matriz de trazabilidad.
