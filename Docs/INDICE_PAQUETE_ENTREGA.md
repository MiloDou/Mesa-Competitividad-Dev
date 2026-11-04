# Índice del paquete de entrega

Estado recopilado el 13 de octubre de 2026. Este índice reúne las fuentes de documentación del repositorio para preparar la entrega indicada para el 14 de noviembre de 2026. No sustituye los documentos académicos originales ni acredita acuerdos con la Mesa.

## Documentos académicos y manuales

| Documento | Contenido |
|---|---|
| [Memoria general y especificación](DOCUMENTO_1_MEMORIA_GENERAL_Y_ESPECIFICACION.docx) | Memoria y especificación del proyecto. |
| [Documentación técnica](DOCUMENTO_2_DOCUMENTACION_TECNICA.docx) | Arquitectura, API, datos e integración de componentes. |
| [Manual de usuario del sitio y CMS](DOCUMENTO_3_MANUAL_USUARIO_SITIO_Y_CMS.md) | Uso del sitio institucional y administración de contenido. |
| [Manual del sistema administrativo](Documento_4_Manual_de_usuario_sistema_administrativo_actualizado.docx) | Guía de usuario del sistema administrativo. |
| [Manual de usuario de la app móvil](DOCUMENTO_5_MANUAL_USUARIO_APP_MOVIL.md) | Guía de uso para miembros y participación móvil. |
| [Manual técnico de instalación y despliegue](DOCUMENTO_6_MANUAL_TECNICO_INSTALACION_DESPLIEGUE_MANTENIMIENTO.docx) | Procedimientos para desarrollo local, configuración y operación. |
| [Plan y evidencias de pruebas](DOCUMENTO_7_PLAN_Y_EVIDENCIAS_DE_PRUEBAS.docx) | Plan y evidencias académicas de pruebas. |
| [Pruebas de aceptación y trazabilidad](PRUEBAS_ACEPTACION.md) | Criterios de aceptación, estado de evidencia y matriz resumida. |

## Documentación técnica y de coordinación

| Documento | Contenido |
|---|---|
| [README general](../README.md) | Alcance, estructura, estado y arranque del proyecto. |
| [Arquitectura actual](ARQUITECTURA_ACTUAL.md) | Componentes, contratos y arquitectura implementada. |
| [Contrato de API](API_BACKEND.md) | Rutas, autenticación, permisos y ejemplos de la API. |
| [Estado de integración](ESTADO_INTEGRACION.md) | Qué flujos consumen API y cuáles siguen siendo demostrativos. |
| [Despliegue web en Vercel](DESPLIEGUE_VERCEL.md) | Configuración de frontend, conexión Git y variable de API. |
| [Calendario y responsables](CALENDARIO_ENTREGA.md) | Hitos, plan de trabajo y responsables registrados. |
| [Lineamientos del curso y GitHub](LINEAMIENTOS_GITHUB.md) | Criterios académicos, ramas y colaboración. |
| [Instrucciones para agentes](INSTRUCCIONES_IA.md) | Reglas de trabajo asistido por IA. |
| [Contribución](../CONTRIBUTING.md) | Flujo para cambios y Pull Requests. |

## Guías por componente y contrato móvil

- [Backend / API](../Backend/README.md)
- [Frontend web](../Frontend/README.md)
- [Aplicación móvil](../Mobile/README.md)
- [Contrato OpenAPI móvil](../Mobile/openapi_movil.yaml)
- [Guía de presentación móvil](../Mobile/PRESENTACION.md)

## Verificación de preparación (Fase Final: Noviembre 2026)

- [x] Los 7 documentos académicos y manuales están organizados y enlazados en este índice.
- [x] El build del frontend web termina correctamente (`npm run build` en Vite).
- [x] `npx tsc --noEmit` del frontend web termina sin errores (TypeScript limpio).
- [x] `manage.py check` y las 30 pruebas unitarias del backend terminan correctamente (100% OK).
- [x] Las 9 suites de pruebas móviles (92 pruebas en Jest) pasan sin fallos.
- [x] Comprobación de TypeScript en Mobile (`npx tsc --noEmit`) sin errores.
- [x] Frontend desplegado en Vercel en `https://mesa-competitividad-dev-pi.vercel.app` (HTTP 200 OK).
- [x] Backend API Django desplegado en Vercel en `https://mesa-competitividad-api.vercel.app` con `/api/health/` y `/api/schema/` respondiendo 200 OK.
- [x] Base de datos PostgreSQL alojada en Supabase Free conectada con SSL (`sslmode=require`) y migraciones ejecutadas.
- [x] Reglas CORS verificadas permitiendo el origen web de Vercel.
- [x] Rutas públicas del portal respondiendo datos reales (`/api/v1/public/projects/`, `/publications/`, `/events/`, `/landing-content/`).
- [x] Servidor de presentación móvil con túnel Cloudflare y código QR disponible para demostraciones en vivo (`npm run presenta`).
- [ ] Subir la documentación completa (formatos DOCX/PDF) al portal académico del curso antes del Miércoles 4 de noviembre.
- [ ] Ensayo grupal de la presentación de 8 minutos para la evaluación docente del Lunes 9 de noviembre.

## Estado de Despliegue en Internet y Servicios

- **Frontend Web:** `https://mesa-competitividad-dev-pi.vercel.app` (Vercel Hobby, rama `develop`).
- **Backend API:** `https://mesa-competitividad-api.vercel.app` (Vercel Serverless WSGI).
- **Base de Datos:** PostgreSQL en Supabase (`hbllnxysfwmjofuyyfom`).
- **Servicio Transaccional de Correo:** Brevo API HTTPS configurada para restablecimiento de contraseña.
- **Verificación en Vivo:** El script `mesa-competitividad-dev/Backend/verify_deploy.sh` confirma la salud de los servicios, esquemas y CORS de punta a punta.
