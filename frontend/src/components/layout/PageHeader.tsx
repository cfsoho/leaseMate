import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  descriptionPlacement?: "below-title" | "aside";
  actions?: ReactNode;
  actionsClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  descriptionPlacement = "below-title",
  actions,
  actionsClassName = "",
}: PageHeaderProps) {
  const useAsideDescription = descriptionPlacement === "aside" && Boolean(description);

  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold leading-tight text-slate-950">
          {title}
        </h1>
        {description && useAsideDescription && (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
        {description && !useAsideDescription && (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className={["flex shrink-0 items-center gap-2", actionsClassName].join(" ")}>
          {actions}
        </div>
      )}
    </div>
  );
}
