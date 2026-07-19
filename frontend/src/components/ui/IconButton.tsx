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
  danger: "lm-icon-button-danger",
  primary: "lm-icon-button-primary",
  secondary: "lm-icon-button-secondary",
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
    <span className="lm-icon-button-wrap">
      <button
        aria-label={label}
        className={[
          "lm-icon-button",
          toneClasses[tone],
        ].filter(Boolean).join(" ")}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
      {!hideTooltip && (
        <span className="lm-icon-button-tooltip">
          {label}
        </span>
      )}
    </span>
  );
}
