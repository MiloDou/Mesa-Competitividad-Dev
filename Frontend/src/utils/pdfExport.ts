export function downloadPdfDocument(filename: string, title: string, contentLines: string[]) {
  const documentTitle = title || "Documento Oficial - Mesa de Competitividad";
  const dateStr = new Date().toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #0F172A;
          margin: 40px;
          line-height: 1.6;
        }
        .header {
          border-b: 2px solid #0B192C;
          padding-bottom: 15px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          color: #0B192C;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: 12px;
          color: #64748B;
        }
        .date {
          font-size: 11px;
          color: #94A3B8;
        }
        .content {
          margin-top: 20px;
          font-size: 13px;
        }
        .paragraph {
          margin-bottom: 12px;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #E2E8F0;
          padding-top: 15px;
          font-size: 10px;
          color: #94A3B8;
          text-align: center;
        }
        .signatures {
          margin-top: 60px;
          display: flex;
          justify-content: space-around;
        }
        .sig-line {
          border-top: 1px solid #0B192C;
          width: 180px;
          text-align: center;
          font-size: 11px;
          padding-top: 5px;
          color: #1E293B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Mesa Departamental de Competitividad</div>
          <div class="subtitle">Quetzaltenango, Guatemala</div>
        </div>
        <div class="date">Fecha: ${dateStr}</div>
      </div>

      <h2 style="color: #1E3E62; font-size: 16px;">${documentTitle}</h2>

      <div class="content">
        ${contentLines.map((line) => `<p class="paragraph">${line}</p>`).join("")}
      </div>

      <div class="signatures">
        <div class="sig-line">Presidencia / Secretaría</div>
        <div class="sig-line">Comisión Directiva</div>
      </div>

      <div class="footer">
        Documento Oficial generado automáticamente por el Sistema Interno de la Mesa de Competitividad de Quetzaltenango.
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Trigger PDF file download
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Open print preview window
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.focus();
  }
}
