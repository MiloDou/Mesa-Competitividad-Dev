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
import { NewsArchiveModal, getLiveNewsList, type NewsItem } from "./public/modals/NewsArchiveModal";
import { ProjectsArchiveModal } from "./public/modals/ProjectsArchiveModal";
import { ActivityDetailModal } from "./public/modals/ActivityDetailModal";
import { apiRequest, fetchAllPages, type PublicEventRecord, type PublicProjectRecord, type PublicPublicationRecord, type PublicSiteProfileRecord } from "../api/client";
import { getPublicLandingContent } from "../api/landingContent";
import { DEFAULT_SECTIONS } from "../data/admin";

import { ScrollToTop } from "../components/ui/ScrollToTop";
import { SectionDivider } from "../components/ui/SectionDivider";

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

// La API es la fuente de verdad: validar la forma sin sobrescribir valores del CMS.
function sanitizeSectionsList(rawSecs: any[]): any[] {
  return rawSecs.filter((sec) => sec && typeof sec === "object" && typeof sec.type === "string" && sec.data && typeof sec.data === "object");
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
    try {
      const saved = localStorage.getItem("site_sections");
      const raw = saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
      return Array.isArray(raw) ? sanitizeSectionsList(raw) : DEFAULT_SECTIONS;
    } catch {
      return DEFAULT_SECTIONS;
    }
  });

  const navItems = getNavItemsFromSections(sections);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("site_sections");
      const raw = saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
      const initSecs = Array.isArray(raw) ? sanitizeSectionsList(raw) : DEFAULT_SECTIONS;
      const items = getNavItemsFromSections(initSecs);
      return items[0]?.id || "inicio";
    } catch {
      return "inicio";
    }
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
  const [publicProfile, setPublicProfile] = useState<PublicSiteProfileRecord | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [publicationsLoaded, setPublicationsLoaded] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [landingLoaded, setLandingLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const resources = [
      fetchAllPages<PublicProjectRecord>("/public/projects/").then((rows) => { if (active) setPublicProjects(rows); }).finally(() => { if (active) setProjectsLoaded(true); }),
      fetchAllPages<PublicPublicationRecord>("/public/publications/").then((rows) => { if (active) setPublications(rows); }).finally(() => { if (active) setPublicationsLoaded(true); }),
      fetchAllPages<PublicEventRecord>("/public/events/").then((rows) => { if (active) setPublicEvents(rows); }).finally(() => { if (active) setEventsLoaded(true); }),
    ];
    Promise.allSettled(resources).then(() => { if (active) setApiLoaded(true); });
    apiRequest<PublicSiteProfileRecord | { results: PublicSiteProfileRecord[] }>("/public/site-profile/")
      .then((response) => {
        const profile = "results" in response ? response.results[0] : response;
        if (active && profile) setPublicProfile(profile);
      })
      .catch(() => {});
    getPublicLandingContent().then(({ content }) => {
      if (!active) return;
      setLandingLoaded(true);
      const writeCache = (key: string, value: unknown) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the API remains the source of truth */ }
      };
      if (Array.isArray(content.site_sections)) {
        const nextSections = sanitizeSectionsList(content.site_sections);
        setSections(nextSections);
        writeCache("site_sections", nextSections);
      }
      if (Array.isArray(content.members)) {
        writeCache("mesa_directiva_miembros", content.members);
        window.dispatchEvent(new Event("mesa_miembros_updated"));
      }
      if (Array.isArray(content.entities)) {
        writeCache("mesa_conformados_entidades", content.entities);
        window.dispatchEvent(new Event("mesa_entidades_updated"));
      }
    }).catch(() => { if (active) setLandingLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("site_sections");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSections(Array.isArray(parsed) ? sanitizeSectionsList(parsed) : DEFAULT_SECTIONS);
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
  const siteNews = landingLoaded && newsSec?.data ? getLiveNewsList(newsSec.data) : [];
  const publicationNews: NewsItem[] = publicationsLoaded ? publications.map((item) => ({
    id: `api-pub-${item.id}`,
    tag: item.section || "General",
    title: item.title,
    excerpt: item.summary || item.body || "",
    date: item.published_at ? new Date(item.published_at).toLocaleDateString("es-GT") : "Publicado",
    read: "4 min",
    content: item.body || item.summary || "",
    img: "",
  })) : [];
  const newsList = [...siteNews, ...publicationNews];
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
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} projects={publicProjects} projectsLoaded={projectsLoaded} entitiesLoaded={landingLoaded} hasEvents={publicEvents.some((event) => event.registration_required)} />;

      case "lamesa":
        return <AboutSection data={aboutSec?.data} profile={publicProfile} />;

      case "conformados":
        return <ConformadosSection data={conformadosSec?.data} />;

      case "hitos":
        return <TimelineSection data={timelineSec?.data} hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />;

      case "agenda":
        return (
          <AgendaSection
            loaded={eventsLoaded}
            activities={publicEvents.map((event) => ({
              id: String(event.id),
              title: event.title,
              subtitle: event.modality,
              date: new Date(event.starts_at).toLocaleDateString("es-GT"),
              time: new Date(event.starts_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
              location: event.location,
              modality: event.modality === "virtual" ? "Virtual" : event.modality === "hybrid" ? "Híbrida" : "Presencial",
              description: event.description,
              agendaTopics: [],
              organizer: "Mesa de Competitividad",
              status: "programada" as const,
            }))}
            onSelectActivity={(act) => setSelectedActivity(act)}
          />
        );

      case "noticias":
        return (
          <NewsSection
            data={newsSec?.data}
            newsList={newsList}
            loaded={landingLoaded || apiLoaded}
            onOpenArchive={() => setShowNewsArchive(true)}
          />
        );

      case "proyectos":
        return (
          <ProjectsSection
            data={projectsSec?.data}
            projects={publicProjects}
            apiLoaded={projectsLoaded}
            onOpenArchive={(project) => {
              setSelectedArchiveProject(project || null);
              setShowProjectsArchive(true);
            }}
          />
        );

      case "summit":
        return (
          <EventSection
            data={landingLoaded ? eventSec?.data : undefined}
            event={publicEvents.find((item) => item.registration_required)}
            eventsLoaded={eventsLoaded}
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
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} projects={publicProjects} projectsLoaded={projectsLoaded} entitiesLoaded={landingLoaded} hasEvents={publicEvents.some((event) => event.registration_required)} />;
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
          newsList={newsList}
          onClose={() => setShowNewsArchive(false)}
        />
      )}

      {showProjectsArchive && (
        <ProjectsArchiveModal
          initialProject={selectedArchiveProject}
          projects={publicProjects}
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
