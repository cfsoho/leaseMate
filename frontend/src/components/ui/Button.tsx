import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-slate-950 text-white hover:bg-slate-800",
  secondary: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "border-transparent bg-transparent text-slate-800 hover:bg-slate-100",
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
        "inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70",
        variantClasses[variant],
        className,
      ].join(" ")}
      type={type}
      {...props}
    />
  );
}
