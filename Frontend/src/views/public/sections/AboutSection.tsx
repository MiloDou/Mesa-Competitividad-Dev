import React, { useState, useEffect } from "react";
import { DIRECTIVA } from "../../../data/public";
import { DirectivaCard } from "../../../components/ui/DirectivaCard";
import { DirectivaMember } from "../../../types/public";

interface AboutSectionProps {
  data?: Record<string, any>;
}

export default function AboutSection({ data }: AboutSectionProps) {
  const [members, setMembers] = useState<DirectivaMember[]>(() => {
    if (typeof window === "undefined") return DIRECTIVA;
    const saved = localStorage.getItem("mesa_directiva_miembros");
    const defaultPositions: Record<string, string> = {
      "Carlos Montúfar": "Presidente",
      "María Fuentes": "Vicepresidente",
      "Roberto Ajú": "Secretario",
      "Sandra Ortiz": "Vocal II",
      "Pedro Tzul": "Vocal I",
      "Ana Hernández": "Tesorero",
      "Luis Morales": "Vocal III",
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Adaptar formato si proviene de admin Member
          return parsed.map((m: any) => {
            const pos = m.position || defaultPositions[m.name] || (m.role === "comision" ? "Comisión Directiva" : "Representante Institucional");
            return {
              name: m.name,
              role: pos,
              org: m.org || "Mesa Departamental de Competitividad",
              initials: m.initials || "MD",
              photo: m.photo || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format",
              status: m.status || "activo",
            };
          });
        }
      } catch (e) {}
    }
    return DIRECTIVA;
  });

  useEffect(() => {
    const defaultPositions: Record<string, string> = {
      "Carlos Montúfar": "Presidente",
      "María Fuentes": "Vicepresidente",
      "Roberto Ajú": "Secretario",
      "Sandra Ortiz": "Vocal II",
      "Pedro Tzul": "Vocal I",
      "Ana Hernández": "Tesorero",
      "Luis Morales": "Vocal III",
    };

    const handleSync = () => {
      const saved = localStorage.getItem("mesa_directiva_miembros");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(
              parsed.map((m: any) => {
                const pos = m.position || defaultPositions[m.name] || (m.role === "comision" ? "Comisión Directiva" : "Representante Institucional");
                return {
                  name: m.name,
                  role: pos,
                  org: m.org || "Mesa Departamental de Competitividad",
                  initials: m.initials || "MD",
                  photo: m.photo || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format",
                  status: m.status || "activo",
                };
              })
            );
          }
        } catch (e) {}
      }
    };
    window.addEventListener("mesa_miembros_updated", handleSync);
    return () => window.removeEventListener("mesa_miembros_updated", handleSync);
  }, []);

  // FILTRO OBLIGATORIO: Solo mostrar miembros activos en el sitio público
  const activeMembers = members.filter((m: any) => m.status !== "inactivo");

  const rawTitle = data?.title || "Juntos hacemos del suroccidente un territorio de oportunidades";
  const title = rawTitle.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");

  const rawDesc = data?.description || "La Mesa Departamental de Competitividad de Quetzaltenango es un espacio de diálogo y colaboración multisectorial con 15 años de trayectoria. Articula esfuerzos del sector público, empresarial, académico y de cooperación para dinamizar la economía, atraer inversión y generar oportunidades de desarrollo competitivo y sostenible.";
  const description = rawDesc.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");

  return (
    <section id="lamesa" className="py-8 lg:py-12 bg-white border-t border-gray-100">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">

        {/* Description row - Quiénes somos */}
        <div className="mb-12">
          <div className="reveal-left max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-8 bg-[#E5B82E]" />
              <span className="text-gold-700 text-xs font-bold tracking-[0.2em] uppercase">Identidad Institucional</span>
            </div>
            <h2 className="text-navy-950 text-4xl lg:text-5xl font-extrabold uppercase tracking-wide leading-tight mb-3">Quiénes somos</h2>
            <p className="text-gold-600 text-xl lg:text-2xl font-semibold leading-snug mb-6">{title}</p>
            <p className="text-slate-600 leading-relaxed text-[16px] font-normal whitespace-pre-line">
              {description}
            </p>
            {data?.imageUrl && (
              <div className="mt-6 rounded-2xl overflow-hidden border border-gray-200 shadow-lg max-h-72">
                <img src={data.imageUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="reveal flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-gold-700 text-xs font-bold uppercase tracking-[0.18em] flex-shrink-0">
            Junta Directiva 2024 – 2026 ({activeMembers.length} activos)
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Directiva — full width 3-column grid (Solo activos) */}
        <div className="reveal-scale grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeMembers.map((m, i) => (
            <DirectivaCard key={m.name} member={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
