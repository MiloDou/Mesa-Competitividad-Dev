import { DIRECTIVA } from "../../../data/public";
import { DirectivaCard } from "../../../components/ui/DirectivaCard";

export default function AboutSection() {
  return (
    <section id="lamesa" className="py-24 bg-navy-950">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">

        {/* Description row */}
        <div className="grid lg:grid-cols-[1fr_2px_1fr] gap-14 items-start mb-16">
          <div>
            <h2 style={{ fontFamily:"var(--font-display)" }} className="text-celeste-400 text-4xl lg:text-5xl font-bold uppercase tracking-wide leading-tight mb-3">Quiénes somos</h2>
            <p className="text-white text-xl lg:text-2xl font-normal leading-snug mb-6">Un espacio de diálogo y construcción colectiva</p>
            <p className="text-navy-300 leading-relaxed mb-4 text-[15px]">
              La Mesa Departamental de Competitividad de Quetzaltenango es un mecanismo de coordinación interinstitucional que reúne representantes del sector público, empresarial, académico y de la sociedad civil para diseñar e implementar la agenda de competitividad territorial.
            </p>
            <p className="text-navy-300 leading-relaxed text-[15px]">
              Operamos bajo gobernanza participativa con tres comisiones: <strong className="text-white">Infraestructura y Logística</strong>, <strong className="text-white">Desarrollo Humano y Empleo</strong>, e <strong className="text-white">Inversión y Comercio</strong>.
            </p>
          </div>

          <div className="hidden lg:block self-stretch bg-navy-800" />

          <div className="flex flex-col justify-center">
            <h2 className="text-celeste-400 text-3xl lg:text-4xl font-bold uppercase tracking-wide leading-tight mb-5">Conformados por</h2>
            <div className="grid grid-cols-3 gap-4">
              {[["12","Instituciones públicas","PUB"],["18","Gremiales privadas","EMP"],["6","Universidades","UNI"]].map(([n,l,abbr]) => (
                <div key={l} className="bg-navy-900 border border-navy-800 rounded-xl p-5">
                  <div className="mb-2"><span className="inline-block bg-navy-700 text-celeste-400 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest">{abbr}</span></div>
                  <p style={{ fontFamily:"var(--font-display)" }} className="text-white text-3xl leading-none">{n}</p>
                  <p className="text-white text-xs mt-1 leading-snug">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-navy-800" />
          <p className="text-navy-300 text-xs font-semibold uppercase tracking-[0.18em] flex-shrink-0">Junta Directiva 2024 – 2026</p>
          <div className="h-px flex-1 bg-navy-800" />
        </div>

        {/* Directiva — full width 3-column grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DIRECTIVA.map((m, i) => (
            <DirectivaCard key={m.name} member={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
