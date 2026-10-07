import React, { useState } from "react";
import { createPortal } from "react-dom";
import { LogoIsotype } from "../../../Logo";

export interface NewsItem {
  id: string;
  tag: string;
  img: string;
  title: string;
  excerpt: string;
  date: string;
  read: string;
  content?: string;
  featured?: boolean;
}

export const ALL_NEWS: NewsItem[] = [
  {
    id: "NWS-001",
    tag: "Sesión Ordinaria",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=700&fit=crop&auto=format",
    title: "Mesa aprueba nuevo corredor logístico con inversión de Q 45 millones",
    excerpt: "La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental, marcando un hito para la conectividad regional.",
    date: "21 agosto 2026",
    read: "5 min",
    featured: true,
    content: "En una reunión histórica celebrada en la ciudad de Quetzaltenango, los delegados de la Mesa Departamental de Competitividad aprobaron el dictamen técnico final para la construcción y adecuación del Corredor Logístico del Altiplano Occidental. Este proyecto contempla la intervención de 42 kilómetros estratégicos para agilizar la movilización de carga pesada y productos agroindustriales entre Quetzaltenango, Totonicapán y San Marcos."
  },
  {
    id: "NWS-002",
    tag: "Convocatoria",
    img: "https://images.unsplash.com/photo-1560523160-754a9e25c68f?w=600&h=400&fit=crop&auto=format",
    title: "Abiertas inscripciones para el Summit de Competitividad 2026",
    excerpt: "400 cupos disponibles para dos jornadas de conferencias y mesas de trabajo con líderes del sector empresarial y académico.",
    date: "05 sep 2026",
    read: "3 min",
    content: "Se han habilitado oficialmente los registros para el Summit Regional de Competitividad 2026. El evento reunirá a más de 28 ponentes internacionales y nacionales expertos en logística, innovación digital, desarrollo de capital humano y atracción de inversiones."
  },
  {
    id: "NWS-003",
    tag: "Informe",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format",
    title: "Informe de avance Q3 2026: 68% de ejecución en proyectos prioritarios",
    excerpt: "El tercer informe trimestral revela una ejecución presupuestaria del 68% en los proyectos de la cartera activa de la Mesa.",
    date: "02 sep 2026",
    read: "4 min",
    content: "El comité financiero y de auditoría ciudadana presentó el reporte de ejecución presupuestaria correspondiente al tercer trimestre del ejercicio fiscal 2026. Los proyectos de modernización municipal e infraestructura vial presentan los mayores porcentajes de avance."
  },
  {
    id: "NWS-004",
    tag: "Convenio",
    img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop&auto=format",
    title: "Firma de alianza estratégica con universidades del occidente",
    excerpt: "Consorcio universitario impulsará laboratorios de innovación tecnológica y becas de especialización técnica.",
    date: "18 agosto 2026",
    read: "4 min",
    content: "Se suscribió un acuerdo marco de cooperación académica entre la Mesa de Competitividad y 6 casas de estudios superiores de Quetzaltenango para vincular la investigación universitaria con las necesidades reales del mercado laboral."
  },
  {
    id: "NWS-005",
    tag: "Medio Ambiente",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop&auto=format",
    title: "Lanzamiento del Plan Sostenible para la Cuenca del Río Samalá",
    excerpt: "Iniciativa conjunta para reforestación de mantos freáticos y plantas de tratamiento de aguas residuales.",
    date: "10 agosto 2026",
    read: "6 min",
    content: "Con apoyo del Ministerio de Ambiente y Recursos Naturales (MARN) e INAB, se dio inicio al programa de protección ambiental de la cuenca hidrográfica del Samalá, beneficiando a más de 12 municipios."
  },
  {
    id: "NWS-006",
    tag: "Comercio",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&auto=format",
    title: "Mesa realiza Rueda de Negocios Regional con más de 120 mipymes",
    excerpt: "Transacciones estimadas por más de Q 12 millones en sectores textil, agroindustria y servicios digitales.",
    date: "28 julio 2026",
    read: "3 min",
    content: "La comisión de Inversión y Comercio organizó la Quinta Rueda de Negocios de la Región Suroccidente, conectando a productores de Quetzaltenango con grandes distribuidores y cadenas supermercados del país."
  }
];

interface NewsArchiveModalProps {
  onClose: () => void;
}

export function NewsArchiveModal({ onClose }: NewsArchiveModalProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [filterTag, setFilterTag] = useState<string>("Todos");

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const tags = ["Todos", "Sesión Ordinaria", "Convocatoria", "Informe", "Convenio", "Medio Ambiente", "Comercio"];

  const filteredNews = filterTag === "Todos" 
    ? ALL_NEWS 
    : ALL_NEWS.filter(n => n.tag.toLowerCase() === filterTag.toLowerCase());

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-fadeup overflow-hidden" onClick={onClose}>
      <div className="relative w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <LogoIsotype size={40} className="flex-shrink-0" />
            <div>
              <h2 className="text-navy-950 text-xl md:text-2xl font-extrabold tracking-tight">
                Archivo de Comunicados y Noticias
              </h2>
              <p className="text-gold-600 text-xs font-semibold">
                Mesa Departamental de Competitividad de Quetzaltenango
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-navy-950 p-2.5 rounded-xl hover:bg-gray-200/60 transition-colors focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 md:px-8 py-4 bg-white border-b border-gray-200 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mr-2 flex-shrink-0">Filtrar:</span>
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none ${
                filterTag === t 
                  ? "bg-navy-900 text-white shadow-md font-bold" 
                  : "bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
          {selectedNews ? (
            /* Detail view */
            <div className="animate-fadeup">
              <button
                onClick={() => setSelectedNews(null)}
                className="inline-flex items-center gap-2 text-navy-900 hover:text-gold-600 text-xs font-bold mb-6 hover:-translate-x-1 transition-all focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none rounded-lg p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a todos los comunicados
              </button>

              <div className="rounded-2xl overflow-hidden mb-6 border border-gray-200 h-64 md:h-80 shadow-md">
                <img src={selectedNews.img} alt={selectedNews.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="bg-gold-500 text-navy-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedNews.tag}
                </span>
                <span className="text-slate-500 text-xs font-medium">{selectedNews.date}</span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-slate-500 text-xs font-medium">{selectedNews.read} de lectura</span>
              </div>

              <h1 className="text-navy-950 text-2xl md:text-3xl font-extrabold leading-snug mb-4">
                {selectedNews.title}
              </h1>

              <p className="text-slate-700 text-base font-semibold leading-relaxed mb-6 border-l-3 border-gold-500 pl-4 bg-gray-50 py-2 rounded-r-xl">
                {selectedNews.excerpt}
              </p>

              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4 font-normal">
                <p>{selectedNews.content || selectedNews.excerpt}</p>
                <p>
                  Para más detalles e informes oficiales sobre este comunicado, puede consultar el área de Transparencia o dirigirse a la Secretaría Ejecutiva de la Mesa de Competitividad de Quetzaltenango.
                </p>
              </div>
            </div>
          ) : (
            /* Grid view */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map(n => (
                <article
                  key={n.id}
                  onClick={() => setSelectedNews(n)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedNews(n);
                    }
                  }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden group cursor-pointer hover:border-gold-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none transition-all duration-300 flex flex-col"
                >
                  <div className="overflow-hidden h-44 relative">
                    <img src={n.img} alt={n.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute top-3 left-3 bg-gold-500 text-navy-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                      {n.tag}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-navy-950 text-base leading-snug mb-2 group-hover:text-navy-700 transition-colors line-clamp-2">
                        {n.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4 font-normal">
                        {n.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-slate-500 font-medium">
                      <span>{n.date}</span>
                      <span className="text-gold-700 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Leer más →
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
