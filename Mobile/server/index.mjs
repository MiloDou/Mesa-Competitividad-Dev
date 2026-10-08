// Servidor de presentación: API con el contrato de `openapi_movil.yaml` + build web de la app + página QR.
// Solo Node 24 (node:http, node:sqlite, node:crypto). Datos ficticios; nada es un voto oficial.
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { gzipSync } from "node:zlib";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toQR } from "toqr";
import { documents } from "../src/native/data.ts";
import { renderPdf } from "./pdf.mjs";
import { seedCounts, votings } from "./seed.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// Las sesiones no caducan: duran mientras exista la base (sobreviven a un reinicio del servidor).
const MAX_SESSIONS = 2000; // ponytail: tope de memoria; al superarlo se expulsan las más viejas.
// Usuarios cortos para personas que escriben poco: basta "mesa".
const ACCOUNTS = [["mesa", "Integrante de la Mesa"], ["presidencia", "Presidencia de la Mesa"], ["secretaria", "Secretaría Técnica"]];
// Generoso: 20 personas en el mismo Wi-Fi comparten IP pública y se equivocan al teclear.
const MAX_FAILS = 60, FAIL_WINDOW_MS = 5 * 60 * 1000;

const hash = (password, salt) => scryptSync(password, salt, 32);
const hashAsync = promisify(scrypt); // al iniciar sesión, sin bloquear al resto de personas
const token = () => randomBytes(24).toString("base64url");

export function openDb(path, password) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, salt BLOB, hash BLOB);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, user_id INTEGER, access TEXT UNIQUE, refresh TEXT UNIQUE, created INTEGER);
    CREATE TABLE IF NOT EXISTS votes (sid TEXT, voting_id INTEGER, option TEXT, cast_at TEXT, PRIMARY KEY (sid, voting_id));
  `);
  // Contraseña nueva en cada arranque: nunca se guarda en Git.
  const upsert = db.prepare("INSERT INTO users (id, email, name, salt, hash) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET salt = excluded.salt, hash = excluded.hash");
  db.exec("DELETE FROM users WHERE email LIKE '%@%'"); // cuentas largas de versiones anteriores
  ACCOUNTS.forEach(([handle, name], i) => {
    const salt = randomBytes(16);
    upsert.run(i + 1, handle, name, salt, hash(password, salt));
  });
  return db;
}

export function createApp({ db, distDir = join(here, "..", "dist"), publicUrl = () => "", password = "" }) {
  const q = {
    user: db.prepare("SELECT * FROM users WHERE email = ?"),
    userById: db.prepare("SELECT * FROM users WHERE id = ?"),
    insertSession: db.prepare("INSERT INTO sessions (sid, user_id, access, refresh, created) VALUES (?, ?, ?, ?, ?)"),
    byAccess: db.prepare("SELECT * FROM sessions WHERE access = ?"),
    byRefresh: db.prepare("SELECT * FROM sessions WHERE refresh = ?"),
    rotate: db.prepare("UPDATE sessions SET access = ?, refresh = ? WHERE sid = ?"),
    drop: db.prepare("DELETE FROM sessions WHERE sid = ?"),
    dropVotes: db.prepare("DELETE FROM votes WHERE sid = ?"),
    oldest: db.prepare("SELECT sid FROM sessions ORDER BY created LIMIT ?"),
    count: db.prepare("SELECT COUNT(*) AS n FROM sessions"),
    vote: db.prepare("SELECT * FROM votes WHERE sid = ? AND voting_id = ?"),
    insertVote: db.prepare("INSERT INTO votes (sid, voting_id, option, cast_at) VALUES (?, ?, ?, ?)"),
  };

  const fails = new Map();
  const removeSession = (sid) => { q.dropVotes.run(sid); q.drop.run(sid); };
  function prune() {
    const extra = q.count.get().n - MAX_SESSIONS + 1;
    if (extra > 0) for (const { sid } of q.oldest.all(extra)) removeSession(sid);
  }

  const userJson = (u) => ({ id: u.id, email: u.email, first_name: u.name, last_name: "", display_name: u.name, roles: [{ key: "member", name: "Miembro" }], member_id: u.id });
  const tokensJson = (s) => ({ access: s.access, refresh: s.refresh, token_type: "Bearer", expires_in: 3600, user: userJson(q.userById.get(s.user_id)) });

  // Cada inicio de sesión es un espacio aislado: los votos se guardan por `sid`, no por usuario.
  const hasVoted = (sid, id) => Boolean(q.vote.get(sid, id));
  const votingJson = (sid, v) => ({
    id: v.id, title: v.title, description: v.summary, status: v.status, options: v.options,
    opens_at: null, closes_at: v.closes_at, member_has_voted: hasVoted(sid, v.id),
    subject: { title: v.title, summary: v.summary, background: v.background, status: v.status },
  });
  const page = (results) => ({ count: results.length, next: null, previous: null, results });

  function results(sid, v) {
    const counts = { ...seedCounts[v.id] };
    const own = q.vote.get(sid, v.id);
    if (own) counts[own.option] = (counts[own.option] ?? 0) + 1;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentages = Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, total ? Math.round((n / total) * 1000) / 10 : 0]));
    return { voting_id: v.id, status: v.status, total_votes: total, results: counts, percentages, live: v.status === "open" };
  }

  const fail = (status, code, detail) => [status, { error: { code, detail } }];

  function authed(req, url) {
    const header = req.headers.authorization ?? "";
    const access = header.startsWith("Bearer ") ? header.slice(7) : url.searchParams.get("t");
    const s = access ? q.byAccess.get(access) : null;
    return s ?? null;
  }

  async function api(req, url, path) {
    const body = req.method === "POST" ? await readJson(req) : {};
    if (path === "/auth/login/" && req.method === "POST") {
      // Contraseña corta: se limita por teléfono (tras el túnel, la IP real llega en CF-Connecting-IP).
      const ip = req.headers["cf-connecting-ip"] ?? req.socket.remoteAddress;
      const now = Date.now(), recent = (fails.get(ip) ?? []).filter((t) => t > now - FAIL_WINDOW_MS);
      if (recent.length >= MAX_FAILS) return fail(429, "throttled", "Demasiados intentos.");
      const u = q.user.get(String(body.email ?? "").trim().toLowerCase().split("@")[0]);
      const ok = u && timingSafeEqual(await hashAsync(String(body.password ?? "").trim(), u.salt, 32), u.hash);
      if (!ok) { fails.set(ip, [...recent, now]); return fail(400, "validation_error", { non_field_errors: ["Usuario o contraseña incorrectos."] }); }
      fails.delete(ip);
      prune();
      const s = { sid: token(), user_id: u.id, access: token(), refresh: token(), created: Date.now() };
      q.insertSession.run(s.sid, s.user_id, s.access, s.refresh, s.created);
      return [200, tokensJson(s)];
    }
    if (path === "/auth/refresh/" && req.method === "POST") {
      const s = q.byRefresh.get(String(body.refresh ?? ""));
      if (!s) return fail(403, "permission_denied", "Sesión no válida.");
      s.access = token(); s.refresh = token();
      q.rotate.run(s.access, s.refresh, s.sid);
      return [200, tokensJson(s)];
    }
    const s = authed(req, url);
    if (!s) return fail(401, "not_authenticated", "Inicia sesión.");
    if (path === "/auth/me/") return [200, userJson(q.userById.get(s.user_id))];
    if (path === "/auth/logout/" && req.method === "POST") { removeSession(s.sid); return [204, null]; }
    if (path === "/votings/") return [200, page(votings.map((v) => votingJson(s.sid, v)))];
    if (path === "/votings/pending/") return [200, page(votings.filter((v) => v.status === "open" && !hasVoted(s.sid, v.id)).map((v) => votingJson(s.sid, v)))];
    if (path === "/documents/") return [200, documents.map(({ id, kind, title, date, pages }) => ({ id, kind, title, date, pages, download: `/api/v1/documents/${id}/download/` }))];

    let m = path.match(/^\/votings\/(\d+)\/(cast\/|results\/)?$/);
    if (m) {
      const v = votings.find((x) => x.id === Number(m[1]));
      if (!v) return fail(404, "not_found", "No encontrado.");
      if (!m[2]) return [200, votingJson(s.sid, v)];
      if (m[2] === "results/") return [200, results(s.sid, v)];
      if (req.method !== "POST") return fail(405, "method_not_allowed", "Método no permitido.");
      if (v.status !== "open") return fail(400, "validation_error", { voting: ["La votación no está abierta."] });
      if (!v.options.includes(body.option)) return fail(400, "validation_error", { option: ["Opción no válida."] });
      if (hasVoted(s.sid, v.id)) return fail(400, "validation_error", { vote: ["Ya existe un voto en esta votación."] });
      const castAt = new Date().toISOString();
      q.insertVote.run(s.sid, v.id, body.option, castAt);
      return [201, { status: "recorded", cast_at: castAt }];
    }
    m = path.match(/^\/documents\/([\w-]+)\/download\/$/);
    if (m) {
      const d = documents.find((x) => x.id === m[1]);
      if (!d) return fail(404, "not_found", "No encontrado.");
      return [200, documentPdf(d), { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${d.id}.pdf"` }];
    }
    return fail(404, "not_found", "Ruta no prevista.");
  }

  async function handle(req, res) {
    const url = new URL(req.url, "http://local");
    const send = (status, data, headers = {}) => {
      const isBuf = Buffer.isBuffer(data) || typeof data === "string";
      res.writeHead(status, { "Cache-Control": "no-store", ...(isBuf ? {} : { "Content-Type": "application/json" }), ...headers });
      res.end(data == null ? undefined : isBuf ? data : JSON.stringify(data));
    };
    try {
      if (url.pathname.startsWith("/api/v1/")) {
        const [status, data, headers] = await api(req, url, url.pathname.slice(7));
        return send(status, data, headers);
      }
      if (url.pathname === "/qr") return send(200, qrPage(publicUrl(), password), { "Content-Type": "text/html; charset=utf-8" });
      return serveStatic(distDir, url.pathname, req, res);
    } catch (error) {
      if (error instanceof SyntaxError) return send(400, { error: { code: "parse_error", detail: "JSON no válido." } });
      console.error(error);
      return send(500, { error: { code: "server_error", detail: "Error interno." } });
    }
  }

  return { handle };
}

function readJson(req) {
  return new Promise((ok, ko) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on("end", () => { try { ok(raw ? JSON.parse(raw) : {}); } catch (e) { ko(e); } });
    req.on("error", ko);
  });
}

function documentPdf(d) {
  return renderPdf([
    { text: "MESA DE COMPETITIVIDAD", size: 9, bold: true },
    { text: d.title, size: 16, bold: true },
    { text: `${d.kind} · ${d.id} · ${d.date} · Acceso: ${d.access}`, size: 9 },
    { text: d.preview, size: 11 },
    ...d.sections.flatMap((s) => [{ text: s.heading, size: 12, bold: true }, { text: s.body }]),
  ], "Documento ficticio de presentación · sin validez oficial");
}

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".ttf": "font/ttf", ".svg": "image/svg+xml" };
function serveStatic(root, pathname, req, res) {
  const base = resolve(root);
  let file = resolve(base, "." + normalize(decodeURIComponent(pathname)));
  if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(base, "index.html"); // SPA
  if (!existsSync(file)) { res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Falta el build web: ejecuta npm run build:web"); }
  // Archivos en memoria y comprimidos una sola vez: la app pesa ~500 KB y se sirve a todos con datos móviles.
  let entry = staticCache.get(file);
  if (!entry) staticCache.set(file, entry = { raw: readFileSync(file), gz: gzipSync(readFileSync(file)) });
  const gzip = /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
  res.writeHead(200, {
    "Content-Type": types[extname(file)] ?? "application/octet-stream",
    "Cache-Control": file.includes(`${join("_expo", "static")}`) ? "public, max-age=31536000, immutable" : "no-cache",
    ...(gzip ? { "Content-Encoding": "gzip" } : {}), Vary: "Accept-Encoding",
  });
  res.end(gzip ? entry.gz : entry.raw);
}
const staticCache = new Map();

function qrSvg(text) {
  const m = toQR(text), n = Math.sqrt(m.length), pad = 4;
  let rects = "";
  for (let i = 0; i < m.length; i++) if (m[i]) rects += `M${(i % n) + pad} ${Math.floor(i / n) + pad}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + pad * 2} ${n + pad * 2}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${rects}" fill="#000"/></svg>`;
}

/** Texto de terminal con medios bloques: 2 filas del QR por línea. */
export function qrTerminal(text) {
  const m = toQR(text), n = Math.sqrt(m.length), at = (x, y) => (x >= 0 && y >= 0 && x < n && y < n ? m[y * n + x] : 0);
  const lines = [];
  for (let y = -2; y < n + 2; y += 2) {
    let line = "";
    for (let x = -2; x < n + 2; x++) line += [" ", "▀", "▄", "█"][(at(x, y) ? 0 : 1) + (at(x, y + 1) ? 0 : 2)];
    lines.push(line);
  }
  return lines.join("\n");
}

const html = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function qrPage(url, password) {
  const wifi = process.env.WIFI_SSID ? `WIFI:T:WPA;S:${process.env.WIFI_SSID};P:${process.env.WIFI_PASSWORD ?? ""};;` : null;
  const card = (n, title, svg, hint) => `<section><h2>${n}. ${title}</h2>${svg}<p>${hint}</p></section>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mesa de Competitividad · Acceso</title>
<style>body{font-family:system-ui,sans-serif;background:#0b2545;color:#fff;margin:0;padding:24px;text-align:center}main{display:flex;flex-wrap:wrap;gap:24px;justify-content:center}section{background:#fff;color:#0b2545;border-radius:16px;padding:20px;width:min(360px,100%)}svg{width:100%;height:auto}code{font-size:1.1em}</style></head><body>
<h1>Mesa de Competitividad</h1><p>Escanea con la cámara de tu teléfono (iPhone o Android).</p><main>
${wifi ? card(1, "Conéctate a la red", qrSvg(wifi), `Red: <b>${html(process.env.WIFI_SSID)}</b>`) : ""}
${card(wifi ? 2 : 1, "Abre la app", qrSvg(url), `<code>${html(url)}</code>`)}
<section><h2>Acceso</h2><p>Usuario<br><code style="font-size:2em">mesa</code></p><p>Contraseña<br><code style="font-size:2em">${html(password)}</code></p><p><small>Cada persona que entra tiene su propio espacio, aunque use la misma cuenta. Datos ficticios de presentación.</small></p></section>
</main></body></html>`;
}

function lanIp() {
  for (const list of Object.values(networkInterfaces())) for (const a of list ?? []) if (a.family === "IPv4" && !a.internal) return a.address;
  return "localhost";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Un error inesperado se registra, pero no apaga el servicio en plena presentación.
  process.on("uncaughtException", (error) => console.error("Error no controlado:", error));
  const port = Number(process.env.PORT ?? 8080);
  const password = process.env.DEMO_PASSWORD ?? String(1000 + (randomBytes(2).readUInt16BE() % 9000));
  const db = openDb(join(here, "data", "mesa.sqlite"), password);
  let publicUrl = process.env.PUBLIC_URL ?? `http://${lanIp()}:${port}`;
  const app = createApp({ db, password, publicUrl: () => publicUrl });
  createServer(app.handle).listen(port, "0.0.0.0", () => {
    console.log(`\nMesa de Competitividad · servidor de presentación\nApp:  ${publicUrl}\nQR:   ${publicUrl}/qr  (proyéctalo)\nUsuario: mesa   Contraseña: ${password}\n`);
    console.log(qrTerminal(publicUrl));
  });
}
