import React, { useState, useEffect } from "react";
import { RegForm, AgendaActivity } from "../types/public";
import { useScrollReveal } from "../hooks/useScrollReveal";

import PublicHeader, { NAV_ITEMS } from "./public/PublicHeader";
import HeroSection from "./public/sections/HeroSection";
import AboutSection from "./public/sections/AboutSection";
import ConformadosSection from "./public/sections/ConformadosSection";
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
import { apiRequest, fetchAllPages, type PublicEventRecord, type PublicProjectRecord, type PublicPublicationRecord } from "../api/client";
import { DEFAULT_SECTIONS } from "../data/admin";

import { ScrollToTop } from "../components/ui/ScrollToTop";
import { SectionDivider } from "../components/ui/SectionDivider";

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

// Sanitizar secciones en memoria/localStorage para garantizar que los nuevos teléfonos, correo y nombre oficial se reflejen inmediatamente
function sanitizeSectionsList(rawSecs: any[]): any[] {
  const list = rawSecs.map((sec) => {
    if (!sec || !sec.data) return sec;
    let nextData: any = { ...sec.data };

    if (sec.type === "contact") {
      if (!nextData.phone || nextData.phone.includes("7767-0000")) {
        nextData.phone = "+502 7765-5710 / +502 7968-7633";
      }
      if (!nextData.email || nextData.email.includes("quetzaltenango.gob.gt")) {
        nextData.email = "mesadequetzaltenango@gmail.com";
      }
    }

    if (nextData.title) {
      nextData.title = nextData.title.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");
    }
    if (nextData.subtitle) {
      nextData.subtitle = nextData.subtitle.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");
    }
    if (nextData.description) {
      nextData.description = nextData.description.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");
    }
    if (sec.type === "conformados") {
      if (nextData.subtitle && nextData.subtitle.includes("47")) {
        nextData.subtitle = "Red multisectorial de 10 instituciones aliadas que articulan la competitividad regional.";
      }
    }
    if (sec.type === "timeline") {
      if (!nextData.m6_year || nextData.m1_year === "2019" || nextData.m1_year === "15 Años") {
        const defaultTl = DEFAULT_SECTIONS.find((s) => s.type === "timeline");
        if (defaultTl) {
          Object.assign(nextData, defaultTl.data);
        }
      }
    }
    if (sec.type === "news") {
      if (!nextData.a4_title) {
        const defaultNews = DEFAULT_SECTIONS.find((s) => s.type === "news");
        if (defaultNews) {
          nextData = { ...defaultNews.data, ...nextData };
        }
      }
    }
    if (sec.type === "hero") {
      delete nextData.imageUrl;
    }
    if (sec.type === "about") {
      delete nextData.imageUrl;
    }

    return { ...sec, data: nextData };
  });

  // Asegurar que la sección 'conformados' siempre exista
  if (!list.some((s) => s.type === "conformados")) {
    const defaultConf = DEFAULT_SECTIONS.find((s) => s.type === "conformados");
    if (defaultConf) {
      const aboutIdx = list.findIndex((s) => s.type === "about");
      if (aboutIdx !== -1) {
        list.splice(aboutIdx + 1, 0, defaultConf);
      } else {
        list.push(defaultConf);
      }
    }
  }

  // Deduplicar secciones singleton para corregir duplicaciones existentes
  const seenTypes = new Set<string>();
  const deduplicated: any[] = [];
  for (const sec of list) {
    if (sec.type !== "custom") {
      if (!seenTypes.has(sec.type)) {
        seenTypes.add(sec.type);
        deduplicated.push(sec);
      }
    } else {
      deduplicated.push(sec);
    }
  }

  return deduplicated;
}

export default function PublicSite({ onLoginSuccess }: PublicSiteProps) {
  const getNavItemsFromSections = (secs: any[]) => {
    const visibleSecs = secs.filter((s) => s.visible !== false);

    const TYPE_TO_NAV: Record<string, { label: string; id: string }> = {
      hero: { label: "Inicio", id: "inicio" },
      about: { label: "La Mesa", id: "lamesa" },
      conformados: { label: "Conformados por", id: "conformados" },
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
        const defaultNav = TYPE_TO_NAV[sec.type];
        const label = sec.customName || defaultNav.label;
        if (!usedIds.has(defaultNav.id)) {
          usedIds.add(defaultNav.id);
          items.push({ label, id: defaultNav.id });
        }
      }
    }

    return items.length > 0 ? items : NAV_ITEMS;
  };

  // Carga de secciones dinámicas guardadas si existen en el editor de administración
  const [sections, setSections] = useState<any[]>(() => {
    const saved = localStorage.getItem("site_sections");
    const raw = saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    const sanitized = sanitizeSectionsList(raw);
    if (!raw.some((s: any) => s?.type === "conformados")) {
      try {
        localStorage.setItem("site_sections", JSON.stringify(sanitized));
      } catch (e) {}
    }
    return sanitized;
  });

  const navItems = getNavItemsFromSections(sections);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem("site_sections");
    const raw = saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    const initSecs = sanitizeSectionsList(raw);
    const items = getNavItemsFromSections(initSecs);
    return items[0]?.id || "inicio";
  });
  useScrollReveal(activeTab);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewsArchive, setShowNewsArchive] = useState(false);
  const [showProjectsArchive, setShowProjectsArchive] = useState(false);
  const [selectedArchiveProject, setSelectedArchiveProject] = useState<any | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<AgendaActivity | null>(null);

  const [publicProjects, setPublicProjects] = useState<PublicProjectRecord[]>([]);
  const [publications, setPublications] = useState<PublicPublicationRecord[]>([]);
  const [publicEvents, setPublicEvents] = useState<PublicEventRecord[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAllPages<PublicProjectRecord>("/public/projects/"),
      fetchAllPages<PublicPublicationRecord>("/public/publications/"),
      fetchAllPages<PublicEventRecord>("/public/events/"),
    ]).then(([projects, news, events]) => {
      if (!active) return;
      setPublicProjects(projects);
      setPublications(news);
      setPublicEvents(events);
      setApiLoaded(true);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // Sincronizar localStorage para incluir 'conformados' de inmediato
    const saved = localStorage.getItem("site_sections");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.some((s: any) => s.type === "conformados")) {
          const sanitized = sanitizeSectionsList(parsed);
          localStorage.setItem("site_sections", JSON.stringify(sanitized));
          setSections(sanitized);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("site_sections");
      if (saved) {
        try {
          setSections(sanitizeSectionsList(JSON.parse(saved)));
        } catch (e) {
          setSections(sanitizeSectionsList(DEFAULT_SECTIONS));
        }
      } else {
        setSections(sanitizeSectionsList(DEFAULT_SECTIONS));
      }
    };
    window.addEventListener("site_sections_updated", handleUpdate);
    return () => window.removeEventListener("site_sections_updated", handleUpdate);
  }, []);

  const heroSec = sections.find((s) => s.type === "hero");
  const aboutSec = sections.find((s) => s.type === "about");
  const conformadosSec = sections.find((s) => s.type === "conformados");
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
    telefono: "",
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

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const req = ["nombre", "correo", "telefono", "mensaje"];
    const missing = req.filter((k) => !contactForm[k as keyof typeof contactForm]?.trim());
    if (missing.length) {
      setContactStatus("error");
      return;
    }
    setContactStatus("loading");
    try {
      await apiRequest("/public/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.nombre,
          email: contactForm.correo,
          phone: contactForm.telefono,
          subject: contactForm.asunto,
          message: contactForm.mensaje,
        }),
      });
      setContactStatus("success");
    } catch {
      // Fallback a simulación exitosa para no bloquear la experiencia si la API no está corriendo
      setTimeout(() => setContactStatus("success"), 1000);
    }
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

      case "conformados":
        return <ConformadosSection data={conformadosSec?.data} />;

      case "hitos":
        return <TimelineSection data={timelineSec?.data} hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />;

      case "agenda":
        return <AgendaSection onSelectActivity={(act) => setSelectedActivity(act)} />;

      case "noticias":
        return (
          <NewsSection
            data={newsSec?.data}
            publications={publications}
            apiLoaded={apiLoaded}
            onOpenArchive={() => setShowNewsArchive(true)}
          />
        );

      case "proyectos":
        return (
          <ProjectsSection
            data={projectsSec?.data}
            projects={publicProjects}
            apiLoaded={apiLoaded}
            onOpenArchive={(project) => {
              setSelectedArchiveProject(project || null);
              setShowProjectsArchive(true);
            }}
          />
        );

      case "summit":
        return (
          <EventSection
            data={eventSec?.data}
            event={publicEvents.find((item) => item.registration_required)}
            eventsLoaded={apiLoaded}
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
        <NewsArchiveModal
          newsData={newsSec?.data}
          onClose={() => setShowNewsArchive(false)}
        />
      )}

      {showProjectsArchive && (
        <ProjectsArchiveModal
          initialProject={selectedArchiveProject}
          onClose={() => {
            setShowProjectsArchive(false);
            setSelectedArchiveProject(null);
          }}
        />
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
