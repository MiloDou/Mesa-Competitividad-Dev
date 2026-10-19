import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp, openDb } from "./index.mjs";

let base, server;
before(async () => {
  const app = createApp({ db: openDb(":memory:", "clave-prueba"), distDir: "/nonexistent" });
  server = createServer(app.handle).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(() => server.close());

const call = async (path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, res, json: res.headers.get("content-type")?.includes("json") ? await res.json() : null };
};
const login = async () => (await call("/auth/login/", { body: { email: "mesa", password: "clave-prueba" } })).json.access;

test("contraseña incorrecta no entra; sin token es 401", async () => {
  assert.equal((await call("/auth/login/", { body: { email: "mesa", password: "x" } })).status, 400);
  assert.equal((await call("/auth/login/", { body: { email: "Mesa ", password: " clave-prueba" } })).status, 200);
  assert.equal((await call("/votings/")).status, 401);
});

test("misma cuenta, dos sesiones aisladas; voto único por sesión", async () => {
  const [a, b] = [await login(), await login()];
  assert.notEqual(a, b);
  assert.equal((await call("/votings/101/cast/", { token: a, body: { option: "A favor" } })).status, 201);
  const dup = await call("/votings/101/cast/", { token: a, body: { option: "En contra" } });
  assert.equal(dup.status, 400);
  assert.ok(dup.json.error.detail.vote);
  assert.equal((await call("/votings/101/", { token: a })).json.member_has_voted, true);
  assert.equal((await call("/votings/101/", { token: b })).json.member_has_voted, false);
  // El conteo es compartido y real: B ve el voto de A, sin votos inventados.
  assert.deepEqual((await call("/votings/101/results/", { token: b })).json.results, { "A favor": 1, "En contra": 0, "Abstención": 0 });
  assert.equal((await call("/votings/101/cast/", { token: b, body: { option: "En contra" } })).status, 201);
  assert.equal((await call("/votings/101/results/", { token: a })).json.total_votes, 2);
});

test("votación cerrada no acepta votos", async () => {
  const t = await login();
  assert.equal((await call("/votings/104/cast/", { token: t, body: { option: "A favor" } })).json.error.detail.voting.length, 1);
});

test("PDF descargable solo con sesión", async () => {
  const t = await login();
  assert.equal((await fetch(`${base}/documents/DOC-2026-028/download/`)).status, 401);
  const res = await fetch(`${base}/documents/DOC-2026-028/download/?t=${t}`);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.equal(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
});

test("20 inicios de sesión simultáneos quedan aislados", async () => {
  const tokens = await Promise.all(Array.from({ length: 20 }, login));
  assert.equal(new Set(tokens).size, 20);
  await call("/votings/102/cast/", { token: tokens[0], body: { option: "En contra" } });
  const pending = await Promise.all(tokens.map((t) => call("/votings/pending/", { token: t })));
  assert.equal(pending.filter((p) => p.json.results.some((v) => v.id === 102)).length, 19);
});

const dist = fileURLToPath(new URL("../dist", import.meta.url));
test("sirve la app web y la página QR", { skip: !existsSync(dist) && "sin build web (npm run build:web)" }, async () => {
  const app = createApp({ db: openDb(":memory:", "x"), distDir: dist, publicUrl: () => "http://192.0.2.1:8080", password: "x" });
  const s = createServer(app.handle).listen(0, "127.0.0.1");
  await new Promise((r) => s.once("listening", r));
  const root = `http://127.0.0.1:${s.address().port}`;
  const index = await (await fetch(`${root}/votaciones`)).text(); // SPA
  assert.match(index, /<html lang="es">/);
  assert.match(await (await fetch(`${root}/qr`)).text(), /<svg/);
  const traversal = await fetch(`${root}/..%2f..%2fpackage.json`);
  assert.equal(await traversal.text(), index); // fuera de dist/ solo se obtiene la app
  // /qr muestra la contraseña: por el túnel (cabecera de Cloudflare) no se sirve.
  assert.equal((await fetch(`${root}/qr`, { headers: { "CF-Connecting-IP": "203.0.113.9" } })).status, 404);
  s.close();
});

test("cerrar sesión no retira el voto; reintento del mismo voto se confirma", async () => {
  const a = await login();
  const first = await call("/votings/103/cast/", { token: a, body: { option: "A favor" } });
  const again = await call("/votings/103/cast/", { token: a, body: { option: "A favor" } });
  assert.equal(again.status, 201);
  assert.equal(again.json.cast_at, first.json.cast_at);
  const before = (await call("/votings/103/results/", { token: a })).json.total_votes;
  assert.equal((await call("/auth/logout/", { token: a, body: {} })).status, 204);
  const b = await login();
  assert.equal((await call("/votings/103/results/", { token: b })).json.total_votes, before);
});

test("el token por URL solo sirve para descargar; cuerpo null es 400", async () => {
  const t = await login();
  assert.equal((await fetch(`${base}/votings/?t=${t}`)).status, 401);
  assert.equal((await fetch(`${base}/auth/login/`, { method: "POST", body: "null" })).status, 400);
});

test("refresh rota: el anterior deja de valer", async () => {
  const r = (await call("/auth/login/", { body: { email: "mesa", password: "clave-prueba" } })).json.refresh;
  assert.equal((await call("/auth/refresh/", { body: { refresh: r } })).status, 200);
  assert.equal((await call("/auth/refresh/", { body: { refresh: r } })).status, 403);
});
