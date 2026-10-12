import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogoIsotype } from "../../../Logo";
import { getLiveNewsList, NewsItem } from "../modals/NewsArchiveModal";

interface NewsSectionProps {
  data?: Record<string, any>;
  onOpenArchive?: () => void;
}

interface NewsModalItem {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  img: string;
  read: string;
  content: string;
}

export default function NewsSection({ data, onOpenArchive }: NewsSectionProps) {
  const [selectedNews, setSelectedNews] = useState<NewsModalItem | null>(null);

  const title = data?.title || "Comunicados y Noticias";

  const allNews = getLiveNewsList(data);
  const featuredItem = allNews[0];
  const sideItems = allNews.slice(1, 3);

  const featuredArticle: NewsModalItem = {
    id: featuredItem?.id || "NWS-001",
    tag: featuredItem?.tag || "Sesión Ordinaria",
    title: featuredItem?.title || "Mesa aprueba impulsos a la Economía Verde e Infraestructura Vial Regional",
    excerpt: featuredItem?.excerpt || "La Mesa Departamental de Competitividad de Quetzaltenango prioriza proyectos de infraestructura logística y sostenibilidad.",
    date: featuredItem?.date || "21 agosto 2026",
    img: featuredItem?.img || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=700&fit=crop&auto=format",
    read: featuredItem?.read || "5 min",
    content: featuredItem?.content || featuredItem?.excerpt || "",
  };

  const sideNews: NewsModalItem[] = sideItems.map((n, idx) => ({
    id: n.id || `side-${idx}`,
    tag: n.tag || "General",
    img: n.img || "https://images.unsplash.com/photo-1560523160-754a9e25c68f?w=600&h=400&fit=crop&auto=format",
    title: n.title,
    excerpt: n.excerpt,
    date: n.date,
    read: n.read || "3 min",
    content: n.content || n.excerpt || "",
  }));

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!selectedNews) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNews(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNews]);

  return (
    <section id="noticias" className="py-6 lg:py-10 bg-white">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="reveal-left">
            <h2 className="text-navy-950 text-4xl lg:text-5xl font-extrabold uppercase tracking-wide leading-tight mb-2">{title}</h2>
            <p className="text-gold-600 text-xl lg:text-2xl font-semibold leading-snug">Lo más reciente</p>
          </div>
          <button
            onClick={onOpenArchive}
            className="reveal-right text-slate-600 hover:text-navy-950 text-sm font-semibold transition-colors self-end flex items-center gap-1.5 cursor-pointer"
          >
            Ver archivo completo
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr_1fr] gap-5">
          {/* Featured */}
          <article
            onClick={() => setSelectedNews(featuredArticle)}
            className="reveal card-lift relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-200 shadow-md hover:border-gold-500 transition-colors bg-navy-950"
            title="Haz clic para ver el comunicado completo"
          >
            <img
              src={featuredArticle.img}
              alt={featuredArticle.title}
              className="img-zoom w-full h-80 lg:h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent"/>
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <span className="inline-block bg-gold-500 text-navy-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full mb-3 self-start uppercase tracking-wider">
                {featuredArticle.tag}
              </span>
              <h3 className="text-white text-2xl font-bold leading-snug mb-2 group-hover:text-gold-300 transition-colors">
                {featuredArticle.title}
              </h3>
              <p className="text-gray-200 text-sm leading-relaxed line-clamp-2 mb-4 font-normal">
                {featuredArticle.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-300 font-medium">
                <span>{featuredArticle.date}</span>
                <span>·</span>
                <span>{featuredArticle.read.includes("min") ? featuredArticle.read : `${featuredArticle.read} de lectura`}</span>
                <span className="ml-auto text-gold-300 font-bold group-hover:underline flex items-center gap-1">
                  Leer noticia →
                </span>
              </div>
            </div>
          </article>

          {/* Side Cards */}
          {sideNews.map((n) => (
            <article
              key={n.id}
              onClick={() => setSelectedNews(n)}
              className="reveal-scale card-lift bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden group cursor-pointer hover:border-gold-500 transition-all duration-200"
              title="Haz clic para ver el comunicado completo"
            >
              <div className="overflow-hidden h-40">
                <img
                  src={n.img}
                  alt={n.title}
                  className="img-zoom w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <span className="inline-block bg-gold-100 text-gold-700 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wider">
                    {n.tag}
                  </span>
                  <h3 className="font-bold text-navy-950 text-[14px] leading-snug mb-2 group-hover:text-gold-600 transition-colors line-clamp-2">
                    {n.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-2 font-normal">
                    {n.excerpt}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span>{n.date}</span>
                    <span>·</span>
                    <span>{n.read}</span>
                  </div>
                  <span className="text-gold-600 font-bold group-hover:underline">Leer más →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* MODAL DETALLE DE NOTICIA AL HACER CLIC */}
      {selectedNews && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-navy-950/80 backdrop-blur-md animate-fadeup"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <LogoIsotype size={36} className="flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gold-500 text-navy-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedNews.tag}
                    </span>
                    <span className="text-slate-500 text-xs font-semibold">{selectedNews.date}</span>
                  </div>
                  <p className="text-gold-700 text-xs font-bold mt-0.5">Mesa Departamental de Competitividad de Quetzaltenango</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNews(null)}
                className="text-slate-500 hover:text-navy-950 p-2 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {/* Imagen principal */}
              <div className="rounded-2xl overflow-hidden h-56 sm:h-72 border border-gray-200 shadow-md bg-slate-100 flex items-center justify-center">
                <img
                  src={selectedNews.img}
                  alt={selectedNews.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Título */}
              <h2 className="text-navy-950 text-2xl sm:text-3xl font-extrabold leading-tight">
                {selectedNews.title}
              </h2>

              {/* Contenido */}
              <div className="text-slate-700 text-base leading-relaxed space-y-4 whitespace-pre-line font-normal">
                {selectedNews.content}
              </div>

              {/* Pie de comunicado */}
              <div className="p-4 bg-slate-50 border-l-4 border-gold-500 rounded-r-xl">
                <p className="text-xs text-slate-600 font-medium">
                  <strong>Comunicado Oficial:</strong> Esta publicación corresponde al canal de transparencia y divulgación pública de la Mesa Departamental de Competitividad de Quetzaltenango.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedNews(null)}
                className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Cerrar comunicado
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
