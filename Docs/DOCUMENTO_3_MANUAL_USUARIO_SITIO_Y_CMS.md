# UNIVERSIDAD RAFAEL LANDÍVAR
**CAMPUS SAN ALBERTO HURTADO, S.J. DE QUETZALTENANGO**  
**FACULTAD DE INGENIERÍA**  
**INGENIERÍA EN INFORMÁTICA Y SISTEMAS**  

---

### DOCUMENTO 3: MANUAL DE USUARIO DEL SITIO INSTITUCIONAL Y CMS
**Plataforma Web Institucional, Sistema de Gestión y Aplicación Móvil para la Mesa de Competitividad de Quetzaltenango**

* **Autor / Responsable:** Diego (Módulo de Sitio Web Institucional y CMS)
* **Organización Beneficiaria:** Mesa de Competitividad de Quetzaltenango
* **Curso:** Proyecto de Graduación / Ingeniería de Software
* **Fecha de Emisión:** Octubre de 2026
* **Lugar:** Quetzaltenango, Guatemala

---

### Control de Versiones

| Versión | Fecha | Responsable | Descripción del Cambio |
| :--- | :--- | :--- | :--- |
| **0.1** | 28/09/2026 | Diego | Estructuración inicial del manual de usuario y catálogo de secciones públicas. |
| **0.2** | 05/10/2026 | Diego | Documentación de tareas del gestor de contenidos (CMS) y previsualización interactiva. |
| **1.0** | 08/10/2026 | Diego | Versión final del Documento 3 con formato APA 7.ª edición, desglose de prototipos/backend y solución de problemas. |

---

## Tabla de Contenidos

1. [Capítulo 1. Introducción y Alcance del Manual](#capítulo-1-introducción-y-alcance-del-manual)
   - 1.1 Propósito del Documento
   - 1.2 Público Objetivo y Perfiles de Usuario
   - 1.3 Estado Actual del Desarrollo (Prototipo vs. Backend)
   - 1.4 Matriz de Permisos por Rol en el CMS
2. [Capítulo 2. Consulta del Portal Público Institucional](#capítulo-2-consulta-del-portal-público-institucional)
   - 2.1 Estructura del Portal Institucional
   - 2.2 Navegación de la Portada Principal (Hero y Estadísticas)
   - 2.3 Identidad Institucional (Sección "Quiénes Somos" y Hitos)
   - 2.4 Noticias, Comunicados y Novedades
   - 2.5 Cartera Pública de Proyectos e Iniciativas
   - 2.6 Centro de Documentos Públicos y Minutas
   - 2.7 Sección Especial: Summit de Competitividad 2026
   - 2.8 Formulario de Contacto e Inscripciones Públicas
3. [Capítulo 3. Tareas de Administración de Contenido (CMS)](#capítulo-3-tareas-de-administración-de-contenido-cms)
   - Procedimiento 01: Acceso al Sistema y Autenticación
   - Procedimiento 02: Recuperación de Contraseña `[Pendiente de Backend]`
   - Procedimiento 03: Navegación del Panel CMS y Selector de Vista Previa
   - Procedimiento 04: Edición de Textos Institucionales y Banner Principal
   - Procedimiento 05: Cambio y Carga de Imágenes Institucionales
   - Procedimiento 06: Publicación de Noticias y Comunicados
   - Procedimiento 07: Modificación y Edición de Contenidos Existentes
   - Procedimiento 08: Gestión de Visibilidad y Despublicado de Secciones
   - Procedimiento 09: Administración de Convocatorias y Eventos
   - Procedimiento 10: Gestión de Miembros y Entidades
   - Procedimiento 11: Configuración de Información de Contacto y Preferencias del Sistema
   - Procedimiento 12: Gestión de Sesiones y Reuniones de la Mesa
   - Procedimiento 13: Gestión de Actas y Documentos Oficiales
   - Procedimiento 14: Gestión de Propuestas y Votaciones de la Mesa
   - Procedimiento 15: Publicación y Visibilidad de Proyectos e Iniciativas
   - Procedimiento 16: Configuración del Summit de Competitividad 2026 y Agenda
   - Procedimiento 17: Cierre Seguro de Sesión y Conmutador de Rol Simulado
   - Procedimiento 18: Solución de Problemas Frecuentes (Troubleshooting)
4. [Capítulo 4. Referencias Bibliográficas (Formato APA)](#capítulo-4-referencias-bibliográficas-formato-apa)

---

## Capítulo 1. Introducción y Alcance del Manual

### 1.1 Propósito del Documento
El presente manual de usuario tiene como objetivo guiar de manera clara, metódica y estructurada al personal administrativo, editores de contenido y público en general en la consulta del portal institucional público y en la operación del Sistema de Gestión de Contenidos (CMS, por sus siglas en inglés *Content Management System*) de la **Mesa de Competitividad de Quetzaltenango**. 

Siguiendo las mejores prácticas de elaboración de manuales de usuario (TechSmith, 2023) y los estándares de presentación de la Universidad Rafael Landívar (2026), este documento establece procedimientos paso a paso, requisitos previos, controles de permisos, advertencias operativas y resultados esperados para cada función disponible.

### 1.2 Público Objetivo y Perfiles de Usuario
El sistema delimita las responsabilidades de los usuarios a través de roles de acceso diferenciados:

1. **Público General / Ciudadanía:** Usuarios sin autenticar que acceden al portal web para informarse sobre los proyectos, boletines, estadísticas, historia y eventos de la Mesa de Competitividad.
2. **Editor de Contenido:** Personal técnico autorizador encargado de redactar noticias, actualizar banners, ajustar la información institucional, gestionar actividades del Summit y modificar el contenido editable del sitio.
3. **Administrador / Comisión:** Integrantes de la directiva o coordinadores con privilegios completos para estructurar secciones, despublicar bloques, gestionar roles de usuarios y supervisar las iniciativas visibles.

### 1.3 Estado Actual del Desarrollo (Prototipo vs. Backend)
De conformidad con los lineamientos del proyecto (Mesa de Competitividad de Quetzaltenango, 2026), es imperativo explicitar la madurez tecnológica de cada módulo documentado:

> [!IMPORTANT]
> **Aviso de Estado del Código Fuente:**  
> Actulamente, el repositorio cuenta con un prototipo funcional interactivo en el módulo `Frontend/` desarrollado en React, TypeScript y Tailwind CSS. El CMS permite la edición en tiempo real, el reordenamiento *drag-and-drop*, la ocultación/exhibición de secciones y la actualización de contenidos almacenados en el estado del cliente (`localStorage`).  
> Aquellas funciones que requieren un servidor API REST activo en `Backend/` (autenticación JWT real, persistencia en base de datos PostgreSQL, servidor de archivos de medios o envío masivo de correos) están identificadas explícitamente dentro de este manual con la etiqueta **`[Pendiente de Backend]`** o **`[Prototipo Visual]`**.

### 1.4 Matriz de Permisos por Rol en el CMS

| Funcionalidad / Módulo | Público General | Editor | Administrador / Comisión | Estado de Implementación |
| :--- | :---: | :---: | :---: | :--- |
| **Consulta del Portal Público** | Permiso Total | Permiso Total | Permiso Total | **Funcional en Prototipo** |
| **Previsualización de Secciones** | No Disponible | Permiso Total | Permiso Total | **Funcional en Prototipo** |
| **Edición de Textos e Imágenes** | Restringido | Permiso Total | Permiso Total | **Funcional (localStorage)** |
| **Publicación de Eventos y Noticias**| Restringido | Permiso Total | Permiso Total | **Funcional (localStorage)** |
| **Reordenar / Ocultar Secciones** | Restringido | Restringido | Permiso Total | **Funcional (localStorage)** |
| **Creación de Secciones Personalizadas**| Restringido | Restringido | Permiso Total | **Funcional (localStorage)** |
| **Persistencia Global en PostgreSQL** | N/A | N/A | N/A | **[Pendiente de Backend]** |
| **Recuperación Automática de Clave** | N/A | N/A | N/A | **[Pendiente de Backend]** |

---

## Capítulo 2. Consulta del Portal Público Institucional

### 2.1 Estructura del Portal Institucional
El portal web de la Mesa de Competitividad de Quetzaltenango ha sido diseñado bajo un enfoque *mobile-first* y adaptativo (*responsive*), garantizando una óptima visualización tanto en computadoras de escritorio como en dispositivos móviles y tabletas.

```
[ Encabezado Público: Logo | Menú Navegación | Acceso Miembros ]
 ├── 1. Portada Principal (Hero Banner & Estadísticas)
 ├── 2. Quiénes Somos (Misión, Visión, Identidad)
 ├── 3. Hitos e Historia (Línea de Tiempo Cronológica)
 ├── 4. Cartera de Proyectos e Iniciativas Públicas
 ├── 5. Publicaciones, Noticias y Comunicados
 ├── 6. Convocatoria y Evento Summit de Competitividad 2026
 ├── 7. Repositorio de Documentos Públicos y Transparencia
 └── 8. Formulario de Contacto e Inscripción / Pie de Página
```

### 2.2 Navegación de la Portada Principal (Hero y Estadísticas)
1. **Acceso al Portal:** Ingrese a la dirección Web institucional (en entorno de desarrollo: `http://localhost:5173`).
2. **Visualización del Banner Principal (Hero):** Se presenta el eslogan institucional, la imagen representativa del desarrollo regional y botones principales de acción (*Call-to-Action*) para explorar iniciativas o ingresar al Summit 2026.
3. **Indicadores de Impacto:** En la franja inferior se despliegan las métricas clave de la institución: número de proyectos en marcha, instituciones participantes, inversión movilizada y empleos promovidos.

### 2.3 Identidad Institucional (Sección "Quiénes Somos" y Hitos)
1. **Navegación:** Seleccione la opción **"Quiénes Somos"** del menú superior.
2. **Información Institucional:** El usuario puede consultar la reseña histórica de la Mesa de Competitividad, sus pilares estratégicos y la integración multisectorial (gobierno, academia y sector privado).
3. **Línea de Tiempo Interactiva:** Muestra cronológicamente los hitos alcanzados desde la fundación de la Mesa hasta las proyecciones del año 2026.

### 2.4 Noticias, Comunicados y Novedades
1. **Sección de Novedades:** Al desplazarse al módulo de noticias, el ciudadano puede filtrar boletines y comunicados por fecha y categoría.
2. **Lectura Detallada:** Haga clic sobre la tarjeta de la noticia para desplegar el texto completo, imágenes adjuntas y enlaces a documentos oficiales relacionados.

### 2.5 Cartera Pública de Proyectos e Iniciativas
1. **Filtro de Iniciativas:** Ingrese a **"Proyectos"**. El portal presenta únicamente aquellas iniciativas cuyo nivel de visibilidad haya sido clasificado como **Público** por la Comisión.
2. **Ficha de Proyecto:** Cada tarjeta pública detalla:
   - Título de la iniciativa y sector estratégico (Infraestructura, Modernización, Desarrollo Humano).
   - Porcentaje de avance físico y presupuesto asignado.
   - Responsable institucional del seguimiento.

### 2.6 Centro de Documentos Públicos y Minutas
1. **Repositorio Ciudadano:** La sección de **"Documentos"** pone a disposición de la población las actas públicas, reglamentos e informes de gestión autorizados.
2. **Descarga de Archivos:** Haga clic en el botón de descarga del documento deseado para obtener el archivo PDF correspondiente.

### 2.7 Sección Especial: Summit de Competitividad 2026
1. **Promoción del Evento:** Espacio destacado en la página de inicio dedicado al *Summit de Competitividad 2026*.
2. **Información Disponible:** Muestra la fecha del encuentro, la sede, los ejes temáticos, los conferencistas destacados y el cronograma de actividades.

### 2.8 Formulario de Contacto e Inscripciones Públicas
1. **Módulo de Contacto:** Ubicado en la parte inferior del portal.
2. **Proceso de Envío:** El visitante completa los campos de Nombre, Correo Electrónico, Institución y Mensaje / Inscripción.
3. **Resultado:** Al presionar **"Enviar Mensaje"**, el prototipo web valida los campos obligatorios y muestra un mensaje de confirmación en pantalla.

---

## Capítulo 3. Tareas de Administración de Contenido (CMS)

A continuación, se describen los 18 procedimientos de administración del portal institucional exigidos en la documentación técnica oficial del proyecto.

---

### Procedimiento 01: Acceso al Sistema y Autenticación
* **Objetivo:** Iniciar sesión en el panel web administrativo para realizar tareas de gestión de contenidos o administración interna.
* **Requisitos Previos:** Disponer de credenciales de acceso asignadas (Correo institucional y contraseña).
* **Rol / Permisos Necesarios:** Editor de Contenido, Administrador / Comisión.
* **Estado de Implementación:** **[Funcional en Prototipo Web / Simulación de Roles]**

#### Pasos Numerados:
1. Abra el navegador e ingrese a la dirección del portal institucional (`http://localhost:5173`).
2. En la barra superior de navegación, haga clic en el botón **"Acceso Miembros"** o **"Sistema Administrativo"**.
3. Ingrese el correo electrónico registrado y la contraseña correspondiente.
4. Seleccione el rol con el que desea ingresar (**Editor** o **Administrador**).
5. Haga clic en **"Iniciar Sesión"**.

**Figura 1**  
*Pantalla de inicio de sesión y selección de rol de acceso*  
```
+-----------------------------------------------------------------------+
|                       MESA DE COMPETITIVIDAD                          |
|                             Iniciar Sesión                           |
| Correo Electrónico: [ c.montufar@camaraxela.gt                    ]   |
| Contraseña:         [ ********************                        ]   |
| Rol de Acceso:      (o) Editor   ( ) Comisión / Administrador       |
|                                                                       |
|                     [  Boton: Iniciar Sesion  ]                       |
+-----------------------------------------------------------------------+
```
`![Figura 1: Pantalla de inicio de sesión](img/figura_01_login.png)`  
*Nota.* Captura obtenida del prototipo web en React/Vite de la Mesa de Competitividad (2026).

* **Resultado Esperado:** El sistema valida las credenciales redirigiendo al usuario al panel principal (*Dashboard*) y activando las pestañas de administración según su rol.
* **Advertencia:** En el prototipo web actual, la autenticación funciona en el estado local de la aplicación. Al integrarse la API backend, el inicio de sesión requerirá un token JWT válido expedido por el servidor.

---

### Procedimiento 02: Recuperación de Contraseña
* **Objetivo:** Permitir el restablecimiento de la clave de acceso en caso de olvido o extravío.
* **Requisitos Previos:** Correo electrónico registrado en la plataforma.
* **Rol / Permisos Necesarios:** Todos los usuarios registrados.
* **Estado de Implementación:** **`[Pendiente de Backend API]`**

#### Pasos Numerados:
1. En la pantalla de inicio de sesión, haga clic en el enlace **"¿Olvidó su contraseña?"**.
2. Ingrese el correo electrónico asociado a su cuenta de miembro de la Mesa.
3. Presione el botón **"Enviar Enlace de Recuperación"**.
4. Ingrese a su bandeja de entrada de correo electrónico y abra el mensaje recibido.
5. Haga clic en el enlace seguro e ingrese la nueva contraseña cumpliendo las políticas de seguridad.

* **Resultado Esperado:** Mensaje de confirmación en pantalla e indicación de que las credenciales han sido actualizadas.
* **Advertencia:** Esta función se encuentra etiquetada como **Pendiente de Backend** debido a que requiere la integración del servicio SMTP de correo electrónico y el endpoint de autenticación en Django REST Framework.

---

### Procedimiento 03: Navegación del Panel CMS y Selector de Vista Previa
* **Objetivo:** Conocer la interfaz de administración del sitio y conmutar la visualización entre el editor de bloques y la vista previa del sitio web en modo escritorio o móvil.
* **Requisitos Previos:** Haber iniciado sesión con rol de Editor o Administrador.
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional en Prototipo Web / React]**

#### Pasos Numerados:
1. En el menú lateral del sistema administrativo, seleccione la pestaña **"Editor de Sitio (CMS)"**.
2. En la barra superior del editor, identifique los botones de control de vista previa:
   - Icono **Monitor / Escritorio**: Ajusta el lienzo a pantalla completa de computadora.
   - Icono **Teléfono Móvil**: Redimensiona la pantalla simulando la experiencia en *smartphones*.
3. Observe la lista de secciones configuradas (Hero, Quiénes Somos, Noticias, Eventos, Proyectos, Contacto, etc.).
4. Use los controles de arrastre (*Drag & Drop*) para cambiar el orden de las secciones.

**Figura 2**  
*Panel principal del gestor de contenidos (CMS) y conmutador de previsualización*  
```
+-----------------------------------------------------------------------+
|  [CMS Editor]  | Vista Previa: [ Escenario Monitor ] [ Escenario Móvil ] |
+-----------------------------------------------------------------------+
|  Secciones del Sitio Web:                                             |
|  [::] 1. Portada Principal (Hero)      [ Visible ] [ Editar ] [ Subir ]|
|  [::] 2. Quiénes Somos (About)         [ Visible ] [ Editar ] [ Bajar ]|
|  [::] 3. Evento Summit 2026            [ Oculto  ] [ Editar ] [ Bajar ]|
+-----------------------------------------------------------------------+
```
`![Figura 2: Panel gestor de contenidos CMS](img/figura_02_cms_overview.png)`  
*Nota.* Captura del panel administrativo en entorno de desarrollo local (Mesa de Competitividad, 2026).

* **Resultado Esperado:** La interfaz refresca instantáneamente el lienzo de trabajo reflejando los cambios de estructura sin necesidad de recargar la página.

---

### Procedimiento 04: Edición de Textos Institucionales y Banner Principal
* **Objetivo:** Actualizar el título, subtítulo, eslogan o llamadas a la acción (*CTA*) de la portada principal del sitio web.
* **Requisitos Previos:** Pestaña "Editor de Sitio (CMS)" activa.
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional en Prototipo (localStorage)]**

#### Pasos Numerados:
1. Ubique el bloque denominado **"Portada principal (Hero)"**.
2. Haga clic en el botón de acción **"Editar Sección"** (icono de lápiz).
3. En el modal emergente, modifique los campos de texto disponibles:
   - **Antetítulo / Eyebrow:** Ej. *"Región Occidente · Guatemala"*.
   - **Título Principal:** Ej. *"Mesa de Competitividad de Quetzaltenango"*.
   - **Subtítulo / Descripción:** Texto descriptivo de la misión institucional.
   - **Texto Botón 1:** Ej. *"Ver iniciativas activas"*.
   - **Texto Botón 2:** Ej. *"Summit de Competitividad 2026"*.
4. Haga clic en **"Guardar Cambios"**.

```
+-----------------------------------------------------------------------+
| EDITAR SECCIÓN: Portada Principal                                     |
+-----------------------------------------------------------------------+
| Título Principal:                                                     |
| [ Mesa de Competitividad de Quetzaltenango                          ] |
| Subtítulo Institucional:                                              |
| [ Articulamos sector público, privado y academia para...            ] |
|                                                                       |
|                         [ Cancelar ]  [ Guardar Cambios ]            |
+-----------------------------------------------------------------------+
```
*Figura 3. Formulario de edición de textos de la portada.*

* **Resultado Esperado:** El texto actualizado se refleja inmediatamente en el lienzo de vista previa y se guarda en la memoria del navegador.

---

### Procedimiento 05: Cambio y Carga de Imágenes Institucionales
* **Objetivo:** Reemplazar las imágenes promocionales, afiches de eventos y fotografías del banner institucional.
* **Requisitos Previos:** Contar con el enlace o archivo de imagen en formato compatible (JPG, PNG o WebP).
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional mediante Enlace URL / Carga local pendiente de API]**

#### Pasos Numerados:
1. Abra el modal de edición de la sección a la que desea cambiar la imagen (ej. Hero, Evento o Noticias).
2. Localice el campo **"URL de Imagen Principal"** o **"Afiche del Evento"**.
3. Ingrese la dirección web de la nueva imagen o seleccione una imagen de la galería de medios sintéticos.
4. Presione **"Guardar Cambios"**.

* **Resultado Esperado:** La nueva imagen se renderiza en la sección correspondiente de la interfaz.
* **Advertencia:** En el prototipo web actual, las imágenes se gestionan mediante URLs y almacenamiento `localStorage`. La carga directa de archivos desde el disco del usuario requiere la implementación del servidor de medios en el backend.

---

### Procedimiento 06: Publicación de Noticias y Comunicados
* **Objetivo:** Agregar una nueva entrada de noticia o comunicado oficial en la portada del portal público.
* **Requisitos Previos:** Redacción del boletín informativo, fecha y titular aprobados.
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional en Prototipo Web]**

#### Pasos Numerados:
1. En el gestor CMS, busque la sección **"Noticias y comunicados"**.
2. Haga clic en **"Editar Sección"**.
3. Complete los datos de la noticia:
   - **Título de la Noticia:** Titular llamativo e informativo.
   - **Fecha de Publicación:** Ej. *"08 de Octubre, 2026"*.
   - **Resumen / Contenido:** Texto explicativo de la novedad institucional.
   - **Imagen Destacada:** URL del banner o foto de la noticia.
4. Presione **"Guardar Cambios"** y posteriormente haga clic en el botón flotante **"Publicar Cambios"**.

* **Resultado Esperado:** La noticia queda registrada en el estado de la aplicación y se muestra en el carrusel de noticias del portal público.

---

### Procedimiento 07: Modificación y Edición de Contenidos Existentes
* **Objetivo:** Corregir o actualizar información en noticias, bloques de texto o proyectos ya publicados.
* **Requisitos Previos:** Identificar el bloque o noticia que requiere modificación.
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional en Prototipo Web]**

#### Pasos Numerados:
1. Diríjase a la pestaña del CMS y ubique el módulo a modificar.
2. Presione el botón **"Editar"** correspondiente a la sección.
3. Realice los ajustes sobre los campos de texto, fechas o imágenes requeridos.
4. Verifique el resultado en el panel lateral de previsualización.
5. Haga clic en **"Guardar Cambios"**.

* **Resultado Esperado:** Los contenidos se actualizan de inmediato en el estado interactivo del cliente.

---

### Procedimiento 08: Gestión de Visibilidad y Despublicado de Secciones
* **Objetivo:** Ocultar o volver a mostrar secciones completas del portal público (por ejemplo, suspender temporalmente el bloque del Summit al finalizar el evento).
* **Requisitos Previos:** Acceso al panel CMS del sistema.
* **Rol / Permisos Necesarios:** Administrador / Comisión (Rol exclusivo de supervisión).
* **Estado de Implementación:** **[Funcional en Prototipo Web]**

#### Pasos Numerados:
1. En la lista de secciones del CMS, ubique el bloque que desea ocultar (ej. *Evento / Summit*).
2. Haga clic en el botón de estado **"Visible"** (icono de ojo).
3. Observe que el estado cambia a **"Oculto"** (icono de ojo tachado) y la sección se atenúa en la lista.
4. Presione el botón **"Publicar Cambios"** en la barra superior.

```
+-----------------------------------------------------------------------+
|  ESTADO DE SECCIONES                                                  |
|  1. Portada Principal (Hero)  [ Visible (Ojo Abierto)  ]               |
|  2. Evento Summit 2026        [ Oculto (Ojo Tachado)   ] <- Clic aquí  |
+-----------------------------------------------------------------------+
```
*Figura 4. Control de visibilidad de secciones públicas.*

* **Resultado Esperado:** La sección seleccionada desaparece completamente de la vista pública de los visitantes.

---

### Procedimiento 09: Administración de Convocatorias y Eventos
* **Objetivo:** Registrar foros, talleres, reuniones ordinarias públicas y actividades institucionales en la agenda del portal.
* **Requisitos Previos:** Programación de la actividad (lugar, hora, fecha y tema).
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional en Prototipo Web]**

#### Pasos Numerados:
1. Ingrese a la sección **"Evento / Summit"** o **"Agenda"** dentro del editor CMS.
2. Haga clic en **"Editar Sección"**.
3. Complete los parámetros del evento:
   - **Nombre de la Actividad.**
   - **Fecha y Horario:** Ej. *"29 de Octubre 2026, 09:00 - 17:00 hrs"*.
   - **Lugar / Modalidad:** Ej. *"Centro de Convenciones Xela / Presencial"*.
   - **Descripción del Evento.**
4. Guarde los cambios para actualizar el bloque informativo.

* **Resultado Esperado:** La actividad aparece destacada en la agenda del sitio público para consulta ciudadana.

---

### Procedimiento 10: Gestión de Miembros y Entidades
* **Objetivo:** Registrar, actualizar credenciales, asignar roles (Comisión o Editor) y administrar el estado de los miembros e instituciones representadas en la Mesa de Competitividad.
* **Requisitos Previos:** Haber ingresado al sistema web administrativo con rol de Administrador / Comisión.
* **Rol / Permisos Necesarios:** Administrador / Comisión.
* **Estado de Implementación:** **[Funcional en Prototipo Web / React State]**

#### Pasos Numerados:
1. En el menú de navegación lateral izquierdo del sistema administrativo, haga clic en la opción **"Miembros y Entidades"**.
2. **Agregar un nuevo miembro:**
   - Presione el botón flotante **"+ Agregar Miembro"** ubicado en la esquina superior derecha.
   - En el formulario modal emergente, ingrese el **Nombre completo**, **Correo electrónico institucional**, **Institución u Organización representada** (ej. *Cámara de Comercio*, *AGEXPORT*, *MINECO*, *CUNOC / USAC*) y seleccione el rol inicial.
3. **Modificar datos de un miembro existente:**
   - Ubique la tarjeta del miembro dentro del directorio.
   - Haga clic en el botón de acción **"Editar"** situado debajo de sus datos institucionales.
   - Actualice la información requerida y guarde los cambios.
4. **Cambiar rol de acceso (Comisión vs. Editor):**
   - En la tarjeta del miembro, haga clic en el botón de acción **"Cambiar rol"**.
   - Conmute la asignación entre el rol **Comisión** (acceso total a gobernanza y votaciones) y **Editor** (gestión de contenidos y proyectos).
5. **Activar o Desactivar acceso:**
   - En caso de rotación de representantes institucionales, haga clic en el botón **"Desactivar"** (o **"Activar"**) en la tarjeta del miembro para suspender o restituir sus permisos sin eliminar su historial.

**Figura 10**  
*Módulo de administración de Miembros y Entidades de la Mesa de Competitividad*  
```
+---------------------------------------------------------------------------------------+
| Miembros y Entidades                                           [ + Agregar Miembro ]  |
+---------------------------------------------------------------------------------------+
| [Foto] Carlos Montúfar  (Comisión)   | [Foto] María Fuentes   (Comisión)             |
|        Cámara de Comercio            |        AGEXPORT                               |
|        c.montufa@camaraxela.gt       |        m.fuentes@agexport.gt                  |
|        [Editar] [Cambiar rol] [Desactivar] |   [Editar] [Cambiar rol] [Desactivar]    |
|--------------------------------------|------------------------------------------------|
| [Foto] Roberto Ajú     (Editor)      | [Foto] Sandra Ortiz    (Editor)               |
|        CUNOC / USAC                  |        MINECO                                 |
|        r.aju@cunoc.usac.gt           |        s.ortiz@mineco.gob.gt                  |
|        [Editar] [Cambiar rol] [Desactivar] |   [Editar] [Cambiar rol] [Desactivar]    |
+---------------------------------------------------------------------------------------+
```
`![Figura 10: Módulo de Miembros y Entidades](img/figura_10_miembros.png)`  
*Nota.* Captura de la pantalla de gestión de miembros e instituciones representadas (Mesa de Competitividad, 2026).

* **Resultado Esperado:** El directorio de miembros se actualiza de inmediato, aplicando las restricciones de rol correspondientes a cada cuenta.
* **Advertencia:** Al desactivar a un miembro por cambio de representación institucional, sus votos pasados y firmas registradas en actas previas se conservan de forma inmutable para auditoría.

---

### Procedimiento 11: Configuración de Información de Contacto y Preferencias del Sistema
* **Objetivo:** Modificar la dirección oficial, teléfono, correo de atención y horario institucional que se muestran en el sitio público, así como ajustar los modificadores de notificaciones automáticas del sistema.
* **Requisitos Previos:** Sesión activa en el panel administrativo.
* **Rol / Permisos Necesarios:** Administrador / Comisión.
* **Estado de Implementación:** **[Funcional en Prototipo Web / Sincronización en vivo con Sitio Público]**

#### Pasos Numerados:
1. En el menú lateral izquierdo, seleccione la opción **"Configuración"**.
2. **Actualizar Datos de Contacto Público:**
   - En el bloque **"Información Institucional de Contacto"**, modifique los campos:
     - **Dirección Oficial:** Ej. *"7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala"*.
     - **Teléfono Institucional:** Ej. *"+502 7767-0000"*.
     - **Correo Electrónico Oficial:** Ej. *"mesa.competitividad@quetzaltenango.gt"*.
     - **Horario de Atención:** Ej. *"Lun – Vie · 8:00 – 17:00 hrs."*.
   - Presione el botón **"Guardar y Publicar Datos de Contacto"**.
3. **Configurar Preferencias de Notificaciones del Sistema:**
   - En el bloque inferior **"Preferencia de Notificaciones del Sistema"**, utilice los interruptores conmutadores para activar o desactivar:
     - *Notificaciones por correo.*
     - *Alerta de reunión (24h antes).*
     - *Alerta de nueva propuesta de voto.*
     - *Publicación automática de actas.*

**Figura 11**  
*Módulo de Configuración de Contacto Institucional y Notificaciones*  
```
+---------------------------------------------------------------------------------------+
| Configuración - Información Institucional de Contacto                                |
+---------------------------------------------------------------------------------------+
| Dirección Oficial:   [ 7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala                  ] |
| Teléfono:            [ +502 7767-0000        ] Correo: [ mesa.competitividad@xela.gt ] |
| Horario:             [ Lun – Vie · 8:00 – 17:00 hrs.                                ] |
|                      [  Boton: Guardar y Publicar Datos de Contacto  ]                |
|---------------------------------------------------------------------------------------|
| Preferencia de Notificaciones:                                                        |
| (ON) Notificaciones por correo        (ON) Alerta de reunión (24h antes)               |
| (ON) Alerta de nueva propuesta        (OFF) Publicación automática de actas           |
+---------------------------------------------------------------------------------------+
```
`![Figura 11: Módulo de Configuración](img/figura_11_configuracion.png)`  
*Nota.* Captura del panel de configuración global del sistema y canales institucionales (Mesa de Competitividad, 2026).

* **Resultado Esperado:** Los datos de contacto modificados se refrescan automáticamente en el pie de página y sección de contacto del portal público.

---

### Procedimiento 12: Gestión de Sesiones y Reuniones de la Mesa
* **Objetivo:** Programar sesiones ordinarias y extraordinarias, publicar convocatorias oficiales, gestionar participantes y dar seguimiento a las actas de reunión.
* **Requisitos Previos:** Convocatoria autorizada por la Comisión.
* **Rol / Permisos Necesarios:** Editor, Administrador / Comisión.
* **Estado de Implementación:** **[Funcional en Prototipo Web / React State]**

#### Pasos Numerados:
1. En el menú de navegación lateral, haga clic en **"Sesiones y Reuniones"**.
2. **Programar una nueva reunión:**
   - Haga clic en el botón **"+ Programar Reunión"** ubicado en la esquina superior derecha.
   - Ingrese el Título de la reunión (ej. *Sesión Ordinaria No. 021*), Fecha, Horario, Ubicación (ej. *Sala de Sesiones, CUNOC* o *Virtual Zoom*) y el número de participantes convocados.
3. **Ver Convocatoria oficial:**
   - En la tarjeta de la sesión programada, haga clic en **"Ver Convocatoria"** para visualizar el documento de citación formal enviado a los miembros.
4. **Editar una reunión programada:**
   - En la esquina superior derecha de la tarjeta de la sesión, haga clic en el enlace **"Editar"** para ajustar fecha, hora o sede.
5. **Vincular o preparar acta de reunión:**
   - Haga clic en el botón **"Preparar Acta"** para trasladarse al módulo de redacción de acuerdos.
   - En el caso de reuniones ya realizadas, haga clic en **"Acta PDF"** para abrir el documento firmado.

**Figura 12**  
*Módulo de gestión de Sesiones y Reuniones de la Mesa de Competitividad*  
```
+---------------------------------------------------------------------------------------+
| Sesiones y Reuniones - Calendario de Sesiones                  [ + Programar Reunión ]|
+---------------------------------------------------------------------------------------+
| [Programada] REU-021 | 14 participantes | [Editar]                                    |
| Sesión Ordinaria No. 021                                                              |
| Fecha: 25 Sep 2026 | Hora: 09:00 - 12:00 | Lugar: Sala de Sesiones, CUNOC                  |
| [ Ver Convocatoria ]  [ Preparar Acta ]                                               |
|---------------------------------------------------------------------------------------|
| [Realizada] REU-020  | 16 participantes | [Editar]                                    |
| Sesión Ordinaria No. 020                                                              |
| Fecha: 21 Ago 2026 | Hora: 09:00 - 12:00 | Lugar: Sala de Sesiones, CUNOC                  |
| [ Acta PDF ]                                                                          |
+---------------------------------------------------------------------------------------+
```
`![Figura 12: Módulo de Sesiones y Reuniones](img/figura_12_reuniones.png)`  
*Nota.* Captura de la pantalla de gestión del calendario de sesiones y convocatorias oficiales (Mesa de Competitividad, 2026).

* **Resultado Esperado:** La reunión queda registrada en la agenda interna y se envía el aviso de citación a las cuentas de los miembros.

---

### Procedimiento 13: Gestión de Actas y Documentos Oficiales
* **Objetivo:** Registrar minutas y actas de sesiones, administrar el flujo de revisión y firma digital, exportar a PDF y publicar actas para acceso de los miembros y la ciudadanía.
* **Requisitos Previos:** Acta redactada o en proceso tras la finalización de una sesión.
* **Rol / Permisos Necesarios:** Editor (redacción), Administrador / Comisión (aprobación y firma).
* **Estado de Implementación:** **[Funcional en Prototipo Web / Simulación de Flujo de Firma]**

#### Pasos Numerados:
1. En el menú lateral, diríjase a **"Actas y Documentos"**.
2. **Crear nueva acta:**
   - Presione el botón **"+ Nueva Acta"** en la esquina superior derecha.
   - Seleccione la sesión asociada, ingrese la fecha y redacte la minuta de acuerdos.
3. **Cambiar estado del documento en el flujo de aprobación:**
   - En la tabla de actas, ubique la columna **ESTADO (CAMBIAR)**.
   - Utilice el selector desplegable para conmutar el estado del acta entre:
     - `Borrador`: En proceso de redacción inicial.
     - `Pendiente de Firma`: Finalizada y lista para recabar la aprobación de la directiva.
     - `Publicada / Firmada`: Aprobada oficialmente para consulta e historia.
4. **Editar o Firmar el Acta:**
   - Haga clic en el botón de acción **"Editar / Firmar"** o **"Editar Acta"** en la columna correspondiente.
5. **Exportar a PDF:**
   - En las actas en estado publicado, presione el botón **"Exportar PDF"** para generar la versión descargable oficial.

**Figura 13**  
*Módulo de gestión de Actas, Minutas y Documentos con control de estados y firma*  
```
+---------------------------------------------------------------------------------------+
| Actas y Documentos - Gestión de convocatorias y actas           [ + Nueva Acta ]      |
| Filtros: [ Todos (5) ] [ Borradores (1) ] [ Pendientes de Firma (1) ] [ Publicadas (3) ] |
+---------------------------------------------------------------------------------------+
| CÓDIGO  | SESIÓN                     | FECHA       | ESTADO (CAMBIAR)    | ACCIONES    |
| ACT-021 | Sesión Ordinaria No. 021   | 18 Sep 2026 | [Pendiente de Firma]| [Editar/Firmar]|
| ACT-022 | Sesión Ord. 022 (Borrador) | 25 Sep 2026 | [Borrador          ]| [Editar/Firmar]|
| ACT-020 | Sesión Ordinaria No. 020   | 21 Ago 2026 | [Publicada/Firmada ]| [Exportar PDF]|
+---------------------------------------------------------------------------------------+
```
`![Figura 13: Módulo de Actas y Documentos](img/figura_13_actas.png)`  
*Nota.* Captura de la tabla de control de actas oficiales y flujo de firma (Mesa de Competitividad, 2026).

* **Resultado Esperado:** Las actas marcadas como *Publicada / Firmada* se habilitan automáticamente en el centro de documentos públicos del sitio web.

---

### Procedimiento 14: Gestión de Propuestas y Votaciones de la Mesa
* **Objetivo:** Registrar iniciativas para someterlas a votación formal de los miembros, monitorear el porcentaje de participación en tiempo real (Favor, Contra, Abstención), cerrar el periodo de votación y publicar los resultados.
* **Requisitos Previos:** Propuesta o moción formal presentada por un miembro de la Comisión.
* **Rol / Permisos Necesarios:** Administrador / Comisión (crear, cerrar y publicar), Miembro / Editor (consulta).
* **Estado de Implementación:** **[Funcional en Prototipo Web / Gráfica de Votaciones]**

#### Pasos Numerados:
1. En el menú lateral izquierdo, seleccione la opción **"Propuestas / Votaciones"**.
2. **Crear una nueva propuesta de votación:**
   - Presione el botón **"+ Nueva Propuesta"**.
   - Ingrese el Título de la propuesta (ej. *Aprobación del Plan Operativo Anual 2027*), Descripción detallada, Categoría (ej. *Planificación*, *Membresía*, *Gobernanza*) y Fecha límite de cierre.
3. **Publicar propuesta en borrador:**
   - Si la propuesta está en estado `borrador`, haga clic en la opción **"Publicar"** para habilitar la recepción de votos desde la web y la aplicación móvil.
4. **Monitorear el conteo de votos:**
   - Observe la gráfica circular de avance de participación (% de quórum).
   - Verifique el desglose cuantitativo en tiempo real: votos a **Favor** (verde), en **Contra** (rojo) y **Abstención** (gris).
5. **Ver detalle completo:**
   - Haga clic en el enlace **"Ver detalle y votos >"** para auditar el desglose de votantes autorizados.
6. **Cerrar votación:**
   - Al cumplirse la fecha plazo o alcanzarse el quórum requerido, haga clic en la acción **"Cerrar votación"**.

**Figura 14**  
*Módulo de administración de Propuestas y Votaciones de la Mesa*  
```
+---------------------------------------------------------------------------------------+
| Propuestas / Votaciones                                        [ + Nueva Propuesta ]  |
| Filtros: [ Todos ] [ Activa ] [ Borrador ] [ Cerrada ]                               |
+---------------------------------------------------------------------------------------+
| [79% Votos]  P-001 (activa) - Cierre: 18 Sep 2026                                       |
|              Aprobación del Plan Operativo Anual 2027                                 |
|              [ 8 Favor ]   [ 2 Contra ]   [ 1 Abstención ]                          |
|              [ Ver detalle y votos > ]                      [ Cerrar votación ]       |
|---------------------------------------------------------------------------------------|
| [0% Votos]   P-003 (borrador) - Cierre: 30 Sep 2026                                     |
|              Convenio de cooperación con BANGUAT                                      |
|              Sin votos — propuesta en borrador              [ Publicar ]              |
+---------------------------------------------------------------------------------------+
```
`![Figura 14: Módulo de Propuestas y Votaciones](img/figura_14_propuestas.png)`  
*Nota.* Captura de la pantalla de votaciones activas y métricas de quórum (Mesa de Competitividad, 2026).

* **Resultado Esperado:** La propuesta queda habilitada para que los miembros emitan su voto seguro desde la aplicación móvil o el sistema web, garantizando un único voto por integrante registrado.

---

### Procedimiento 15: Publicación y Visibilidad de Proyectos e Iniciativas
* **Objetivo:** Registrar proyectos del plan de competitividad, actualizar el porcentaje de avance físico, asignar líderes responsables y definir su nivel de visibilidad (Público o Privado).
* **Requisitos Previos:** Ficha técnica de proyecto aprobada.
* **Rol / Permisos Necesarios:** Editor (actualización), Administrador / Comisión (creación y visibilidad).
* **Estado de Implementación:** **[Funcional en Prototipo Web / React State]**

#### Pasos Numerados:
1. En el menú lateral, seleccione la opción **"Proyectos"**.
2. **Crear nuevo proyecto:**
   - Presione el botón **"+ Nuevo Proyecto"**.
   - Ingrese Código (ej. *PRY-001*), Nombre de la iniciativa (ej. *Corredor Logístico Altiplano Occidental*), Sector (ej. *Infraestructura*), Porcentaje de avance (0% a 100%), Líder responsable y Presupuesto estimado.
3. **Configurar Visibilidad Pública / Privada:**
   - En la ficha o selector de visibilidad del proyecto, seleccione:
     - `Público`: La iniciativa se difunde abiertamente en la cartera del sitio web público.
     - `Privado`: El proyecto permanece restringido para consulta interna de los miembros de la Mesa.
4. Haga clic en **"Guardar Proyecto"**.

* **Resultado Esperado:** Los proyectos clasificados como públicos alimentan automáticamente la sección de cartera del sitio web institucional.

---

### Procedimiento 16: Configuración del Summit de Competitividad 2026 y Agenda
* **Objetivo:** Administrar los bloques promocionales, afiches, fechas oficiales, ejes temáticos y la agenda de ponencias del *Summit de Competitividad 2026*.
* **Requisitos Previos:** Programa oficial del evento Summit estructurado.
* **Rol / Permisos Necesarios:** Editor, Administrador.
* **Estado de Implementación:** **[Funcional en Prototipo Web / CMS Section Editor]**

#### Pasos Numerados:
1. En el menú lateral, ingrese a **"Editor del Sitio Web"** (CMS).
2. Ubique la sección **"Evento / Summit"** y haga clic en **"Editar Sección"**.
3. Ingrese el Título del Foro, Eje Temático central, Fecha del Evento (*29 de Octubre de 2026*), Sede y la URL del Afiche oficial.
4. Para ajustar el cronograma de conferencistas, seleccione el bloque **"Agenda del Summit"** e ingrese el horario y tema de cada ponente.
5. Haga clic en **"Guardar Cambios"** y posteriormente en **"Publicar Cambios"**.

* **Resultado Esperado:** La sección del Summit del portal público exhibe el afiche actualizado, la fecha del encuentro y el cronograma navegable.

---

### Procedimiento 17: Cierre Seguro de Sesión y Conmutador de Rol Simulado
* **Objetivo:** Finalizar la sesión administrativa de forma segura y conmutar vistas de simulación para verificar los permisos de la interfaz.
* **Requisitos Previos:** Sesión iniciada en el panel administrativo.
* **Rol / Permisos Necesarios:** Todos los usuarios autenticados.
* **Estado de Implementación:** **[Funcional en Prototipo Web]**

#### Pasos Numerados:
1. **Conmutación de Rol Simulado (Entorno de Prototipo):**
   - En la parte inferior de la barra lateral izquierda, ubique el panel **"SIMULAR ROL:"**.
   - Presione el botón **"Comisión"** o **"Editor"** para alternar instantáneamente la interfaz entre la vista administrativa y la vista restringida de edición.
2. **Cierre de Sesión Seguro:**
   - En la esquina inferior derecha de la pantalla (o en la barra de usuario), haga clic en el botón de salida **"Salir"** (icono de puerta).
   - Confirme la acción para cerrar la sesión.

* **Resultado Esperado:** El sistema limpia las variables de sesión del estado y redirige al usuario a la portada del portal público.

---

### Procedimiento 18: Solución de Problemas Frecuentes (Troubleshooting)

A continuación, se presenta la matriz de diagnóstico y resolución de incidencias operativas comunes en los módulos del sistema administrativo y gestor de contenidos:

| Incidencia / Problema | Causa Probable | Solución Sugerida |
| :--- | :--- | :--- |
| **No aparece el botón "+ Agregar Miembro" o "+ Nueva Propuesta".** | El usuario ha ingresado con el rol de **Editor** en lugar de **Comisión**. | Verifique su rol en la esquina superior derecha o conmute la simulación a **Comisión** para activar las funciones de gobernanza. |
| **Un acta publicada no aparece en el sitio público.** | El selector de estado en la tabla de actas no fue cambiado a `Publicada / Firmada`. | Ingrese a **Actas y Documentos**, ubique el acta y cambie la opción desplegable en la columna *ESTADO (CAMBIAR)* a `Publicada / Firmada`. |
| **Los votos registrados no se reflejan en el conteo de la propuesta.** | La propuesta se encuentra aún en estado `borrador`. | Ingrese al módulo de **Propuestas / Votaciones** y haga clic en la acción **"Publicar"** para habilitar la emisión de votos. |
| **Un proyecto no se muestra en la cartera del sitio web.** | Su nivel de visibilidad está configurado como `Privado`. | Ingrese a la pestaña de **Proyectos**, edite la iniciativa y cambie su estado de visibilidad a `Público`. |
| **Los datos de contacto editados no se guardaron.** | No se presionó el botón de guardado en el módulo de Configuración. | En la pestaña **Configuración**, asegúrese de hacer clic en **"Guardar y Publicar Datos de Contacto"** tras modificar la dirección, correo o teléfono. |
| **Las modificaciones del CMS no son visibles en dispositivos móviles.** | No se ha ejecutado la sincronización del estado local. | Haga clic en el botón verde **"Publicar Cambios"** en el encabezado del CMS para forzar el refresco de datos en todos los lienzos de vista previa. |

---

## Capítulo 4. Referencias Bibliográficas (Formato APA)

* Mesa de Competitividad de Quetzaltenango. (2026). *Lineamientos para la documentación y entrega del proyecto: Plataforma web institucional, sistema de gestión y aplicación móvil*. Universidad Rafael Landívar, Facultad de Ingeniería, Campus San Alberto Hurtado, S.J. Quetzaltenango, Guatemala.
* TechSmith. (2023, 15 de marzo). *Cómo crear un manual de usuario paso a paso (Guía completa)*. Blog de TechSmith en Español. https://www.techsmith.es/blog/manual-usuario/
* Universidad Rafael Landívar. (2026). *Normas y lineamientos institucionales para la presentación de proyectos técnicos y académicos*. Facultad de Ingeniería, Quetzaltenango, Guatemala.

