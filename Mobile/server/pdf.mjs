// PDF de texto mínimo (Helvetica, WinAnsi para acentos), sin dependencias.
// ponytail: solo texto envuelto por caracteres; para tablas o imágenes usar una librería de PDF.

const WIDTH = 595, HEIGHT = 842, MARGIN = 56, LINE = 15, PER_LINE = 88;

const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);

function wrap(text, size) {
  const max = Math.floor(PER_LINE * (11 / size));
  const out = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (line && (line + " " + word).length > max) { out.push(line); line = word; } else line = line ? `${line} ${word}` : word;
    }
    out.push(line);
  }
  return out;
}

/** blocks: [{ text, size?, bold? }]. Devuelve un Buffer PDF. */
export function renderPdf(blocks, footer) {
  const pages = [[]];
  let y = HEIGHT - MARGIN;
  for (const { text, size = 11, bold = false } of blocks) {
    for (const line of wrap(text, size)) {
      if (y < MARGIN + 30) { pages.push([]); y = HEIGHT - MARGIN; }
      pages.at(-1).push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${MARGIN} ${y} Td (${esc(line)}) Tj ET`);
      y -= LINE * (size / 11);
    }
    y -= LINE / 2;
  }

  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const catalog = add(null), pagesId = add(null);
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids = pages.map((ops, i) => {
    const foot = `BT /F1 8 Tf ${MARGIN} 30 Td (${esc(`${footer} · Página ${i + 1} de ${pages.length}`)}) Tj ET`;
    const stream = [...ops, foot].join("\n");
    const content = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${WIDTH} ${HEIGHT}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => { const at = Buffer.byteLength(pdf, "latin1"); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; return at; });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // latin1 = WinAnsi para los caracteres del español; los que no caben se sustituyen.
  return Buffer.from(pdf.replace(/[^\x00-\xff]/g, (c) => ({ "–": "-", "—": "-", "·": "\xb7", "“": '"', "”": '"', "→": "->" })[c] ?? "?"), "latin1");
}
