// Arranque de la presentación. `--internet` abre un túnel rápido de Cloudflare (sin cuenta) y usa su URL https en el QR.
// Mientras corre, la PC no se suspende (systemd-inhibit) y, si el servidor se cae, se reinicia con la misma contraseña.
import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";

const port = process.env.PORT ?? "8080";
const password = process.env.DEMO_PASSWORD ?? String(randomInt(1000, 10000));
const server = fileURLToPath(new URL("./index.mjs", import.meta.url));
let stopping = false, current = null, tunnel = null;

function start(env = {}) {
  current = spawn("systemd-inhibit", ["--what=sleep:idle:handle-lid-switch", "--why=Presentación Mesa", process.execPath, "--no-warnings", server], {
    stdio: "inherit", env: { ...process.env, PORT: port, DEMO_PASSWORD: password, ...env },
  });
  current.on("exit", () => {
    if (stopping) return;
    console.error("\nEl servidor se detuvo; reiniciando con la misma contraseña…");
    setTimeout(() => start(env), 1000);
  });
}

function stop() {
  stopping = true;
  current?.kill();
  tunnel?.kill();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

if (!process.argv.includes("--internet")) {
  start();
} else {
  tunnel = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`], { stdio: ["ignore", "pipe", "pipe"] });
  tunnel.on("error", () => { console.error("No se encontró cloudflared. Instálalo: sudo dnf install cloudflared (o el .rpm de Cloudflare)."); process.exit(1); });
  tunnel.on("exit", () => { if (!stopping) console.error("\n⚠ El túnel de Cloudflare se cerró. Vuelve a ejecutar npm run presenta:internet (la URL y el QR cambiarán)."); });
  const watch = (chunk) => {
    const url = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
    if (url && !current) start({ PUBLIC_URL: url });
  };
  tunnel.stdout.on("data", watch);
  tunnel.stderr.on("data", watch);
}
