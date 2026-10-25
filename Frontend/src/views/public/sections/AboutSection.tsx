import React from "react"
import { DirectivaCard } from "../../../components/ui/DirectivaCard"
import { DirectivaMember } from "../../../types/public"
import { useSyncedStorage } from "../../../hooks/useSyncedStorage"
import type { PublicSiteProfileRecord } from "../../../api/client"

interface AboutSectionProps {
  data?: Record<string, any>
  profile?: PublicSiteProfileRecord | null
}

export default function AboutSection({ data, profile }: AboutSectionProps) {
  const [members] = useSyncedStorage<DirectivaMember[]>(
    "mesa_directiva_miembros",
    [],
    {
      eventName: "mesa_miembros_updated",
      validate: Array.isArray,
      transform: (parsed) =>
        parsed.map((m: any) => ({
          name: m.name,
          role: "Colaborador",
          position: "Colaborador",
          org: m.org || "Mesa Departamental de Competitividad",
          initials: m.initials || "MD",
          photo:
            m.photo ||
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format",
          status: m.status || "activo",
        })),
    },
  )

  // FILTRO OBLIGATORIO: Solo mostrar miembros activos en el sitio público
  const activeMembers = members.filter((m: any) => m.status !== "inactivo")

  const rawTitle =
    data?.title ||
    profile?.name ||
    "Mesa Departamental de Competitividad de Quetzaltenango"

  const title = rawTitle.replace(
    /Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi,
    "Mesa Departamental de Competitividad de Quetzaltenango",
  )

  const rawDesc =
    profile?.summary?.trim() ||
    data?.description ||
    ""

  const description = rawDesc.replace(
    /Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi,
    "Mesa Departamental de Competitividad de Quetzaltenango",
  )

  return (
    <section
      id="lamesa"
      className="py-8 lg:py-12 bg-white border-t border-gray-100"
    >
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        {/* Description row - Quiénes somos */}
        <div className="mb-12">
          <div className="reveal-left max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-8 bg-[#E5B82E]" />
              <span className="text-gold-700 text-xs font-bold tracking-[0.2em] uppercase">
                Identidad Institucional
              </span>
            </div>
            <h2 className="text-navy-950 text-4xl lg:text-5xl font-extrabold uppercase tracking-wide leading-tight mb-3">
              Quiénes somos
            </h2>
            <p className="text-gold-600 text-xl lg:text-2xl font-semibold leading-snug mb-6">
              {title}
            </p>
            {description && <p className="text-slate-600 leading-relaxed text-[16px] font-normal whitespace-pre-line">{description}</p>}
            {(profile?.mission || profile?.vision) && (
              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                {profile.mission && (
                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">Misión</h3>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{profile.mission}</p>
                  </article>
                )}
                {profile.vision && (
                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">Visión</h3>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{profile.vision}</p>
                  </article>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="reveal flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-gold-700 text-xs font-bold uppercase tracking-[0.18em] flex-shrink-0">
            Equipo de Colaboradores ({activeMembers.length} activos)
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Directiva — full width 3-column grid (Solo activos) */}
        <div className="reveal-scale grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeMembers.map((m, i) => (
            <DirectivaCard key={m.name} member={m} index={i} />
          ))}
        </div>
        {activeMembers.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-slate-600">
            No hay integrantes publicados por el momento.
          </p>
        )}
      </div>
    </section>
  )
}
