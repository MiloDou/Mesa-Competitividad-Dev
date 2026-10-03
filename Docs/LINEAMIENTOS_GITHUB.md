# Lineamientos de trabajo en GitHub

Estos lineamientos convierten en reglas de equipo los documentos de requerimientos, arquitectura, asignaciones y evaluación disponibles para el proyecto Mesa de Competitividad de Quetzaltenango. Aplican a `Frontend/`, `Backend/`, `Mobile/` y `Docs/`.

## 1. Organización y propiedad del trabajo

- Mantener separado el código web, el backend/API, la aplicación móvil y la documentación en sus carpetas correspondientes.
- Trabajar en ramas cortas por tarea. Usar nombres descriptivos, por ejemplo `feat/api-proyectos`, `fix/permisos-votacion` o `docs/instalacion-backend`.
- No trabajar directamente sobre la rama principal compartida. Integrar cambios mediante Pull Request, aunque la revisión sea entre compañeros.
- Cada PR debe explicar el problema, el cambio, cómo se verificó y qué requerimientos toca. Vincular el issue o tarea cuando exista.
- Antes de integrar, revisar que los cambios no rompan el trabajo de otro componente y que no contradigan los contratos de la API.
- Resolver conflictos con la persona autora del cambio; no borrar trabajo ajeno para desbloquear una integración.

## 2. Commits y revisión

- Hacer commits pequeños, con mensajes claros en español o inglés y un verbo de acción: `feat: agregar consulta de reuniones`, `fix: impedir voto duplicado`, `docs: explicar configuración local`.
- No mezclar en un commit cambios funcionales sin relación, archivos generados, credenciales o ajustes de formato masivo.
- En cada PR, comprobar como mínimo: ejecución del componente afectado, validaciones pertinentes y consistencia de documentación/matriz. Registrar los pasos y resultados en la descripción.
- Solicitar revisión a un compañero de otro componente cuando el cambio afecte API, permisos, datos compartidos o integración móvil-web.

## 3. Contratos entre componentes

- La API REST del backend es el punto común de acceso a datos y reglas de negocio para web y móvil.
- Documentar endpoints, autenticación, permisos, campos, errores y ejemplos en `Docs/` o en el componente backend.
- No duplicar reglas de autorización en cada cliente como sustituto de validarlas en el servidor.
- Coordinar cambios de modelo/API con web y móvil antes de integrarlos; actualizar diagramas, diccionario de datos y matriz de trazabilidad en el mismo cambio o PR asociado.
- Mantener el modelo y los diagramas alineados con la versión implementada. No presentar diseños iniciales como definitivos sin cotejarlos.

## 4. Calidad funcional y de producto

- Toda función nueva debe corresponder a requerimiento aprobado o quedar marcada como propuesta pendiente.
- Un requerimiento debe ser claro, específico, necesario, verificable y trazable. Evitar términos vagos como “rápido” o “fácil” sin criterio medible.
- Priorizar la separación de responsabilidades: cada módulo debe tener una responsabilidad clara y las reglas de negocio deben vivir en el backend.
- Mantener la app móvil enfocada en reuniones, avisos, consulta y votación. Diseñar con lenguaje claro, pocas acciones por pantalla y operaciones básicas de máximo cinco pasos según el levantamiento.
- Proteger la información en proceso y los datos personales. No publicar contactos sin consentimiento ni iniciativas confidenciales antes de su autorización.
- Para votaciones, hacer cumplir como mínimo un voto por miembro y registrar claramente el ciclo de vida de la votación; quórum, desempate y visibilidad de resultados se documentan como pendientes hasta validación de la Mesa.

## 5. Documentación obligatoria

Mantener en Markdown, cuando aplique:

- README general y README por componente con propósito, requisitos, versiones, instalación, configuración, ejecución y pruebas.
- Descripción de arquitectura y decisiones tomadas (incluido monolito regular o modular).
- Contrato/documentación de API.
- Diagrama de arquitectura, componentes, clases y secuencias principales; modelo entidad-relación y diccionario de datos.
- Matriz de trazabilidad: requerimiento, componente, caso de uso, prueba y estado.
- Plan y resultados de pruebas, incidencias y evidencia de usabilidad móvil.
- Manuales de usuario, instalación, despliegue, respaldo y restauración conforme se completen.
- Registro de decisiones pendientes, supuestos y acuerdos de la Mesa.

La entrega académica organiza la documentación final en siete piezas: (1) memoria general y especificación, (2) documentación técnica, (3) manual del sitio/CMS, (4) manual administrativo, (5) manual móvil, (6) instalación, despliegue y mantenimiento, y (7) plan y evidencias de pruebas. Para este avance no es necesario fingir que todos están completos: crear cada pieza conforme exista información verificada y señalar el estado real.

### Matriz de trazabilidad: observaciones que deben cerrarse

La matriz fuente disponible contiene 75 requerimientos con estado **Definido**. Es un inventario de especificación, no prueba de que las funciones estén implementadas. Sus observaciones destacan estos huecos que deben resolverse o registrarse como fuera de alcance con aprobación:

- Incorporar un caso de uso para el formulario de contacto y para asistencia al usuario; reflejar consulta de proyectos desde móvil, registro del token push y notificación al cerrar una votación.
- Resolver diferencias entre las versiones del MER para historial de vigencia de miembros, presupuesto/sector de proyectos, agenda y modalidad/enlace de reuniones, periodos de apertura/cierre y opciones de votación, sesiones/tokens, auditoría de operaciones y borrado lógico. Hay varias versiones del modelo (completo, núcleo e imágenes); por ejemplo, una observación sobre salida de miembros debe cotejarse con `Relacional 4.png`, donde aparece `fecha_salida` para pertenencia a comisión, y confirmar si también queda registrado el periodo de representación institucional.
- Definir cómo se representan los tres niveles de confidencialidad requeridos y cómo se configuran la disponibilidad, la infraestructura y su medición.
- Mantener vínculos válidos entre cada requerimiento, regla de negocio, caso de uso, entidad, prototipo, implementación y evidencia de prueba. No dejar observaciones conocidas sin responsable ni decisión.

La hoja de cálculo fuente `Matriz_Trazabilidad_Mesa_Competitividad.xlsx` se encuentra actualmente fuera de este repositorio, en la raíz del espacio de trabajo. Al incorporarla a `Docs/`, mantener la versión original y su lógica de vínculos; revisar las fórmulas en una copia antes de cambiar su estructura.

Para documentos formales del curso, seguir el lineamiento fuente: tamaño carta, márgenes de 2.54 cm, Arial 11/12, interlineado 1.5, numeración, títulos, índices y referencias APA 7 cuando corresponda. La documentación de repositorio debe ser breve, navegable y reflejar el producto real.

## 6. Secretos, archivos y datos

- Ignorar `.env`, credenciales, tokens, claves y archivos locales privados. Publicar solo `.env.example` con nombres de variables y valores ficticios.
- Incluir dependencias con versiones utilizadas en los archivos del gestor real (`requirements.txt`, `package.json`, configuración Expo u otros); no inventar versiones.
- No subir `node_modules`, entornos virtuales, compilados regenerables, cachés, builds, bases locales ni archivos temporales.
- Usar información ficticia para pruebas salvo que la Mesa autorice expresamente datos reales. Respetar la autorización individual de publicación de datos de contacto.

## 7. Integración y cierre de hitos

- Integrar temprano web, API y móvil usando datos de prueba; no esperar al final para comprobar autenticación y flujos completos.
- Para un hito, dejar una versión ejecutable, instrucciones reproducibles, matriz actualizada y evidencia de los flujos demostrados.
- Entregar correcciones académicas con los diagramas y requerimientos sincronizados con la implementación.
- Guardar accesos institucionales y de hosting de forma segura y entregarlos a la organización por mecanismo separado de los documentos públicos.

## 8. Referencias de este lineamiento

El alcance funcional y documental se consolidó a partir de los lineamientos de documentación y entrega del proyecto, el documento de requerimientos, el checklist de evaluación del Entregable No. 1, las asignaciones del equipo, la propuesta de arquitectura/tecnologías/modelo de datos, los diagramas y la transcripción de levantamiento. Las contradicciones y decisiones abiertas están señaladas en el README y en el calendario para su validación, no se consideran decisiones ya aprobadas.
