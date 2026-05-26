import type { ReactNode } from "react";

type IconButtonTone = "danger" | "primary" | "secondary";

type IconButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  hideTooltip?: boolean;
  label: string;
  tone?: IconButtonTone;
  onClick: () => void;
};

const toneClasses: Record<IconButtonTone, string> = {
  danger: "border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800",
  primary: "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white",
  secondary: "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950",
};

export function IconButton({
  children,
  disabled = false,
  hideTooltip = false,
  label,
  tone = "primary",
  onClick,
}: IconButtonProps) {
  return (
    <span className="group relative inline-flex">
      <button
        aria-label={label}
        className={[
          "grid size-8 place-items-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40",
          toneClasses[tone],
        ].join(" ")}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
      {!hideTooltip && (
        <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden max-w-48 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-normal text-white shadow-lg group-hover:block group-focus-within:block">
          {label}
        </span>
      )}
    </span>
  );
}
