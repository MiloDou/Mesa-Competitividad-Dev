import React, { useEffect, useState } from "react";
import { apiRequest, type Page } from "../../../api/client";

interface SiteProfile {
  id: number;
  name: string;
  summary: string;
  mission: string;
  vision: string;
}

interface Publication {
  id: number;
  title: string;
  slug: string;
  summary: string;
  body: string;
  section: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
}

type Collection<T> = Page<T> | T[];
const rows = <T,>(value: Collection<T>): T[] => Array.isArray(value) ? value : value.results;
const slugFor = (title: string) => title.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CmsApiPanel({ canAdmin }: { canAdmin: boolean }) {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: "", slug: "", summary: "", body: "", section: "news" });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [profileData, publicationData] = await Promise.all([
        apiRequest<Collection<SiteProfile>>("/site-profile/"),
        apiRequest<Collection<Publication>>("/publications/"),
      ]);
      setProfile(rows(profileData)[0] ?? null);
      setPublications(rows(publicationData));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el contenido del sitio.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await apiRequest<SiteProfile>(`/site-profile/${profile.id}/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: profile.summary, mission: profile.mission, vision: profile.vision }),
      });
      setProfile(updated);
      setNotice("Perfil institucional guardado correctamente.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el perfil institucional.");
    } finally {
      setSaving(false);
    }
  }

  async function savePublication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = { ...draft, slug: draft.slug || slugFor(draft.title) };
    try {
      await apiRequest<Publication>(editingId ? `/publications/${editingId}/` : "/publications/", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setDraft({ title: "", slug: "", summary: "", body: "", section: "news" });
      setEditingId(null);
      setNotice("Borrador guardado correctamente.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el contenido.");
    } finally {
      setSaving(false);
    }
  }

  async function publish(item: Publication) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest<Publication>(`/publications/${item.id}/publish/`, { method: "POST" });
      setNotice("Publicación realizada correctamente.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar el contenido.");
    } finally {
      setSaving(false);
    }
  }

  function edit(item: Publication) {
    setDraft({ title: item.title, slug: item.slug, summary: item.summary, body: item.body, section: item.section });
    setEditingId(item.id);
    setNotice("");
  }

  return (
    <section className="mb-8 rounded-2xl border border-navy-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gold-700">CONTENIDO DEL SITIO</p>
          <h3 className="text-lg font-semibold text-navy-900 mt-1">Perfil institucional y publicaciones</h3>
          <p className="text-xs text-slate-500 mt-1">Edita aquí la información institucional y las publicaciones del sitio.</p>
        </div>
        <button onClick={() => void reload()} disabled={loading || saving} className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">Actualizar</button>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando información institucional…</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">{notice}</p>}

      {!loading && profile && (
        <form onSubmit={saveProfile} className="grid md:grid-cols-2 gap-3 mb-6 border-b border-slate-100 pb-6">
          <div className="md:col-span-2"><h4 className="font-semibold text-sm text-navy-900">{profile.name}</h4><p className="text-xs text-slate-500">Perfil institucional</p></div>
          {(["summary", "mission", "vision"] as const).map((field) => (
            <label key={field} className={`text-xs font-semibold text-slate-600 ${field === "summary" ? "md:col-span-2" : ""}`}>
              {{ summary: "Resumen", mission: "Misión", vision: "Visión" }[field]}
              <textarea className="input mt-1 min-h-20 text-sm font-normal" maxLength={field === "summary" ? 500 : 5000} value={profile[field]} onChange={(event) => setProfile({ ...profile, [field]: event.target.value })} />
            </label>
          ))}
          <div className="md:col-span-2"><button disabled={saving} className="bg-navy-900 text-white rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50">Guardar perfil institucional</button></div>
        </form>
      )}

      {!loading && !profile && !error && <p className="mb-5 text-sm text-slate-500">No hay un perfil institucional disponible para editar.</p>}

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6">
        <form onSubmit={savePublication} className="space-y-3">
          <h4 className="font-semibold text-sm text-navy-900">{editingId ? "Editar borrador" : "Crear borrador de publicación"}</h4>
          <input className="input text-sm" placeholder="Título" required maxLength={220} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value, slug: editingId ? draft.slug : slugFor(event.target.value) })} />
          <input className="input text-sm" placeholder="URL (slug)" required maxLength={240} value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugFor(event.target.value) })} />
          <input className="input text-sm" placeholder="Resumen" maxLength={500} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
          <textarea className="input min-h-28 text-sm" placeholder="Contenido en texto plano" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
          <div className="flex flex-wrap gap-2">
            <button disabled={saving} className="bg-navy-900 text-white rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50">{saving ? "Guardando…" : "Guardar borrador"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setDraft({ title: "", slug: "", summary: "", body: "", section: "news" }); }} className="border border-slate-200 rounded-lg px-4 py-2 text-xs">Cancelar edición</button>}
          </div>
          <p className="text-[11px] text-slate-500">Publicar hace visible el contenido en el sitio público y requiere permiso de Comisión.</p>
        </form>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-navy-900">Publicaciones</h4>
          {!loading && publications.length === 0 && <p className="text-sm text-slate-500">No hay publicaciones guardadas.</p>}
          {publications.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0"><p className="font-semibold text-sm text-navy-900 truncate">{item.title}</p><p className="text-xs text-slate-500">{item.slug} · {item.status === "published" ? "Publicado" : item.status === "archived" ? "Archivado" : "Borrador"}</p></div>
              <div className="flex gap-2">
                {item.status !== "published" && item.status !== "archived" && <button onClick={() => edit(item)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs">Editar</button>}
                {canAdmin && item.status === "draft" && <button disabled={saving} onClick={() => void publish(item)} className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs disabled:opacity-50">Publicar</button>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
