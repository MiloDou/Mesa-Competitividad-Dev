import React from "react";
import { Screen } from "../../../types/mobile";
import { downloadPdfDocument } from "../../../utils/pdfExport";

interface DocumentsScreenProps {
  goTo: (s: Screen) => void;
}

const ScreenHeader: React.FC<{ title: string; sub: string; onBack: () => void }> = ({ title, sub, onBack }) => (
  <div className="bg-navy-950 px-5 pt-5 pb-6">
    <button onClick={onBack} className="flex items-center gap-2 text-celeste-400 hover:text-white text-sm mb-3 transition-colors font-semibold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Inicio
    </button>
    <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-3xl font-normal">
      {title}
    </h2>
    <p className="text-celeste-400 text-sm mt-0.5 font-medium">{sub}</p>
  </div>
);

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ goTo }) => {
  return (
    <div>
      <ScreenHeader title="Documentos" sub="Repositorio institucional" onBack={() => goTo("home")} />
      <div className="px-4 pt-4 space-y-4 pb-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0">
          {["Todos", "Actas", "Informes", "Planes", "Resoluciones"].map((c, i) => (
            <button
              key={c}
              className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                i === 0 ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Documents list */}
        {[
          { title: "Acta Sesión Ordinaria No. 020", type: "Acta", date: "21 ago 2026", size: "2.4 MB", tag: "bg-green-100 text-green-700", abbr: "ACT", abbrC: "bg-green-100 text-green-700", new: false },
          { title: "Informe de Avance Q3 2026", type: "Informe", date: "05 sep 2026", size: "1.8 MB", tag: "bg-celeste-100 text-celeste-700", abbr: "INF", abbrC: "bg-celeste-100 text-celeste-700", new: true },
          { title: "Plan Operativo Anual 2026", type: "Plan", date: "10 ene 2026", size: "3.2 MB", tag: "bg-navy-100 text-navy-700", abbr: "PLN", abbrC: "bg-navy-100 text-navy-700", new: false },
          { title: "Resolución No. 021-2026", type: "Resolución", date: "21 ago 2026", size: "0.5 MB", tag: "bg-purple-100 text-purple-700", abbr: "RES", abbrC: "bg-purple-100 text-purple-700", new: false },
          { title: "Acta Sesión Ordinaria No. 019", type: "Acta", date: "10 ago 2026", size: "2.1 MB", tag: "bg-green-100 text-green-700", abbr: "ACT", abbrC: "bg-green-100 text-green-700", new: false },
          { title: "Informe de Avance Q2 2026", type: "Informe", date: "10 jul 2026", size: "1.6 MB", tag: "bg-celeste-100 text-celeste-700", abbr: "INF", abbrC: "bg-celeste-100 text-celeste-700", new: false },
        ].map((d) => (
          <div key={d.title} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 items-start">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 text-xs font-black ${d.abbrC}`}>
              {d.abbr}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-navy-900 text-sm leading-snug pr-1">{d.title}</p>
                {d.new && <span className="text-[9px] bg-navy-800 text-white font-bold px-1.5 py-0.5 rounded flex-shrink-0">NUEVO</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.tag}`}>{d.type}</span>
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400">
                  {d.date}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-300">
                  {d.size}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                downloadPdfDocument(
                  `${d.abbr.toLowerCase()}-oficial.pdf`,
                  d.title,
                  [
                    `Categoría: ${d.type}`,
                    `Fecha de registro: ${d.date}`,
                    `Tamaño original: ${d.size}`,
                    `Mesa Departamental de Competitividad de Quetzaltenango.`,
                    `Este documento es público y forma parte del archivo de transparencia de la institución.`
                  ]
                )
              }
              className="w-9 h-9 bg-navy-50 hover:bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors active:scale-90"
            >
              <svg className="w-4 h-4 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsScreen;
