import emblemSrc from "../../../imports/Gemini_Generated_Image_qn6fwyqn6fwyqn6f-removebg-preview.png";

interface HeroSectionProps {
  data?: Record<string, string>;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const eyebrow = data?.eyebrow || "Región Occidente · Guatemala";
  const title = data?.title || "Mesa de Competitividad de Quetzaltenango";
  const subtitle = data?.subtitle || "Articulamos sector público, privado y academia para construir la agenda de desarrollo económico sostenible del occidente guatemalteco.";
  const cta1 = data?.cta1 || "Ver iniciativas activas";
  const cta2 = data?.cta2 || "Summit de Competitividad 2026";
  const imageUrl = data?.imageUrl;

  return (
    <section id="inicio" className="relative overflow-hidden bg-white">
      {/* Background with full brand logo emblem watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Full Official Emblem Watermark Backdrop */}
        <div className="absolute right-[-2%] sm:right-[2%] top-1/2 -translate-y-1/2 w-[550px] md:w-[700px] lg:w-[850px] opacity-15 flex items-center justify-center">
          <img
            src={emblemSrc}
            alt="Fondo Logo Oficial Mesa de Competitividad"
            className="w-full h-auto object-contain scale-105"
          />
        </div>
      </div>

      <div className="relative max-w-screen-xl mx-auto px-5 lg:px-10 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-10 items-center pt-6 lg:pt-10 pb-16 lg:pb-20">
          <div className="lg:col-span-8">
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

            <p className="hero-enter hero-enter-3 text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl font-normal">
              {subtitle}
            </p>

            <div className="hero-enter hero-enter-4 flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#proyectos"
                className="btn-scale inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-7 py-4 rounded-xl shadow-xl shadow-navy-900/10 border border-navy-900"
              >
                {cta1}
                <svg className="w-4 h-4 text-gold-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </a>
              {cta2 && (
                <a
                  href="#summit-2026"
                  className="btn-scale inline-flex items-center justify-center gap-2 border-2 border-gold-600 hover:border-gold-700 bg-gold-50 text-gold-700 font-bold text-sm px-7 py-4 rounded-xl shadow-md"
                >
                  {cta2}
                </a>
              )}
            </div>

            {/* Stats row with gold highlight borders */}
            <div className="hero-enter hero-enter-5 flex flex-wrap gap-8 pt-6 border-t border-gray-200">
              {[["23","proyectos activos"],["Q 287M","inversión articulada"],["47","instituciones aliadas"],["2019","año de fundación"]].map(([n,l]) => (
                <div key={l} className="min-w-[120px]">
                  <p className="text-gold-600 text-3xl font-extrabold tracking-tight">{n}</p>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Section Image if set in editor */}
          {imageUrl && (
            <div className="lg:col-span-4 hero-enter hero-enter-3 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl max-h-[380px]">
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
