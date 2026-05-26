import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "../../features/auth/authApi";
import { getAccessToken } from "../../lib/auth/tokenStorage";
import { useLocaleContext } from "../../lib/i18n/localeContext";
import { isSupportedLocale } from "../../lib/i18n/localeUtils";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { EmailVerificationPrompt } from "../auth/EmailVerificationPrompt";
import { Modal } from "../ui/Modal";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale } = useLocaleContext();
  const { t } = useTranslation();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: Boolean(getAccessToken()),
    refetchInterval: (query) => {
      const user = query.state.data;
      return user && !user.email_verified_at ? 5000 : false;
    },
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    const preferredLocale = currentUser.data?.preferred_locale_code;
    if (
      preferredLocale &&
      isSupportedLocale(preferredLocale) &&
      preferredLocale !== locale
    ) {
      setLocale(preferredLocale);
    }
  }, [currentUser.data?.preferred_locale_code, locale, setLocale]);

  useEffect(() => {
    if (currentUser.data?.email_verified_at) {
      setIsVerificationModalOpen(false);
    }
  }, [currentUser.data?.email_verified_at]);

  useEffect(() => {
    if (
      currentUser.data &&
      !currentUser.data.email_verified_at &&
      location.pathname !== "/dashboard"
    ) {
      setIsVerificationModalOpen(true);
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser.data, location.pathname, navigate]);

  useEffect(() => {
    if (
      currentUser.data?.password_must_change &&
      location.pathname !== "/profile"
    ) {
      navigate("/profile", { replace: true });
    }
  }, [currentUser.data?.password_must_change, location.pathname, navigate]);

  return (
    <div
      className={[
        "grid min-h-screen bg-slate-50",
        isSidebarCollapsed
          ? "lg:grid-cols-[76px_minmax(0,1fr)]"
          : "lg:grid-cols-[260px_minmax(0,1fr)]",
      ].join(" ")}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="min-w-0">
        <TopBar />
        <main className="min-w-0 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div className="mx-auto grid max-w-[1600px] gap-6">
            <Outlet />
          </div>
        </main>
      </div>
      {isVerificationModalOpen && (
        <Modal title={t("dashboard.emailNotVerifiedTitle")}>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t("dashboard.verifyEmailFirst")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {t("dashboard.verifyEmailModalWait")}
          </p>
          {currentUser.data && (
            <div className="mt-4">
              <EmailVerificationPrompt compact currentUser={currentUser.data} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
