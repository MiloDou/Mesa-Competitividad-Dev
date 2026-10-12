import { useEffect, useState } from "react";
import PublicSite  from "./views/PublicSite";
import AdminSystem from "./views/admin/AdminSystem";
import { apiRequest, setAccessToken } from "./api/client";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<"comision" | "editor">("comision");

  useEffect(() => {
    const token = sessionStorage.getItem("mesa_access");
    if (token) {
      setAccessToken(token);
      setAdminRole(sessionStorage.getItem("mesa_role") === "editor" ? "editor" : "comision");
      setIsAdmin(true);
    }
  }, []);

  async function logout() {
    try { await apiRequest<void>("/auth/logout/", { method: "POST" }); } catch { /* Siempre se elimina la sesión local. */ } finally {
      sessionStorage.removeItem("mesa_access");
      sessionStorage.removeItem("mesa_refresh");
      sessionStorage.removeItem("mesa_role");
      setAccessToken(null);
      setIsAdmin(false);
    }
  }

  return (
    <div className="size-full overflow-auto bg-navy-950" style={{ fontFamily: "var(--font-sans)" }}>
      {isAdmin ? (
        <div className="relative size-full">
          <button
            onClick={logout}
            className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[100] flex items-center gap-1.5 bg-navy-900/90 hover:bg-navy-800 text-red-400 hover:text-red-300 border border-navy-700 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold shadow-xl transition-all"
            title="Cerrar sesión administrativa y volver al sitio público"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden xs:inline">Cerrar Sesión</span>
            <span className="xs:hidden">Salir</span>
          </button>
          <AdminSystem initialRole={adminRole} />
        </div>
      ) : (
        <PublicSite onLoginSuccess={() => {
          setAdminRole(sessionStorage.getItem("mesa_role") === "editor" ? "editor" : "comision");
          setIsAdmin(true);
        }} />
      )}
    </div>
  );
}
