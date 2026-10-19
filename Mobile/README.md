# Interfaz móvil de la Mesa

Esta carpeta contiene el **frontend React Native con Expo** para miembros de la Mesa. La entrada actual es `index.ts` → `App.tsx` → `src/native/MobileApp.tsx`. Las pantallas permiten revisar el recorrido visual de acceso, inicio, reuniones, iniciativas, propuestas, voto, avisos, documentos y perfil.

## Estado real

- **Conectado a la API del proyecto** (`src/api/`): inicio y cierre de sesión, lista y detalle de votaciones, envío del voto y consulta de resultados. El contrato que consume la app está en [`openapi_movil.yaml`](openapi_movil.yaml). La ejecución contra un backend/dispositivo real aún requiere una prueba autorizada.
  - La sesión usa el token opaco Bearer del backend. El refresh se guarda con `expo-secure-store` y se renueva al recibir un 401.
  - Las lecturas se repiten tras renovar la sesión; **el envío del voto nunca se reenvía automáticamente**. Cada intento usa un `client_request_id` (UUID de `expo-crypto`), y un reintento manual reutiliza el mismo UUID para que el servidor no duplique el voto.
  - Antes del POST se exige confirmación explícita en un diálogo que se abre al revisar la elección; cancelar no envía nada. El recorrido de voto desde la tarjeta pendiente de Inicio necesita cinco activaciones en la prueba automatizada. Tras una respuesta válida del envío se muestra solo un aviso de voto registrado, no un comprobante oficial ni una fecha inventada. Si el POST tuvo un resultado ambiguo, se consulta `GET /votings/{id}/`: `member_has_voted=true` solo permite avisar que la cuenta ya tiene un voto en esa votación; no identifica opción, fecha ni cuál intento lo registró. Con `false` o error, el resultado sigue incierto y no se reenvía automáticamente. El backend no expone una API de comprobante propio ni `comprobante_url`.
  - Los resultados se piden solo para votaciones cerradas; el servidor los rechaza antes del cierre.
- Reuniones, iniciativas, avisos y documentos siguen usando datos sintéticos de `src/native/data.ts` y muestran el aviso de demostración.
- Los avisos y las iniciativas tienen fichas navegables de ejemplo; los documentos son referencias sin archivo descargable.
- Desde Perfil se pueden revisar los estados de carga, lista vacía y error en las listas de reuniones, iniciativas, avisos y documentos. El botón Reintentar vuelve a los datos de ejemplo; no hace una petición de red.
- Cada documento tiene una ficha y un espacio de vista previa, pero no contiene ni descarga un PDF real.
- La vista de resultados consulta conteos y porcentajes del servidor solo al cerrar la votación; no decide quórum, aprobación ni ganadores. Sin un backend de pruebas conectado, las pruebas Jest usan transporte falso y no acreditan resultados reales.
- La API está documentada en `../Docs/API_BACKEND.md`. Documentos reales, reuniones y notificaciones push todavía no se consumen desde la app.
- El prototipo anterior React/Vite permanece en `src/views/`, `src/components/`, `src/data/` y archivos relacionados como referencia temporal; la entrada Expo no lo importa. Su retiro requiere coordinación con el equipo.

## Servidor de presentación (navegador + QR)

Guía completa para cualquier computadora (Windows/macOS/Linux): [PRESENTACION.md](PRESENTACION.md). Para que un agente lo configure todo: pídele que lea y siga [AGENTE-PRESENTACION.md](AGENTE-PRESENTACION.md).

`server/` es un servidor Node 24 sin dependencias (`node:http`, `node:sqlite`) que sirve la app web y una API con el contrato de `openapi_movil.yaml`. Los datos son ficticios y nada es un voto oficial.

- `npm run presenta`: compila la web y la sirve en `http://<IP-LAN>:8080` para teléfonos en la misma red. Antes abre el puerto con `sudo firewall-cmd --add-port=8080/tcp` (temporal). Si defines `WIFI_SSID` y `WIFI_PASSWORD`, la página `/qr` también muestra un QR para unirse a la red.
- `npm run presenta:internet` (recomendado): el servidor solo escucha en esta PC y abre un túnel rápido de Cloudflare (requiere `cloudflared`) para que entren con sus propios datos móviles mediante una URL `https://…trycloudflare.com`.
- La terminal muestra el QR, la contraseña (fija con `DEMO_PASSWORD=1234`, o nueva en cada arranque; nunca en Git) y la URL. Abre `http://localhost:8080/qr` **en esta PC** y proyéctalo: la página `/qr` muestra la contraseña y por eso no se sirve por el túnel ni desde otros equipos. Usuario: `mesa` (también `presidencia` y `secretaria`). Tras 200 intentos fallidos en 5 minutos desde una misma IP pública, esa IP espera.
- Cada inicio de sesión vota una sola vez y de forma independiente, aunque todos usen la misma cuenta. «Ver cómo va» muestra el conteo real y compartido de todos los votos emitidos (empieza en 0 en cada arranque, con botón «Actualizar conteo»). Cerrar sesión no retira el voto. Mostrar el avance de una votación abierta contradice la regla móvil y solo aplica a esta rama de presentación.
- «Abrir PDF» abre en otra pestaña un PDF generado por el servidor (pie «Entorno de demostración»), que se puede guardar o compartir.
- Las sesiones no caducan: duran hasta que apagas el servidor (Ctrl+C) y sobreviven a una recarga de la página. Mientras corre, la PC no se suspende (`systemd-inhibit`) y, si el servidor se cae, se reinicia con la misma contraseña. Mantén la PC conectada a la corriente.
- `node server/carga.mjs http://localhost:8080 <contraseña> 20 5` simula 20 personas con el mismo usuario haciendo el recorrido completo. Deja votos reales: después relanza `npm run presenta` para empezar en 0.
- `npm run test:server` ejecuta las pruebas del servidor; la base local queda en `server/data/` (ignorada).

## Ejecutar

Requiere una versión LTS de Node.js y un dispositivo o emulador compatible con el SDK de Expo fijado en `package.json`.

```powershell
cd Mobile
npm ci
npm start
```

Expo mostrará un QR. En un teléfono con Expo Go, escanéalo con el teléfono y la computadora conectados a la misma red. En Windows, para verla en la PC, instala Android Studio y crea un dispositivo virtual desde **Device Manager**; inicia el dispositivo y presiona `a` en la terminal donde corre Expo. La [guía oficial de Expo](https://docs.expo.dev/get-started/set-up-your-environment/?device=simulated&mode=expo-go&platform=android) explica la configuración del emulador y el SDK.

Para usar el backend local, copia `.env.example` como `.env` y ajusta `EXPO_PUBLIC_API_BASE_URL` (en el emulador Android usa `http://10.0.2.2:8000/api/v1`). Con un teléfono físico, agrega la IP de la PC a `DJANGO_ALLOWED_HOSTS` del backend. Ten en cuenta que login y refresh comparten un límite de 10 solicitudes por hora.

`npm run typecheck` verifica los tipos. `npm test -- --runInBand` ejecuta las pruebas unitarias con Jest; las pruebas de envío son simuladas y no hacen votos reales. `npm run mock` sirve `fixtures/json-server/fixtures.json` con la forma de las votaciones como referencia, pero no reproduce la paginación ni el POST de voto. Las pantallas de esta carpeta no se abren desde la URL del proyecto `Frontend/`.

## Organización del frontend

```text
src/api/
├── client.ts             Sesión, Bearer, renovación y envoltura de errores
├── votings.ts            Votaciones, voto, comprobante y mapeo a los campos del Run 03
└── types.ts              Formas reales de la API
src/native/
├── components.tsx       Componentes visuales compartidos y navegación inferior
├── data.ts               Datos sintéticos de las secciones aún sin API
├── MobileApp.tsx         Estado local y selección de pantallas
├── screens/              Acceso, inicio, reuniones, votación e información
├── theme.ts              Colores, tipografía y medidas de la línea gráfica
└── types.ts              Tipos usados solo por la interfaz móvil
```

El [diseño editable en Figma](https://www.figma.com/design/k0R0KFBJiUlS4hIqXPvz91) sirve de guía visual. Los textos de demostración y las reglas pendientes deberán revisarse con la Mesa antes de conectar datos reales.
