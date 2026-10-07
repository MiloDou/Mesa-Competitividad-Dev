import React, { useState, useEffect } from "react";
import { RegForm, AgendaActivity } from "../types/public";
import { useScrollReveal } from "../hooks/useScrollReveal";

import PublicHeader, { NAV_ITEMS } from "./public/PublicHeader";
import HeroSection from "./public/sections/HeroSection";
import AboutSection from "./public/sections/AboutSection";
import TimelineSection from "./public/sections/TimelineSection";
import NewsSection from "./public/sections/NewsSection";
import ProjectsSection from "./public/sections/ProjectsSection";
import EventSection from "./public/sections/EventSection";
import DocumentsSection from "./public/sections/DocumentsSection";
import ContactSection from "./public/sections/ContactSection";
import FooterSection from "./public/sections/FooterSection";
import { AgendaSection } from "./public/sections/AgendaSection";
import { LoginModal } from "./public/modals/LoginModal";
import { NewsArchiveModal } from "./public/modals/NewsArchiveModal";
import { ProjectsArchiveModal } from "./public/modals/ProjectsArchiveModal";
import { ActivityDetailModal } from "./public/modals/ActivityDetailModal";

import { ScrollToTop } from "../components/ui/ScrollToTop";

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

export default function PublicSite({ onLoginSuccess }: PublicSiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("inicio");
  useScrollReveal(activeTab);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewsArchive, setShowNewsArchive] = useState(false);
  const [showProjectsArchive, setShowProjectsArchive] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<AgendaActivity | null>(null);

  // Carga de secciones dinámicas guardadas si existen en el editor de administración
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

  const heroSec = sections.find((s) => s.type === "hero");
  const aboutSec = sections.find((s) => s.type === "about");
  const contactSec = sections.find((s) => s.type === "contact");
  const eventSec = sections.find((s) => s.type === "event");

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
    setRegTouched((s) => new Set([...s, k]));
  }

  function regInvalid(k: keyof RegForm) {
    return regTouched.has(k) && !regForm[k];
  }

  function submitReg(e: React.FormEvent) {
    e.preventDefault();
    const req: (keyof RegForm)[] = ["nombre", "apellidos", "correo", "organizacion", "sector", "modalidad"];
    const missing = req.filter((k) => !regForm[k]);
    setRegTouched(new Set([...missing]));
    if (missing.length) {
      setRegStatus("error");
      return;
    }
    setRegStatus("loading");
    setTimeout(() => setRegStatus("success"), 1800);
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const req = ["nombre", "correo", "asunto", "mensaje"];
    const missing = req.filter((k) => !contactForm[k as keyof typeof contactForm]?.trim());
    if (missing.length) {
      setContactStatus("error");
      return;
    }
    setContactStatus("loading");
    setTimeout(() => setContactStatus("success"), 1500);
  }

  const goToTab = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById("pub-root");
    if (el) el.scrollTop = 0;
  };

  // Renderizado modular compacto por pestaña
  const renderTabContent = () => {
    switch (activeTab) {
      case "inicio":
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} />;

      case "lamesa":
        return <AboutSection data={aboutSec?.data} />;

      case "hitos":
        return <TimelineSection hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />;

      case "agenda":
        return <AgendaSection onSelectActivity={(act) => setSelectedActivity(act)} />;

      case "noticias":
        return <NewsSection onOpenArchive={() => setShowNewsArchive(true)} />;

      case "proyectos":
        return <ProjectsSection onOpenArchive={() => setShowProjectsArchive(true)} />;

      case "summit":
        return (
          <EventSection
            regForm={regForm}
            setRegForm={setRegForm}
            regStatus={regStatus}
            regTouched={regTouched}
            touch={touch}
            regInvalid={regInvalid}
            submitReg={submitReg}
          />
        );

      case "transparencia":
        return <DocumentsSection />;

      case "contacto":
        return (
          <ContactSection
            data={contactSec?.data}
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactStatus={contactStatus}
            submitContact={submitContact}
          />
        );

      default:
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} />;
    }
  };

  return (
    <div
      id="pub-root"
      className="bg-white text-slate-700 overflow-y-auto h-full flex flex-col min-h-screen"
      style={{ fontFamily: "var(--font-sans)", scrollBehavior: "smooth" }}
    >
      <PublicHeader
        scrolled={scrolled}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main id="main-content" tabIndex={-1} className="focus:outline-none flex-1 animate-fadeup">
        {renderTabContent()}
      </main>

      <FooterSection onOpenLogin={() => setShowLoginModal(true)} onNavigateTab={goToTab} />
      <ScrollToTop />

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

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}
