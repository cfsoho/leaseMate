import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrentUser } from "../../features/auth/authApi";
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
import { clearStoredLocale } from "../../lib/i18n/LocaleProvider";
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
            },
          });
        }
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
        shouldFadeIn ? "app-login-enter" : "",
        isSidebarCollapsed
          ? "lg:grid-cols-[76px_minmax(0,1fr)]"
          : "lg:grid-cols-[260px_minmax(0,1fr)]",
      ].join(" ")}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onExpandCollapsed={() => setIsSidebarCollapsed(false)}
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

function parseRealtimeEvent(value: string): RealtimeEvent | null {
  try {
    const parsed = JSON.parse(value) as RealtimeEvent;
    return typeof parsed.type === "string" ? parsed : null;
  } catch {
    return null;
  }
}
