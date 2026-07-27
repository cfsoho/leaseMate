import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  MonitorSmartphone,
  Search,
  User,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { appBrand } from "../../config/appBrand";
import { getCurrentUser, logout } from "../../features/auth/authApi";
import { startAppLogoutTransition } from "../../features/auth/authUiTransition";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "../../lib/auth/tokenStorage";
import { clearStoredLocale } from "../../lib/i18n/LocaleProvider";
import { useTranslation } from "../../lib/i18n/useTranslation";
import {
  getUnreadLocalNotificationCount,
  listLocalNotifications,
  type LocalNotification,
  removeLocalNotification,
  subscribeLocalNotifications,
} from "../../lib/notifications/localNotifications";
import { BrandMark } from "../ui/BrandMark";
import { NavigationSections } from "./NavigationSections";

type TopBarProps = {
  adminSetupOnly?: boolean;
  dashboardOnly?: boolean;
};

export function TopBar({
  adminSetupOnly = false,
  dashboardOnly = false,
}: TopBarProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const hasToken = Boolean(getAccessToken());
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hasToken,
    retry: false,
  });
  const usesFamilyNameFirst = ["ja", "zh-Hant-TW", "zh-Hant-HK"].includes(
    currentUser.data?.preferred_locale_code ?? "",
  );
  const displayName = currentUser.data
    ? usesFamilyNameFirst
      ? `${currentUser.data.family_name}${currentUser.data.given_name}`.trim()
      : `${currentUser.data.given_name} ${currentUser.data.family_name}`.trim()
    : "Admin";
  const displayEmail = currentUser.data?.email ?? "";
  const currentUserKey = currentUser.data?.id ?? currentUser.data?.email ?? "";
  const handleLogout = () => {
    setIsUserMenuOpen(false);
    const refreshToken = getRefreshToken();

    void (async () => {
      if (refreshToken) {
        try {
          await logout(refreshToken);
        } catch {
          // Local logout must still continue if the server session is already gone.
        }
      }

      startAppLogoutTransition(() => {
        clearStoredLocale();
        clearTokens();
        queryClient.removeQueries({ queryKey: ["current-user"] });
        navigate("/login", { replace: true });
      });
    })();
  };
  const handleProfile = () => {
    setIsUserMenuOpen(false);
    navigate("/profile");
  };
  const handleDevices = () => {
    setIsUserMenuOpen(false);
    navigate("/devices");
  };
  const handleNotifications = () => {
    if (!currentUserKey) {
      return;
    }

    setIsNotificationMenuOpen((current) => !current);
  };
  const handleNotificationOpen = (notification: LocalNotification) => {
    if (!currentUserKey) {
      return;
    }

    const targetPath = notification.targetPath || "/devices#devices";
    const targetPathname = targetPath.split("#", 1)[0] || "/devices";

    removeLocalNotification(currentUserKey, notification.id);
    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id),
    );
    setNotificationCount((current) => Math.max(0, current - 1));
    setIsNotificationMenuOpen(false);

    if (location.pathname === targetPathname) {
      window.requestAnimationFrame(() => {
        document
          .getElementById("devices")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    navigate(targetPath);
  };

  useEffect(() => {
    if (!currentUserKey) {
      setNotificationCount(0);
      return;
    }

    const updateCount = () => {
      setNotificationCount(getUnreadLocalNotificationCount(currentUserKey));
      setNotifications(listLocalNotifications(currentUserKey));
    };

    updateCount();
    return subscribeLocalNotifications(currentUserKey, updateCount);
  }, [currentUserKey]);

  useEffect(() => {
    if (!isNotificationMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setIsNotificationMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isNotificationMenuOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          aria-expanded={isMobileNavOpen}
          aria-label={
            isMobileNavOpen
              ? t("shell.closeNavigation")
              : t("shell.openNavigation")
          }
          className="inline-grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          type="button"
          onClick={() => setIsMobileNavOpen((current) => !current)}
        >
          {isMobileNavOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </button>

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <label className="relative w-full max-w-md">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10"
              placeholder={t("shell.searchPlaceholder")}
            />
          </label>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
          <BrandMark size="sm" />
          <span className="truncate font-bold text-slate-950">
            {appBrand.name}
          </span>
        </div>

        <div ref={notificationMenuRef} className="relative">
          <button
            aria-expanded={isNotificationMenuOpen}
            aria-haspopup="menu"
            aria-label={t("shell.notifications")}
            className="relative inline-grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            title={
              notificationCount > 0
                ? t("notifications.otherDeviceLoggedIn")
                : t("shell.notifications")
            }
            type="button"
            onClick={handleNotifications}
          >
            <Bell aria-hidden="true" size={18} />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-5 text-white">
                +{notificationCount}
              </span>
            )}
          </button>

          {isNotificationMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-950">
                  {t("shell.notifications")}
                </p>
              </div>
              <div className="grid max-h-96 overflow-y-auto p-1.5">
                {notifications.length === 0 ? (
                  <p className="px-2.5 py-3 text-sm text-slate-500">
                    {t("notifications.none")}
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={[
                        "grid gap-1 rounded-md px-2.5 py-2 text-left text-sm hover:bg-slate-100",
                        notification.readAt ? "text-slate-500" : "text-slate-800",
                      ].join(" ")}
                      role="menuitem"
                      type="button"
                      onClick={() => handleNotificationOpen(notification)}
                    >
                      <span className="font-semibold text-slate-950">
                        {getNotificationTitle(notification, t)}
                      </span>
                      <span className="text-xs leading-relaxed text-slate-500">
                        {getNotificationBody(notification, t)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
            type="button"
            onClick={() => setIsUserMenuOpen((current) => !current)}
          >
            <span className="grid size-7 place-items-center rounded-md bg-slate-100 text-slate-500">
              <User aria-hidden="true" size={16} />
            </span>
            <ChevronDown
              aria-hidden="true"
              className={[
                "text-slate-400 transition-transform",
                isUserMenuOpen ? "rotate-180" : "",
              ].join(" ")}
              size={16}
            />
          </button>

          {isUserMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="min-w-0 border-b border-slate-100 px-4 py-3 pr-6">
                <p className="truncate text-sm font-bold text-slate-950">
                  {displayName}
                </p>
                <p
                  className="max-w-full truncate text-xs font-normal text-slate-500"
                  title={displayEmail || "Not signed in"}
                >
                  {displayEmail || "Not signed in"}
                </p>
              </div>
              <div className="grid p-1.5">
                <UserMenuButton
                  icon={User}
                  label={t("shell.profile")}
                  onClick={handleProfile}
                />
                <UserMenuButton
                  icon={MonitorSmartphone}
                  label={t("shell.security")}
                  onClick={handleDevices}
                />
              </div>
              <div className="border-t border-slate-100 p-1.5">
                <UserMenuButton
                  icon={LogOut}
                  label={t("shell.logOut")}
                  tone="danger"
                  onClick={handleLogout}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <nav
        className={[
          "absolute left-0 right-0 top-16 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-100 bg-white px-3 py-4 shadow-xl lg:hidden",
          isMobileNavOpen ? "grid" : "hidden",
        ].join(" ")}
      >
        <div className="grid gap-6">
          <NavigationSections
            adminSetupOnly={adminSetupOnly}
            dashboardOnly={dashboardOnly}
            onNavigate={() => setIsMobileNavOpen(false)}
          />
        </div>
      </nav>
    </header>
  );
}

function getNotificationTitle(
  notification: LocalNotification,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (notification.kind === "device_login") {
    return t("notifications.otherDeviceLoggedIn");
  }

  return t("shell.notifications");
}

function getNotificationBody(
  notification: LocalNotification,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (notification.kind === "device_login") {
    return (
      notification.payload?.device ||
      t("notifications.otherDeviceLoggedInBody")
    );
  }

  return t("notifications.openSecurity");
}

type UserMenuButtonProps = {
  icon: typeof User;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger";
};

function UserMenuButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: UserMenuButtonProps) {
  return (
    <button
      className={[
        "flex min-h-9 w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 text-left text-sm font-semibold",
        tone === "danger"
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
      role="menuitem"
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={16} />
      {label}
    </button>
  );
}
