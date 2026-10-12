# Despliegue web con Vercel

## Configuración versionada

`Frontend/vercel.json` fija el framework Vite, `npm run build`, la carpeta `dist` y el rewrite de rutas SPA. El build se valida con `cd Frontend && npm run build`.

## Configuración pendiente en la cuenta Vercel

La vinculación de GitHub y estos ajustes pertenecen al proyecto de Vercel y no se pueden establecer desde los archivos del repositorio:

1. Autorizar la aplicación Vercel para el repositorio `MiloDou/Mesa-Competitividad-Dev` desde la cuenta propietaria.
2. Importar o conectar ese repositorio en Vercel.
3. En **Settings → Build and Deployment**, establecer **Root Directory** en `Frontend`.
4. En **Settings → Git**, seleccionar `develop` como **Production Branch**.
5. Confirmar en el proyecto los comandos y salida declarados en `Frontend/vercel.json`.

Con la integración instalada, Vercel debe crear despliegues de preview para ramas/PRs y actualizar producción cuando se integren cambios a `develop`. La ejecución real de estos despliegues depende de la conexión y permisos en la cuenta Vercel.

## API requerida para producción

`Frontend/src/api/client.ts` usa `VITE_API_BASE_URL` y, si no se establece, apunta a `http://127.0.0.1:8000/api/v1`. Ese valor solo sirve en desarrollo local. Antes de desplegar, configura `VITE_API_BASE_URL` en Vercel para Preview y Production con la URL HTTPS pública del backend, por ejemplo `https://api.ejemplo.org/api/v1` cuando el equipo tenga un dominio de API real. No se debe publicar un valor `localhost`, una URL ficticia ni credenciales.

El repositorio no registra todavía una URL pública del backend. Sin esa variable, el sitio estático puede desplegarse, pero las funciones conectadas a API no funcionarán en producción.

## Flujo del equipo

1. Actualizar la rama local desde `develop`.
2. Crear una rama para el cambio.
3. Subir la rama y abrir un PR hacia `develop`.
4. Revisar el enlace de Preview que publique Vercel una vez conectada la integración.
5. Integrar el PR solo después de validar el Preview; Vercel tomará `develop` como producción según la configuración indicada arriba.

## Comprobación actual

El archivo de configuración y el build local pueden comprobarse en CI. No se afirma que GitHub esté vinculado a un proyecto Vercel ni que exista un despliegue hasta confirmar el acceso en la cuenta y observar una URL y estado de deployment reales.
