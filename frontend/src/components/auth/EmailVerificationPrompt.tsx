import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailWarning } from "lucide-react";

import {
  resendEmailVerification,
  updateCurrentUser,
} from "../../features/auth/authApi";
import type { CurrentUser } from "../../features/auth/authTypes";
import { useTranslation } from "../../lib/i18n/useTranslation";

type EmailVerificationPromptProps = {
  currentUser: CurrentUser;
  compact?: boolean;
};

export function EmailVerificationPrompt({
  currentUser,
  compact = false,
}: EmailVerificationPromptProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(currentUser.email);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmail(currentUser.email);
  }, [currentUser.email]);

  const sendVerification = useMutation({
    mutationFn: async () => {
      const nextEmail = email.trim();

      if (!nextEmail) {
        throw new Error(t("form.emailInvalid"));
      }

      if (nextEmail !== currentUser.email) {
        await updateCurrentUser({ email: nextEmail });
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      }

      return resendEmailVerification();
    },
    onSuccess: (result) => {
      if (result.already_verified) {
        queryClient.invalidateQueries({ queryKey: ["current-user"] });
        setMessage(t("dashboard.emailAlreadyVerified"));
        return;
      }

      setIsEditingEmail(false);
      setMessage(
        result.email_sent
          ? t("dashboard.verificationEmailSent")
          : t("dashboard.verificationEmailSendFailed"),
      );
    },
    onError: (error) => {
      setMessage(
        error instanceof Error
          ? error.message
          : t("dashboard.verificationEmailSendFailed"),
      );
    },
  });

  return (
    <div
      className={[
        compact
          ? "grid gap-4"
          : "flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-950 sm:flex-row sm:items-start sm:justify-between",
      ].join(" ")}
    >
      <div className={compact ? "grid gap-2" : "flex items-start gap-3"}>
        {!compact && (
          <MailWarning aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
        )}
        <div>
          {!compact && (
            <h2 className="font-bold">{t("dashboard.emailNotVerifiedTitle")}</h2>
          )}
          <p
            className={[
              "mt-1 text-sm leading-relaxed",
              compact ? "text-slate-600" : "text-rose-900",
            ].join(" ")}
          >
            {t("dashboard.emailNotVerifiedMessage")}
          </p>
          <div className="mt-3 grid gap-2">
            <label
              className={[
                "grid gap-1 text-sm font-semibold",
                compact ? "text-slate-700" : "text-rose-950",
              ].join(" ")}
            >
              {t("dashboard.confirmEmailAddress")}
              <input
                className={[
                  "min-h-10 rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none focus:ring-4",
                  compact
                    ? "border-slate-300 focus:border-slate-950 focus:ring-slate-950/10"
                    : "border-rose-200 focus:border-rose-500 focus:ring-rose-500/15",
                ].join(" ")}
                disabled={!isEditingEmail || sendVerification.isPending}
                maxLength={254}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              className={[
                "justify-self-start text-sm font-semibold underline-offset-4 hover:underline",
                compact ? "text-slate-700 hover:text-slate-950" : "text-rose-700",
              ].join(" ")}
              disabled={sendVerification.isPending}
              type="button"
              onClick={() => {
                setMessage(null);
                setIsEditingEmail((current) => !current);
              }}
            >
              {isEditingEmail
                ? t("dashboard.keepCurrentEmail")
                : t("dashboard.correctEmail")}
            </button>
          </div>
          {sendVerification.isPending && (
            <p
              className={[
                "mt-3 inline-flex items-center gap-2 text-sm font-semibold",
                compact ? "text-slate-700" : "text-rose-700",
              ].join(" ")}
            >
              <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              {t("dashboard.verificationInProgress")}
            </p>
          )}
          {message && (
            <p
              className={[
                "mt-2 text-sm font-semibold",
                compact ? "text-slate-700" : "text-rose-900",
              ].join(" ")}
            >
              {message}
            </p>
          )}
        </div>
      </div>
      <button
        className={[
          "lm-button shrink-0",
          compact
            ? "lm-button-primary"
            : "lm-button-warning",
        ].join(" ")}
        disabled={sendVerification.isPending}
        type="button"
        onClick={() => {
          setMessage(null);
          sendVerification.mutate();
        }}
      >
        {sendVerification.isPending
          ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              {t("dashboard.sendingVerificationEmail")}
            </>
          )
          : t("dashboard.resendVerificationEmail")}
      </button>
    </div>
  );
}
