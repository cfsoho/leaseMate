import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useCollapsibleCardContainer } from "./CollapsibleCardContainer";

type CollapsibleCardProps = {
  action?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
  className?: string;
  collapsible?: boolean;
  description?: ReactNode;
  id?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  summary?: ReactNode;
  title: ReactNode;
};

export function CollapsibleCard({
  action,
  bodyClassName = "grid gap-4 px-5 pb-5",
  children,
  className = "",
  collapsible = true,
  description,
  id,
  isOpen,
  onOpenChange,
  summary,
  title,
}: CollapsibleCardProps) {
  const cardContainer = useCollapsibleCardContainer();
  const hasContentBelowHeader = Boolean(summary || (isOpen && children));
  const hasContentBelowSummary = Boolean(summary && isOpen && children);
  const setCardOpen = (nextIsOpen: boolean) => {
    onOpenChange(nextIsOpen);
    cardContainer?.requestLayoutReflow();
  };

  const toggleCard = () => {
    if (!collapsible) {
      return;
    }

    setCardOpen(!isOpen);
  };

  return (
    <section
      id={id}
      className={[
        "lm-card rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "grid w-full gap-1 px-5 pt-5 text-left",
          hasContentBelowHeader ? "pb-2.5" : "pb-5",
          collapsible ? "cursor-pointer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={toggleCard}
      >
        <div className="flex w-full items-start justify-between gap-4">
          <span className="text-base font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {(action || collapsible) && (
            <span
              className="flex shrink-0 items-center justify-end gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              {action}
              {collapsible && (
                <button
                  aria-expanded={isOpen}
                  className="inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  type="button"
                  onClick={() => setCardOpen(!isOpen)}
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={[
                      "shrink-0 transition-transform",
                      isOpen ? "rotate-180" : "",
                    ].join(" ")}
                    size={18}
                  />
                </button>
              )}
            </span>
          )}
        </div>
        {description && (
          <span className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </span>
        )}
      </div>
      {summary && (
        <div
          className={[
            "px-5",
            hasContentBelowSummary ? "pb-2.5" : "pb-5",
            collapsible ? "cursor-pointer" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={toggleCard}
        >
          {summary}
        </div>
      )}
      {isOpen && children && <div className={bodyClassName}>{children}</div>}
    </section>
  );
}
