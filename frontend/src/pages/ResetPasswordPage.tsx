import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AuthCard } from "../components/auth/AuthCard";
import { Button } from "../components/ui/Button";
import { FormAlert } from "../components/ui/FormAlert";
import { getPasswordGenerationLabels } from "../components/ui/GeneratePasswordButton";
import { PasswordInput } from "../components/ui/PasswordInput";
import { appBrand } from "../config/appBrand";
import {
  buildPasswordStrengthItems,
  getPasswordChecks,
  getPasswordStrengthLabels,
  isStrongPassword,
} from "../components/ui/PasswordStrength";
import {
  getPasswordResetTokenStatus,
  resetPassword,
} from "../features/auth/authApi";
import { useTranslation } from "../lib/i18n/useTranslation";

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    confirmPassword: "",
    newPassword: "",
  });
  const passwordChecks = getPasswordChecks(form.newPassword);
  const passwordIsStrong = isStrongPassword(form.newPassword);
  const passwordsMatch = form.newPassword === form.confirmPassword;
  const tokenStatus = useQuery({
    queryKey: ["password-reset-token", token],
    queryFn: () => getPasswordResetTokenStatus(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });
  const resetPasswordMutation = useMutation({
    mutationFn: () => resetPassword(token ?? "", form.newPassword),
  });
  const canSubmit = Boolean(
    Boolean(token) &&
      tokenStatus.data?.valid &&
      passwordIsStrong &&
      passwordsMatch &&
      !resetPasswordMutation.isPending,
  );

  if (resetPasswordMutation.isSuccess) {
    return (
      <AuthCard
        eyebrow={appBrand.name}
        title={t("auth.resetPasswordSuccessTitle")}
      >
        <p className="text-sm leading-relaxed text-slate-600">
          {t("auth.resetPasswordSuccessBody")}
        </p>
        <Button onClick={() => navigate("/login", { replace: true })}>
          {t("auth.backToLogin")}
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      as="form"
      eyebrow={t("auth.resetPasswordEyebrow")}
      maxWidthClassName="max-w-[460px]"
      title={t("auth.resetPasswordTitle")}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          resetPasswordMutation.mutate();
        }
      }}
    >
      <p className="text-sm leading-relaxed text-slate-600">
        {tokenStatus.isLoading && t("auth.resetPasswordChecking")}
        {tokenStatus.data?.valid && t("auth.resetPasswordBody")}
        {(tokenStatus.isError || (tokenStatus.data && !tokenStatus.data.valid)) &&
          t("auth.resetPasswordInvalid")}
      </p>

      {resetPasswordMutation.isError && (
        <FormAlert>{resetPasswordMutation.error.message}</FormAlert>
      )}

      {tokenStatus.data?.valid && (
        <>
          {tokenStatus.data.email && (
            <div className="grid gap-1">
              <p className="text-sm font-bold text-slate-700">
                {t("form.email")}
              </p>
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {tokenStatus.data.email}
              </p>
            </div>
          )}

          <PasswordInput
            error={
              form.newPassword && !passwordIsStrong
                ? t("form.passwordWeak")
                : undefined
            }
            generate={{
              label: t("form.generatePassword"),
              labels: getPasswordGenerationLabels(t),
              onGenerate: (password) =>
                setForm({
                  confirmPassword: password,
                  newPassword: password,
                }),
            }}
            label={t("profile.newPassword")}
            required
            strength={{
              checks: buildPasswordStrengthItems(passwordChecks, t),
              labels: getPasswordStrengthLabels(t),
              title: t("form.passwordStrength"),
            }}
            value={form.newPassword}
            onChange={(newPassword) =>
              setForm((current) => ({ ...current, newPassword }))
            }
          />

          <PasswordInput
            error={
              form.confirmPassword && !passwordsMatch
                ? t("form.passwordMismatch")
                : undefined
            }
            label={t("form.confirmPassword")}
            required
            value={form.confirmPassword}
            onChange={(confirmPassword) =>
              setForm((current) => ({ ...current, confirmPassword }))
            }
          />

          <Button disabled={!canSubmit} type="submit">
            {resetPasswordMutation.isPending
              ? t("auth.resetPasswordSaving")
              : t("auth.resetPasswordSubmit")}
          </Button>
        </>
      )}

      {!tokenStatus.data?.valid && !tokenStatus.isLoading && (
        <Button
          type="button"
          onClick={() => navigate("/forgot-password", { replace: true })}
        >
          {t("auth.forgotPasswordSubmit")}
        </Button>
      )}
    </AuthCard>
  );
}
