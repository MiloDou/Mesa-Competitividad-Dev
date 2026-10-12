import pdfLogoSrc from "../imports/pdf-logo.png";
import loadingIsotypeSrc from "../imports/loading-isotype.png";

export interface FactItem {
  label: string;
  value: string;
}

export interface SignerItem {
  name: string;
  role: string;
}

export interface ExportDocumentOptions {
  filename?: string;
  title?: string;
  categoryKind?: string;
  docCode?: string;
  dateStr?: string;
  facts?: FactItem[];
  contentLines?: string[];
  noticeTitle?: string;
  noticeText?: string;
  signers?: SignerItem[];
  verificationCode?: string;
}

function getAbsoluteUrl(src: string): string {
  if (typeof window === "undefined") return src;
  if (src.startsWith("data:") || src.startsWith("http")) {
    return src;
  }
  return window.location.origin + (src.startsWith("/") ? src : "/" + src);
}

function showLoadingModal(onComplete: () => void) {
  if (typeof document === "undefined") {
    onComplete();
    return;
  }

  if (document.getElementById("pdf-export-modal-overlay")) return;

  const durationMs = 1200;
  const startTime = Date.now();
  const isotypeUrl = getAbsoluteUrl(loadingIsotypeSrc);

  const overlay = document.createElement("div");
  overlay.id = "pdf-export-modal-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.bottom = "0";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "16px";
  overlay.style.backgroundColor = "rgba(15, 23, 42, 0.85)";
  overlay.style.backdropFilter = "blur(8px)";
  overlay.style.webkitBackdropFilter = "blur(8px)";

  overlay.innerHTML = `
    <div style="background:#ffffff; border-radius: 24px; padding: 32px 28px; width: 100%; max-width: 420px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); border: 1px solid #E2E8F0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;">
      <!-- Isotipo Circular de la Mesa -->
      <div style="width: 88px; height: 88px; margin: 0 auto 16px; position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: linear-gradient(135deg, #12005E, #FFD700); opacity: 0.25; filter: blur(10px);"></div>
        <img src="${isotypeUrl}" alt="Isotipo Mesa de Competitividad" style="width: 84px; height: 84px; object-fit: contain; position: relative; z-index: 10;" />
      </div>

      <!-- Títulos de la Ventana de Carga -->
      <h3 style="font-size: 16px; font-weight: 800; color: #0C003D; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        Mesa Departamental de Competitividad
      </h3>
      <p style="font-size: 13px; color: #64748B; margin: 0 0 20px; font-weight: 600;">
        Generando Documento Oficial...
      </p>

      <!-- Barra de Carga -->
      <div style="background: #F1F5F9; border-radius: 9999px; height: 14px; width: 100%; overflow: hidden; border: 1px solid #CBD5E1; padding: 2px; position: relative;">
        <div id="pdf-export-progress-bar" style="background: linear-gradient(90deg, #12005E 0%, #E5B82E 50%, #12005E 100%); height: 100%; width: 0%; border-radius: 9999px; transition: width 0.1s linear;"></div>
      </div>

      <!-- Porcentaje y Estado -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 12px; color: #475569; font-weight: 600;">
        <span id="pdf-export-status-text">Iniciando compilación...</span>
        <span id="pdf-export-percent-text" style="color: #12005E; font-weight: 800;">0%</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const progressBar = document.getElementById("pdf-export-progress-bar");
  const percentText = document.getElementById("pdf-export-percent-text");
  const statusText = document.getElementById("pdf-export-status-text");

  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(100, Math.floor((elapsed / durationMs) * 100));

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (percentText) percentText.textContent = `${progress}%`;

    if (statusText) {
      if (progress < 30) {
        statusText.textContent = "Preparando datos del documento...";
      } else if (progress < 70) {
        statusText.textContent = "Compilando plantilla A4 institucional...";
      } else {
        statusText.textContent = "¡Generando vista de impresión/PDF!";
      }
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        onComplete();
      }, 200);
    }
  }, 40);
}

export function downloadPdfDocument(
  filenameOrOptions: string | ExportDocumentOptions,
  titleParam?: string,
  contentLinesParam?: string[]
) {
  let options: ExportDocumentOptions = {};

  if (typeof filenameOrOptions === "object" && filenameOrOptions !== null) {
    options = filenameOrOptions;
  } else {
    options = {
      filename: filenameOrOptions,
      title: titleParam,
      contentLines: contentLinesParam,
    };
  }

  showLoadingModal(() => {
    generateAndDownloadPdf(options);
  });
}

function generateAndDownloadPdf(options: ExportDocumentOptions) {
  const documentTitle = options.title || "Documento Oficial - Mesa Departamental de Competitividad";
  const rawFilename = options.filename || "documento-oficial.pdf";
  const categoryKind = options.categoryKind || "Documento institucional / Transparencia";
  const dateStr =
    options.dateStr ||
    new Date().toLocaleDateString("es-GT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const docCode =
    options.docCode ||
    `MDC-${Math.floor(100 + Math.random() * 900)}-2026`;

  const verificationCode =
    options.verificationCode ||
    `MDC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`;

  const rawContentLines = options.contentLines || [];
  const extractedFacts: FactItem[] = options.facts ? [...options.facts] : [];
  const bodyParagraphs: string[] = [];

  rawContentLines.forEach((line) => {
    if (line.includes(":")) {
      const parts = line.split(":");
      const label = parts[0].trim();
      const value = parts.slice(1).join(":").trim();
      if (label && value && !options.facts) {
        extractedFacts.push({ label, value });
      } else {
        bodyParagraphs.push(line);
      }
    } else {
      bodyParagraphs.push(line);
    }
  });

  if (extractedFacts.length === 0) {
    extractedFacts.push(
      { label: "Categoría", value: documentTitle },
      { label: "Entidad", value: "Mesa Departamental de Competitividad" },
      { label: "Jurisdicción", value: "Quetzaltenango, Guatemala" },
      { label: "Fecha de emisión", value: dateStr }
    );
  }

  const factsHtml = `
    <dl class="facts">
      ${extractedFacts
        .map(
          (f) => `<div><dt>${f.label}</dt><dd>${f.value}</dd></div>`
        )
        .join("")}
    </dl>
  `;

  const paragraphsHtml =
    bodyParagraphs.length > 0
      ? bodyParagraphs
          .map((p, idx) => `<p class="${idx === 0 ? "lead" : ""}">${p}</p>`)
          .join("")
      : `<p class="lead">Este documento oficial forma parte del archivo de registros y transparencia de la Mesa Departamental de Competitividad de Quetzaltenango.</p>`;

  const signers = options.signers || [
    { name: "Licda. Presidencia / Secretaría", role: "Mesa Departamental de Competitividad" },
    { name: "Comisión Directiva", role: "Quetzaltenango, Guatemala" },
  ];

  const pdfLogoUrl = getAbsoluteUrl(pdfLogoSrc);

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${documentTitle} · Mesa Departamental de Competitividad</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap">
<style>
  :root {
    --ink: #17212e;
    --navy: #17375e;
    --jade: #1f7a6a;
    --jade-soft: #e7f3f0;
    --muted: #5d6978;
    --rule: #d3dae3;
    --paper: #ffffff;
    --serif: "Source Serif 4", Georgia, "Times New Roman", serif;
    --sans: "Source Sans 3", "Segoe UI", Arial, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @page { size: A4; margin: 0; }

  html { background: #e9edf2; }

  body {
    font-family: var(--sans);
    color: var(--ink);
    font-size: 11pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 12mm auto;
    background: var(--paper);
    padding: 16mm 18mm 12mm;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Franja superior de identidad */
  .page::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 5mm;
    background: var(--navy);
  }
  .page::after {
    content: "";
    position: absolute;
    inset: 5mm 0 auto 0;
    height: 1mm;
    background: var(--jade);
  }

  /* Encabezado: logo oficial + código de documento */
  header.masthead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 4mm;
    padding-bottom: 6mm;
    border-bottom: 1px solid var(--rule);
  }

  .logo {
    height: 26mm;
    display: flex;
    align-items: center;
    background: transparent;
    padding: 0;
    border: none;
  }
  .logo img {
    height: 100%;
    width: auto;
    object-fit: contain;
    display: block;
    border: none;
    outline: none;
    box-shadow: none;
  }

  .docref {
    text-align: right;
    font-size: 9.5pt;
    color: var(--muted);
    line-height: 1.5;
  }
  .docref strong { display: block; color: var(--ink); font-weight: 600; font-size: 10.5pt; }

  /* Título del documento */
  .title-block { padding: 8mm 0 4mm; }
  .title-block .kind {
    font-size: 10.5pt;
    color: var(--jade);
    font-weight: 600;
    margin-bottom: 2mm;
  }
  .title-block h2 {
    font-family: var(--serif);
    font-weight: 600;
    font-size: 22pt;
    line-height: 1.12;
    color: var(--ink);
    max-width: 160mm;
  }

  /* Ficha de datos */
  dl.facts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border-top: 2px solid var(--navy);
    margin-top: 2mm;
  }
  dl.facts > div {
    padding: 4mm 0;
    border-bottom: 1px solid var(--rule);
  }
  dl.facts > div:nth-child(odd) { padding-right: 6mm; }
  dl.facts > div:nth-child(even) { padding-left: 6mm; border-left: 1px solid var(--rule); }
  dl.facts dt { font-size: 9.5pt; color: var(--muted); }
  dl.facts dd { font-size: 11.5pt; font-weight: 600; color: var(--ink); margin-top: 0.5mm; }

  /* Cuerpo */
  .body { padding-top: 6mm; max-width: 160mm; }
  .body p { margin-bottom: 4mm; }
  .body p.lead { font-size: 11.5pt; }

  /* Declaración de transparencia */
  .notice {
    margin-top: 6mm;
    display: grid;
    grid-template-columns: 11mm 1fr;
    gap: 4mm;
    align-items: start;
    background: var(--jade-soft);
    border-left: 3px solid var(--jade);
    padding: 5mm 6mm;
    border-radius: 0 2mm 2mm 0;
  }
  .notice .mark {
    width: 11mm; height: 11mm; border-radius: 50%;
    background: var(--jade); color: #fff;
    display: grid; place-items: center;
    font-weight: 700; font-size: 13pt;
  }
  .notice h3 { font-family: var(--serif); font-size: 12.5pt; font-weight: 600; color: var(--ink); margin-bottom: 1mm; }
  .notice p { font-size: 10.5pt; color: #2b3a44; }

  /* Firmas */
  .signatures {
    margin-top: auto;
    padding-top: 18mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20mm;
  }
  .sign { text-align: center; }
  .sign .line { border-top: 1px solid var(--ink); margin-bottom: 2mm; }
  .sign .name { font-weight: 600; font-size: 10.5pt; }
  .sign .role { font-size: 9.5pt; color: var(--muted); }

  /* Pie sin bordes salteados */
  footer.foot {
    margin-top: 10mm;
    padding-top: 4mm;
    border-top: 1px solid var(--rule);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8mm;
    align-items: center;
    font-size: 8.5pt;
    color: var(--muted);
    line-height: 1.5;
  }
  .verify { display: flex; align-items: center; gap: 4mm; }
  .qr {
    width: 16mm; height: 16mm;
    border: 1px solid #d3dae3;
    border-radius: 2mm;
    display: grid; place-items: center;
    font-size: 7.5pt; text-align: center; color: var(--muted); background: #f8fafc;
  }
  .verify b { color: var(--ink); font-weight: 600; }

  @media print {
    html { background: none; }
    .page { margin: 0; box-shadow: none; width: 100%; min-height: 100vh; padding: 12mm 15mm; }
  }
  @media screen {
    .page { box-shadow: 0 2px 18px rgba(23, 33, 46, .12); }
  }
</style>
</head>
<body>
  <main class="page">

    <header class="masthead">
      <div class="logo">
        <img src="${pdfLogoUrl}" alt="Logo Mesa Departamental de Competitividad" />
      </div>

      <div class="docref">
        <strong>${docCode}</strong>
        Emitido el ${dateStr}
      </div>
    </header>

    <section class="title-block">
      <p class="kind">${categoryKind}</p>
      <h2>${documentTitle}</h2>
    </section>

    ${factsHtml}

    <section class="body">
      ${paragraphsHtml}

      <div class="notice">
        <div class="mark" aria-hidden="true">✓</div>
        <div>
          <h3>${options.noticeTitle || "Documento público"}</h3>
          <p>${options.noticeText || "Forma parte del archivo de transparencia de la institución y puede consultarse y compartirse libremente."}</p>
        </div>
      </div>
    </section>

    <section class="signatures">
      ${signers
        .map(
          (s) => `
        <div class="sign">
          <div class="line"></div>
          <div class="name">${s.name}</div>
          <div class="role">${s.role}</div>
        </div>`
        )
        .join("")}
    </section>

    <footer class="foot">
      <p>Documento oficial generado automáticamente por el Sistema Interno de la Mesa Departamental de Competitividad de Quetzaltenango.</p>
      <div class="verify">
        <div>Código de verificación<br><b>${verificationCode}</b></div>
        <div class="qr" style="font-family: monospace; font-weight: bold; font-size: 8pt;">MDC<br>QR</div>
      </div>
    </footer>

  </main>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  try {
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    } else {
      downloadHtmlFile(htmlContent, rawFilename);
    }
  } catch (e) {
    console.warn("Fallback PDF export window:", e);
    downloadHtmlFile(htmlContent, rawFilename);
  }
}

function downloadHtmlFile(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/\.pdf$/, ".html");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
