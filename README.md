# Mesa de Competitividad de Quetzaltenango

Plataforma digital para apoyar la presencia pública y la gestión interna de la Mesa de Competitividad de Quetzaltenango. El proyecto responde a la información institucional dispersa, la dificultad de dar seguimiento a iniciativas y acuerdos, la rotación de representantes y la necesidad de comunicar convocatorias a los miembros.

> **Estado del repositorio (revisión del commit `2d3f3cb`):** `Frontend/` contiene un prototipo web en React/Vite del sitio público y el panel; `Mobile/` contiene otro prototipo web en React/Vite con pantallas de teléfono. `Backend/` todavía solo contiene `.gitkeep`. Las pantallas usan principalmente datos locales y no constituyen una integración funcional con API, PostgreSQL ni notificaciones push.

## Componentes y alcance

1. **Sitio institucional público:** información de la Mesa, noticias, actividades, Summit 2026, directorio con datos autorizados, iniciativas públicas y contacto/inscripción cuando se confirme su implementación.
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

La propuesta documentada es cliente-servidor con una API REST compartida: React (web pública y panel, con Tailwind CSS), Django REST Framework (API, autenticación y reglas de negocio), PostgreSQL (datos relacionales) y React Native con Expo (móvil). El código subido todavía no implementa esa arquitectura completa: las dos interfaces son aplicaciones web Vite y no existe backend en el repositorio.

El equipo debe confirmar y documentar si el backend será un monolito regular o modular y registrar versiones reales de herramientas y dependencias. Las fuentes también plantean la opción de priorizar una web adaptable/PWA y dejar la app nativa como fase posterior, mientras que los lineamientos académicos solicitan evidencia de aplicación móvil en el segundo entregable. Esta decisión requiere validación del equipo y del docente/cliente antes de presentar el alcance como definitivo.

## Requisitos destacados y decisiones pendientes

- La matriz fuente contiene 75 requerimientos en estado **Definido**; ese estado describe requisitos especificados, no funcionalidades implementadas. La copia de trabajo está fuera de este repositorio y debe incorporarse/actualizarse en `Docs/` para que GitHub conserve la trazabilidad completa.
- Trazar cada requerimiento a diseño, implementación y prueba en una matriz actualizada.
- Definir quórum, criterio de aprobación, empate y publicación de resultados de votación con la Mesa.
- Aclarar permisos simultáneos (por ejemplo, administrador que también vota) y transición de representantes.
- Resolver las observaciones de la matriz contra las distintas versiones de diagramas/MER: falta el caso de uso del formulario de contacto; confirmar historial de salida de miembros, presupuesto/sector de proyectos, agenda/modalidad de reuniones y vigencia/opciones de votación; aclarar niveles de confidencialidad, auditoría general, borrado lógico e invalidación de sesión; y añadir al modelado móvil asistencia, consulta de proyectos, registro de tokens push y aviso de cierre de votación.
- Resolver la infraestructura y el método de medición asociados a los requerimientos de disponibilidad; mantener diagramas sincronizados con el sistema real.
- Convertir metas de rendimiento/disponibilidad en criterios que el equipo pueda medir.
- Validar con la Mesa qué datos de contacto pueden publicarse y qué datos reales pueden usarse en pruebas.

El checklist de la primera entrega registró **9.40/10** y recomienda cerrar esos puntos y precisar el tipo de arquitectura. Consulta [Docs/LINEAMIENTOS_GITHUB.md](Docs/LINEAMIENTOS_GITHUB.md) para los criterios del proyecto y [CONTRIBUTING.md](CONTRIBUTING.md) para proponer cambios en GitHub.

## Estructura del repositorio

```text
.
├── Backend/    # reservado para API; sin código todavía
├── Docs/       # lineamientos, calendario y documentación técnica/funcional
├── Frontend/   # prototipo web del sitio público y panel administrativo
└── Mobile/     # prototipo web de la interfaz para miembros
```

Los dos prototipos incluyen archivos `package.json` y `package-lock.json`. Cada componente debe añadir sus instrucciones completas de configuración, integración y despliegue cuando existan.

## Calendario de trabajo

- **3 de octubre de 2026:** avance interno indicado en la asignación del equipo.
- **14 de octubre de 2026:** Entregable académico No. 2 según los lineamientos del curso.
- **18 de octubre de 2026:** fecha de entrega del equipo solicitada para este plan.
- **29 de octubre de 2026:** Summit de Competitividad 2026; la documentación propone que el sitio esté publicado al menos diez días antes.
- **4 de noviembre de 2026:** entrega final académica indicada en los lineamientos del curso.

El calendario por responsable y día está en [Docs/CALENDARIO_ENTREGA.md](Docs/CALENDARIO_ENTREGA.md). La fecha del 14 y la del 18 corresponden a hitos distintos en las fuentes; confirmar con el docente si el 18 sustituye o complementa el corte académico.

## Inicio y configuración

Para ejecutar cada prototipo web localmente, entrar en `Frontend/` o `Mobile/` y usar `npm ci` seguido de `npm run dev`. Ambos tienen un script `npm run build`. No hay instrucciones reproducibles para backend, base de datos, app nativa o despliegue porque esos componentes aún no existen en el repositorio. Cada responsable debe añadir versiones, configuración, variables de entorno de ejemplo y pasos de ejecución conforme implemente su componente.

## Seguridad y datos

No subir contraseñas, tokens, claves privadas, credenciales de producción, bases con información personal ni datos confidenciales de gestiones en proceso. Añadir secretos a `.gitignore`, entregar accesos por un canal seguro y separado, y usar datos ficticios en demos salvo autorización expresa. La visibilidad pública de iniciativas y contactos requiere validación conforme a las reglas de negocio.

## Equipo

La asignación disponible identifica a Diego y David para web y a German y Pablo para móvil. **Milo es Ronaldo Emilio Méndez Mayorga**, responsable indicado para backend/API; la segunda persona de esa pareja sigue sin identificarse en las notas. Ver [Docs/CALENDARIO_ENTREGA.md](Docs/CALENDARIO_ENTREGA.md). Todo el equipo comparte la responsabilidad de integración, documentación y entrega.

## Documentación fuente

Los documentos de análisis, requisitos, arquitectura, diagramas, entrevistas y retroalimentación académica usados para elaborar los lineamientos se encuentran en la carpeta de trabajo `Proyecto/` junto al repositorio. La documentación Markdown mantenida dentro de este repositorio está en `Docs/`. Antes de editar funcionalidades, revisar las decisiones pendientes y reflejar los cambios en la matriz de trazabilidad.
