import React from "react"
import { ParticipatingEntity } from "../../../types/admin"
import {
  SOLID_CARD_PALETTES,
  RANDOM_COLOR_SEQUENCE,
} from "../../../components/ui/DirectivaCard"
import { useSyncedStorage } from "../../../hooks/useSyncedStorage"

interface ConformadosSectionProps {
  data?: Record<string, any>
}

export function getEntityCategoryStyle(
  category: string = "",
  index: number = 0,
) {
  let label = "Multisectorial"
  if (/academ/i.test(category)) label = "Académico"
  else if (/p[uú]blic/i.test(category)) label = "Público"
  else if (/social/i.test(category)) label = "Sociedad Civil"
  else if (/productiv/i.test(category)) label = "Productivo"
  else if (/investiga/i.test(category)) label = "Investigativo"

  // Distribución de 3 colores sólidos (Dorado, Azul, Rojo) sin degradados
  const colorIdx =
    RANDOM_COLOR_SEQUENCE[Math.abs(index) % RANDOM_COLOR_SEQUENCE.length]
  const palette = SOLID_CARD_PALETTES[colorIdx]

  return {
    label,
    topAccent: palette.topAccent,
    badge: palette.badge,
    categoryText: palette.roleText,
    borderHover: palette.borderHover,
    avatarRing: palette.avatarRing,
    avatarText: palette.avatarText,
    titleHover: palette.titleHover,
  }
}

export default function ConformadosSection({ data }: ConformadosSectionProps) {
  // Cargar entidades desde localStorage (gestionadas exclusivamente desde el CMS)
  const [entities] = useSyncedStorage<ParticipatingEntity[]>(
    "mesa_conformados_entidades",
    [],
    {
      eventName: "mesa_entidades_updated",
      validate: Array.isArray,
    },
  )

  // FILTRO OBLIGATORIO: En el sitio público SOLO se muestran las entidades ACTIVAS
  const activeEntities = entities.filter((e) => e.status !== "inactivo")

  // CÁLCULOS ESTRICTAMENTE DINÁMICOS BASADOS EN ENTIDADES ACTIVAS
  const totalCount = activeEntities.length
  const academiaCount = activeEntities.filter(
    (e) => e.category === "Academia",
  ).length
  const publicoCount = activeEntities.filter(
    (e) => e.category === "Sector Público",
  ).length
  const socialCount = activeEntities.filter(
    (e) => e.category === "Sector Social",
  ).length
  const productivoCount = activeEntities.filter(
    (e) => e.category === "Sector Productivo",
  ).length
  const investigativoCount = activeEntities.filter(
    (e) => e.category === "Sector Investigativo",
  ).length
  const otrosCount = socialCount + productivoCount + investigativoCount

  const title = data?.title || "CONFORMADOS POR"
  const subtitle = `Red multisectorial de ${totalCount} instituciones aliadas que articulan la competitividad regional.`

  // Estadísticas que se recalculan en tiempo real al agregar, desactivar o eliminar entidades en el CMS
  const statCards = [
    {
      num: publicoCount.toString(),
      label: "Instituciones públicas",
      tag: "Público",
      tagClass: "bg-sky-50 text-sky-800 border-sky-300",
      numClass: "text-sky-600",
    },
    {
      num: academiaCount.toString(),
      label: "Universidades y centros",
      tag: "Académico",
      tagClass: "bg-rose-50 text-red-700 border-red-300",
      numClass: "text-red-600",
    },
    {
      num: otrosCount.toString(),
      label: "Sociedad civil y productivo",
      tag: "Sociedad Civil y Productivo",
      tagClass: "bg-amber-50 text-gold-800 border-gold-300",
      numClass: "text-gold-600",
    },
    {
      num: totalCount.toString(),
      label: "Entidades aliadas activas",
      tag: "Total Aliados",
      tagClass: "bg-amber-50 text-gold-800 border-gold-300",
      numClass: "text-gold-600",
    },
  ]

  if (activeEntities.length === 0) {
    return (
      <section id="conformados" className="py-8 lg:py-12 bg-slate-50 border-t border-gray-200">
        <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
          <h2 className="text-navy-950 text-3xl lg:text-4xl font-extrabold uppercase tracking-wide leading-tight mb-2">
            {title}
          </h2>
          <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-slate-600">
            No hay entidades participantes publicadas por el momento.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="conformados"
      className="py-8 lg:py-12 bg-slate-50 border-t border-gray-200"
    >
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        {/* Section Header (Sin botones de edición públicos: la gestión es exclusiva del CMS) */}
        <div className="reveal-left mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-8 bg-[#E5B82E]" />
              <span className="text-gold-700 text-xs font-bold tracking-[0.2em] uppercase">
                Estructura Multisectorial
              </span>
            </div>
            <h2 className="text-navy-950 text-3xl lg:text-4xl font-extrabold uppercase tracking-wide leading-tight mb-2">
              {title}
            </h2>
            <p className="text-slate-600 text-base max-w-3xl font-normal">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="bg-navy-900 text-gold-400 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs border border-navy-800">
              {totalCount} Entidades Activas
            </span>
          </div>
        </div>

        {/* 4 Stat Cards Row (Calculados Dinámicamente según Entidades Activas) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 reveal-scale">
          {statCards.map((sc) => (
            <div
              key={sc.label}
              className="card-lift bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div className="mb-3">
                <span
                  className={`inline-block border text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${sc.tagClass}`}
                >
                  {sc.tag}
                </span>
              </div>
              <div>
                <p
                  className={`${sc.numClass} text-4xl lg:text-5xl leading-none font-extrabold tracking-tight transition-all duration-300`}
                >
                  {sc.num}
                </p>
                <p className="text-slate-700 text-xs sm:text-sm mt-2 font-semibold leading-snug">
                  {sc.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 5 Ejes de la Mesa */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-extrabold text-amber-600">
              01 PRODUCTIVO
            </span>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Cámaras, Productores, Empresarios y Turismo
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-extrabold text-blue-600">
              02 ACADEMIA
            </span>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              CUNOC, Landívar, Mesoamericana y Da Vinci
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-extrabold text-teal-600">
              03 PÚBLICO
            </span>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Gobernación, MINECO, INGUAT, Metrópoli y AMDEL
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-extrabold text-indigo-600">
              04 INVESTIGATIVO
            </span>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Consultores y centros de investigación territorial
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-extrabold text-rose-600">
              05 SOCIAL
            </span>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Red de Grupos Gestores, sociedad civil y cooperación
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="reveal flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-gold-700 text-xs font-bold uppercase tracking-[0.18em] flex-shrink-0">
            Red de Entidades Participantes Activas ({totalCount})
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* FORMATO VISUAL IDÉNTICO A LOS MIEMBROS (DirectivaCard format) */}
        <div className="reveal-scale grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeEntities.map((ent, i) => {
            const st = getEntityCategoryStyle(ent.category, i)
            return (
              <div
                key={ent.id}
                className="card-frame-hover card-lift group relative bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden cursor-default"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Top accent line */}
                <div className={`h-1.5 ${st.topAccent}`} />

                <div className="flex gap-0">
                  {/* Photo / Logo column */}
                  <div className="relative w-[135px] sm:w-[145px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center justify-center p-3 pb-10 min-h-[185px]">
                    {ent.photo ? (
                      <img
                        src={ent.photo}
                        alt={ent.name}
                        className="w-full h-full max-h-[135px] object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-navy-950 flex items-center justify-center text-gold-400 font-bold text-sm shadow-sm">
                        {ent.initials || "ENT"}
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20">
                      <div
                        className={`border rounded-xl px-2.5 py-1 text-center shadow-md whitespace-nowrap ${st.badge}`}
                      >
                        <span
                          style={{ fontFamily: "var(--font-mono)" }}
                          className="text-[10px] font-extrabold tracking-widest leading-none block uppercase"
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details column */}
                  <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                    <div>
                      {/* Name - Main card title */}
                      <p
                        className={`text-navy-950 ${st.titleHover} font-bold text-[16px] leading-snug mb-1 transition-colors duration-200`}
                      >
                        {ent.name}
                      </p>
                      {/* Sector / Área */}
                      <p
                        className={`${st.categoryText} text-[11px] font-extrabold uppercase tracking-widest mb-3`}
                      >
                        {ent.category}
                      </p>
                      {/* Divider */}
                      <div className="h-px bg-gray-100 mb-3" />
                      {/* Institución / Rol */}
                      <p className="text-slate-600 text-[13px] leading-snug font-normal">
                        Entidad aliada participante en el diálogo multisectorial
                        y desarrollo territorial.
                      </p>
                    </div>

                    {/* Bottom identifier */}
                    <div className="mt-4 flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full bg-gray-50 border ${st.avatarRing} flex items-center justify-center flex-shrink-0`}
                      >
                        <span
                          style={{ fontFamily: "var(--font-mono)" }}
                          className={`${st.avatarText} text-[8px] font-bold`}
                        >
                          {ent.initials || "MD"}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider truncate">
                        Mesa Departamental de Competitividad
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom accent */}
                <div
                  className={`h-0.5 bg-gray-200 ${st.borderHover} transition-colors duration-300`}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
