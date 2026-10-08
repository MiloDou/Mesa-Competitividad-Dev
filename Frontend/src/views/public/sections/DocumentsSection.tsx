import { DOCS } from "../../../data/public";
import { downloadPdfDocument } from "../../../utils/pdfExport";

interface DocumentsSectionProps {
  data?: Record<string, any>;
}

export default function DocumentsSection({ data }: DocumentsSectionProps) {
  const sectionTitle = data?.title || "Transparencia Institucional";
  const subtitle = "Documentos y Registros Públicos";

  const docsList = [
    {
      abbr: "ACT",
      abbr_color: "bg-navy-100 text-navy-900",
      title: data?.d1_title || "Actas de Sesión",
      count: data?.d1_count || "38 documentos",
      tag: data?.d1_tag || "Últimas 24 meses"
    },
    {
      abbr: "INF",
      abbr_color: "bg-celeste-100 text-celeste-900",
      title: data?.d2_title || "Informes de Avance",
      count: data?.d2_count || "12 informes en 2026",
      tag: data?.d2_tag || "Actualización trimestral"
    },
    {
      abbr: "PLA",
      abbr_color: "bg-gold-100 text-gold-900",
      title: data?.d3_title || "Plan de Trabajo 2026",
      count: data?.d3_count || "Vigente · Jun 2026",
      tag: data?.d3_tag || "6 líneas de acción"
    },
    {
      abbr: "PRE",
      abbr_color: "bg-emerald-100 text-emerald-900",
      title: data?.d4_title || "Ejecución Presupuestaria",
      count: data?.d4_count || "Reportes trimestrales",
      tag: data?.d4_tag || "Transparencia fiscal"
    },
  ];

  function handleDownloadDoc(doc: typeof docsList[0]) {
    downloadPdfDocument(
      `${doc.abbr.toLowerCase()}-oficial.pdf`,
      `Documento Institucional - ${doc.title}`,
      [
        `Categoría: ${doc.title}`,
        `Registro: ${doc.count}`,
        `Etiqueta de actualización: ${doc.tag}`,
        `Mesa Departamental de Competitividad de Quetzaltenango.`,
        `Este documento es público y forma parte del archivo de transparencia de la institución.`
      ]
    );
  }

  return (
    <section id="transparencia" className="py-8 lg:py-12 bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="reveal-left mb-6">
          <h2 className="text-navy-950 text-3xl lg:text-4xl font-extrabold uppercase tracking-wide mb-2">{sectionTitle}</h2>
          <p className="text-gold-600 text-lg lg:text-xl font-semibold">{subtitle}</p>
        </div>

        <div className="reveal-scale grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {docsList.map(d => (
            <button key={d.title}
                    onClick={() => handleDownloadDoc(d)}
                    className="card-lift text-left p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-gold-500 hover:shadow-xl transition-all duration-200 group">
              <div className="mb-4"><span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-black tracking-wide ${d.abbr_color}`}>{d.abbr}</span></div>
              <h3 className="font-bold text-navy-950 mb-1 text-[15px] group-hover:text-gold-600">{d.title}</h3>
              <p className="text-xs text-slate-600 mb-0.5 font-medium">{d.count}</p>
              <p className="text-xs text-slate-400 font-normal">{d.tag}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-gold-700 group-hover:gap-1.5 transition-all">
                Exportar PDF
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
