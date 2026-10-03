# Interfaz móvil de la Mesa

Esta carpeta contiene el **frontend React Native con Expo** para miembros de la Mesa. La entrada actual es `index.ts` → `App.tsx` → `src/native/MobileApp.tsx`. Las pantallas permiten revisar el recorrido visual de acceso, inicio, reuniones, iniciativas, propuestas, voto, avisos, documentos y perfil.

## Estado real

- La interfaz utiliza datos sintéticos de `src/native/data.ts`.
- El acceso, la elección de voto y su confirmación son demostraciones locales. No autentican, envían ni registran información en un servidor.
- Los avisos y las iniciativas tienen fichas navegables de ejemplo; los documentos son referencias sin archivo descargable.
- Desde Perfil se pueden revisar los estados de carga, lista vacía y error en las listas de reuniones, iniciativas, avisos y documentos. El botón Reintentar vuelve a los datos de ejemplo; no hace una petición de red.
- Cada documento tiene una ficha y un espacio de vista previa, pero no contiene ni descarga un PDF real.
- La vista de resultados de una votación cerrada muestra solo el estado de publicación pendiente; no incluye cifras ni decisiones reales de la Mesa.
- Resultados, permisos, documentos reales y notificaciones push dependen de contratos y servicios aún no implementados en este repositorio.
- El prototipo anterior React/Vite permanece en `src/views/`, `src/components/`, `src/data/` y archivos relacionados como referencia temporal; la entrada Expo no lo importa. Su retiro requiere coordinación con el equipo.

## Ejecutar

Requiere una versión LTS de Node.js y un dispositivo o emulador compatible con el SDK de Expo fijado en `package.json`.

```powershell
cd Mobile
npm ci
npm start
```

Expo mostrará un QR. En un teléfono con Expo Go, escanéalo con el teléfono y la computadora conectados a la misma red. En Windows, para verla en la PC, instala Android Studio y crea un dispositivo virtual desde **Device Manager**; inicia el dispositivo y presiona `a` en la terminal donde corre Expo. La [guía oficial de Expo](https://docs.expo.dev/get-started/set-up-your-environment/?device=simulated&mode=expo-go&platform=android) explica la configuración del emulador y el SDK.

`npm run typecheck` verifica los tipos. No hay todavía un runner de pruebas unitarias ni una API para realizar pruebas integradas. Las pantallas de esta carpeta no se abren desde la URL del proyecto `Frontend/`.

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
