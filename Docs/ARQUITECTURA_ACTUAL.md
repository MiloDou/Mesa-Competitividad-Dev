# Arquitectura y modelo actuales

Documento basado en los contratos y modelos que existen en el repositorio. El diagrama distingue los flujos conectados de las vistas que todavía conservan datos de demostración. No describe un despliegue productivo.

## Componentes

```mermaid
flowchart LR
  Browser[ navegador web React / Vite ] -->|HTTPS en despliegue; REST JSON| API[ Django REST Framework /api/v1 ]
  Expo[ app móvil Expo ] -->|REST JSON y Bearer token| API
  API --> Accounts[ accounts: autenticación y roles ]
  API --> Projects[ projects: iniciativas y documentos ]
  API --> Meetings[ meetings: convocatorias, minutas y acuerdos ]
  API --> Voting[ voting: procesos y votos ]
  API --> Portal[ portal: perfil, publicaciones y eventos ]
  API --> Notifications[ notifications: bandeja y cola push ]
  API --> Audit[ audit: bitácora ]
  Accounts --> DB[(SQLite desarrollo / PostgreSQL configurado)]
  Projects --> DB
  Meetings --> DB
  Voting --> DB
  Portal --> DB
  Notifications --> DB
  Audit --> DB
  Projects --> PrivateFiles[(private_uploads)]
  Portal --> PrivateFiles
  Notifications -. proveedor opcional .-> ExpoPush[Expo Push]
  Portal -. SMTP opcional .-> Mail[servidor SMTP]
```

**Conectado actualmente:** web pública con recursos CMS y formularios; panel autenticado con lectura y actualización de estado de proyectos y edición del perfil institucional/publicaciones; Mobile con inicio/cierre de sesión, consulta privada de reuniones, proyectos, votaciones, avisos y metadatos de documentos, además de envío de voto y resultados cerrados. La conexión depende de `VITE_API_BASE_URL` o `EXPO_PUBLIC_API_BASE_URL` y de un backend accesible.

**Aún demostrativo:** edición/reordenamiento genérico de secciones CMS, CRUD completo de proyectos, gestión de eventos/medios y reuniones/minutas desde el panel, descarga de documentos en Mobile, notificaciones push, estadísticas y secciones de contenido web complementarias. El comportamiento de respaldo local debe identificarse como demostración.

## Secuencias principales

### Inicio de sesión móvil y consulta de reuniones

```mermaid
sequenceDiagram
  actor Miembro
  participant App as Mobile Expo
  participant API as Django API
  participant DB as Base de datos
  Miembro->>App: correo y contraseña
  App->>API: POST /auth/login/
  API->>DB: valida usuario y emite sesión
  DB-->>API: cuenta, roles y sesión
  API-->>App: access, refresh y perfil
  App->>API: GET /meetings/ + Bearer access
  API->>DB: filtra reuniones visibles para la cuenta
  DB-->>API: reuniones autorizadas
  API-->>App: lista paginada
  App-->>Miembro: presenta reuniones devueltas
```

### Envío idempotente de voto

```mermaid
sequenceDiagram
  actor Miembro
  participant App as Mobile Expo
  participant API as Django API
  participant DB as Base de datos
  Miembro->>App: confirma opción
  App->>API: POST /votings/{id}/cast/ + opción + client_request_id
  API->>API: valida rol, representación vigente y estado abierto
  API->>DB: registra voto con protección de unicidad
  DB-->>API: voto persistido o mismo acuse idempotente
  API-->>App: confirmación del servidor
  App->>API: GET /votings/ (refresca procesos visibles)
  API-->>App: estado actualizado
  App-->>Miembro: muestra voto registrado
```

El UUID se genera una vez cuando se inicia un intento de voto y se conserva si se reintenta desde la pantalla de confirmación. El backend sigue siendo quien aplica el límite de un voto por miembro.

## Clases de dominio

```mermaid
classDiagram
  class User { +email +is_active }
  class Role { +key +name }
  class AuthSession { +access_digest +refresh_digest +revoked_at }
  class Commission { +name +is_active }
  class Member { +first_name +last_name +is_active +public_profile_consent }
  class CommissionMembership { +starts_at +ends_at }
  class Project { +code +title +sector +status +confidentiality +is_public }
  class ProjectAssignment { +responsibility +starts_at +ends_at }
  class FollowUpTopic { +title +due_at +completed_at }
  class Document { +title +content_type +size_bytes +confidentiality }
  class Meeting { +title +scheduled_at +modality +confidentiality }
  class Minute { +content +status +approved_at }
  class Agreement { +title +status +due_at }
  class Voting { +status +options +opens_at +closes_at }
  class Vote { +option +client_request_id +cast_at }
  class Notification { +kind +title +created_at +read_at }
  User "*" -- "*" Role : capacidades
  User "1" -- "*" AuthSession : sesiones
  User "0..1" -- "0..1" Member : perfil
  Member "1" -- "*" CommissionMembership : representación
  Commission "1" -- "*" CommissionMembership : comisión
  Commission "1" -- "*" Project : administra
  Project "1" -- "*" ProjectAssignment : responsables
  Member "1" -- "*" ProjectAssignment : asignación
  Project "1" -- "*" FollowUpTopic : seguimiento
  Project "0..1" -- "*" Document : archivos
  Meeting "1" -- "0..1" Minute : acta
  Meeting "*" -- "*" Member : invitados
  Minute "1" -- "*" Agreement : acuerdos
  Project "0..1" -- "*" Voting : tema
  Agreement "0..1" -- "*" Voting : tema
  Voting "1" -- "*" Vote : votos
  Member "1" -- "*" Vote : participa
  User "1" -- "*" Notification : recibe
```

## Modelo entidad-relación resumido

```mermaid
erDiagram
  USER ||--o{ AUTH_SESSION : abre
  USER }o--o{ ROLE : recibe
  USER ||--o| MEMBER : representa
  MEMBER ||--o{ COMMISSION_MEMBERSHIP : ocupa
  COMMISSION ||--o{ COMMISSION_MEMBERSHIP : contiene
  COMMISSION ||--o{ PROJECT : coordina
  PROJECT ||--o{ PROJECT_ASSIGNMENT : asigna
  MEMBER ||--o{ PROJECT_ASSIGNMENT : responsable
  PROJECT ||--o{ FOLLOW_UP_TOPIC : registra
  PROJECT ||--o{ DOCUMENT : adjunta
  MEETING ||--o| MINUTE : documenta
  MEMBER }o--o{ MEETING : recibe_convocatoria
  MINUTE ||--o{ AGREEMENT : contiene
  PROJECT o|--o{ VOTING : se_somete
  AGREEMENT o|--o{ VOTING : se_somete
  VOTING ||--o{ VOTE : recibe
  MEMBER ||--o{ VOTE : emite
  USER ||--o{ NOTIFICATION : recibe
  USER { int id PK; string email UK; bool is_active }
  ROLE { int id PK; string key UK; string name }
  AUTH_SESSION { int id PK; int user_id FK; string access_digest; string refresh_digest; datetime revoked_at }
  MEMBER { int id PK; int user_id FK; int institution_id FK; string first_name; string last_name; bool is_active }
  COMMISSION_MEMBERSHIP { int id PK; int member_id FK; int commission_id FK; date starts_at; date ends_at }
  PROJECT { int id PK; string code UK; string title; string status; string confidentiality; bool is_public }
  MEETING { int id PK; int commission_id FK; string title; datetime scheduled_at; string modality }
  MINUTE { int id PK; int meeting_id FK_UK; string status; datetime approved_at }
  AGREEMENT { int id PK; int minute_id FK; string title; string status }
  VOTING { int id PK; int commission_id FK; int project_id FK_NULL; int agreement_id FK_NULL; string status }
  VOTE { int id PK; int voting_id FK; int member_id FK; string option; uuid client_request_id }
  DOCUMENT { int id PK; int project_id FK_NULL; int minute_id FK_NULL; string title; string confidentiality }
```

La votación se relaciona con exactamente uno de `PROJECT` o `AGREEMENT`. El documento pertenece exactamente a un proyecto o minuta. `MINUTE.meeting_id` es único. El código fuente y migraciones conservan las restricciones completas, índices y campos restantes.

## Diccionario de datos clave

| Entidad | Campos relevantes | Regla de integridad |
| --- | --- | --- |
| `User` / `Role` | correo, estado, roles y capacidades | La API verifica sesión y capacidad en operaciones privadas. |
| `CommissionMembership` | miembro, comisión, inicio y fin de representación | El periodo no se superpone con otra representación del mismo miembro y comisión. |
| `Project` | código, título, sector, estado, confidencialidad, publicación | Solo información clasificada pública puede publicarse; la API verifica capacidad de publicación. |
| `Meeting` | comisión, agenda, fecha, modalidad, invitados | Fin no anterior al inicio; solo personas convocadas pueden registrar asistencia. |
| `Minute` / `Agreement` | reunión, contenido, aprobación, acuerdo y responsable | Hay una minuta por reunión; una minuta aprobada es inmutable. |
| `Voting` / `Vote` | estado, opciones, fechas, miembro, opción y UUID de solicitud | Tema único entre proyecto/acuerdo; voto único por miembro, con reintento idempotente. |
| `Document` | relación a proyecto o minuta, archivo y confidencialidad | Debe pertenecer a exactamente un padre y respetar el permiso de lectura. |
| `Notification` | destinatario, tipo, cuerpo y lectura | Una cuenta solo consulta y actualiza su propia bandeja. |

Para atributos adicionales, longitud, nulabilidad y valores permitidos, consultar los modelos en `Backend/accounts/`, `Backend/directory/`, `Backend/projects/`, `Backend/meetings/`, `Backend/voting/` y `Backend/notifications/`.

## Persistencia ACID

La integración conserva las transacciones y restricciones que ya implementa Django (por ejemplo, rotación de sesión y registro de votos) y no escribe directamente en la base desde los clientes. El navegador y Expo solo consideran persistida una operación después del acuse de API. SQLite es el perfil local; Compose configura PostgreSQL para pruebas compartidas. La durabilidad productiva depende de desplegar la base, respaldos y restauración descritos en [Backend/README.md](../Backend/README.md).
