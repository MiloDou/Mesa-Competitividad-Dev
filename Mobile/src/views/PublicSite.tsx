import React, { useState, useEffect } from "react";
import { RegForm } from "../types/public";

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

interface PublicSiteProps {
  onLoginSuccess?: () => void;
}

export default function PublicSite({ onLoginSuccess }: PublicSiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
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
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success">("idle");

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
    setRegTouched(new Set([...regTouched, ...missing]));
    if (missing.length) {
      setRegStatus("error");
      return;
    }
    setRegStatus("loading");
    setTimeout(() => setRegStatus("success"), 1800);
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    setContactStatus("loading");
    setTimeout(() => setContactStatus("success"), 1500);
  }

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

      <HeroSection />
      <AboutSection />
      <TimelineSection hoveredHito={hoveredHito} setHoveredHito={setHoveredHito} />
      <NewsSection />
      <ProjectsSection />
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
    </div>
  );
}
