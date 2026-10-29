import { useEffect, useState } from "react";
import PublicSite  from "./views/PublicSite";
import AdminSystem from "./views/admin/AdminSystem";
import { apiRequest, setAccessToken } from "./api/client";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { SplashScreen } from "./components/ui/SplashScreen";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<"comision" | "editor">("comision");
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

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
    <ErrorBoundary>
      <FeedbackProvider>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} duration={2000} />}
        <div className="size-full overflow-auto bg-navy-950" style={{ fontFamily: "var(--font-sans)" }}>
          {isAdmin ? (
            <div className="relative size-full">
              <AdminSystem initialRole={adminRole} onLogout={logout} />
            </div>
          ) : (
            <PublicSite onLoginSuccess={() => {
              setAdminRole(sessionStorage.getItem("mesa_role") === "editor" ? "editor" : "comision");
              setIsAdmin(true);
            }} />
          )}
        </div>
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
