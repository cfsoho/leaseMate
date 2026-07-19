import type { FormEvent, ReactNode } from "react";

import { BrandMark } from "../ui/BrandMark";

type AuthCardProps = {
  action?: ReactNode;
  as?: "form" | "section";
  children: ReactNode;
  className?: string;
  eyebrow: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  title: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthCard({
  action,
  as = "section",
  children,
  className = "",
  eyebrow,
  footer,
  maxWidthClassName = "max-w-[420px]",
  title,
  onSubmit,
}: AuthCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <div className="flex h-11 min-w-0 flex-col justify-between">
            <p className="text-xs font-bold uppercase leading-none tracking-wide text-slate-500">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-bold leading-none text-slate-950">
              {title}
            </h1>
          </div>
        </div>

        {action}
      </div>

      {children}

      {footer && <div className="border-t border-slate-100 pt-2">{footer}</div>}
    </>
  );

  const cardClassName = [
    "grid w-full gap-[18px] rounded-lg border border-slate-200 bg-white p-6",
    maxWidthClassName,
    className,
  ].join(" ");

  return (
    <main className="grid min-h-screen place-items-center p-6">
      {as === "form" ? (
        <form className={cardClassName} onSubmit={onSubmit}>
          {content}
        </form>
      ) : (
        <section className={cardClassName}>{content}</section>
      )}
    </main>
  );
}
