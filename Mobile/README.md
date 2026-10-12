# Interfaz móvil de la Mesa

Esta carpeta contiene el **frontend React Native con Expo** para miembros de la Mesa. La entrada actual es `index.ts` → `App.tsx` → `src/native/MobileApp.tsx`. Las pantallas permiten revisar el recorrido visual de acceso, inicio, reuniones, iniciativas, propuestas, voto, avisos, documentos y perfil.

## Estado real

- La interfaz conserva datos sintéticos de `src/native/data.ts` como respaldo para la demostración y cuando la API no responde.
- El botón **Iniciar sesión** usa `/auth/login/`; al estar autenticado, consulta reuniones, proyectos permitidos, votaciones, avisos y metadatos de documentos con el token de sesión. La API sigue aplicando los permisos y el alcance de la cuenta. El botón **Entrar a la demostración** conserva el recorrido local anterior.
- Las cuentas de miembro pueden consultar las convocatorias visibles y votar en procesos abiertos. La app envía un UUID idempotente por intento de voto, actualiza la lista tras confirmación y consulta resultados solo en procesos cerrados.
- Sin sesión, la lista de iniciativas consulta `GET /api/v1/public/projects/`. Si la API no responde, conserva las fichas sintéticas.
- Copia `.env.example` a `.env` para configurar `EXPO_PUBLIC_API_BASE_URL`. El ejemplo apunta al backend del equipo anfitrión desde Android Emulator (`http://10.0.2.2:8000/api/v1`). En iOS Simulator usa `127.0.0.1`; en un teléfono físico usa la IP local del equipo y agrega ese host a `DJANGO_ALLOWED_HOSTS`. No expongas el servidor de desarrollo a redes públicas.
- La sesión solo vive en memoria durante la ejecución de la app; al cerrarla hay que iniciar sesión de nuevo. No se añadió almacenamiento de tokens ni una dependencia nueva.
- Los documentos conectados muestran metadatos autorizados; su descarga autenticada todavía no está implementada. Las notificaciones conectadas son la bandeja del sistema; el registro de token y push siguen pendientes.
- La consulta de resultados presenta los conteos y porcentajes que devuelve la API para votaciones cerradas. No infiere quórum, ganador ni aprobación institucional.
- Desde Perfil se pueden revisar los estados de carga, lista vacía y error cuando se entra a demostración. No modifica los resultados del servidor.
- La API y sus rutas están documentadas en `../Docs/API_BACKEND.md`; la integración y sus límites se registran en `../Docs/ESTADO_INTEGRACION.md`.
- El prototipo anterior React/Vite permanece en `src/views/`, `src/components/`, `src/data/` y archivos relacionados como referencia temporal; la entrada Expo no lo importa. Su retiro requiere coordinación con el equipo.

## Ejecutar

Requiere una versión LTS de Node.js y un dispositivo o emulador compatible con el SDK de Expo fijado en `package.json`.

```powershell
cd Mobile
npm ci
npm start
```

Expo mostrará un QR. En un teléfono con Expo Go, escanéalo con el teléfono y la computadora conectados a la misma red. En Windows, para verla en la PC, instala Android Studio y crea un dispositivo virtual desde **Device Manager**; inicia el dispositivo y presiona `a` en la terminal donde corre Expo. La [guía oficial de Expo](https://docs.expo.dev/get-started/set-up-your-environment/?device=simulated&mode=expo-go&platform=android) explica la configuración del emulador y el SDK.

`npm run typecheck` verifica los tipos. Las pruebas de extremo a extremo con una cuenta y un servidor locales aún deben ejecutarse. Las pantallas de esta carpeta no se abren desde la URL del proyecto `Frontend/`.

## Organización del frontend

```text
src/native/
├── components.tsx       Componentes visuales compartidos y navegación inferior
├── data.ts               Datos sintéticos de demostración
├── MobileApp.tsx         Estado local y selección de pantallas
├── screens/              Acceso, inicio, reuniones, votación e información
├── theme.ts              Colores, tipografía y medidas de la línea gráfica
└── types.ts              Tipos usados solo por la interfaz móvil
```

El [diseño editable en Figma](https://www.figma.com/design/k0R0KFBJiUlS4hIqXPvz91) sirve de guía visual. Los textos de demostración y las reglas pendientes deberán revisarse con la Mesa antes de conectar datos reales.
