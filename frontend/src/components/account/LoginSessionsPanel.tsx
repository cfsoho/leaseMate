import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Laptop, LogOut, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getCurrentUserSessions,
  logoutAllSessions,
  logoutOtherSessions,
  revokeCurrentUserSession,
} from "../../features/auth/authApi";
import { startAppLogoutTransition } from "../../features/auth/authUiTransition";
import type { UserLoginSession } from "../../features/auth/authTypes";
import { clearTokens, getRefreshToken } from "../../lib/auth/tokenStorage";
import { clearStoredLocale } from "../../lib/i18n/LocaleProvider";
import type { TranslationKey } from "../../lib/i18n/translations";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { Button } from "../ui/Button";

const SESSION_FADE_MS = 2000;

export function LoginSessionsPanel() {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const previousSessionIdsRef = useRef<Set<string> | null>(null);
  const [enteringSessionIds, setEnteringSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [leavingSessionIds, setLeavingSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const sessions = useQuery({
    queryKey: ["current-user", "sessions"],
    queryFn: getCurrentUserSessions,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await revokeCurrentUserSession(sessionId);
      return { result, sessionId };
    },
    onSuccess: ({ sessionId }) => {
      setLeavingSessionIds((current) => new Set(current).add(sessionId));
      window.setTimeout(() => {
        setLeavingSessionIds((current) => {
          const next = new Set(current);
          next.delete(sessionId);
          return next;
        });
        queryClient.invalidateQueries({
          queryKey: ["current-user", "sessions"],
        });
      }, SESSION_FADE_MS);
    },
  });
  const logoutOthers = useMutation({
    mutationFn: () => logoutOtherSessions(getRefreshToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "sessions"] });
    },
  });
  const logoutEverywhere = useMutation({
    mutationFn: logoutAllSessions,
    onSuccess: () => {
      startAppLogoutTransition(() => {
        clearStoredLocale();
        clearTokens();
        queryClient.removeQueries({ queryKey: ["current-user"] });
        navigate("/login", { replace: true });
      });
    },
  });
  const error =
    sessions.error ||
    revokeSession.error ||
    logoutOthers.error ||
    logoutEverywhere.error;
  const sessionCount = sessions.data?.length ?? 0;

  useEffect(() => {
    if (!sessions.data) {
      return;
    }

    const sessionIds = new Set(sessions.data.map((session) => session.id));
    const previousSessionIds = previousSessionIdsRef.current;
    previousSessionIdsRef.current = sessionIds;

    if (!previousSessionIds) {
      return;
    }

    const nextEnteringIds = sessions.data
      .filter((session) => !previousSessionIds.has(session.id))
      .map((session) => session.id);

    if (nextEnteringIds.length === 0) {
      return;
    }

    setEnteringSessionIds((current) => {
      const next = new Set(current);
      nextEnteringIds.forEach((sessionId) => next.add(sessionId));
      return next;
    });

    const timeoutId = window.setTimeout(() => {
      setEnteringSessionIds((current) => {
        const next = new Set(current);
        nextEnteringIds.forEach((sessionId) => next.delete(sessionId));
        return next;
      });
    }, SESSION_FADE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [sessions.data]);

  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("security.devicesTitle")}
          </h2>
          <p className="m-0 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            {t("security.devicesDescription")}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {sessionCount > 1 && (
            <Button
              disabled={logoutOthers.isPending}
              variant="secondary"
              onClick={() => logoutOthers.mutate()}
            >
              <LogOut aria-hidden="true" size={16} />
              {logoutOthers.isPending
                ? t("security.loggingOut")
                : t("security.logOutOthers")}
            </Button>
          )}
          <Button
            disabled={logoutEverywhere.isPending}
            onClick={() => logoutEverywhere.mutate()}
          >
            <LogOut aria-hidden="true" size={16} />
            {logoutEverywhere.isPending
              ? t("security.loggingOut")
              : t("security.logOutAll")}
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        {sessions.isLoading && (
          <SessionNotice message={t("security.loadingDevices")} />
        )}
        {error && (
          <SessionNotice
            message={
              error instanceof Error
                ? error.message
                : t("security.unableToUpdateDevices")
            }
            tone="error"
          />
        )}
        {sessions.data?.length === 0 && (
          <SessionNotice message={t("security.noBrowserSessions")} />
        )}
        {sessions.data && sessions.data.length > 0 && (
          <div className="grid gap-2">
            {sessions.data.map((session) => (
              <SessionPanel
                key={session.id}
                isEntering={enteringSessionIds.has(session.id)}
                isLeaving={leavingSessionIds.has(session.id)}
                isRevoking={revokeSession.isPending}
                locale={locale}
                session={session}
                t={t}
                onRevoke={() => revokeSession.mutate(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SessionPanel({
  isEntering,
  isLeaving,
  isRevoking,
  locale,
  session,
  t,
  onRevoke,
}: {
  isEntering: boolean;
  isLeaving: boolean;
  isRevoking: boolean;
  locale: string;
  session: UserLoginSession;
  t: (key: TranslationKey) => string;
  onRevoke: () => void;
}) {
  const title = formatDeviceTitle(session.device_info, t);
  const isRevoked = Boolean(session.revoked_at);
  const location = getLocationLabel(session, t);
  const DeviceIcon = isMobileDevice(session.device_info) ? Smartphone : Laptop;
  const sessionStatus = session.session_status ?? (session.is_online ? "online" : "idle");
  const sessionStateLabel =
    sessionStatus === "online"
      ? t("security.online")
      : sessionStatus === "idle"
        ? t("security.idle")
        : t("security.offline");
  const sessionStateClass =
    sessionStatus === "online"
      ? "bg-emerald-500"
      : sessionStatus === "idle"
        ? "bg-amber-400"
        : "bg-red-500";

  return (
    <article
      className={[
        "login-session-row grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        isEntering ? "login-session-entering" : "",
        isLeaving ? "login-session-leaving" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-grid size-8 shrink-0 place-items-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <DeviceIcon aria-hidden="true" size={16} />
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
            {title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-600 dark:text-slate-300">
              <span
                aria-hidden="true"
                className={[
                  "inline-block size-2.5 rounded-full",
                  sessionStateClass,
                ].join(" ")}
              />
              {sessionStateLabel}
            </span>
            {session.is_current && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-normal text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                {t("security.currentDevice")}
              </span>
            )}
          </div>
          <p className="m-0 text-xs font-normal text-slate-500 dark:text-slate-400">
            {withToken(
              t("security.createdAt"),
              "date",
              formatDate(session.created_at, locale),
            )}
          </p>
          <p className="m-0 text-xs font-normal text-slate-500 dark:text-slate-400">
            {withToken(
              t("security.expiresAt"),
              "date",
              formatDate(session.expires_at, locale),
            )}
          </p>
          <p className="m-0 text-xs font-normal text-slate-500 dark:text-slate-400">
            {withToken(
              t("security.lastUsedAt"),
              "date",
              formatDate(session.last_used_at, locale),
            )}
          </p>
          <p className="m-0 text-xs font-normal text-slate-500 dark:text-slate-400">
            {location}
          </p>
          {session.ip_address && (
            <p className="m-0 text-xs font-normal text-slate-500 dark:text-slate-400">
              {withToken(t("security.ipAddress"), "ip", session.ip_address)}
            </p>
          )}
        </div>
      </div>
      <Button
        disabled={isRevoking || isRevoked}
        type="button"
        variant="secondary"
        onClick={onRevoke}
      >
        <LogOut aria-hidden="true" size={15} />
        {isRevoked ? t("security.loggedOut") : t("security.logOut")}
      </Button>
    </article>
  );
}

function getLocationLabel(
  session: UserLoginSession,
  t: (key: TranslationKey) => string,
) {
  const location = [
    session.location_city,
    session.location_region,
    session.location_country_code,
  ]
    .filter(Boolean)
    .join(", ");

  if (location) {
    return withToken(t("security.location"), "location", location);
  }

  if (isLocalAddress(session.ip_address)) {
    return t("security.privateNetworkIp");
  }

  return t("security.locationNotAvailable");
}

function formatDeviceTitle(
  userAgent: string | null | undefined,
  t: (key: TranslationKey) => string,
) {
  if (!userAgent) {
    return t("security.browserSession");
  }

  const browser = getBrowserName(userAgent);
  const platform = getPlatformName(userAgent);

  if (browser && platform) {
    return `${browser} on ${platform}`;
  }

  return browser || platform || t("security.browserSession");
}

function withToken(template: string, token: string, value: string) {
  return template.replace(`{${token}}`, value);
}

function isMobileDevice(userAgent: string | null | undefined) {
  return Boolean(userAgent && /iPhone|iPad|Android|Mobile/i.test(userAgent));
}

function getBrowserName(userAgent: string) {
  if (/Edg\//.test(userAgent)) {
    return "Microsoft Edge";
  }
  if (/CriOS\//.test(userAgent)) {
    return "Chrome";
  }
  if (/Chrome\//.test(userAgent) && !/Chromium\//.test(userAgent)) {
    return "Chrome";
  }
  if (/Firefox\//.test(userAgent) || /FxiOS\//.test(userAgent)) {
    return "Firefox";
  }
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return "Safari";
  }

  return "";
}

function getPlatformName(userAgent: string) {
  if (/iPhone/.test(userAgent)) {
    return "iPhone";
  }
  if (/iPad/.test(userAgent)) {
    return "iPad";
  }
  if (/Macintosh/.test(userAgent)) {
    return "Mac";
  }
  if (/Android/.test(userAgent)) {
    return "Android";
  }
  if (/Windows/.test(userAgent)) {
    return "Windows";
  }
  if (/Linux/.test(userAgent)) {
    return "Linux";
  }

  return "";
}

function isLocalAddress(ipAddress: string | null | undefined) {
  if (!ipAddress) {
    return false;
  }

  return (
    ipAddress === "127.0.0.1" ||
    ipAddress === "::1" ||
    ipAddress === "localhost" ||
    ipAddress.startsWith("10.") ||
    ipAddress.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ipAddress)
  );
}

function SessionNotice({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <p
      className={[
        "m-0 rounded-lg border p-3 text-sm font-normal",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
      ].join(" ")}
    >
      {message}
    </p>
  );
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
