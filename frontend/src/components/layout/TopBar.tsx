import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../../features/auth/authApi";
import { clearTokens, getAccessToken } from "../../lib/auth/tokenStorage";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { adminNavItems, mainNavItems } from "./navigation";

export function TopBar() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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
  const handleLogout = () => {
    clearTokens();
    queryClient.removeQueries({ queryKey: ["current-user"] });
    setIsUserMenuOpen(false);
    navigate("/login", { replace: true });
  };
  const handleProfile = () => {
    setIsUserMenuOpen(false);
    navigate("/profile");
  };

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
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-900 font-bold text-white">
            LM
          </span>
          <span className="truncate font-bold text-slate-950">LeaseMate</span>
        </div>

        <button
          aria-label={t("shell.notifications")}
          className="inline-grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          type="button"
        >
          <Bell aria-hidden="true" size={18} />
        </button>

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
              className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-950">{displayName}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {displayEmail || "Not signed in"}
                </p>
              </div>
              <div className="grid p-1.5">
                <UserMenuButton
                  icon={User}
                  label={t("shell.profile")}
                  onClick={handleProfile}
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
          "gap-1 border-t border-slate-100 px-3 py-2 lg:hidden",
          isMobileNavOpen ? "grid" : "hidden",
        ].join(" ")}
      >
        {[...mainNavItems, ...adminNavItems].map((item) => (
          <NavLink
            key={item.href}
            className={({ isActive }) =>
              [
                "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
                isActive
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")
            }
            to={item.href}
            onClick={() => setIsMobileNavOpen(false)}
          >
            <item.icon aria-hidden="true" size={16} />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </header>
  );
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
