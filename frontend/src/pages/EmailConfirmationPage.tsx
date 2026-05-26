import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { confirmEmail } from "../features/auth/authApi";
import { setAccessToken, setRefreshToken } from "../lib/auth/tokenStorage";
import { useTranslation } from "../lib/i18n/useTranslation";

export function EmailConfirmationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [closeMessage, setCloseMessage] = useState<string | null>(null);
  const confirmation = useQuery({
    queryKey: ["confirm-email", token],
    queryFn: () => confirmEmail(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!confirmation.isSuccess) {
      return;
    }

    setAccessToken(confirmation.data.access_token);
    setRefreshToken(confirmation.data.refresh_token);
    queryClient.setQueryData(["current-user"], confirmation.data.user);

    if (confirmation.data.user.password_must_change) {
      navigate("/profile", { replace: true });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["current-user"] });
  }, [confirmation.data, confirmation.isSuccess, navigate, queryClient]);
  const isAlreadyVerified =
    confirmation.error instanceof Error &&
    confirmation.error.message === "Email already verified";

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="grid w-full max-w-[420px] gap-[18px] rounded-lg border border-slate-200 bg-white p-6">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          {t("auth.emailConfirmationEyebrow")}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-slate-950">
          {t("auth.emailConfirmationTitle")}
        </h1>
        <p className="leading-relaxed text-slate-500">
          {confirmation.isLoading && t("auth.emailConfirmationChecking")}
          {confirmation.isSuccess && t("auth.emailConfirmationSuccess")}
          {confirmation.isError &&
            (isAlreadyVerified
              ? t("auth.emailConfirmationAlreadyVerified")
              : t("auth.emailConfirmationFailed"))}
        </p>
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md bg-slate-950 px-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          type="button"
          onClick={() => {
            window.close();
            setCloseMessage(t("auth.closeTabFallback"));
          }}
        >
          {t("auth.closeTab")}
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
