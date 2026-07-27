import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrentUser, getSystemSetupStatus } from "../../features/auth/authApi";
import {
  consumeTransitionFlag,
  LOGIN_TO_APP_TRANSITION_KEY,
  setAuthRedirectReason,
} from "../../features/auth/authUiTransition";
import {
  AUTH_TOKEN_CHANGE_EVENT,
  clearTokens,
  getAccessToken,
} from "../../lib/auth/tokenStorage";
import { API_ACTIVITY_EVENT } from "../../lib/api/client";
import { formatDeviceTitle } from "../../lib/device/deviceDisplay";
import { clearStoredLocale } from "../../lib/i18n/LocaleProvider";
import { ForcedLightTheme } from "../../lib/theme/ForcedLightTheme";
import { useLocaleContext } from "../../lib/i18n/localeContext";
import { isSupportedLocale } from "../../lib/i18n/localeUtils";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { addLocalNotification } from "../../lib/notifications/localNotifications";
import {
  createRealtimeSocket,
  sendRealtimeActivity,
  type RealtimeEvent,
} from "../../lib/realtime/realtimeClient";
import { EmailVerificationPrompt } from "../auth/EmailVerificationPrompt";
import { AuthCard } from "../auth/AuthCard";
import { Modal } from "../ui/Modal";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [shouldFadeIn] = useState(() =>
    consumeTransitionFlag(LOGIN_TO_APP_TRANSITION_KEY),
  );
  const [hasAccessToken, setHasAccessToken] = useState(() =>
    Boolean(getAccessToken()),
  );
  const realtimeSocketRef = useRef<WebSocket | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale, setLocale } = useLocaleContext();
  const { t } = useTranslation();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hasAccessToken,
    refetchInterval: (query) => {
      const user = query.state.data;
      if (!hasAccessToken) {
        return false;
      }
      return user && !user.email_verified_at ? 5000 : 15000;
    },
    refetchOnWindowFocus: true,
    retry: false,
  });
  const isAdmin = currentUser.data?.role_code === "ADMIN";
  const systemSetupStatus = useQuery({
    queryKey: ["system-setup-status"],
    queryFn: getSystemSetupStatus,
    enabled: hasAccessToken && currentUser.isSuccess,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const isSystemSetupLocked = Boolean(
    isAdmin && systemSetupStatus.data && !systemSetupStatus.data.system_ready,
  );
  const isRegularUserSystemSetupLocked = Boolean(
    currentUser.data &&
      !isAdmin &&
      systemSetupStatus.data &&
      !systemSetupStatus.data.system_ready,
  );
  const isEmailVerificationOnly = Boolean(
    currentUser.data &&
      !isRegularUserSystemSetupLocked &&
      !isSystemSetupLocked &&
      !currentUser.data.email_verified_at,
  );

  useEffect(() => {
    const handleAuthTokenChange = () => {
      setHasAccessToken(Boolean(getAccessToken()));
    };

    window.addEventListener(AUTH_TOKEN_CHANGE_EVENT, handleAuthTokenChange);
    return () =>
      window.removeEventListener(AUTH_TOKEN_CHANGE_EVENT, handleAuthTokenChange);
  }, []);

  useEffect(() => {
    if (!hasAccessToken) {
      queryClient.removeQueries({ queryKey: ["current-user"] });
      navigate("/login", { replace: true });
    }
  }, [hasAccessToken, navigate, queryClient]);

  useEffect(() => {
    if (!hasAccessToken) {
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    const socket = createRealtimeSocket(accessToken);
    realtimeSocketRef.current = socket;
    const sendActivity = () => sendRealtimeActivity(socket);

    socket.addEventListener("open", sendActivity);
    socket.addEventListener("message", (event) => {
      const realtimeEvent = parseRealtimeEvent(event.data);
      if (realtimeEvent?.type === "session_revoked") {
        setAuthRedirectReason("session_revoked");
        clearStoredLocale();
        clearTokens();
        queryClient.removeQueries({ queryKey: ["current-user"] });
        navigate("/login", { replace: true });
      }

      if (realtimeEvent?.type === "sessions_changed") {
        queryClient.invalidateQueries({
          queryKey: ["current-user", "sessions"],
        });

        const userKey = currentUser.data?.id ?? currentUser.data?.email;
        if (
          userKey &&
          realtimeEvent.payload?.reason === "device_logged_in"
        ) {
          addLocalNotification(userKey, {
            kind: "device_login",
            targetPath: "/devices#devices",
            payload: {
              sessionId:
                typeof realtimeEvent.payload.session_id === "string"
                  ? realtimeEvent.payload.session_id
                  : "",
              device:
                typeof realtimeEvent.payload.device_info === "string"
                  ? formatDeviceTitle(realtimeEvent.payload.device_info, t)
                  : "",
            },
          });
        }
      }

      if (realtimeEvent?.type === "system_setup_changed") {
        queryClient.invalidateQueries({ queryKey: ["system-setup-status"] });
        queryClient.invalidateQueries({ queryKey: ["system-settings", "email"] });
        queryClient.invalidateQueries({
          queryKey: ["system-settings", "email", "status"],
        });
      }
    });

    const intervalId = window.setInterval(sendActivity, 30000);
    window.addEventListener(API_ACTIVITY_EVENT, sendActivity);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(API_ACTIVITY_EVENT, sendActivity);
      socket.removeEventListener("open", sendActivity);
      if (realtimeSocketRef.current === socket) {
        realtimeSocketRef.current = null;
      }
      socket.close();
    };
  }, [currentUser.data?.email, currentUser.data?.id, hasAccessToken, navigate, queryClient]);

  useEffect(() => {
    sendRealtimeActivity(realtimeSocketRef.current);
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (location.hash) {
      return;
    }

    scrollPageToTop();
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (currentUser.isError && !getAccessToken()) {
      setHasAccessToken(false);
    }
  }, [currentUser.isError]);

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
      !isRegularUserSystemSetupLocked &&
      !isSystemSetupLocked &&
      !currentUser.data.email_verified_at &&
      location.pathname !== "/dashboard"
    ) {
      setIsVerificationModalOpen(true);
      navigate("/dashboard", { replace: true });
    }
  }, [
    currentUser.data,
    isRegularUserSystemSetupLocked,
    isSystemSetupLocked,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (isSystemSetupLocked && location.pathname !== "/settings") {
      navigate("/settings", { replace: true });
    }
  }, [isSystemSetupLocked, location.pathname, navigate]);

  useEffect(() => {
    if (
      currentUser.data?.password_must_change &&
      !isRegularUserSystemSetupLocked &&
      location.pathname !== "/profile"
    ) {
      navigate("/profile", { replace: true });
    }
  }, [
    currentUser.data?.password_must_change,
    isRegularUserSystemSetupLocked,
    location.pathname,
    navigate,
  ]);

  function handleBlockedUserLogout() {
    clearStoredLocale();
    clearTokens();
    queryClient.removeQueries({ queryKey: ["current-user"] });
    navigate("/login", { replace: true });
  }

  if (isRegularUserSystemSetupLocked) {
    return (
      <ForcedLightTheme>
        <AuthCard
          eyebrow={t("auth.adminSetupRequiredEyebrow")}
          title={t("auth.adminSetupRequiredTitle")}
          footer={
            <button
              className="lm-button lm-button-primary flex min-h-9 w-full items-center justify-center rounded-md px-3 text-sm"
              type="button"
              onClick={handleBlockedUserLogout}
            >
              {t("shell.logOut")}
            </button>
          }
        >
          <p className="text-sm leading-relaxed text-slate-600">
            {t("auth.adminSetupRequiredBody")}
          </p>
        </AuthCard>
      </ForcedLightTheme>
    );
  }

  if (isSystemSetupLocked) {
    return (
      <div
        className={[
          "h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950",
          shouldFadeIn ? "app-login-enter" : "",
        ].join(" ")}
      >
        <main className="app-main h-full min-w-0 overflow-y-auto">
          <div className="app-route-outlet">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={[
        "grid h-dvh overflow-hidden bg-slate-50",
        shouldFadeIn ? "app-login-enter" : "",
        isSidebarCollapsed
          ? "lg:grid-cols-[76px_minmax(0,1fr)]"
          : "lg:grid-cols-[260px_minmax(0,1fr)]",
      ].join(" ")}
    >
      <Sidebar
        adminSetupOnly={isSystemSetupLocked}
        dashboardOnly={isEmailVerificationOnly}
        isCollapsed={isSidebarCollapsed}
        onExpandCollapsed={() => setIsSidebarCollapsed(false)}
        onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="flex min-h-0 min-w-0 flex-col">
        <TopBar
          adminSetupOnly={isSystemSetupLocked}
          dashboardOnly={isEmailVerificationOnly}
        />
        <main className="app-main min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="app-route-outlet">
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

function parseRealtimeEvent(value: string): RealtimeEvent | null {
  try {
    const parsed = JSON.parse(value) as RealtimeEvent;
    return typeof parsed.type === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function scrollPageToTop() {
  const resetScroll = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  resetScroll();
  window.requestAnimationFrame(resetScroll);
  window.setTimeout(resetScroll, 50);
}
