import React from "react";
import { SiteSection } from "../../../types/admin";

interface CustomSectionProps {
  section: SiteSection;
}

export default function CustomSection({ section }: CustomSectionProps) {
  const data = section.data || {};
  const title = data.title || section.customName || "Apartado Personalizado";
  const subtitle = data.subtitle || "Iniciativa Institucional";
  const description = data.description || "";
  const imageUrl = data.imageUrl;
  const cta = data.cta;

  return (
    <section className="py-8 lg:py-12 bg-white border-t border-gray-100 animate-fadeup">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className={`grid ${imageUrl ? "lg:grid-cols-2" : "grid-cols-1"} gap-8 lg:gap-12 items-center`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 rounded-full px-3.5 py-1 mb-4">
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
              <span className="text-orange-800 text-xs font-bold uppercase tracking-wider">
                {subtitle}
              </span>
            </div>

            <h2 className="text-navy-950 text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-wide leading-tight mb-4">
              {title}
            </h2>

            {description && (
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 whitespace-pre-line font-normal">
                {description}
              </p>
            )}

            {cta && (
              <div className="pt-2">
                <button
                  type="button"
                  className="btn-scale inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>{cta}</span>
                  <svg className="w-4 h-4 text-gold-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl max-h-[420px] bg-slate-50">
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
