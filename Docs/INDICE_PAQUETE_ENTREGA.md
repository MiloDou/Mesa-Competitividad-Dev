# Índice del paquete de entrega

Estado recopilado el 13 de octubre de 2026. Este índice reúne las fuentes de documentación del repositorio para preparar la entrega indicada para el 14 de noviembre de 2026. No sustituye los documentos académicos originales ni acredita acuerdos con la Mesa.

## Documentos académicos y manuales

| Documento | Contenido |
|---|---|
| [Memoria general y especificación](DOCUMENTO_1_MEMORIA_GENERAL_Y_ESPECIFICACION.docx) | Memoria y especificación del proyecto. |
| [Manual de usuario del sitio y CMS](DOCUMENTO_3_MANUAL_USUARIO_SITIO_Y_CMS.md) | Uso del sitio institucional y administración de contenido. |
| [Manual del sistema administrativo](Documento_4_Manual_de_usuario_sistema_administrativo_actualizado.docx) | Guía de usuario del sistema administrativo. |
| [Plan y evidencias de pruebas](DOCUMENTO_7_PLAN_Y_EVIDENCIAS_DE_PRUEBAS.docx) | Plan y evidencias académicas de pruebas. |
| [Pruebas de aceptación y trazabilidad](PRUEBAS_ACEPTACION.md) | Criterios de aceptación, estado de evidencia y matriz resumida del Entregable No. 2. |

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

## Verificación de preparación

- [x] Los documentos académicos, técnicos y manuales existentes están enlazados desde este índice.
- [x] El build local del frontend termina correctamente.
- [x] `npx tsc --noEmit` del frontend termina correctamente.
- [x] `manage.py check` y las 24 pruebas del backend terminan correctamente.
- [x] Las 9 pruebas del servidor de presentación móvil terminan correctamente.
- [ ] Corregir los errores de ejecución en 2 suites móviles (19 fallos; 73 pruebas pasan) y volver a ejecutar Jest.
- [ ] Resolver la fecha: el README y el calendario registran el Entregable No. 2 para el 14 de octubre de 2026 y la entrega final del curso para el 4 de noviembre de 2026; este índice toma el 14 de noviembre de 2026 de la solicitud actual, pendiente de confirmación con el docente.
- [ ] Corregir los errores de TypeScript reportados por `Mobile/npm run typecheck` y volver a ejecutar la comprobación.
- [x] Confirmar en Vercel que el proyecto web existente está conectado a GitHub, usa `Frontend` como raíz y despliega `develop` a producción.
- [x] Elegir una configuración dentro de cuotas gratuitas: Vercel Hobby y Supabase Free para PostgreSQL y Storage privado; documentar sus límites y preparar la configuración del backend.
- [ ] Crear el proyecto API con `Backend` como raíz y asignar `DATABASE_URL`, `DJANGO_SECRET_KEY`, hosts y CORS de producción.
- [ ] Crear el proyecto Supabase Free, el bucket privado y credenciales S3 server-side; la sesión de Supabase requiere que el usuario inicie sesión y acepte cualquier condición presentada.
- [ ] Publicar el backend en una URL HTTPS y asignarla a `VITE_API_BASE_URL` en Production; Preview solo debe apuntar a un backend/base de prueba independiente.
- [ ] Comprobar en Vercel un despliegue exitoso y verificar desde el sitio publicado que una llamada a API responde correctamente, con CORS permitido para el dominio web.
- [ ] Actualizar las evidencias de aceptación con verificaciones realizadas en el entorno publicado.

## Estado de Vercel y API

La cuenta Vercel tiene el proyecto `mesa-competitividad-dev` conectado a `MiloDou/Mesa-Competitividad-Dev`, con `Frontend` como raíz, `develop` como rama de producción y un deployment marcado **Ready**. El panel muestra que no tiene variables de entorno. No hay aún un proyecto backend ni una URL pública de API. El CLI de Vercel no está instalado en este entorno; el estado de la web se confirmó en el panel.
