# Presentación de la app móvil: guía de configuración

Esta guía sirve en Windows, macOS y Linux. La computadora que la ejecuta hace de servidor. Hasta 20 personas abren la app en el navegador de su teléfono, escaneando un QR. Todas usan el mismo usuario y contraseña, cada una con su propia sesión. Los votos son reales y el conteo se comparte entre todas las sesiones.

Todos los datos son ficticios. No hay backend real ni cuentas reales.

## 1. Requisitos (una sola vez)

| Herramienta | Versión | Windows | macOS | Linux (Fedora/Ubuntu) |
|---|---|---|---|---|
| Git | cualquiera | `winget install Git.Git` | `xcode-select --install` | `sudo dnf install git` / `sudo apt install git` |
| Node.js | **24 o superior** (obligatorio) | `winget install OpenJS.NodeJS` | `brew install node@24` | https://nodejs.org o `nvm install 24` |
| cloudflared | cualquiera (solo modo internet) | `winget install Cloudflare.cloudflared` | `brew install cloudflared` | Fedora: `.rpm` de https://github.com/cloudflare/cloudflared/releases · Ubuntu: `.deb` del mismo enlace |

Comprueba las versiones con `node -v`, que debe mostrar `v24.x` o mayor, y con `cloudflared --version`. Node 24 hace falta porque el servidor usa `node:sqlite` y carga archivos TypeScript directamente.

## 2. Obtener el código

```bash
git clone git@github.com:MiloDou/Mesa-Competitividad-Dev.git
cd Mesa-Competitividad-Dev
git checkout feat/mobile-demo-r04
cd Mobile
npm install
npm run test:server
```

`npm run test:server` debe terminar con `pass 9` y `fail 0`.

## 3. Arrancar

Elige uno de los dos modos.

**Modo internet (recomendado).** Cada persona usa sus propios datos móviles, sin compartir red:

```bash
npm run presenta:internet
```

**Modo red local.** Todos se conectan al mismo Wi-Fi o al hotspot de un celular:

```bash
npm run presenta
```

Para fijar una contraseña fácil, define `DEMO_PASSWORD` antes del comando. Si no la defines, el servidor genera una aleatoria de 4 dígitos y la muestra en la terminal.

| Sistema | Comando |
|---|---|
| Linux/macOS | `DEMO_PASSWORD=1234 npm run presenta:internet` |
| Windows PowerShell | `$env:DEMO_PASSWORD="1234"; npm run presenta:internet` |
| Windows CMD | `set "DEMO_PASSWORD=1234" && npm run presenta:internet` |

Cuando la terminal muestre `QR: http://localhost:8080/qr`:

1. Abre **`http://localhost:8080/qr` en esa misma computadora** y proyéctalo. Por seguridad, esa página no se abre desde otro equipo.
2. Las personas escanean el QR y entran con usuario **`mesa`** y la contraseña que se muestra en la página.

**Para detener:** pulsa `Ctrl+C` en la terminal. En cada arranque los votos vuelven a 0.

## 4. Problemas comunes

| Síntoma | Solución |
|---|---|
| `node:sqlite` no existe o hay un error de sintaxis con `.ts` | La versión de Node es menor que 24. Actualízala. |
| `No se encontró cloudflared` | Instálalo (paso 1) o usa `npm run presenta`. |
| En modo red local los teléfonos no cargan | El firewall bloquea el puerto 8080. Windows: acepta el aviso de firewall de Node o ejecuta `netsh advfirewall firewall add rule name="Mesa 8080" dir=in action=allow protocol=TCP localport=8080`. Fedora: `sudo firewall-cmd --add-port=8080/tcp`. |
| Hotspot: solo se conectan algunos teléfonos | Los hotspots suelen aceptar de 5 a 10 dispositivos. Usa el modo internet. |
| El túnel se cerró | Vuelve a ejecutar el comando. La URL y el QR cambian. |
| El puerto 8080 está ocupado | Usa otro puerto: `PORT=8081` (o `$env:PORT="8081"` en PowerShell) y abre `http://localhost:8081/qr`. |

**Antes de presentar:** haz un ensayo con dos teléfonos, uno Android y uno iPhone. Deja la computadora conectada a la corriente. En Linux la computadora no se suspende mientras corre el servidor; en Windows y macOS desactiva la suspensión a mano.
