import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { verifySystemEmailSettings } from "../features/settings/settingsApi";
import { useTranslation } from "../lib/i18n/useTranslation";

export function SystemEmailVerificationPage() {
  const { token } = useParams();
  const { t } = useTranslation();
  const [closeMessage, setCloseMessage] = useState<string | null>(null);
  const verification = useQuery({
    queryKey: ["system-settings", "email", "verify", token],
    queryFn: () => verifySystemEmailSettings(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="grid w-full max-w-[440px] gap-[18px] rounded-lg border border-slate-200 bg-white p-6">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          {t("settings.emailVerificationEyebrow")}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-slate-950">
          {t("settings.emailVerificationTitle")}
        </h1>
        <p className="leading-relaxed text-slate-500">
          {verification.isLoading && t("settings.emailVerificationChecking")}
          {verification.isSuccess &&
            (verification.data.is_ready
              ? t("settings.emailVerificationSuccess")
              : t("settings.emailVerificationPartialSuccess"))}
          {verification.isError && t("settings.emailVerificationFailed")}
        </p>
        <button
          className="lm-button-primary inline-flex min-h-8 items-center justify-center rounded-md border px-2.5 text-sm font-semibold"
          type="button"
          onClick={() => {
            window.close();
            setCloseMessage(t("auth.closeTabFallback"));
          }}
        >
          {t("settings.emailVerificationClose")}
        </button>
        {closeMessage && (
          <p className="text-center text-xs font-semibold text-slate-500">
            {closeMessage}
          </p>
        )}
      </section>
    </main>
  );
}
