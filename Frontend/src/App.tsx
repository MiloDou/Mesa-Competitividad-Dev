import { lazy, Suspense, useEffect, useState } from "react";
import PublicSite  from "./views/PublicSite";
const AdminSystem = lazy(() => import("./views/admin/AdminSystem"));
import { apiRequest, setAccessToken } from "./api/client";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
const ResetPassword = lazy(() => import("./views/public/modals/ResetPassword").then((module) => ({ default: module.ResetPassword })));
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { SplashScreen } from "./components/ui/SplashScreen";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<"comision" | "editor">("comision");
  const [showSplash, setShowSplash] = useState(true);
  const isPasswordReset = window.location.pathname.replace(/\/$/, "") === "/reset-password";

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    if (isPasswordReset) return;
    const token = sessionStorage.getItem("mesa_access");
    if (token) {
      setAccessToken(token);
      setAdminRole(sessionStorage.getItem("mesa_role") === "editor" ? "editor" : "comision");
      setIsAdmin(true);
    }
  }, [isPasswordReset]);

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
          <Suspense fallback={<div className="p-8 text-center text-white">Cargando…</div>}>
          {isPasswordReset ? <ResetPassword /> : isAdmin ? (
            <div className="relative size-full">
              <AdminSystem initialRole={adminRole} onLogout={logout} />
            </div>
          ) : (
            <PublicSite onLoginSuccess={() => {
              setAdminRole(sessionStorage.getItem("mesa_role") === "editor" ? "editor" : "comision");
              setIsAdmin(true);
            }} />
          )}
          </Suspense>
        </div>
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
