import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import { AuthCard } from "../components/auth/AuthCard";
import { Button } from "../components/ui/Button";
import { FormAlert } from "../components/ui/FormAlert";
import { appBrand } from "../config/appBrand";
import { requestPasswordReset } from "../features/auth/authApi";
import { getLastLoginEmail } from "../lib/auth/tokenStorage";
import { useTranslation } from "../lib/i18n/useTranslation";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState(() => getLastLoginEmail() ?? "");
  const passwordReset = useMutation({
    mutationFn: requestPasswordReset,
  });

  return (
    <AuthCard
      as="form"
      eyebrow={appBrand.name}
      title={t("auth.forgotPasswordTitle")}
      onSubmit={(event) => {
        event.preventDefault();
        passwordReset.mutate(email.trim());
      }}
    >
      <p className="text-sm leading-relaxed text-slate-600">
        {t("auth.forgotPasswordBody")}
      </p>

      {passwordReset.isError && (
        <FormAlert>{passwordReset.error.message}</FormAlert>
      )}

      {passwordReset.isSuccess && (
        <FormAlert tone="info">
          <p className="font-semibold text-slate-950">
            {t("auth.forgotPasswordSentTitle")}
          </p>
          <p className="mt-1 font-normal">
            {t("auth.forgotPasswordSentBody")}
          </p>
        </FormAlert>
      )}

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        {t("form.email")}
        <input
          autoComplete="email"
          className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <Button
        disabled={passwordReset.isPending || passwordReset.isSuccess || !email.trim()}
        type="submit"
      >
        {passwordReset.isPending
          ? t("auth.forgotPasswordSending")
          : t("auth.forgotPasswordSubmit")}
      </Button>

      <Link
        className="w-fit text-sm font-semibold text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
        to="/login"
      >
        {t("auth.backToLogin")}
      </Link>
    </AuthCard>
  );
}
