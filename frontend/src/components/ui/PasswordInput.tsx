import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  GeneratePasswordButton,
  type PasswordGenerationLabels,
} from "./GeneratePasswordButton";
import {
  PasswordStrengthList,
  type PasswordStrengthLabels,
} from "./PasswordStrength";

const defaultInputClass = "lm-form-input";

export const PasswordInput = forwardRef<HTMLInputElement, {
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  generate?: {
    label: string;
    labels: PasswordGenerationLabels;
    onGenerate: (password: string) => void;
  };
  inputClassName?: string;
  label: string;
  maxLength?: number;
  name?: string;
  required?: boolean;
  strength?: {
    checks: { isMet: boolean; label: string }[];
    labels: PasswordStrengthLabels;
    title: string;
  };
  value: string;
  onChange: (value: string) => void;
}>(function PasswordInput({
  autoComplete = "new-password",
  disabled,
  error,
  generate,
  inputClassName = defaultInputClass,
  label,
  maxLength = 128,
  name,
  required,
  strength,
  value,
  onChange,
}, ref) {
  const [isVisible, setIsVisible] = useState(false);
  const inputName =
    name ??
    (autoComplete === "current-password"
      ? "password"
      : autoComplete === "new-password"
        ? "new_password"
        : undefined);

  return (
    <label
      className={["lm-form-label", error ? "lm-form-field-invalid" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="lm-form-label-line">
        {label}
        {required && <span className="lm-form-required"> *</span>}
      </span>
      <span className="lm-password-field">
        <input
          autoComplete={autoComplete}
          className={`${inputClassName} lm-password-input`}
          disabled={disabled}
          maxLength={maxLength}
          name={inputName}
          ref={ref}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="lm-password-toggle"
          disabled={disabled}
          tabIndex={-1}
          type="button"
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </span>
      {error && (
        <span className="lm-form-error">
          {error}
        </span>
      )}
      {generate && (
        <GeneratePasswordButton
          disabled={disabled}
          label={generate.label}
          labels={generate.labels}
          onGenerate={generate.onGenerate}
        />
      )}
      {strength && (
        <PasswordStrengthList
          checks={strength.checks}
          labels={strength.labels}
          title={strength.title}
        />
      )}
    </label>
  );
});
