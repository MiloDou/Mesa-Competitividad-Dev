import { useEffect, useState, type FormEvent } from "react";
import { LogoFull } from "../../../Logo";
import { apiRequest, setAccessToken } from "../../../api/client";

export function ResetPassword() {
  const [link] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { uid: params.get("uid"), token: params.get("token") };
  });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const hasLink = Boolean(link.uid && link.token);

  useEffect(() => {
    // El enlace solo se conserva en memoria mientras esta pantalla está abierta.
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasLink || pending) return;
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await apiRequest<void>("/auth/password-reset/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: link.uid, token: link.token, password }),
      });
      setAccessToken(null);
      sessionStorage.removeItem("mesa_access");
      sessionStorage.removeItem("mesa_refresh");
      sessionStorage.removeItem("mesa_role");
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (failure) {
      setError(failure instanceof TypeError
        ? "No pudimos conectar con el servidor. Intenta de nuevo más tarde."
        : failure instanceof Error ? failure.message : "No fue posible cambiar la contraseña. Intenta de nuevo.");
    } finally { setPending(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-950 p-4" style={{ fontFamily: "var(--font-sans)" }}>
      <section aria-labelledby="reset-title" className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-navy-900 flex flex-col items-center gap-3">
          <LogoFull size={56} dark={true} />
          <h1 id="reset-title" className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Nueva contraseña</h1>
        </div>
        <div className="p-8 space-y-5">
          {!hasLink ? (
            <p role="alert" className="text-sm text-red-700">El enlace está incompleto. Abre el enlace recibido por correo o solicita uno nuevo desde «Olvidé mi contraseña».</p>
          ) : done ? (
            <p role="status" className="text-sm text-green-800">Tu contraseña se actualizó. Las sesiones anteriores se cerraron. Vuelve al inicio e ingresa con tu nueva contraseña.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p id="password-help" className="text-sm text-gray-600">Usa al menos 12 caracteres. Evita contraseñas comunes, solo numéricas o similares a tus datos personales.</p>
              {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error} Si el enlace venció o ya fue utilizado, solicita uno nuevo desde el inicio de sesión.</p>}
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-navy-900 mb-2">Nueva contraseña</label>
                <input id="new-password" type="password" autoComplete="new-password" required minLength={12} aria-describedby="password-help" disabled={pending} value={password} onChange={event => setPassword(event.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-navy-950 focus:border-navy-700" />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-navy-900 mb-2">Confirmar contraseña</label>
                <input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} disabled={pending} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-navy-950 focus:border-navy-700" />
              </div>
              <button type="submit" disabled={pending} className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm py-3.5 rounded-xl disabled:opacity-60">{pending ? "Guardando…" : "Guardar contraseña"}</button>
            </form>
          )}
          <a href="/" className="block text-center text-sm font-semibold text-navy-900 underline underline-offset-4">Volver al inicio</a>
        </div>
      </section>
    </main>
  );
}
