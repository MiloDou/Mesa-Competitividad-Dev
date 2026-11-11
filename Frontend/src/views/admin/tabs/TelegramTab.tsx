import React, { useCallback, useEffect, useState } from "react";
import {
  getTelegramIntegrantes, registerTelegramIntegrante, removeTelegramIntegrante, sendTelegramAnnouncement,
  type TelegramIntegrante,
} from "../../../api/admin";
import { PlusIcon, TrashIcon } from "../../../components/icons/AdminIcons";
import { useFeedback } from "../../../components/ui/FeedbackProvider";

const STATUS: Record<TelegramIntegrante["status"], { label: string; className: string }> = {
  pending_consent: { label: "Esperando que acepte", className: "bg-amber-100 text-amber-900" },
  active: { label: "Activo", className: "bg-emerald-100 text-emerald-900" },
  paused: { label: "En pausa", className: "bg-slate-200 text-slate-700" },
  revoked: { label: "Dado de baja", className: "bg-slate-100 text-slate-500" },
  blocked: { label: "Bloqueó el bot", className: "bg-red-100 text-red-800" },
};
const ANNOUNCEMENT_LIMIT = 2000;

function message(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export const TelegramTab: React.FC = () => {
  const { showSuccess, showError, confirm } = useFeedback();
  const [integrantes, setIntegrantes] = useState<TelegramIntegrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setIntegrantes(await getTelegramIntegrantes());
    } catch (cause) {
      setError(message(cause, "No se pudo cargar la lista de integrantes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function run(action: () => Promise<string>, fallback: string) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const msg = await action();
      setNotice(msg);
      showSuccess(msg);
      await refresh();
    } catch (cause) {
      const msg = message(cause, fallback);
      setError(msg);
      showError(msg);
    } finally {
      setBusy(false);
    }
  }

  function register(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      const result = await registerTelegramIntegrante(name.trim(), code.trim());
      setName("");
      setCode("");
      return result.consent_sent
        ? `${result.name} quedó registrado. Falta que pulse «Acepto» en el mensaje que le envió el bot.`
        : `${result.name} quedó registrado, pero el bot no pudo enviarle el mensaje para aceptar. Pídele que escriba /estado al bot.`;
    }, "No se pudo registrar al integrante.");
  }

  async function announce(event: React.FormEvent) {
    event.preventDefault();
    const active = integrantes.filter((item) => item.status === "active").length;
    const ok = await confirm({
      title: "Enviar aviso por Telegram",
      message: `Se enviará este aviso a todos los chats activos (${active} integrantes activos). ¿Deseas continuar?`,
      confirmText: "Enviar aviso",
      cancelText: "Cancelar",
      type: "info",
    });
    if (!ok) return;

    void run(async () => {
      const { recipients } = await sendTelegramAnnouncement(text);
      setText("");
      return `Aviso en camino a ${recipients} ${recipients === 1 ? "chat" : "chats"}. Llega en uno o dos minutos.`;
    }, "No se pudo enviar el aviso.");
  }

  async function remove(item: TelegramIntegrante) {
    const ok = await confirm({
      title: "Dar de baja integrante",
      message: `¿Dar de baja a ${item.name}? Dejará de recibir avisos de inmediato.`,
      confirmText: "Dar de baja",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;

    void run(async () => {
      await removeTelegramIntegrante(item.id);
      return `${item.name} fue dado de baja y ya no recibirá avisos.`;
    }, "No se pudo dar de baja al integrante.");
  }

  return (
    <div className="space-y-5 animate-fadeup">
      <h2 className="font-semibold text-navy-900">Avisos por Telegram</h2>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}

      <div className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={register} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-navy-900">Registrar nuevo integrante de Telegram</h3>
          <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
            <li>La persona escribe <strong>/start</strong> al bot de la Mesa en Telegram.</li>
            <li>El bot le da un código de 8 caracteres (vence en 15 minutos) y te lo envía.</li>
            <li>Escribe aquí su nombre y el código.</li>
            <li>La persona pulsa <strong>«Acepto»</strong> en Telegram y empieza a recibir los avisos.</li>
          </ol>
          <label className="block text-xs font-semibold text-slate-600">Nombre completo *<input required maxLength={100} className="input mt-1 text-sm" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="block text-xs font-semibold text-slate-600">Código del bot *<input required maxLength={8} autoComplete="off" spellCheck={false} className="input mt-1 text-sm font-mono uppercase tracking-widest" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="ABCD1234" /></label>
          <button type="submit" disabled={busy} className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl"><PlusIcon className="w-3.5 h-3.5" />Registrar</button>
        </form>

        <form onSubmit={announce} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-navy-900">Enviar aviso a los integrantes</h3>
          <p className="text-xs text-slate-600">Llega a todos los chats activos con el título «Aviso de la Mesa de Competitividad». No incluyas información confidencial.</p>
          <label className="block text-xs font-semibold text-slate-600">Aviso *<textarea required maxLength={ANNOUNCEMENT_LIMIT} className="input mt-1 min-h-32 text-sm" value={text} onChange={(event) => setText(event.target.value)} /></label>
          <div className="flex items-center justify-between">
            <button type="submit" disabled={busy || !text.trim()} className="bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl">Enviar aviso</button>
            <span className="text-xs text-slate-500">{text.length}/{ANNOUNCEMENT_LIMIT}</span>
          </div>
        </form>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <h3 className="font-semibold text-navy-900 px-6 py-4 border-b border-slate-100">Integrantes</h3>
        {loading ? <p className="p-8 text-center text-sm text-slate-500">Cargando integrantes…</p>
          : integrantes.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">Todavía no hay integrantes registrados.</p>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-6 py-2 font-semibold">Nombre</th><th className="px-6 py-2 font-semibold">Estado</th><th className="px-6 py-2 font-semibold">Registrado</th><th className="px-6 py-2" /></tr></thead>
              <tbody>{integrantes.map((item) => <tr key={item.id} className="border-t border-slate-100">
                <td className="px-6 py-3 text-navy-900">{item.name}</td>
                <td className="px-6 py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS[item.status].className}`}>{STATUS[item.status].label}</span></td>
                <td className="px-6 py-3 text-xs text-slate-600">{new Date(item.created_at).toLocaleDateString("es-GT")}{item.registered_by && ` · ${item.registered_by}`}</td>
                <td className="px-6 py-3 text-right">{item.status !== "revoked" && <button onClick={() => remove(item)} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded disabled:opacity-50"><TrashIcon className="w-3.5 h-3.5" />Eliminar</button>}</td>
              </tr>)}</tbody>
            </table></div>}
      </section>
    </div>
  );
};

export default TelegramTab;
