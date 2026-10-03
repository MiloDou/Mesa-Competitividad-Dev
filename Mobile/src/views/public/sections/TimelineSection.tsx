import { HITO_IMAGES } from "../../../data/public";

interface TimelineSectionProps {
  hoveredHito: number | null;
  setHoveredHito: (n: number | null) => void;
}

export default function TimelineSection({ hoveredHito, setHoveredHito }: TimelineSectionProps) {
  return (
    <div className="bg-navy-900 border-t border-navy-800">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10 py-10">
        <p className="text-navy-300 text-[10px] font-bold uppercase tracking-[0.18em] mb-10 text-center">Hitos de la Mesa · 2019 – 2026</p>
        <div className="relative">
          {/* Line */}
          <div className="absolute left-0 right-0 top-7 h-px bg-navy-700 hidden sm:block" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {[
              { year:"2019", label:"Fundación", desc:"Decreto de creación y primera sesión constitutiva", dot:"bg-celeste-500" },
              { year:"2021", label:"Plan Estratégico", desc:"Aprobación del primer Plan de Trabajo 2021–2024", dot:"bg-navy-400" },
              { year:"2022", label:"Q 100M", desc:"Primer portafolio de proyectos con Q 100M articulados", dot:"bg-navy-400" },
              { year:"2024", label:"47 aliados", desc:"Incorporación de 12 nuevas instituciones miembro", dot:"bg-navy-400" },
              { year:"2026", label:"Summit", desc:"Primer Summit de Competitividad Regional", dot:"bg-celeste-500" },
            ].map((h, i) => (
              <div key={h.year} className="relative flex flex-col items-center text-center">
                {/* Tooltip card */}
                {hoveredHito === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-56 bg-navy-800 border border-navy-700 rounded-xl overflow-hidden shadow-2xl z-20 pointer-events-none animate-fadeup">
                    <img src={HITO_IMAGES[i]} alt={h.label} className="w-full h-28 object-cover" />
                    <div className="p-3">
                      <span style={{ fontFamily:"var(--font-mono)" }} className="text-celeste-400 text-[10px] font-bold block mb-0.5">{h.year}</span>
                      <p className="text-white font-semibold text-sm mb-1">{h.label}</p>
                      <p className="text-navy-400 text-xs leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                )}
                <button
                  className={`w-14 h-14 rounded-full border-4 border-navy-900 ${h.dot} flex-shrink-0 mb-4 shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-xl focus:outline-none`}
                  onMouseEnter={() => setHoveredHito(i)}
                  onMouseLeave={() => setHoveredHito(null)}
                  aria-label={`Hito ${h.year}: ${h.label}`}
                />
                <span style={{ fontFamily:"var(--font-mono)" }} className="text-celeste-400 text-sm font-bold tracking-widest">{h.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
