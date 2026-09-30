import { DIRECTIVA } from "../../../data/public";
import { DirectivaCard } from "../../../components/ui/DirectivaCard";

interface AboutSectionProps {
  data?: Record<string, any>;
}

export default function AboutSection({ data }: AboutSectionProps) {
  return (
    <section id="lamesa" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">

        {/* Description row */}
        <div className="grid lg:grid-cols-[1fr_2px_1fr] gap-14 items-start mb-16">
          <div className="reveal-left">
            <h2 className="text-navy-950 text-4xl lg:text-5xl font-extrabold uppercase tracking-wide leading-tight mb-3">Quiénes somos</h2>
            <p className="text-gold-600 text-xl lg:text-2xl font-semibold leading-snug mb-6">Un espacio de diálogo y construcción colectiva</p>
            <p className="text-slate-600 leading-relaxed mb-4 text-[15px] font-normal">
              La Mesa Departamental de Competitividad de Quetzaltenango es un mecanismo de coordinación interinstitucional que reúne representantes del sector público, empresarial, académico y de la sociedad civil para diseñar e implementar la agenda de competitividad territorial.
            </p>
            <p className="text-slate-600 leading-relaxed text-[15px] font-normal">
              Operamos bajo gobernanza participativa con tres comisiones: <strong className="text-navy-900 font-bold">Infraestructura y Logística</strong>, <strong className="text-navy-900 font-bold">Desarrollo Humano y Empleo</strong>, e <strong className="text-navy-900 font-bold">Inversión y Comercio</strong>.
            </p>
          </div>

          <div className="hidden lg:block self-stretch bg-gray-200" />

          <div className="reveal-right flex flex-col justify-center">
            <h2 className="text-navy-950 text-3xl lg:text-4xl font-extrabold uppercase tracking-wide leading-tight mb-5">Conformados por</h2>
            <div className="grid grid-cols-3 gap-4">
              {[["12","Instituciones públicas","PUB"],["18","Gremiales privadas","EMP"],["6","Universidades","UNI"]].map(([n,l,abbr]) => (
                <div key={l} className="card-lift bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="mb-2"><span className="inline-block bg-gold-100 text-gold-700 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest">{abbr}</span></div>
                  <p className="text-gold-600 text-3xl leading-none font-bold">{n}</p>
                  <p className="text-slate-700 text-xs mt-1 leading-snug font-medium">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="reveal flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-gold-700 text-xs font-bold uppercase tracking-[0.18em] flex-shrink-0">Junta Directiva 2024 – 2026</p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Directiva — full width 3-column grid */}
        <div className="reveal-scale grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DIRECTIVA.map((m, i) => (
            <DirectivaCard key={m.name} member={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
