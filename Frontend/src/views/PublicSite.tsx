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
import { apiRequest, fetchAllPages, type PublicEventRecord, type PublicProjectRecord, type PublicPublicationRecord } from "../api/client";
import { DEFAULT_SECTIONS } from "../data/admin";

import { ScrollToTop } from "../components/ui/ScrollToTop";
import { SectionDivider } from "../components/ui/SectionDivider";

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

export default function PublicSite({ onLoginSuccess }: PublicSiteProps) {
  const getNavItemsFromSections = (secs: any[]) => {
    const visibleSecs = secs.filter((section) => section.visible !== false);
    const typeToNav: Record<string, { label: string; id: string }> = {
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

    for (const section of visibleSecs) {
      if (section.type === "custom") {
        items.push({
          label: section.customName || section.data?.title || "Apartado",
          id: section.id,
        });
      } else if (typeToNav[section.type]) {
        const navItem = typeToNav[section.type];
        if (!usedIds.has(navItem.id)) {
          usedIds.add(navItem.id);
          items.push(navItem);
        }
      }
    }

    return items.length > 0 ? items : NAV_ITEMS;
  };

  useScrollReveal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewsArchive, setShowNewsArchive] = useState(false);
  const [showProjectsArchive, setShowProjectsArchive] = useState(false);
  const [publicProjects, setPublicProjects] = useState<PublicProjectRecord[]>([]);
  const [publications, setPublications] = useState<PublicPublicationRecord[]>([]);
  const [publicEvents, setPublicEvents] = useState<PublicEventRecord[]>([]);
  const [apiUnavailable, setApiUnavailable] = useState(false);
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
      setApiUnavailable(false);
      setApiLoaded(true);
    }).catch(() => { if (active) setApiUnavailable(true); });
    return () => { active = false; };
  }, []);

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
    telefono: "",
    asunto: "",
    mensaje: "",
  });

  const goToTab = (id: string) => {
    setActiveTab(id);
    document.getElementById("pub-root")?.scrollTo({ top: 0 });
  };
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

  async function submitReg(e: React.FormEvent) {
    e.preventDefault();
    const req: (keyof RegForm)[] = ["nombre", "apellidos", "correo", "organizacion", "sector", "modalidad"];
    const missing = req.filter((k) => !regForm[k]);
    setRegTouched(new Set([...missing]));
    if (missing.length) {
      setRegStatus("error");
      return;
    }
    const event = publicEvents.find(item => item.registration_required);
    if (!event) { setRegStatus("error"); return; }
    setRegStatus("loading");
    try {
      await apiRequest(`/public/events/${encodeURIComponent(event.slug)}/register/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${regForm.nombre} ${regForm.apellidos}`.trim(), email: regForm.correo, institution: regForm.organizacion }) });
      setRegStatus("success");
    } catch { setRegStatus("error"); }
  }

  const [contactTouched, setContactTouched] = useState<Set<string>>(new Set());

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const req = ["nombre", "correo", "telefono", "mensaje"];
    const missing = req.filter(k => !contactForm[k as keyof typeof contactForm]?.trim());
    setContactTouched(new Set([...missing]));
    if (missing.length) {
      setContactStatus("error");
      return;
    }
    setContactStatus("loading");
    try {
      await apiRequest("/public/contact/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: contactForm.nombre, email: contactForm.correo, phone: contactForm.telefono, subject: contactForm.asunto, message: contactForm.mensaje }) });
      setContactStatus("success");
    } catch { setContactStatus("error"); }
  }

  // Filter sections that are set to visible
  const visibleSections = sections.filter((s) => s.visible);

  const renderSectionComponent = (sec: any) => {
    switch (sec.type) {
      case "hero":
        return <HeroSection key={sec.id} data={sec.data} onNavigateTab={goToTab} />;
      case "about":
        return <AboutSection key={sec.id} data={sec.data} />;
      case "timeline":
        return <TimelineSection key={sec.id} data={sec.data} hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />;
      case "news":
        return <NewsSection key={sec.id} data={sec.data} onOpenArchive={() => setShowNewsArchive(true)} publications={publications} apiLoaded={apiLoaded} />;
      case "projects":
        return <ProjectsSection key={sec.id} data={sec.data} onOpenArchive={() => setShowProjectsArchive(true)} projects={publicProjects} apiLoaded={apiLoaded} />;
      case "event":
        return (
          <EventSection
            data={eventSec?.data}
            regForm={regForm}
            event={publicEvents.find(item => item.registration_required)}
            eventsLoaded={apiLoaded}
            setRegForm={setRegForm}
            regStatus={regStatus}
            regTouched={regTouched}
            touch={touch}
            regInvalid={regInvalid}
            submitReg={submitReg}
          />
        );

      case "documents":
        return <DocumentsSection data={sec.data} />;

      case "contact":
        return (
          <ContactSection
            data={sec.data}
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactStatus={contactStatus}
            submitContact={submitContact}
          />
        );

      default: {
        if (sec.type === "custom") {
          return <CustomSection section={sec} />;
        }
        return null;
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

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {apiUnavailable && (
          <div role="status" className="bg-amber-50 border-y border-amber-200 px-5 py-3 text-center text-sm text-amber-900">
            No se pudo conectar con la API; se muestra el contenido de demostración. Revisa que el backend esté activo.
          </div>
        )}
        <p className="border-b border-amber-100 bg-amber-50/70 px-4 py-2 text-center text-xs text-amber-900">
          El contenido institucional complementario aún incluye datos de demostración.
        </p>
        {/* If sections exist in state, render them dynamically in their exact order */}
        {visibleSections.length > 0 ? (
          visibleSections.map((sec, idx) => (
            <React.Fragment key={sec.id}>
              {idx > 0 && <SectionDivider />}
              {renderSectionComponent(sec)}
            </React.Fragment>
          ))
        ) : (
          <>
            <HeroSection />
            <SectionDivider />
            <AboutSection />
            <SectionDivider />
            <TimelineSection hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />
            <SectionDivider />
            <NewsSection onOpenArchive={() => setShowNewsArchive(true)} publications={publications} apiLoaded={apiLoaded} />
            <SectionDivider />
            <ProjectsSection onOpenArchive={() => setShowProjectsArchive(true)} projects={publicProjects} apiLoaded={apiLoaded} />
            <SectionDivider />
            <EventSection
              regForm={regForm}
              event={publicEvents.find(item => item.registration_required)}
              eventsLoaded={apiLoaded}
              setRegForm={setRegForm}
              regStatus={regStatus}
              regTouched={regTouched}
              touch={touch}
              regInvalid={regInvalid}
              submitReg={submitReg}
            />
            <SectionDivider />
            <DocumentsSection />
            <SectionDivider />
            <ContactSection
              contactForm={contactForm}
              setContactForm={setContactForm}
              contactStatus={contactStatus}
              submitContact={submitContact}
            />
          </>
        )}
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
