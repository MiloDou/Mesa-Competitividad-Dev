import React, { useState, useEffect } from "react";
import { AgendaActivity } from "../types/public";
import { useScrollReveal } from "../hooks/useScrollReveal";

import PublicHeader from "./public/PublicHeader";
import HeroSection from "./public/sections/HeroSection";
import AboutSection from "./public/sections/AboutSection";
import ConformadosSection from "./public/sections/ConformadosSection";
import TimelineSection from "./public/sections/TimelineSection";
import NewsSection from "./public/sections/NewsSection";
import ProjectsSection from "./public/sections/ProjectsSection";
import DocumentsSection from "./public/sections/DocumentsSection";
import ContactSection from "./public/sections/ContactSection";
import CustomSection from "./public/sections/CustomSection";
import FooterSection from "./public/sections/FooterSection";
import { AgendaSection } from "./public/sections/AgendaSection";
import { LoginModal } from "./public/modals/LoginModal";
import { NewsArchiveModal, type NewsItem } from "./public/modals/NewsArchiveModal";
import { ProjectsArchiveModal } from "./public/modals/ProjectsArchiveModal";
import { ActivityDetailModal } from "./public/modals/ActivityDetailModal";
import { apiRequest, fetchAllPages, type PublicEventRecord, type PublicProjectRecord, type PublicPublicationRecord, type PublicSiteProfileRecord } from "../api/client";
import { getPublicLandingContent } from "../api/landingContent";

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

    return items;
  };

  const [sections, setSections] = useState<any[]>([]);

  const navItems = getNavItemsFromSections(sections).filter((item) => item.id !== "summit");

  const [activeTab, setActiveTab] = useState<string>(() => {
    return "inicio";
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
      if (Array.isArray(content.site_sections)) {
        const nextSections = sanitizeSectionsList(content.site_sections);
        setSections(nextSections);
      }
      if (Array.isArray(content.members)) {
        try { localStorage.setItem("mesa_directiva_miembros", JSON.stringify(content.members)); } catch {}
        window.dispatchEvent(new Event("mesa_miembros_updated"));
      }
    }).catch(() => { if (active) setLandingLoaded(true); });
    fetchAllPages<{ id: number; name: string; category: string; photo: string; status: string; initials: string }>("/public/institutions/")
      .then((rows) => {
        if (!active) return;
        try { localStorage.setItem("mesa_conformados_entidades", JSON.stringify(rows.map((row) => ({ ...row, id: String(row.id) })))); } catch {}
        window.dispatchEvent(new Event("mesa_entidades_updated"));
      }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUpdate = () => { void getPublicLandingContent().then(({ content }) => { if (Array.isArray(content.site_sections)) setSections(sanitizeSectionsList(content.site_sections)); }).catch(() => {}); };
    window.addEventListener("site_sections_updated", handleUpdate);
    return () => window.removeEventListener("site_sections_updated", handleUpdate);
  }, []);

  const heroSec = sections.find((s) => s.type === "hero");
  const aboutSec = sections.find((s) => s.type === "about");
  const conformadosSec = sections.find((s) => s.type === "conformados");
  const timelineSec = sections.find((s) => s.type === "timeline");
  const newsSec = sections.find((s) => s.type === "news");
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
  const newsList = publicationNews;
  const projectsSec = sections.find((s) => s.type === "projects");
  const docsSec = sections.find((s) => s.type === "documents");
  const contactSec = sections.find((s) => s.type === "contact");
  const customSecs = sections.filter((s) => s.type === "custom");

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
    } catch { setContactStatus("error"); }
  }

  const goToTab = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById("pub-root");
    if (el) el.scrollTop = 0;
  };

  // Renderizado modular de un solo módulo por pestaña
  const renderTabContent = () => {
    if (!landingLoaded) return <div className="p-8 text-center text-slate-600">Cargando información…</div>;
    if (sections.length === 0) return <div className="p-8 text-center text-slate-600">La información institucional aún no está disponible.</div>;
    switch (activeTab) {
      case "inicio":
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} projects={publicProjects} projectsLoaded={projectsLoaded} entitiesLoaded={landingLoaded} hasEvents={false} />;

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
        return <section className="p-8 text-center text-slate-600">La información de eventos está pendiente de confirmación.</section>;

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
        return <HeroSection data={heroSec?.data} onNavigateTab={goToTab} projects={publicProjects} projectsLoaded={projectsLoaded} entitiesLoaded={landingLoaded} hasEvents={false} />;
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
