# Instrucciones para agentes de código (Codex, Claude Code, Antigravity u otro)

Objetivo: dejar lista la presentación de la app móvil en la computadora del usuario y decirle exactamente cómo arrancarla. La guía humana está en `Mobile/PRESENTACION.md`.

## Reglas
- Trabaja solo en la rama `feat/mobile-demo-r04`. No hagas commit, push, merge ni rebase. No modifiques código.
- Pide confirmación antes de instalar programas del sistema (Node, cloudflared, git) o de cambiar el firewall. Muestra el comando exacto que vas a ejecutar.
- No crees `.env`, tokens ni credenciales. La contraseña de la demostración se pasa con `DEMO_PASSWORD` al arrancar.
- Ejecuta y verifica cada paso de verdad; no supongas el resultado. Al final distingue lo comprobado de lo pendiente.

## Pasos

1. **Detecta el sistema** (Windows, macOS o Linux) y la consola (PowerShell, CMD o bash).
2. **Revisa Node** con `node -v`.
   - Si falta o es menor que v24, propón instalarlo: Windows `winget install OpenJS.NodeJS`; macOS `brew install node@24`; Linux `nvm install 24` o el paquete de nodejs.org.
   - Después vuelve a comprobar la versión.
3. **Revisa cloudflared** con `cloudflared --version`.
   - Solo hace falta para el modo internet. Si falta, propón instalarlo: Windows `winget install Cloudflare.cloudflared`; macOS `brew install cloudflared`; Linux el `.rpm` o `.deb` de https://github.com/cloudflare/cloudflared/releases.
4. **Prepara el repositorio.**
   - Si no está clonado: `git clone git@github.com:MiloDou/Mesa-Competitividad-Dev.git`. Si falla por SSH, usa la URL HTTPS.
   - Si ya está clonado: `git fetch origin` y `git status`. Si hay cambios sin guardar, **detente y pregunta**.
   - Luego `git checkout feat/mobile-demo-r04` y `git pull --ff-only`.
5. **Instala dependencias** desde `Mobile/` con `npm install`. No uses `npm audit fix` ni actualices paquetes.
6. **Verifica el servidor** desde `Mobile/` con `npm run test:server`. Debe dar `pass 9`, `fail 0`.
7. **Verifica la compilación web** con `npm run build:web`. Debe crear `Mobile/dist/` sin errores.
8. **Haz una prueba de humo.**
   - Arranca `npm run presenta` en segundo plano con `DEMO_PASSWORD=1234`. En PowerShell: `$env:DEMO_PASSWORD="1234"`.
   - Comprueba que `http://localhost:8080/qr` responde 200 y que `http://localhost:8080/` sirve la app.
   - Detén el proceso con Ctrl+C o matando su PID. Confirma que el puerto 8080 quedó libre.
   - Si el puerto está ocupado, usa `PORT=8081`.
9. **Entrega al usuario un resumen** con:
   - las versiones instaladas y el resultado de las pruebas;
   - el comando para arrancar en su consola. Modo internet, recomendado: `DEMO_PASSWORD=1234 npm run presenta:internet` (o la variante de PowerShell/CMD). Modo red local: `npm run presenta`;
   - que debe abrir `http://localhost:8080/qr` **en esa misma computadora** y proyectarlo;
   - que el usuario es `mesa`, la contraseña es la de `DEMO_PASSWORD`, se detiene con Ctrl+C y los votos vuelven a 0 en cada arranque;
   - para el modo red local, el aviso de que el firewall debe permitir el puerto TCP 8080. Los comandos están en `PRESENTACION.md`, sección 4.

## Fallos conocidos
- **Error con `node:sqlite` o con archivos `.ts`:** la versión de Node es menor que 24.
- **`No se encontró cloudflared`:** falta el paso 3.
- **La página `/qr` responde 404 desde otro equipo:** es lo esperado; solo abre en localhost.
