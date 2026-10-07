import { useEffect } from "react";

export function useScrollReveal(dep?: any) {
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px 50px 0px",
      threshold: 0.01,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");

    elements.forEach((el) => {
      // Garantizar visibilidad inmediata al cambiar de pestaña modular
      el.classList.add("revealed");
      observer.observe(el);
    });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [dep]);
}
