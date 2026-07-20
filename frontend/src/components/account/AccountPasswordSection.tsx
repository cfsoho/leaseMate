import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { changeCurrentUserPassword, getCurrentUser } from "../../features/auth/authApi";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { Button } from "../ui/Button";
import { CollapsibleCard } from "../ui/CollapsibleCard";
import { getPasswordGenerationLabels } from "../ui/GeneratePasswordButton";
import { Modal } from "../ui/Modal";
import { PasswordInput } from "../ui/PasswordInput";
import {
  buildPasswordStrengthItems,
  getPasswordChecks,
  getPasswordStrengthLabels,
  isStrongPassword,
} from "../ui/PasswordStrength";

export function AccountPasswordSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    confirm_password: "",
    new_password: "",
    old_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof typeof passwordForm, string>>
  >({});
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isPasswordErrorModalOpen, setIsPasswordErrorModalOpen] =
    useState(false);
  const [isPasswordSuccessModalOpen, setIsPasswordSuccessModalOpen] =
    useState(false);
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const user = currentUser.data;
  const newPasswordChecks = getPasswordChecks(passwordForm.new_password);
  const passwordGenerationLabels = getPasswordGenerationLabels(t);
  const passwordStrengthItems = buildPasswordStrengthItems(newPasswordChecks, t);
  const passwordStrengthLabels = getPasswordStrengthLabels(t);
  const changePassword = useMutation({
    mutationFn: () => {
      if (!user) {
        throw new Error(t("profile.loadError"));
      }

      return changeCurrentUserPassword(user.id, {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setPasswordForm({
        confirm_password: "",
        new_password: "",
        old_password: "",
      });
      setPasswordErrors({});
      setPasswordMessage(null);
      setIsPasswordSuccessModalOpen(true);
    },
    onError: (error) => {
      setIsPasswordSuccessModalOpen(false);
      setIsPasswordErrorModalOpen(true);
      setPasswordMessage(
        error instanceof Error ? error.message : t("profile.passwordUpdateFailed"),
      );
    },
  });
  const isPasswordChangeReady = Boolean(
    user &&
      (user.password_must_change || passwordForm.old_password.trim()) &&
      passwordForm.new_password.trim() &&
      passwordForm.confirm_password.trim(),
  );
  const isPasswordFormDisabled = changePassword.isPending || currentUser.isLoading;

  return (
    <>
      <CollapsibleCard
        isOpen={isOpen}
        title={t("profile.passwordSection")}
        description={t("profile.passwordDescription")}
        onOpenChange={setIsOpen}
      >
          {currentUser.isLoading && (
            <PasswordNotice message={t("profile.loading")} />
          )}
          {currentUser.isError && (
            <PasswordNotice message={t("profile.loadError")} tone="error" />
          )}
          {passwordMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-normal leading-relaxed text-red-700">
              {passwordMessage}
            </p>
          )}
          {user?.password_must_change && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-normal text-amber-900">
              {t("profile.passwordMustChange")}
            </p>
          )}
          {user && (
        <form
          className="grid gap-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors = validatePasswordChangeForm(passwordForm, {
              mismatch: t("form.passwordMismatch"),
              requireOldPassword: !user.password_must_change,
              required: t("form.requiredMessage"),
              sameAsCurrent: t("profile.passwordSameAsCurrent"),
              weak: t("form.passwordWeak"),
            });
            setPasswordErrors(nextErrors);
            setPasswordMessage(null);
            setIsPasswordErrorModalOpen(false);
            setIsPasswordSuccessModalOpen(false);

            if (Object.keys(nextErrors).length === 0) {
              changePassword.mutate();
            }
          }}
        >
          <div className="grid gap-3">
            {!user.password_must_change && (
              <PasswordInput
                autoComplete="current-password"
                disabled={isPasswordFormDisabled}
                error={passwordErrors.old_password}
                inputClassName={inputClass}
                label={t("profile.oldPassword")}
                name="old_password"
                maxLength={128}
                value={passwordForm.old_password}
                onChange={(value) =>
                  setPasswordForm((current) => ({
                    ...current,
                    old_password: value,
                  }))
                }
              />
            )}
            <PasswordInput
              autoComplete="new-password"
              disabled={isPasswordFormDisabled}
              error={passwordErrors.new_password}
              generate={{
                label: t("form.generatePassword"),
                labels: passwordGenerationLabels,
                onGenerate: (generatedPassword) => {
                  setPasswordForm((current) => ({
                    ...current,
                    confirm_password: generatedPassword,
                    new_password: generatedPassword,
                  }));
                },
              }}
              inputClassName={inputClass}
              label={t("profile.newPassword")}
              maxLength={128}
              name="new_password"
              strength={{
                checks: passwordStrengthItems,
                labels: passwordStrengthLabels,
                title: t("form.passwordStrength"),
              }}
              value={passwordForm.new_password}
              onChange={(value) =>
                setPasswordForm((current) => ({
                  ...current,
                  new_password: value,
                }))
              }
            />
            <PasswordInput
              autoComplete="new-password"
              disabled={isPasswordFormDisabled}
              error={passwordErrors.confirm_password}
              inputClassName={inputClass}
              label={t("form.confirmPassword")}
              maxLength={128}
              name="confirm_password"
              value={passwordForm.confirm_password}
              onChange={(value) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirm_password: value,
                }))
              }
            />
          </div>
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Button
              disabled={isPasswordFormDisabled || !isPasswordChangeReady}
              type="submit"
            >
              {changePassword.isPending
                ? t("profile.saving")
                : t("profile.changePassword")}
            </Button>
          </div>
        </form>
          )}
      </CollapsibleCard>
      {passwordMessage && isPasswordErrorModalOpen && (
        <Modal title={t("profile.passwordUpdateFailedTitle")}>
          <p className="mt-2 text-sm font-normal leading-relaxed text-slate-700">
            {passwordMessage}
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setIsPasswordErrorModalOpen(false)}>
              {t("profile.close")}
            </Button>
          </div>
        </Modal>
      )}
      {isPasswordSuccessModalOpen && (
        <Modal title={t("profile.passwordUpdatedTitle")}>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t("profile.passwordUpdatedBody")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t("profile.passwordUpdatedGeneratedReminder")}
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setIsPasswordSuccessModalOpen(false)}>
              {t("profile.close")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

const inputClass =
  "min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10";

function PasswordNotice({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <section
      className={[
        "rounded-lg border bg-white p-5 text-sm font-semibold",
        tone === "error"
          ? "border-red-200 text-red-700"
          : "border-slate-200 text-slate-500",
      ].join(" ")}
    >
      {message}
    </section>
  );
}

function validatePasswordChangeForm(
  value: {
    confirm_password: string;
    new_password: string;
    old_password: string;
  },
  messages: {
    mismatch: string;
    requireOldPassword: boolean;
    required: string;
    sameAsCurrent: string;
    weak: string;
  },
) {
  const errors: Partial<Record<keyof typeof value, string>> = {};

  if (messages.requireOldPassword && !value.old_password.trim()) {
    errors.old_password = messages.required;
  }

  if (!value.new_password.trim()) {
    errors.new_password = messages.required;
  } else if (value.old_password && value.new_password === value.old_password) {
    errors.new_password = messages.sameAsCurrent;
  } else if (!isStrongPassword(value.new_password)) {
    errors.new_password = messages.weak;
  }

  if (!value.confirm_password.trim()) {
    errors.confirm_password = messages.required;
  } else if (value.new_password !== value.confirm_password) {
    errors.confirm_password = messages.mismatch;
  }

  return errors;
}
