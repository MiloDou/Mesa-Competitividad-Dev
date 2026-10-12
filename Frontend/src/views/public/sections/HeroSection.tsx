import React, { useState, useEffect } from "react";
import emblemSrc from "../../../imports/Gemini_Generated_Image_qn6fwyqn6fwyqn6f-removebg-preview.png";
import { PROJECTS, DEFAULT_ENTITIES } from "../../../data/admin";

interface HeroSectionProps {
  data?: Record<string, string>;
  onNavigateTab?: (tabId: string) => void;
}

export function parseBudgetValue(raw?: string | number | null): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return isNaN(raw) ? 0 : raw;
  const str = String(raw).trim();
  if (!str) return 0;

  const clean = str.replace(/[Qq$€\s,]/g, "").trim();
  if (!clean) return 0;

  if (/m(il(l(ones)?)?)?$/i.test(clean) || clean.toLowerCase().endsWith("m")) {
    const num = parseFloat(clean.replace(/[a-zA-Z]/g, ""));
    return isNaN(num) ? 0 : num * 1_000_000;
  }
  if (/b(il(l(ones)?)?)?$/i.test(clean) || clean.toLowerCase().endsWith("b")) {
    const num = parseFloat(clean.replace(/[a-zA-Z]/g, ""));
    return isNaN(num) ? 0 : num * 1_000_000_000;
  }
  if (/k$/i.test(clean)) {
    const num = parseFloat(clean.replace(/[a-zA-Z]/g, ""));
    return isNaN(num) ? 0 : num * 1_000;
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatBudgetValue(total: number): string {
  if (!total || total <= 0) return "Q 0M";
  if (total >= 1_000_000_000) {
    const inB = total / 1_000_000_000;
    const formatted = inB % 1 === 0 ? inB.toFixed(0) : inB.toFixed(1).replace(/\.0$/, "");
    return `Q ${formatted}B`;
  }
  if (total >= 1_000_000) {
    const inM = total / 1_000_000;
    const formatted = inM % 1 === 0 ? inM.toFixed(0) : inM.toFixed(1).replace(/\.0$/, "");
    return `Q ${formatted}M`;
  }
  if (total >= 1_000) {
    const inK = total / 1_000;
    const formatted = inK % 1 === 0 ? inK.toFixed(0) : inK.toFixed(1).replace(/\.0$/, "");
    return `Q ${formatted}K`;
  }
  return `Q ${total.toLocaleString("es-GT")}`;
}

export default function HeroSection({ data, onNavigateTab }: HeroSectionProps) {
  const eyebrow = data?.eyebrow || "15 años Construyendo Competitividad Regional · Suroccidente de Guatemala";
  const title = data?.title || "Mesa Departamental de Competitividad de Quetzaltenango";
  const subtitle = data?.subtitle || "Fortalecer a Quetzaltenango como nodo regional estratégico del suroccidente de Guatemala, articulando esfuerzos públicos y privados para dinamizar la economía, atraer inversión y generar oportunidades de desarrollo competitivo y sostenible para todo el territorio.";
  const cta1 = data?.cta1 || "Ver iniciativas activas";
  const cta2 = data?.cta2 || "Summit de Competitividad 2026";

  // Carga reactiva de proyectos gestionados en el CMS
  const [projectList, setProjectList] = useState<any[]>(() => {
    if (typeof window === "undefined") return PROJECTS;
    const saved = localStorage.getItem("site_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return PROJECTS;
  });

  // Carga reactiva de entidades participantes gestionadas en el CMS
  const [entitiesList, setEntitiesList] = useState<any[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ENTITIES;
    const saved = localStorage.getItem("mesa_conformados_entidades");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_ENTITIES;
  });

  useEffect(() => {
    const handleProjectsSync = () => {
      const saved = localStorage.getItem("site_projects");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setProjectList(parsed);
        } catch (e) {}
      } else {
        setProjectList(PROJECTS);
      }
    };

    const handleEntitiesSync = () => {
      const saved = localStorage.getItem("mesa_conformados_entidades");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setEntitiesList(parsed);
        } catch (e) {}
      } else {
        setEntitiesList(DEFAULT_ENTITIES);
      }
    };

    window.addEventListener("site_projects_updated", handleProjectsSync);
    window.addEventListener("mesa_entidades_updated", handleEntitiesSync);
    window.addEventListener("storage", handleProjectsSync);
    window.addEventListener("storage", handleEntitiesSync);

    return () => {
      window.removeEventListener("site_projects_updated", handleProjectsSync);
      window.removeEventListener("mesa_entidades_updated", handleEntitiesSync);
      window.removeEventListener("storage", handleProjectsSync);
      window.removeEventListener("storage", handleEntitiesSync);
    };
  }, []);

  // Proyectos activos en el CMS
  const activeProjects = projectList.filter((p: any) => {
    const st = (p.status || "").toLowerCase().trim();
    return st === "activo" || st === "en ejecución" || st === "en curso" || st === "active";
  });
  const activeCount = activeProjects.length;

  // Inversión articulada: suma de todos los proyectos activos
  const totalInvestment = activeProjects.reduce((acc: number, p: any) => acc + parseBudgetValue(p.budget), 0);
  const investmentFormatted = formatBudgetValue(totalInvestment);

  // Instituciones aliadas activas en Conformados Por
  const activeEntities = entitiesList.filter((e: any) => e.status !== "inactivo");
  const entitiesCount = activeEntities.length;

  return (
    <section id="inicio" className="relative overflow-hidden bg-white">
      {/* Background with full brand logo emblem watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[-2%] sm:right-[2%] top-1/2 -translate-y-1/2 w-[550px] md:w-[700px] lg:w-[850px] opacity-15 flex items-center justify-center">
          <img
            src={emblemSrc}
            alt="Fondo Logo Oficial Mesa de Competitividad"
            className="w-full h-auto object-contain scale-105"
          />
        </div>
      </div>

      <div className="relative max-w-screen-xl mx-auto px-5 lg:px-10 flex flex-col justify-center">
        <div className="max-w-4xl pt-6 lg:pt-10 pb-16 lg:pb-20">
          {/* Eyebrow badge */}
          <div className="hero-enter hero-enter-1 flex items-center gap-3 mb-8">
            <div className="h-0.5 w-10 bg-[#E5B82E]" />
            <span className="text-gold-700 text-xs font-bold tracking-[0.22em] uppercase">
              {eyebrow}
            </span>
          </div>

          <h1 className="hero-enter hero-enter-2 text-navy-950 text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-6 font-extrabold tracking-tight">
            {title}
          </h1>

          <p className="hero-enter hero-enter-3 text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-3xl font-normal">
            {subtitle}
          </p>

          <div className="hero-enter hero-enter-4 flex flex-col sm:flex-row gap-4 mb-12">
            <button
              type="button"
              onClick={() => (onNavigateTab ? onNavigateTab("proyectos") : null)}
              className="btn-scale inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-7 py-4 rounded-xl shadow-xl shadow-navy-900/10 border border-navy-900 cursor-pointer min-h-[44px]"
            >
              {cta1}
              <svg className="w-4 h-4 text-gold-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
            {cta2 && (
              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab("summit") : null)}
                className="btn-scale inline-flex items-center justify-center gap-2 border-2 border-gold-600 hover:border-gold-700 bg-gold-50 text-gold-700 font-bold text-sm px-7 py-4 rounded-xl shadow-md cursor-pointer min-h-[44px]"
              >
                {cta2}
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="hero-enter hero-enter-5 flex flex-wrap gap-8 pt-6 border-t border-gray-200">
            {[
              [String(activeCount), "proyectos activos"],
              [investmentFormatted, "inversión articulada"],
              [String(entitiesCount), "instituciones aliadas"],
              ["15 Años", "de trayectoria"],
            ].map(([n, l]) => (
              <div key={l} className="min-w-[120px]">
                <p className="text-gold-600 text-3xl font-extrabold tracking-tight">{n}</p>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
