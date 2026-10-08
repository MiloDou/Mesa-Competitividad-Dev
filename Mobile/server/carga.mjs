// Prueba de carga: N personas simultáneas con el MISMO usuario hacen el recorrido completo.
// Uso: node server/carga.mjs http://localhost:8080 <contraseña> [personas=20] [rondas=5]
const [base, password, people = "20", rounds = "5"] = process.argv.slice(2);
const times = [];
let errors = 0;

async function timed(path, init) {
  const t = performance.now();
  const res = await fetch(base + path, init);
  await res.arrayBuffer();
  times.push(performance.now() - t);
  if (!res.ok) errors++;
  return res;
}

async function person(i) {
  const login = await (await fetch(`${base}/api/v1/auth/login/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "mesa", password }) })).json();
  const auth = { headers: { Authorization: `Bearer ${login.access}`, "Content-Type": "application/json", "Accept-Encoding": "gzip" } };
  await timed("/", auth);
  for (let r = 0; r < Number(rounds); r++) {
    await timed("/api/v1/votings/", auth);
    await timed("/api/v1/votings/pending/", auth);
    await timed("/api/v1/votings/101/", auth);
    await timed("/api/v1/votings/101/results/", auth);
    await timed(`/api/v1/documents/DOC-2026-028/download/?t=${login.access}`);
  }
  const cast = await fetch(`${base}/api/v1/votings/101/cast/`, { ...auth, method: "POST", body: JSON.stringify({ option: ["A favor", "En contra", "Abstención"][i % 3] }) });
  const mine = await (await fetch(`${base}/api/v1/votings/101/results/`, auth)).json();
  return { access: login.access, cast: cast.status, total: mine.total_votes };
}

const t0 = performance.now();
const out = await Promise.all(Array.from({ length: Number(people) }, (_, i) => person(i)));
times.sort((a, b) => a - b);
const pct = (p) => times[Math.min(times.length - 1, Math.floor(times.length * p))].toFixed(0);
console.log(`personas=${people} solicitudes=${times.length} errores=${errors} tiempo_total=${(performance.now() - t0).toFixed(0)}ms`);
console.log(`latencia ms: mediana=${pct(0.5)} p95=${pct(0.95)} máx=${pct(1)}`);
console.log(`sesiones distintas=${new Set(out.map((o) => o.access)).size} votos aceptados=${out.filter((o) => o.cast === 201).length} conteo compartido final=${Math.max(...out.map((o) => o.total))} (esperado ${people})`);
