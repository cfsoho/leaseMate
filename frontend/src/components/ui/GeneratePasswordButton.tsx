import { useState } from "react";

import type { TranslationKey } from "../../lib/i18n/translations";
import { generateStrongPassword } from "../../lib/auth/passwordGenerator";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type PasswordGenerationLabels = {
  close: string;
  copied: string;
  copy: string;
  title: string;
  warning: string;
};

export function getPasswordGenerationLabels(
  t: (key: TranslationKey) => string,
): PasswordGenerationLabels {
  return {
    close: t("profile.close"),
    copied: t("form.passwordCopied"),
    copy: t("form.copyPassword"),
    title: t("form.generatedPasswordTitle"),
    warning: t("form.generatedPasswordWarning"),
  };
}

export function GeneratePasswordButton({
  disabled,
  label,
  labels,
  onGenerate,
}: {
  disabled?: boolean;
  label: string;
  labels: PasswordGenerationLabels;
  onGenerate: (password: string) => void;
}) {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    if (!generatedPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  function handleGenerate() {
    const nextPassword = generateStrongPassword();
    setGeneratedPassword(nextPassword);
    setIsCopied(false);
    onGenerate(nextPassword);
  }

  return (
    <>
      <button
        className="lm-generate-password-button"
        disabled={disabled}
        type="button"
        onClick={handleGenerate}
      >
        {label}
      </button>
      {generatedPassword && (
        <Modal title={labels.title}>
          <p className="lm-generated-password-warning">
            {labels.warning}
          </p>
          <div className="lm-generated-password-value">
            {generatedPassword}
          </div>
          <div className="lm-generated-password-actions">
            <Button variant="secondary" onClick={handleCopy}>
              {isCopied ? labels.copied : labels.copy}
            </Button>
            <Button onClick={() => setGeneratedPassword(null)}>
              {labels.close}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
