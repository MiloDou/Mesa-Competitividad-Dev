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
import CustomSection from "./public/sections/CustomSection";
import FooterSection from "./public/sections/FooterSection";
import { AgendaSection } from "./public/sections/AgendaSection";
import { LoginModal } from "./public/modals/LoginModal";
import { NewsArchiveModal } from "./public/modals/NewsArchiveModal";
import { ProjectsArchiveModal } from "./public/modals/ProjectsArchiveModal";
import { ActivityDetailModal } from "./public/modals/ActivityDetailModal";
import { DEFAULT_SECTIONS } from "../data/admin";

import { ScrollToTop } from "../components/ui/ScrollToTop";

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

export default function PublicSite({ onLoginSuccess }: PublicSiteProps) {
  const getNavItemsFromSections = (secs: any[]) => {
    const visibleSecs = secs.filter((s) => s.visible !== false);

    const TYPE_TO_NAV: Record<string, { label: string; id: string }> = {
      hero: { label: "Inicio", id: "inicio" },
      about: { label: "La Mesa", id: "lamesa" },
      timeline: { label: "Hitos", id: "hitos" },
      news: { label: "Noticias", id: "noticias" },
      event: { label: "Summit 2026", id: "summit" },
      projects: { label: "Proyectos", id: "proyectos" },
      documents: { label: "Transparencia", id: "transparencia" },
      contact: { label: "Contacto", id: "contacto" },
    };

    const items: { label: string; id: string }[] = [];
    const usedIds = new Set<string>();

    for (const sec of visibleSecs) {
      if (sec.type === "custom") {
        const id = sec.id;
        const label = sec.customName || sec.data?.title || "Apartado";
        items.push({ label, id });
      } else if (TYPE_TO_NAV[sec.type]) {
        const nav = TYPE_TO_NAV[sec.type];
        if (!usedIds.has(nav.id)) {
          usedIds.add(nav.id);
          items.push(nav);
        }
      }
    }

    return items.length > 0 ? items : NAV_ITEMS;
  };

  // Carga de secciones dinámicas guardadas si existen en el editor de administración
  const [sections, setSections] = useState<any[]>(() => {
    const saved = localStorage.getItem("site_sections");
    return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
  });

  const navItems = getNavItemsFromSections(sections);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem("site_sections");
    const initSecs = saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    const items = getNavItemsFromSections(initSecs);
    return items[0]?.id || "inicio";
  });
  useScrollReveal(activeTab);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewsArchive, setShowNewsArchive] = useState(false);
  const [showProjectsArchive, setShowProjectsArchive] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<AgendaActivity | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("site_sections");
      if (saved) {
        try {
          setSections(JSON.parse(saved));
        } catch (e) {
          setSections(DEFAULT_SECTIONS);
        }
      } else {
        setSections(DEFAULT_SECTIONS);
      }
    };
    window.addEventListener("site_sections_updated", handleUpdate);
    return () => window.removeEventListener("site_sections_updated", handleUpdate);
  }, []);

  const heroSec = sections.find((s) => s.type === "hero");
  const aboutSec = sections.find((s) => s.type === "about");
  const timelineSec = sections.find((s) => s.type === "timeline");
  const newsSec = sections.find((s) => s.type === "news");
  const eventSec = sections.find((s) => s.type === "event");
  const projectsSec = sections.find((s) => s.type === "projects");
  const docsSec = sections.find((s) => s.type === "documents");
  const contactSec = sections.find((s) => s.type === "contact");
  const customSecs = sections.filter((s) => s.type === "custom");

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

  // Renderizado modular de un solo módulo por pestaña
  const renderTabContent = () => {
    switch (activeTab) {
      case "inicio":
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} />;

      case "lamesa":
        return <AboutSection data={aboutSec?.data} />;

      case "hitos":
        return <TimelineSection data={timelineSec?.data} hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />;

      case "agenda":
        return <AgendaSection onSelectActivity={(act) => setSelectedActivity(act)} />;

      case "noticias":
        return <NewsSection data={newsSec?.data} onOpenArchive={() => setShowNewsArchive(true)} />;

      case "proyectos":
        return <ProjectsSection data={projectsSec?.data} onOpenArchive={() => setShowProjectsArchive(true)} />;

      case "summit":
        return (
          <EventSection
            data={eventSec?.data}
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
        return <DocumentsSection data={docsSec?.data} />;

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

      default: {
        const foundCustom = customSecs.find((s) => s.id === activeTab);
        if (foundCustom) {
          return <CustomSection section={foundCustom} />;
        }
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} />;
      }
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
        navItems={navItems}
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
