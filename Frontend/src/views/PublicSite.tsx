import React, { useState, useEffect } from "react";
import { RegForm } from "../types/public";
import { useScrollReveal } from "../hooks/useScrollReveal";

import PublicHeader from "./public/PublicHeader";
import HeroSection from "./public/sections/HeroSection";
import AboutSection from "./public/sections/AboutSection";
import TimelineSection from "./public/sections/TimelineSection";
import NewsSection from "./public/sections/NewsSection";
import ProjectsSection from "./public/sections/ProjectsSection";
import EventSection from "./public/sections/EventSection";
import DocumentsSection from "./public/sections/DocumentsSection";
import ContactSection from "./public/sections/ContactSection";
import FooterSection from "./public/sections/FooterSection";
import { LoginModal } from "./public/modals/LoginModal";
import { NewsArchiveModal } from "./public/modals/NewsArchiveModal";
import { ProjectsArchiveModal } from "./public/modals/ProjectsArchiveModal";

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

export default function PublicSite({ onLoginSuccess }: PublicSiteProps) {
  useScrollReveal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewsArchive, setShowNewsArchive] = useState(false);
  const [showProjectsArchive, setShowProjectsArchive] = useState(false);

  // Load sections (both default and saved ones) in order
  const [sections, setSections] = useState<any[]>(() => {
    const saved = localStorage.getItem("site_sections");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("site_sections");
      if (saved) setSections(JSON.parse(saved));
    };
    window.addEventListener("site_sections_updated", handleUpdate);
    return () => window.removeEventListener("site_sections_updated", handleUpdate);
  }, []);

  const [regForm, setRegForm] = useState<RegForm>({
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    organizacion: "",
    sector: "",
    modalidad: "",
    comentarios: "",
  });
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [regTouched, setRegTouched] = useState<Set<string>>(new Set());

  const [contactForm, setContactForm] = useState({
    nombre: "",
    correo: "",
    asunto: "",
    mensaje: "",
  });
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [scrolled, setScrolled] = useState(false);
  const [hoveredHito, setHoveredHito] = useState<number | null>(null);

  useEffect(() => {
    const el = document.getElementById("pub-root");
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, []);

  function touch(k: string) {
    setRegTouched(s => new Set([...s, k]));
  }

  function regInvalid(k: keyof RegForm) {
    return regTouched.has(k) && !regForm[k];
  }

  function submitReg(e: React.FormEvent) {
    e.preventDefault();
    const req: (keyof RegForm)[] = ["nombre", "apellidos", "correo", "organizacion", "sector", "modalidad"];
    const missing = req.filter(k => !regForm[k]);
    setRegTouched(new Set([...missing]));
    if (missing.length) {
      setRegStatus("error");
      return;
    }
    setRegStatus("loading");
    setTimeout(() => setRegStatus("success"), 1800);
  }

  const [contactTouched, setContactTouched] = useState<Set<string>>(new Set());

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const req = ["nombre", "correo", "asunto", "mensaje"];
    const missing = req.filter(k => !contactForm[k as keyof typeof contactForm]?.trim());
    setContactTouched(new Set([...missing]));
    if (missing.length) {
      setContactStatus("error");
      return;
    }
    setContactStatus("loading");
    setTimeout(() => setContactStatus("success"), 1500);
  }

  // Filter sections that are set to visible
  const visibleSections = sections.filter((s) => s.visible);

  const renderSectionComponent = (sec: any) => {
    switch (sec.type) {
      case "hero":
        return <HeroSection key={sec.id} data={sec.data} />;
      case "about":
        return <AboutSection key={sec.id} data={sec.data} />;
      case "timeline":
        return <TimelineSection key={sec.id} hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />;
      case "news":
        return <NewsSection key={sec.id} onOpenArchive={() => setShowNewsArchive(true)} />;
      case "projects":
        return <ProjectsSection key={sec.id} onOpenArchive={() => setShowProjectsArchive(true)} />;
      case "event":
        return (
          <EventSection
            key={sec.id}
            regForm={regForm}
            setRegForm={setRegForm}
            regStatus={regStatus}
            regTouched={regTouched}
            touch={touch}
            regInvalid={regInvalid}
            submitReg={submitReg}
          />
        );
      case "documents":
        return <DocumentsSection key={sec.id} />;
      case "contact":
        return (
          <ContactSection
            key={sec.id}
            data={sec.data}
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactStatus={contactStatus}
            submitContact={submitContact}
          />
        );
      case "custom":
        return (
          <section key={sec.id} className="py-20 bg-navy-950 border-t border-navy-900 text-white relative overflow-hidden">
            <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  {sec.data?.subtitle && (
                    <span className="text-gold-400 text-xs font-bold uppercase tracking-widest block mb-2">
                      {sec.data.subtitle}
                    </span>
                  )}
                  <h2 className="text-3xl lg:text-4xl font-extrabold uppercase mb-4 text-white">
                    {sec.customName || sec.data?.title}
                  </h2>
                  <p className="text-navy-200 text-base leading-relaxed mb-6">
                    {sec.data?.description}
                  </p>
                  {sec.data?.cta && (
                    <button className="bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-bold px-6 py-3 rounded-xl hover:from-gold-400 hover:to-gold-300 transition-all text-xs uppercase tracking-wider">
                      {sec.data.cta}
                    </button>
                  )}
                </div>
                {sec.data?.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border-2 border-navy-800 shadow-2xl max-h-80">
                    <img src={sec.data.imageUrl} alt={sec.data.title || "Imagen"} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="pub-root"
      className="bg-white text-slate-700 overflow-y-auto h-full"
      style={{ fontFamily: "var(--font-sans)", scrollBehavior: "smooth" }}
    >
      <PublicHeader
        scrolled={scrolled}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* If sections exist in state, render them dynamically in their exact order */}
      {visibleSections.length > 0 ? (
        visibleSections.map((sec) => renderSectionComponent(sec))
      ) : (
        <>
          <HeroSection />
          <AboutSection />
          <TimelineSection hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />
          <NewsSection onOpenArchive={() => setShowNewsArchive(true)} />
          <ProjectsSection onOpenArchive={() => setShowProjectsArchive(true)} />
          <EventSection
            regForm={regForm}
            setRegForm={setRegForm}
            regStatus={regStatus}
            regTouched={regTouched}
            touch={touch}
            regInvalid={regInvalid}
            submitReg={submitReg}
          />
          <DocumentsSection />
          <ContactSection
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactStatus={contactStatus}
            submitContact={submitContact}
          />
        </>
      )}

      <FooterSection onOpenLogin={() => setShowLoginModal(true)} />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => {
            setShowLoginModal(false);
            if (onLoginSuccess) onLoginSuccess();
          }}
        />
      )}

      {showNewsArchive && (
        <NewsArchiveModal onClose={() => setShowNewsArchive(false)} />
      )}

      {showProjectsArchive && (
        <ProjectsArchiveModal onClose={() => setShowProjectsArchive(false)} />
      )}
    </div>
  );
}
