import type { ReactNode } from "react";

type FormAlertTone = "error" | "info" | "success";

type FormAlertProps = {
  children?: ReactNode;
  messages?: string[];
  tone?: FormAlertTone;
};

const toneClasses: Record<FormAlertTone, string> = {
  error: "lm-form-alert-error",
  info: "lm-form-alert-info",
  success: "lm-form-alert-success",
};

export function FormAlert({ children, messages, tone = "error" }: FormAlertProps) {
  const cleanedMessages = messages?.filter(Boolean) ?? [];

  return (
    <div
      className={[
        "lm-form-alert",
        toneClasses[tone],
      ].join(" ")}
    >
      {cleanedMessages.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4">
          {cleanedMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        children
      )}
    </div>
  );
}
