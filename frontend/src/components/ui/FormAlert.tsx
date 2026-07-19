import type { ReactNode } from "react";

type FormAlertTone = "error" | "info" | "success";

type FormAlertProps = {
  children: ReactNode;
  tone?: FormAlertTone;
};

const toneClasses: Record<FormAlertTone, string> = {
  error: "lm-form-alert-error",
  info: "lm-form-alert-info",
  success: "lm-form-alert-success",
};

export function FormAlert({ children, tone = "error" }: FormAlertProps) {
  return (
    <div
      className={[
        "lm-form-alert",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </div>
  );
}
