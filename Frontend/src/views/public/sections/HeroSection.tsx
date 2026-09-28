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
    <section id="inicio" className="relative overflow-hidden bg-navy-950" style={{ minHeight: "92vh" }}>
      {/* Background with brand logo emblem watermark & radiant background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep blue & indigo radial glows */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-brand-blue/30 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-brand-purple/40 rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[150px]" />

        {/* Integrated official emblem watermark image */}
        <div className="absolute right-[-8%] top-1/2 -translate-y-1/2 w-[750px] lg:w-[950px] opacity-15 mix-blend-screen flex items-center justify-center">
          <img
            src={emblemSrc}
            alt="Emblema Mesa de Competitividad"
            className="w-full h-auto object-contain filter drop-shadow-[0_0_80px_rgba(197,155,39,0.3)] scale-110"
          />
        </div>

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-transparent" />
      </div>

      <div className="relative max-w-screen-xl mx-auto px-5 lg:px-10 flex flex-col justify-center" style={{ minHeight: "92vh" }}>
        <div className="grid lg:grid-cols-2 gap-10 items-center py-24 lg:py-32">
          <div>
            {/* Eyebrow badge */}
            <div className="hero-enter hero-enter-1 flex items-center gap-3 mb-8">
              <div className="h-0.5 w-10 bg-gradient-to-r from-gold-500 to-gold-300" />
              <span className="text-gold-400 text-xs font-bold tracking-[0.22em] uppercase">
                {eyebrow}
              </span>
            </div>

            <h1 className="hero-enter hero-enter-2 text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-6 font-extrabold tracking-tight">
              {title}
            </h1>

            <p className="hero-enter hero-enter-3 text-navy-200 text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-xl font-normal">
              {subtitle}
            </p>

            <div className="hero-enter hero-enter-4 flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#proyectos"
                className="btn-scale inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue to-navy-600 hover:from-navy-600 hover:to-brand-blue text-navy-50 font-bold text-sm px-7 py-4 rounded-xl shadow-xl shadow-brand-blue/30 border border-brand-blue/50"
              >
                {cta1}
                <svg className="w-4 h-4 text-gold-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </a>
              {cta2 && (
                <a
                  href="#summit-2026"
                  className="btn-scale inline-flex items-center justify-center gap-2 border-2 border-gold-500/80 hover:border-gold-400 bg-gold-500/10 backdrop-blur-sm text-gold-300 hover:text-gold-200 font-bold text-sm px-7 py-4 rounded-xl shadow-lg"
                >
                  {cta2}
                </a>
              )}
            </div>

            {/* Stats row with gold highlight borders */}
            <div className="hero-enter hero-enter-5 flex flex-wrap gap-8 pt-6 border-t border-navy-800/80">
              {[["23","proyectos activos"],["Q 287M","inversión articulada"],["47","instituciones aliadas"],["2019","año de fundación"]].map(([n,l]) => (
                <div key={l} className="min-w-[120px]">
                  <p className="text-gold-400 text-3xl font-extrabold tracking-tight">{n}</p>
                  <p className="text-navy-300 text-xs font-semibold uppercase tracking-wider mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Section Image if set */}
          {imageUrl && (
            <div className="hero-enter hero-enter-3 rounded-2xl overflow-hidden border-2 border-navy-800 shadow-2xl max-h-[450px]">
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
