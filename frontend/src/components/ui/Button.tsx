import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "lm-button-primary",
  secondary: "lm-button-secondary",
  ghost: "lm-button-ghost",
};

export function Button({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "lm-button",
        variantClasses[variant],
        className,
      ].filter(Boolean).join(" ")}
      type={type}
      {...props}
    />
  );
}
