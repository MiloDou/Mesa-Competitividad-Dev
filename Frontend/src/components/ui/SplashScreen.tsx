import React, { useEffect, useState } from "react";
import emblemSrc from "../../imports/loading-isotype.png";

interface SplashScreenProps {
  /** Callback triggered when the splash screen has completed its transition and can be unmounted */
  onFinish?: () => void;
  /** Duration in milliseconds before initiating the fade out transition (default: 2300ms) */
  duration?: number;
}

/**
 * SplashScreen component for Mesa Departamental de Competitividad de Quetzaltenango.
 * - Solid pure white background (#FFFFFF) without gradients.
 * - Large emblem centerpiece that assembles cleanly through layer entrance, rotation alignment and golden sheen.
 * - Adheres to clean code principles, accessibility (prefers-reduced-motion) and automatic DOM cleanup.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2300,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion for immediate dismissal
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      onFinish?.();
      return;
    }

    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  const handleAnimationEnd = () => {
    if (isFadingOut) {
      onFinish?.();
    }
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Cargando Mesa Departamental de Competitividad de Quetzaltenango"
      onAnimationEnd={handleAnimationEnd}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-gray-900 select-none ${
        isFadingOut ? "animate-splash-fade-out pointer-events-none" : ""
      }`}
    >
      <div className="relative flex flex-col items-center max-w-lg mx-auto px-6 text-center">
        {/* Contenedor del Logo en Grande con ensamblado visual */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center mb-8">
          {/* Anillo geométrico exterior con rotación de ensamble */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-gold-400/40 animate-splash-ring pointer-events-none"
            aria-hidden="true"
          />

          {/* Halo sutil de contraste dorado sobre fondo blanco */}
          <div
            className="absolute inset-4 rounded-full border border-navy-900/10 shadow-xl bg-white/70 pointer-events-none"
            aria-hidden="true"
          />

          {/* Logo oficial en gran escala con efecto de ensamblado (zoom + enfoque nítido) */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 overflow-hidden rounded-full flex items-center justify-center animate-splash-core">
            <img
              src={emblemSrc}
              alt="Logo Oficial de la Mesa Departamental de Competitividad de Quetzaltenango"
              className="w-full h-full object-contain block drop-shadow-md"
            />

            {/* Efecto de destello / barrido luminoso al terminar de armarse */}
            <div
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none animate-splash-sheen"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Tipografía oficial institucional que aparece al armarse el logo */}
        <p
          className="text-xs sm:text-sm font-bold uppercase tracking-[0.28em] text-gold-600 opacity-0 animate-splash-text"
          style={{ animationDelay: "0.4s" }}
        >
          Mesa Departamental de
        </p>

        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wide text-navy-900 mt-1 opacity-0 animate-splash-text"
          style={{ animationDelay: "0.6s" }}
        >
          Competitividad
        </h1>

        <p
          className="text-base sm:text-lg font-bold text-navy-600 mt-1 opacity-0 animate-splash-text"
          style={{ animationDelay: "0.8s" }}
        >
          Quetzaltenango
        </p>

        {/* Línea decorativa minimalista con expansión */}
        <div
          className="mt-6 h-0.5 w-16 bg-gold-500 rounded-full opacity-0 animate-splash-text"
          style={{ animationDelay: "1s" }}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
};

export default SplashScreen;
