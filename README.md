# 🏛️ Plataforma Digital — Mesa de Competitividad de Quetzaltenango

Plataforma integral (Web, Móvil y API REST) desarrollada para centralizar la presencia institucional pública, la administración de iniciativas estratégicas, la convocatoria y seguimiento de sesiones de trabajo, y la toma de decisiones por votación colegiada de la **Mesa de Competitividad de Quetzaltenango**.

---

## 📌 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Componentes de la Solución](#-componentes-de-la-solución)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Instalación y Configuración Local](#-instalación-y-configuración-local)
  - [Requisitos Previos](#requisitos-previos)
  - [1. Backend (Django REST Framework)](#1-backend-django-rest-framework)
  - [2. Frontend Web (React + Vite)](#2-frontend-web-react--vite)
  - [3. Aplicación Móvil (React Native + Expo)](#3-aplicación-móvil-react-native--expo)
- [Modelo de Seguridad y Roles (RBAC)](#-modelo-de-seguridad-y-roles-rbac)
- [Pruebas Automatizadas y Calidad](#-pruebas-automatizadas-y-calidad)
- [Documentación Adicional](#-documentación-adicional)
- [Equipo y Créditos Académicos](#-equipo-y-créditos-académicos)
- [Licencia](#-licencia)

---

## 🎯 Descripción General

La Mesa de Competitividad de Quetzaltenango reúne a representantes de la academia, sector público y sector privado. Esta plataforma resuelve problemáticas clave del ecosistema institucional:

1. **Dispersión de información:** Centralización de minutas, actas, acuerdos, noticias e indicadores de competitividad.
2. **Trazabilidad de iniciativas:** Seguimiento por fases, responsables y porcentajes de avance de los proyectos regionales.
3. **Gestión de representaciones:** Control histórico de delegados institucionales, periodos de vigencia y relevos sin pérdida de continuidad.
4. **Gobierno y toma de decisiones:** Módulo de sesiones de trabajo con convocatorias, agenda formal y votaciones seguras con voto único idempotente.

---

## 🏗️ Arquitectura del Sistema

La solución adopta una arquitectura desacoplada centrada en una API REST modular:

```text
┌─────────────────────────────────────────────────────────────┐
│                       Clientes                              │
│   ┌──────────────────────────┐   ┌───────────────────────┐  │
│   │   Frontend Web (React)   │   │  App Móvil (Expo/RN)  │  │
│   │ (Sitio Público + CMS)    │   │  (Miembros y Votos)   │  │
│   └─────────────┬────────────┘   └───────────┬───────────┘  │
└─────────────────┼────────────────────────────┼──────────────┘
                  │ HTTPS / JSON               │ HTTPS / JSON
                  ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Backend                    │
│             Django 5.x + Django REST Framework              │
│                                                             │
│   [accounts]   [portal]   [directory]   [meetings]   ...    │
│   [projects]   [voting]   [common]      [audit]             │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
    ┌────────────────────┐          ┌─────────────────────┐
    │  Base de Datos     │          │  Servicios Cloud    │
    │  PostgreSQL/SQLite │          │  Brevo API (Email)  │
    └────────────────────┘          │  Storage / Vercel   │
                                    └─────────────────────┘
```

---

## 🧩 Componentes de la Solución

### 1. Portal Web Institucional y CMS (`/Frontend`)
- **Portal Público:** Presentación de la Mesa, agenda del *Summit de Competitividad*, ejes estratégicos, noticias, directorio de miembros y formulario de contacto.
- **Panel Administrativo (CMS):** Editor de contenido del sitio, gestión de instituciones aliadas, administración de miembros, actas, documentos y proyectos.

### 2. API REST Modular (`/Backend`)
- Autenticación mediante sesiones y tokens revocables.
- Flujo transaccional de recuperación de credenciales mediante integración con **Brevo API**.
- Control estricto de accesos basado en capacidades y roles (RBAC).
- Registro de auditoría, borrado lógico (*soft delete*) y estados de publicación.

### 3. Aplicación Móvil para Miembros (`/Mobile`)
- Diseñada para representantes y miembros activos acreditados.
- Visualización de próximas reuniones y convocatorias con acceso a enlaces virtuales.
- Consulta de iniciativas y proyectos en curso.
- Participación en votaciones colegiadas habilitadas en tiempo real.

---

## 💻 Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Python 3.11+, Django 5.x, Django REST Framework, SQLite (Dev) / PostgreSQL (Prod) |
| **Frontend Web** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Móvil** | React Native, Expo SDK, TypeScript |
| **Integraciones** | Brevo API (Email transaccional), OpenAPI / Swagger |
| **Infraestructura** | Vercel (Frontend & Serverless deployment), GitHub Actions (CI/CD) |

---

## 📁 Estructura del Repositorio

```text
.
├── Backend/                 # API RESTful en Django y configuración del servidor
│   ├── accounts/            # Usuarios, roles, perfiles y autenticación
│   ├── directory/           # Instituciones y directorio de representantes
│   ├── meetings/            # Sesiones, convocatorias, actas y agendas
│   ├── portal/              # Contenido público, noticias, hitos y CMS
│   ├── projects/            # Iniciativas, etapas, metas y documentos
│   ├── voting/              # Votaciones, opciones, emisión y cómputo de votos
│   └── config/              # Configuración general de Django y rutas globales
├── Frontend/                # Aplicación Web (Portal Institucional y Panel CMS)
│   ├── src/views/public/    # Páginas y secciones abiertas al público
│   ├── src/views/admin/     # Panel de administración y gestión interna
│   └── src/api/             # Clientes HTTP y conexión a la API REST
├── Mobile/                  # Aplicación móvil en React Native / Expo
│   └── src/native/screens/  # Pantallas móviles (Reuniones, Votación, Iniciativas)
└── Docs/                    # Especificaciones técnicas, arquitectura y manuales
```

---

## 🚀 Instalación y Configuración Local

### Requisitos Previos

- **Python** 3.11 o superior y `pip`
- **Node.js** 18.x LTS o superior y `npm`
- **Git**
- *(Opcional)* Aplicación **Expo Go** en tu dispositivo móvil o un emulador configurado.

---

### 1. Backend (Django REST Framework)

1. Ingresa a la carpeta del backend:
   ```bash
   cd Backend
   ```
2. Crea y activa un entorno virtual de Python:
   ```bash
   python -m venv .venv

   # En Linux / macOS:
   source .venv/bin/activate

   # En Windows:
   .venv\Scripts\activate
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configura las variables de entorno creando un archivo `.env`:
   ```bash
   cp .env.example .env
   ```
5. Aplica las migraciones de la base de datos:
   ```bash
   python manage.py migrate
   ```
6. *(Opcional)* Crea un superusuario para acceder al panel de administración:
   ```bash
   python manage.py createsuperuser
   ```
7. Inicia el servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
   > La API estará disponible en `http://127.0.0.1:8000/api/` y la documentación OpenAPI interactiva en `http://127.0.0.1:8000/api/docs/`.

---

### 2. Frontend Web (React + Vite)

1. En una nueva terminal, navega a la carpeta de la interfaz web:
   ```bash
   cd Frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Configura el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   > Abre el enlace proporcionado en consola (usualmente `http://localhost:5173`) en tu navegador.

---

### 3. Aplicación Móvil (React Native + Expo)

1. En otra terminal independiente, navega a la carpeta móvil:
   ```bash
   cd Mobile
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el empaquetador de Expo:
   ```bash
   npx expo start
   ```
4. **Ejecución:**
   - Escanea el código QR desde la app **Expo Go** (Android/iOS).
   - Presiona `a` para abrir en el emulador de Android.
   - Presiona `w` para probar una vista preliminar web.

---

## 🔐 Modelo de Seguridad y Roles (RBAC)

El sistema opera bajo una matriz de capacidades acumulables por rol:

| Rol | Alcance y Facultades |
| :--- | :--- |
| **Administrador / Comisión** | Control total de usuarios, roles, configuraciones globales, auditoría y publicación. |
| **Editor** | Redacción y actualización de proyectos, convocatorias, actas y noticias institucionales. |
| **Miembro Acreditado** | Consulta de reuniones internas, revisión de iniciativas y emisión de votos en asambleas. |
| **Lector Interno** | Acceso de solo lectura a documentos y acuerdos no públicos. |
| **Público General** | Navegación sobre información de divulgación abierta (sin autenticación). |

---

## 🧪 Pruebas Automatizadas y Calidad

Para ejecutar la suite de pruebas unitarias y de integración del Backend:

```bash
cd Backend
python manage.py test
```

Para verificar la compilación y tipado del Frontend Web:

```bash
cd Frontend
npm run build
```

---

## 📄 Documentación Adicional

En el directorio [`Docs/`](Docs/) se encuentra la documentación técnica y funcional detallada del proyecto:

- [Arquitectura y Modelo de Datos](Docs/ARQUITECTURA_ACTUAL.md)
- [Especificación de Endpoints y API REST](Docs/API_BACKEND.md)
- [Matriz de Pruebas y Criterios de Aceptación](Docs/PRUEBAS_ACEPTACION.md)
- [Guía de Despliegue en Vercel y Cloud](Docs/DESPLIEGUE_VERCEL.md)
- [Manual de Usuario - Aplicación Móvil](Docs/DOCUMENTO_5_MANUAL_USUARIO_APP_MOVIL.md)

---


## ⚖️ Licencia

Este proyecto fue desarrollado con fines académicos y de impacto institucional para la Mesa de Competitividad de Quetzaltenango. Todos los derechos de imagen y contenido institucional pertenecen a sus respectivas organizaciones.
````
