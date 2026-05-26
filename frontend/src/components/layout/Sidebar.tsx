import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useTranslation } from "../../lib/i18n/useTranslation";
import {
  adminNavItems,
  mainNavItems,
  referenceNavItem,
  referenceNavItems,
} from "./navigation";
import type { NavItem } from "./navigation";

type SidebarProps = {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ isCollapsed, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className="hidden overflow-hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start"
      aria-label={t("shell.openNavigation")}
    >
      <div
        className={[
          "flex h-16 shrink-0 items-center border-b border-slate-200",
          isCollapsed ? "justify-center px-3" : "px-3",
        ].join(" ")}
      >
        <NavLink
          aria-label={t("nav.dashboard")}
          className={[
            "flex min-h-11 items-center rounded-lg hover:bg-slate-100",
            isCollapsed ? "justify-center px-0" : "w-full gap-2.5 px-2",
          ].join(" ")}
          to="/dashboard"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-900 font-bold text-white">
            LM
          </span>
          <div className={isCollapsed ? "hidden" : "min-w-0"}>
            <p className="truncate text-sm font-bold leading-5 text-slate-950">
              LeaseMate
            </p>
            <p className="truncate text-xs font-semibold text-slate-500">
              {t("app.subtitle")}
            </p>
          </div>
        </NavLink>
      </div>

      <div
        className={[
          "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain py-4",
          isCollapsed ? "px-2" : "px-3",
        ].join(" ")}
      >
        <NavSection
          isCollapsed={isCollapsed}
          items={mainNavItems}
          title={t("nav.workspace")}
        />
        <AdminNavSection
          isCollapsed={isCollapsed}
          items={adminNavItems}
          title={t("nav.admin")}
        />
      </div>

      <div className="shrink-0 border-t border-slate-200 p-2">
        <button
          aria-label={
            isCollapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")
          }
          className={[
            "flex min-h-10 w-full items-center rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
          ].join(" ")}
          type="button"
          onClick={onToggleCollapsed}
        >
          {isCollapsed ? (
            <PanelLeftOpen aria-hidden="true" size={18} />
          ) : (
            <PanelLeftClose aria-hidden="true" size={18} />
          )}
          {!isCollapsed && <span>{t("shell.collapseSidebar")}</span>}
        </button>
      </div>
    </aside>
  );
}

type NavSectionProps = {
  title: string;
  items: NavItem[];
  isCollapsed: boolean;
};

function NavSection({ title, items, isCollapsed }: NavSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-1">
      {!isCollapsed && (
        <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavLink
          key={item.href}
          title={isCollapsed ? t(item.labelKey) : undefined}
          className={({ isActive }) =>
            [
              "flex min-h-10 items-center rounded-lg text-sm font-semibold",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
              isActive
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")
          }
          to={item.href}
        >
          <item.icon aria-hidden="true" size={18} />
          {!isCollapsed && <span>{t(item.labelKey)}</span>}
        </NavLink>
      ))}
    </section>
  );
}

function AdminNavSection({ title, items, isCollapsed }: NavSectionProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isReferenceActive =
    pathname === referenceNavItem.href ||
    pathname.startsWith(`${referenceNavItem.href}/`);
  const [isReferenceOpen, setIsReferenceOpen] = useState(isReferenceActive);

  useEffect(() => {
    if (isReferenceActive) {
      setIsReferenceOpen(true);
    }
  }, [isReferenceActive]);

  return (
    <section className="grid gap-1">
      {!isCollapsed && (
        <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          {title}
        </p>
      )}

      <div className="grid gap-1">
        <button
          aria-expanded={isReferenceOpen}
          title={isCollapsed ? t(referenceNavItem.labelKey) : undefined}
          className={[
            "flex min-h-10 w-full items-center rounded-lg text-sm font-semibold",
            isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
            isReferenceActive
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          ].join(" ")}
          type="button"
          onClick={() => setIsReferenceOpen((current) => !current)}
        >
          <referenceNavItem.icon aria-hidden="true" size={18} />
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-left whitespace-nowrap">
                {t(referenceNavItem.labelKey)}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={[
                  "shrink-0 transition-transform",
                  isReferenceOpen ? "rotate-180" : "",
                ].join(" ")}
                size={16}
              />
            </>
          )}
        </button>

        {!isCollapsed && isReferenceOpen && (
          <div className="grid gap-1 pl-7">
            {referenceNavItems.map((item) => (
              <NavLink
                key={item.href}
                className={({ isActive }) =>
                  [
                    "flex min-h-9 items-center rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")
                }
                to={item.href}
              >
                <span className="truncate">{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {items.map((item) => (
        <NavLink
          key={item.href}
          title={isCollapsed ? t(item.labelKey) : undefined}
          className={({ isActive }) =>
            [
              "flex min-h-10 items-center rounded-lg text-sm font-semibold",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
              isActive
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")
          }
          to={item.href}
        >
          <item.icon aria-hidden="true" size={18} />
          {!isCollapsed && (
            <span className="truncate whitespace-nowrap">{t(item.labelKey)}</span>
          )}
        </NavLink>
      ))}
    </section>
  );
}
