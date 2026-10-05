# Instrucciones para agentes de código

Aplica a todo este repositorio. Lee `README.md`, `CONTRIBUTING.md` y, según la tarea, `Docs/LINEAMIENTOS_GITHUB.md`. `Backend/` contiene una API Django REST modular documentada en `Docs/API_BACKEND.md`; `Frontend/` y `Mobile/` siguen siendo prototipos y aún no consumen esa API. No presentes una función como integrada en el cliente si solo existe en la API o en un prototipo.

## Alcance y cooperación

- Antes de editar, revisa `git status` y los archivos pertinentes. Respeta cambios sin confirmar de otras personas; no los sobrescribas, restaures ni incluyas en tus commits.
- Trabaja en la carpeta asignada y con el menor diff útil. No muevas, renombres, crees o reorganices carpetas por comodidad. Si una tarea exige tocar otro módulo, explica la dependencia y coordina con sus responsables antes de integrarla.
- Divide el trabajo por tarea y evita que dos agentes editen el mismo archivo al mismo tiempo. Comunica contratos de API, tipos compartidos, permisos y modelos de datos a quienes trabajan en web, móvil y backend.
- Usa ramas y PR pequeños conforme a `CONTRIBUTING.md`. En el PR registra alcance, archivos, riesgos, verificación y decisiones pendientes. Nunca resuelvas un conflicto borrando trabajo ajeno.
- Si una instrucción o requerimiento contradice la implementación, expón la diferencia y pide una decisión; no inventes acuerdos de la Mesa ni del docente.

## Seguridad y aprobación obligatoria

- Trata el repositorio como público. No agregues secretos, `.env` reales, datos personales, contactos sin consentimiento, expedientes internos ni registros de producción al código, pruebas, documentación, capturas o logs. Usa datos sintéticos y `.env.example` con valores ficticios.
- La autorización, los permisos, la confidencialidad y la regla de un voto por miembro deben validarse en el servidor cuando se implementen. No presentes un estado visual como prueba de autenticación, votación, persistencia o envío real.
- **Detente y solicita aprobación específica del usuario antes de ejecutar cualquier cambio de riesgo, aun en modo automático.** Expón rutas exactas, cambio propuesto, motivo, consecuencias, forma de reversión y personas o módulos afectados. Espera una respuesta explícita; el silencio no autoriza.
- Son cambios de riesgo: editar autenticación, roles, permisos, votaciones, privacidad o visibilidad pública; alterar contratos API o modelos compartidos; migrar o borrar datos; editar secretos, configuración de producción o despliegue; instalar o subir versiones mayores de dependencias; eliminar, renombrar o reestructurar código/carpetas; reemplazar trabajo ajeno; hacer `reset --hard`, `push --force`, merge a la rama principal o publicar/desplegar. Incluye cualquier cambio cuya falla pueda perder datos, exponer información o romper otro componente.
- También pide aprobación antes de una acción irreversible o externa con efectos reales. Una solicitud general de “arreglar” o un modo autónomo no equivale a aprobación del cambio concreto. Si el usuario ya aprobó explícitamente ese mismo cambio con sus consecuencias, no repitas la pregunta.
- Puedes inspeccionar y proponer sin aprobación. Para cambios pequeños y reversibles dentro del alcance aprobado, continúa y explica el resultado.

## Pruebas con uso moderado de tiempo y tokens

- Para cada cambio funcional, añade o ajusta solo las pruebas unitarias del comportamiento afectado. Prefiere casos pequeños y datos sintéticos; no crees snapshots extensos ni pruebas duplicadas.
- Ejecuta primero la prueba o el archivo de pruebas relevante con el filtro del runner. Si pasa, detente ahí. Si falla, resume el error, corrige la causa y vuelve a ejecutar esa prueba. Ejecuta la suite completa solo si cambió una pieza compartida, se prepara una integración o el usuario lo pide.
- Muestra únicamente el comando, el resultado y el fragmento de error necesario; evita volcar logs completos, archivos grandes o toda la suite en el chat. Lee archivos pertinentes con búsquedas acotadas.
- Si el módulo no tiene runner ni script `test`, indícalo sin afirmar que `build` o `lint` son pruebas unitarias. Propón una configuración mínima como tarea separada; instalarla requiere aprobación si introduce una dependencia mayor o afecta a otros módulos.
- No repitas comandos costosos sin una hipótesis nueva. Si una prueba depende de servicios externos o datos reales, sustituye esas dependencias por dobles de prueba; solicita aprobación antes de usar sistemas reales.

## Cierre de tarea

Informa qué cambió, dónde, qué prueba puntual se ejecutó y su resultado, qué no se pudo verificar y qué coordinación o aprobación queda pendiente. Mantén README y documentación alineados con el estado real del código.
