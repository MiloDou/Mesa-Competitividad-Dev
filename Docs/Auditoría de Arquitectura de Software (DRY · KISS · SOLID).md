# Auditoría de Arquitectura de Software (DRY · KISS · SOLID)

Oct 12, 2026 · @Diego

El sistema no cumple DRY ni SRP, y cumple parcialmente KISS, OCP, ISP y DIP; solo LSP se sostiene, con una excepción menor. Se revisaron `Backend/`, `Frontend/` y `Mobile/`. Esta entrega es solo análisis: no se modificó ningún archivo, y ninguna recomendación altera endpoints, UI, comportamiento ni esquemas de datos.

Como ajuste previo, la agenda del módulo Summit quedó únicamente dentro de «Desplegar Agenda» (se eliminó la cuadrícula inline duplicada en `EventSection.tsx`), y `npm run build` en `Frontend/` terminó sin errores.

## 1. Resumen ejecutivo

| Principio | Veredicto | Justificación |
| --- | --- | --- |
| DRY | No cumple | Código de sincronización con `localStorage` repetido en más de 12 archivos, datos mock duplicados entre `Frontend` y `Mobile`, y consultas de membresía de comisiones reescritas en 6 lugares del backend. |
| KISS | Cumple parcialmente | Componentes monolíticos (`SiteEditorTab.tsx` con más de 2,000 líneas), parser manual de fechas en texto libre y colecciones dinámicas aplanadas en claves con prefijo. |
| SOLID · S (responsabilidad única) | No cumple | `MembersTab` gestiona dos dominios distintos; `PublicSite` mezcla enrutamiento, red y formularios. |
| SOLID · O (abierto/cerrado) | Cumple parcialmente | Agregar secciones exige editar `switch` y ramas de renderizado fijas, sin un registro extensible. |
| SOLID · L (sustitución de Liskov) | Cumple | Las jerarquías de DRF y React respetan sus contratos base; excepción menor en `CapabilityReadOnlyViewSet`. |
| SOLID · I (segregación de interfaces) | Cumple parcialmente | Props extensas en secciones que solo necesitan mostrar datos pero reciben controladores completos de formulario. |
| SOLID · D (inversión de dependencias) | Cumple parcialmente | El cliente HTTP depende de `sessionStorage` global; `User.has_capability` consulta la base de datos en cada evaluación. |

## 2. Hallazgos identificados

Se identificaron 14 hallazgos: 3 de severidad alta (DRY-02, DRY-03 y KISS-01), 8 media y 3 baja.

| ID | Principio | Archivo : línea | Problema | Severidad | Impacto |
| --- | --- | --- | --- | --- | --- |
| DRY-01 | DRY | `Frontend/src/data/public.ts:13-68` y `Mobile/src/data/public.ts:13-68` | Datos iniciales duplicados de forma exacta (`PUBLIC_PROJECTS`, `STATUS_MAP`, `DIRECTIVA`, `DOCS`). | Media | Desincronización de datos ante cualquier cambio de negocio (fechas, puestos). |
| DRY-02 | DRY | `Frontend/src/views/PublicSite.tsx:212-242`, `ProjectsSection.tsx:18-52`, `AboutSection.tsx:13-48` | Lectura, parseo seguro y suscripción a eventos de `localStorage` repetidos en más de 12 componentes. | Alta | Código repetitivo propenso a errores de sincronización y mutación de estado en memoria. |
| DRY-03 | DRY | `Backend/voting/views.py:41-44`, `voting/services.py:19-25`, `projects/access.py:23-28` | Consulta de membresía activa de comisiones (`starts_at__lte`, `ends_at__gte`) escrita a mano en 6 lugares, con filtros asimétricos. | Alta | Riesgo de reglas de acceso inconsistentes entre votaciones, proyectos y reuniones. |
| DRY-04 | DRY | `Backend/portal/views.py:267-284, 307-312` | Validación de referencia pública de un `ContentAsset` repetida 3 veces en el mismo archivo. | Baja | Mantenimiento frágil al añadir entidades que usen imágenes del CMS. |
| KISS-01 | KISS / SRP | `Frontend/src/views/admin/tabs/SiteEditorTab.tsx:1-2018` | Componente de más de 2,000 líneas con saneamiento por regex, 7 formularios de sección, arrastrar y soltar, y vista previa. | Alta | Complejidad cognitiva extrema y alto riesgo de regresiones al tocar cualquier sección. |
| KISS-02 | KISS | `Frontend/src/views/admin/tabs/OverviewTab.tsx:12-39` | `parseMeetingTimestamp` interpreta texto informal en español con diccionarios de meses, aunque la entidad ya tiene `targetDate` ISO. | Media | Fragilidad ante formatos de fecha variados y lógica innecesaria en el cliente. |
| KISS-03 | KISS | `Frontend/src/data/admin.ts:167-270` | Colecciones dinámicas (hitos, artículos) aplanadas en claves `m1_year`, `m1_title`, `a1_title` y leídas con regex. | Media | Obliga a recorrer y borrar claves con regex en lugar de manipular arreglos tipados. |
| SOLID-S01 | S | `Frontend/src/views/admin/tabs/MembersTab.tsx:1-884` | Una vista gobierna miembros individuales y entidades colaboradoras, con 14 variables de estado. | Media | Mantenimiento acoplado de dos directorios independientes. |
| SOLID-S02 | S | `Frontend/src/views/PublicSite.tsx:1-431` | Actúa a la vez como almacén de estado, despachador de red, enrutador de pestañas y gestor de formularios. | Media | Cualquier cambio en contacto o en el modal de archivo re-renderiza la vista raíz. |
| SOLID-O01 | O | `Frontend/src/views/PublicSite.tsx:327-422` | Renderizado mediante un `switch` fijo con una rama por tipo de sección. | Baja | Agregar una sección obliga a editar el archivo central. |
| SOLID-L01 | L | `Backend/common/viewsets.py:44-46` | `CapabilityReadOnlyViewSet.get_permissions()` reasigna `action_capabilities` sin fusionar las declaradas en subclases. | Media | Un `@action` con capacidad propia se sobrescribe en silencio. |
| SOLID-I01 | I | `Frontend/src/views/public/sections/EventSection.tsx:21-32` | `EventSectionProps` mezcla 7 props de control de formulario con los datos del evento. | Baja | La presentación queda atada al estado del formulario. |
| SOLID-D01 | D | `Frontend/src/api/client.ts:43-58` | `apiRequest` está acoplado a `sessionStorage` global para guardar y rotar tokens. | Media | Impide reutilizar el cliente en SSR, pruebas sin mocks o React Native. |
| SOLID-D02 | D | `Backend/accounts/models.py:82-85` | `User.has_capability` hace `self.roles.filter(...)` a la base de datos en cada evaluación. | Media | Consultas idénticas repetidas durante un solo ciclo de autorización. |

## 3. Plan de trabajo propuesto

Siete prioridades que resuelven los hallazgos con refactors internos: mismas claves de almacenamiento, mismos endpoints, misma UI y mismas respuestas.

### Prioridad 1 · Hook común para `localStorage` (DRY-02)

- **Problema:** más de 12 componentes repiten la misma rutina de unas 25 líneas (`getItem`, `JSON.parse` con try-catch y listeners de `storage` y de eventos `window`).
- **Solución:** crear el hook `useSyncedStorage<T>(key, defaultValue, eventName)` en `Frontend/src/hooks/useSyncedStorage.ts` y reemplazar la repetición sin cambiar ningún formato ni valor guardado.
- **Archivos:** `ProjectsSection.tsx`, `ConformadosSection.tsx`, `AboutSection.tsx`, `OverviewTab.tsx`, `MeetingsTab.tsx`, `ProjectsArchiveModal.tsx`.
- **Riesgo:** bajo; se mitiga conservando las mismas claves y nombres de eventos.
- **Verificación:** editar un dato en el CMS y comprobar que el sitio público se actualiza en tiempo real como antes.
- **Esfuerzo:** S.

### Prioridad 2 · Consulta única de membresías de comisión (DRY-03)

- **Problema:** la pertenencia activa a una comisión se consulta a mano en 6 lugares, y algunos omiten `commission__is_active=True`.
- **Solución:** definir un método reutilizable, por ejemplo `CommissionMembershipQuerySet.active_on(date=None, member=None)`, o `Member.get_active_commission_ids(date=None)`.
- **Archivos:** `Backend/directory/models.py`, `voting/views.py`, `voting/services.py`, `projects/access.py`.
- **Riesgo:** bajo; la lógica queda idéntica pero consistente.
- **Verificación:** `python manage.py test`.
- **Esfuerzo:** S.

### Prioridad 3 · Fusionar capacidades en el viewset de solo lectura (SOLID-L01)

- **Problema:** `get_permissions()` pisa `action_capabilities` y elimina las capacidades de acciones personalizadas.
- **Solución:** igualar la lógica de `CapabilityViewSet` combinando diccionarios:

```python
self.action_capabilities = {
    **getattr(self, "action_capabilities", {}),
    "list": self.read_capability,
    "retrieve": self.read_capability,
}
```

- **Archivos:** `Backend/common/viewsets.py:44-46`.
- **Riesgo:** muy bajo.
- **Verificación:** pruebas de acceso a los endpoints de solo lectura.
- **Esfuerzo:** S.

### Prioridad 4 · Caché de capacidades por solicitud (SOLID-D02)

- **Problema:** `User.has_capability()` consulta la base de datos cada vez que se evalúa un permiso en la misma solicitud.
- **Solución:** guardar las capacidades en la instancia durante la solicitud:

```python
def has_capability(self, capability_key):
    if self.is_superuser:
        return True
    if not hasattr(self, "_cached_capabilities"):
        self._cached_capabilities = set(
            self.roles.values_list("capabilities__key", flat=True)
        )
    return capability_key in self._cached_capabilities
```

- **Archivos:** `Backend/accounts/models.py:82-85`.
- **Riesgo:** muy bajo; no cambia ninguna respuesta, solo reduce consultas redundantes.
- **Verificación:** `python manage.py test accounts common`.
- **Esfuerzo:** S.

### Prioridad 5 · Dividir `SiteEditorTab.tsx` (KISS-01)

- **Problema:** un componente de 2,018 líneas es difícil de auditar y de refactorizar con seguridad.
- **Solución:** extraer los editores a `Frontend/src/views/admin/tabs/site-editor/` (`HeroSectionEditor`, `AboutSectionEditor`, `TimelineSectionEditor`, `NewsSectionEditor`, `ConformadosSectionEditor`, `SiteEditorHeader`); `SiteEditorTab.tsx` queda como orquestador.
- **Archivos:** `SiteEditorTab.tsx` y los nuevos componentes.
- **Riesgo:** medio; se mitiga conservando las mismas firmas de props e interfaces de datos.
- **Verificación:** cada formulario guarda y carga los mismos datos en `localStorage` y la vista previa se ve idéntica.
- **Esfuerzo:** M.

### Prioridad 6 · Separar `MembersTab.tsx` (SOLID-S01)

- **Problema:** miembros internos y entidades aliadas conviven en un archivo de 884 líneas.
- **Solución:** crear `MembersListSubtab.tsx` y `EntitiesListSubtab.tsx`; `MembersTab.tsx` solo conserva la navegación entre ambos.
- **Archivos:** `Frontend/src/views/admin/tabs/MembersTab.tsx`.
- **Riesgo:** bajo.
- **Verificación:** listar y crear miembros y entidades funciona exactamente igual.
- **Esfuerzo:** S.

### Prioridad 7 · Simplificar el cálculo de fechas (KISS-02)

- **Problema:** `parseMeetingTimestamp` analiza texto libre con diccionarios de meses manuales.
- **Solución:** guardar siempre `targetDate` en ISO 8601 (`YYYY-MM-DDTHH:mm:ss`) y calcular con `new Date(m.targetDate).getTime()`, conservando el parser actual solo como respaldo.
- **Archivos:** `Frontend/src/views/admin/tabs/OverviewTab.tsx:12-39`.
- **Riesgo:** bajo.
- **Verificación:** el reloj del dashboard y las reuniones próximas mantienen su cuenta regresiva exacta.
- **Esfuerzo:** S.

## 4. Orden de ejecución sugerido

Ejecutar en tres pasos, de menor a mayor riesgo, empezando por el backend, que se puede verificar por completo con pruebas.

1. **Backend, riesgo mínimo:** corregir `CapabilityReadOnlyViewSet` (SOLID-L01), cachear capacidades en `User.has_capability` (SOLID-D02), unificar las consultas de membresía (DRY-03) y encapsular la validación de `ContentAsset` (DRY-04).
2. **Frontend, utilidades comunes:** crear `useSyncedStorage` y sustituir la lógica repetida (DRY-02), y simplificar `parseMeetingTimestamp` (KISS-02).
3. **Frontend, modularización de UI:** dividir `MembersTab.tsx` (SOLID-S01) y después descomponer `SiteEditorTab.tsx` (KISS-01).

Quedan fuera de este plan, por tener menor severidad, los hallazgos DRY-01, KISS-03, SOLID-S02, SOLID-O01, SOLID-I01 y SOLID-D01; pueden planificarse después.

> **Gobernanza:** el sistema permanece sin modificaciones. Se espera tu aprobación antes de aplicar cualquiera de los pasos.
