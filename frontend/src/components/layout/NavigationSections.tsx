import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { useTranslation } from "../../lib/i18n/useTranslation";
import {
  adminNavItems,
  mainNavItems,
  referenceNavItem,
  referenceNavItems,
} from "./navigation";
import type { NavItem } from "./navigation";

type NavigationSectionsProps = {
  isCollapsed?: boolean;
  onExpandCollapsed?: () => void;
  onNavigate?: () => void;
};

export function NavigationSections({
  isCollapsed = false,
  onExpandCollapsed,
  onNavigate,
}: NavigationSectionsProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isReferenceActive =
    pathname === referenceNavItem.href ||
    pathname.startsWith(`${referenceNavItem.href}/`);
  const [isReferenceOpen, setIsReferenceOpen] = useState(isReferenceActive);

  useEffect(() => {
    setIsReferenceOpen(isReferenceActive);
  }, [isReferenceActive]);

  function closeOpenAccordion() {
    setIsReferenceOpen(false);
    onNavigate?.();
  }

  return (
    <>
      <NavSection
        isCollapsed={isCollapsed}
        items={mainNavItems}
        title={t("nav.workspace")}
        onNavigate={closeOpenAccordion}
      />
      <AdminNavSection
        isReferenceActive={isReferenceActive}
        isReferenceOpen={isReferenceOpen}
        isCollapsed={isCollapsed}
        items={adminNavItems}
        title={t("nav.admin")}
        onExpandCollapsed={onExpandCollapsed}
        onNavigate={closeOpenAccordion}
        onReferenceOpenChange={setIsReferenceOpen}
        onReferenceNavigate={onNavigate}
      />
    </>
  );
}

type NavSectionProps = {
  title: string;
  items: NavItem[];
  isCollapsed: boolean;
  onExpandCollapsed?: () => void;
  onNavigate?: () => void;
};

function NavSection({
  title,
  items,
  isCollapsed,
  onNavigate,
}: NavSectionProps) {
  const { pathname, search } = useLocation();
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(search);
  const selectedId = searchParams.get("selected");

  return (
    <section className="grid gap-1">
      {!isCollapsed && (
        <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isChildActive =
          pathname === item.href && Boolean(selectedId) && Boolean(item.childLabelKey);

        return (
          <div key={item.href} className="grid gap-1">
            <NavLink
              title={isCollapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                [
                  "flex min-h-10 items-center rounded-lg text-sm font-semibold",
                  isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
                  isActive
                    ? "lm-button-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")
              }
              to={item.href}
              onClick={onNavigate}
            >
              <item.icon aria-hidden="true" size={18} />
              {!isCollapsed && (
                <span className="truncate whitespace-nowrap">{t(item.labelKey)}</span>
              )}
            </NavLink>
            {!isCollapsed && isChildActive && item.childLabelKey && (
              <NavLink
                className="ml-7 flex min-h-8 items-center gap-2 rounded-lg bg-slate-100 px-2.5 text-sm font-semibold whitespace-nowrap text-slate-950 hover:bg-slate-200"
                to={`${item.href}${search}`}
                onClick={onNavigate}
              >
                <span className="font-mono text-slate-400">|-</span>
                <span className="truncate">{t(item.childLabelKey)}</span>
              </NavLink>
            )}
          </div>
        );
      })}
    </section>
  );
}

function AdminNavSection({
  title,
  items,
  isReferenceActive,
  isReferenceOpen,
  isCollapsed,
  onExpandCollapsed,
  onNavigate,
  onReferenceNavigate,
  onReferenceOpenChange,
}: NavSectionProps & {
  isReferenceActive: boolean;
  isReferenceOpen: boolean;
  onReferenceNavigate?: () => void;
  onReferenceOpenChange: (isOpen: boolean) => void;
}) {
  const { pathname, search } = useLocation();
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(search);
  const selectedSetupListId = searchParams.get("selected");

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
              ? "lm-button-primary"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          ].join(" ")}
          type="button"
          onClick={() => {
            if (isCollapsed) {
              onReferenceOpenChange(true);
              onExpandCollapsed?.();
              return;
            }

            onReferenceOpenChange(!isReferenceOpen);
          }}
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
            {referenceNavItems.map((item) => {
              const isChildActive =
                pathname === item.href &&
                Boolean(selectedSetupListId) &&
                Boolean(item.childLabelKey);

              return (
                <div key={item.href} className="grid gap-1">
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "flex min-h-9 items-center rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap",
                        isActive
                          ? "lm-button-primary"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      ].join(" ")
                    }
                    to={item.href}
                    onClick={onReferenceNavigate}
                  >
                    <span className="truncate">{t(item.labelKey)}</span>
                  </NavLink>
                  {isChildActive && item.childLabelKey && (
                    <NavLink
                      className="ml-2 flex min-h-8 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap bg-slate-100 text-slate-950 hover:bg-slate-200"
                      to={`${item.href}${search}`}
                      onClick={onReferenceNavigate}
                    >
                      <span className="font-mono text-slate-400">|-</span>
                      <span className="truncate">
                        {t(item.childLabelKey)}
                      </span>
                    </NavLink>
                  )}
                </div>
              );
            })}
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
                ? "lm-button-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")
          }
          to={item.href}
          onClick={onNavigate}
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
