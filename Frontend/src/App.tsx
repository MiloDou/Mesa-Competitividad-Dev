import { useState } from "react";
import PublicSite  from "./views/PublicSite";
import AdminSystem from "./views/admin/AdminSystem";
import { apiRequest, setSessionTokens } from "./api/client";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<"comision" | "editor">("comision");

  async function logout() {
    try { await apiRequest<void>("/auth/logout/", { method: "POST" }); } catch { /* Siempre se elimina la sesión local. */ } finally {
      setSessionTokens(null, null);
      setIsAdmin(false);
    }
  }

  return (
    <ErrorBoundary>
      <div className="size-full overflow-auto bg-navy-950" style={{ fontFamily: "var(--font-sans)" }}>
        {isAdmin ? (
          <div className="relative size-full">
            <AdminSystem initialRole={adminRole} onLogout={logout} />
          </div>
        ) : (
          <PublicSite onLoginSuccess={(role) => {
            setAdminRole(role);
            setIsAdmin(true);
          }} />
        )}
      </div>
    </ErrorBoundary>
  );
}
