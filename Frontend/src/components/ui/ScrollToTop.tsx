import React, { useState, useEffect } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver al inicio de la página"
      title="Volver al inicio (Teclado: Enter/Espacio)"
      className="fixed bottom-6 right-6 z-40 bg-navy-900 hover:bg-navy-800 text-white p-3.5 rounded-full shadow-2xl border border-navy-700/50 transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none flex items-center justify-center group"
    >
      <svg
        className="w-5 h-5 text-gold-400 group-hover:-translate-y-0.5 transition-transform duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}

export default ScrollToTop;
