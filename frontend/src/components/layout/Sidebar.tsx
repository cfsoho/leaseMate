import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useTranslation } from "../../lib/i18n/useTranslation";
import { NavigationSections } from "./NavigationSections";

type SidebarProps = {
  isCollapsed: boolean;
  onExpandCollapsed: () => void;
  onToggleCollapsed: () => void;
};

export function Sidebar({
  isCollapsed,
  onExpandCollapsed,
  onToggleCollapsed,
}: SidebarProps) {
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
        <NavigationSections
          isCollapsed={isCollapsed}
          onExpandCollapsed={onExpandCollapsed}
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
