import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp, openDb } from "./index.mjs";

let base, server;
before(async () => {
  const app = createApp({ db: openDb(":memory:", "clave-prueba"), distDir: "/nonexistent" });
  server = createServer(app.handle).listen(0);
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
  const dup = await call("/votings/101/cast/", { token: a, body: { option: "A favor" } });
  assert.equal(dup.status, 400);
  assert.ok(dup.json.error.detail.vote);
  assert.equal((await call("/votings/101/", { token: a })).json.member_has_voted, true);
  assert.equal((await call("/votings/101/", { token: b })).json.member_has_voted, false);
  assert.equal((await call("/votings/101/results/", { token: a })).json.total_votes, 14);
  assert.equal((await call("/votings/101/results/", { token: b })).json.total_votes, 13);
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

test("sirve la app web y la página QR", async () => {
  const { fileURLToPath } = await import("node:url");
  const dist = fileURLToPath(new URL("../dist", import.meta.url));
  const app = createApp({ db: openDb(":memory:", "x"), distDir: dist, publicUrl: () => "http://192.0.2.1:8080", password: "x" });
  const s = createServer(app.handle).listen(0);
  await new Promise((r) => s.once("listening", r));
  const root = `http://127.0.0.1:${s.address().port}`;
  assert.match(await (await fetch(`${root}/votaciones`)).text(), /<div id="root">|<html/); // SPA
  assert.match(await (await fetch(`${root}/qr`)).text(), /<svg/);
  assert.doesNotMatch(await (await fetch(`${root}/..%2f..%2fpackage.json`)).text(), /mesa-competitividad-mobile/);
  s.close();
});
