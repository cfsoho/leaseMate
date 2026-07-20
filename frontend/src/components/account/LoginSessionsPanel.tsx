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
import {
  formatDeviceTitle,
  isMobileDevice,
} from "../../lib/device/deviceDisplay";
import { clearStoredLocale } from "../../lib/i18n/LocaleProvider";
import type { TranslationKey } from "../../lib/i18n/translations";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { Button } from "../ui/Button";
import { CollapsibleCard } from "../ui/CollapsibleCard";

const SESSION_FADE_MS = 2000;

type LoginSessionsPanelProps = {
  id?: string;
};

export function LoginSessionsPanel({ id }: LoginSessionsPanelProps) {
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
    <CollapsibleCard
      action={
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
      }
      className="login-sessions-card"
      collapsible={false}
      description={t("security.devicesDescription")}
      id={id}
      isOpen
      onOpenChange={() => undefined}
      title={t("security.devicesTitle")}
    >
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
    </CollapsibleCard>
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
        "login-session-row grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        isEntering ? "login-session-entering" : "",
        isLeaving ? "login-session-leaving" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="login-session-icon mt-0.5 inline-grid size-8 shrink-0 place-items-center rounded-md">
          <DeviceIcon aria-hidden="true" size={16} />
        </span>
        <div className="min-w-0">
          <p className="login-session-name m-0 truncate text-sm font-semibold">
            {title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="login-session-state inline-flex items-center gap-1.5 text-xs font-normal">
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
              <span className="login-session-current rounded-full px-2 py-0.5 text-xs font-normal">
                {t("security.currentDevice")}
              </span>
            )}
          </div>
          <p className="login-session-meta m-0 text-xs font-normal">
            {withToken(
              t("security.createdAt"),
              "date",
              formatDate(session.created_at, locale),
            )}
          </p>
          <p className="login-session-meta m-0 text-xs font-normal">
            {withToken(
              t("security.expiresAt"),
              "date",
              formatDate(session.expires_at, locale),
            )}
          </p>
          <p className="login-session-meta m-0 text-xs font-normal">
            {withToken(
              t("security.lastUsedAt"),
              "date",
              formatDate(session.last_used_at, locale),
            )}
          </p>
          <p className="login-session-meta m-0 text-xs font-normal">
            {location}
          </p>
          {session.ip_address && (
            <p className="login-session-meta m-0 text-xs font-normal">
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

function withToken(template: string, token: string, value: string) {
  return template.replace(`{${token}}`, value);
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
        "login-session-notice m-0 rounded-lg border p-3 text-sm font-normal",
        tone === "error" ? "login-session-notice-error" : "",
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
