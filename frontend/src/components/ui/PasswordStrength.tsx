import type { TranslationKey } from "../../lib/i18n/translations";
import { Check, Circle, X } from "lucide-react";

export type PasswordCheckKey =
  | "lowercase"
  | "minLength"
  | "number"
  | "symbol"
  | "uppercase";

export type PasswordChecks = Record<PasswordCheckKey, boolean>;

export type PasswordStrengthLabels = {
  fair: string;
  ok: string;
  strong: string;
  weak: string;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    lowercase: /[a-z]/.test(password),
    minLength: password.length >= 8,
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };
}

export function isStrongPassword(password: string) {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

export function getPasswordStrengthLabels(
  t: (key: TranslationKey) => string,
): PasswordStrengthLabels {
  return {
    fair: t("form.passwordStrengthFair"),
    ok: t("form.passwordStrengthOk"),
    strong: t("form.passwordStrengthStrong"),
    weak: t("form.passwordStrengthWeak"),
  };
}

export function buildPasswordStrengthItems(
  checks: PasswordChecks,
  t: (key: TranslationKey) => string,
) {
  return [
    {
      isMet: checks.minLength,
      label: t("form.passwordMinLength"),
    },
    {
      isMet: checks.uppercase,
      label: t("form.passwordUppercase"),
    },
    {
      isMet: checks.lowercase,
      label: t("form.passwordLowercase"),
    },
    {
      isMet: checks.number,
      label: t("form.passwordNumber"),
    },
    {
      isMet: checks.symbol,
      label: t("form.passwordSymbol"),
    },
  ];
}

export function PasswordStrengthList({
  checks,
  className = "",
  labels,
  title,
}: {
  checks: { isMet: boolean; label: string }[];
  className?: string;
  labels: PasswordStrengthLabels;
  title: string;
}) {
  const strength = getPasswordStrength(checks, labels);
  const hasPasswordInput = checks.some((check) => check.isMet);

  return (
    <div className={["lm-password-strength", className].filter(Boolean).join(" ")}>
      <div className="lm-password-strength-header">
        <p className="lm-password-strength-title">
          {title}
        </p>
        {strength && (
          <span
            className={[
              "lm-password-strength-badge",
              strength.className,
            ].join(" ")}
          >
            {strength.label}
          </span>
        )}
      </div>
      <ul className="lm-password-strength-list">
        {checks.map((check) => (
          <li
            className={`lm-password-strength-item ${
              check.isMet
                ? "lm-password-strength-met"
                : hasPasswordInput
                  ? "lm-password-strength-unmet"
                  : "lm-password-strength-neutral"
            }`}
            key={check.label}
          >
            {check.isMet && <Check aria-hidden="true" size={13} strokeWidth={3} />}
            {!check.isMet && hasPasswordInput && (
              <X aria-hidden="true" size={13} strokeWidth={3} />
            )}
            {!check.isMet && !hasPasswordInput && (
              <Circle aria-hidden="true" size={10} strokeWidth={2.5} />
            )}
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getPasswordStrength(
  checks: { isMet: boolean; label: string }[],
  labels: PasswordStrengthLabels,
) {
  const metCount = checks.filter((check) => check.isMet).length;

  if (metCount === 0) {
    return null;
  }

  if (metCount === checks.length) {
    return {
      className: "lm-password-strength-strong",
      label: labels.strong,
    };
  }

  if (metCount >= 4) {
    return {
      className: "lm-password-strength-ok",
      label: labels.ok,
    };
  }

  if (metCount >= 2) {
    return {
      className: "lm-password-strength-fair",
      label: labels.fair,
    };
  }

  return {
    className: "lm-password-strength-weak",
    label: labels.weak,
  };
}
