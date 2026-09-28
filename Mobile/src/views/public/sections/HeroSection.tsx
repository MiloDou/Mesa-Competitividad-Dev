import { LogoIsotype } from "../../../Logo";

export default function HeroSection() {
  return (
    <section id="inicio" className="relative overflow-hidden" style={{ minHeight: "90vh" }}>
      {/* Full-bleed background image */}
      <div className="absolute inset-0 bg-navy-950">
        <img
          src="https://images.unsplash.com/photo-1593196061235-cf1b70e0309d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHdWF0ZW1hbGElMjBtb3VudGFpbnMlMjBjaXR5JTIwYWVyaWFsfGVufDF8fHx8MTc4OTY2ODM4NXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Montañas de Guatemala"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/80 to-navy-950" />
      </div>

      <div className="relative max-w-screen-xl mx-auto px-5 lg:px-10 flex flex-col justify-center" style={{ minHeight: "90vh" }}>
        <div className="max-w-2xl py-24 lg:py-32">
          {/* Eyebrow */}
          <div className="hero-enter hero-enter-1 flex items-center gap-3 mb-8">
            <div className="h-px w-10 bg-gold-500" />
            <span className="text-celeste-400 text-xs font-semibold tracking-[0.2em] uppercase">Región Occidente · Guatemala</span>
          </div>

          <h1 style={{ fontFamily:"var(--font-display)" }}
              className="hero-enter hero-enter-2 text-white text-5xl lg:text-6xl xl:text-7xl leading-[1.05] mb-6 font-normal">
            Mesa de{" "}
            <em className="text-gold-400 not-italic">Competitividad</em>{" "}
            de Quetzaltenango
          </h1>

          <p className="hero-enter hero-enter-3 text-navy-200 text-lg leading-relaxed mb-10 max-w-xl">
            Articulamos sector público, privado y academia para construir la agenda de desarrollo económico sostenible del occidente guatemalteco.
          </p>

          <div className="hero-enter hero-enter-4 flex flex-col sm:flex-row gap-3 mb-16">
            <a href="#proyectos"
               className="btn-scale inline-flex items-center justify-center gap-2 bg-celeste-500 hover:bg-celeste-400 text-navy-950 font-bold text-sm px-6 py-3.5 rounded-lg shadow-lg shadow-celeste-500/25 focus-visible:ring-2 focus-visible:ring-celeste-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900">
              Ver iniciativas activas
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
            </a>
            <a href="#summit-2026"
               className="btn-scale inline-flex items-center justify-center gap-2 border border-navy-500 hover:border-celeste-500 text-navy-200 hover:text-celeste-400 font-medium text-sm px-6 py-3.5 rounded-lg">
              Summit de Competitividad 2026
            </a>
          </div>

          {/* Stats row */}
          <div className="hero-enter hero-enter-5 flex flex-wrap gap-8">
            {[["23","proyectos activos"],["Q 287M","inversión articulada"],["47","instituciones aliadas"],["2019","año de fundación"]].map(([n,l]) => (
              <div key={l}>
                <p style={{ fontFamily:"var(--font-display)" }} className="text-celeste-400 text-2xl font-normal">{n}</p>
                <p className="text-navy-400 text-xs uppercase tracking-wide mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
