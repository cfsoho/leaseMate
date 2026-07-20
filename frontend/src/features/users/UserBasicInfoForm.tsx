import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "../../components/ui/Button";
import { FormAlert } from "../../components/ui/FormAlert";
import { PhoneInput } from "../../components/ui/PhoneInput";
import { passwordManagerIgnoreProps } from "../../components/ui/inputSecurity";
import type { BootstrapLocale, ProfileCountry } from "../auth/authTypes";

export type UserBasicInfoFormValue = {
  family_name: string;
  given_name: string;
  email?: string;
  phone: string;
  phone_country_id: string;
  preferred_locale_code: string;
};

type UserBasicInfoFormProps = {
  cancelLabel: string;
  countries: ProfileCountry[];
  disabled?: boolean;
  emailRequired?: boolean;
  locales: BootstrapLocale[];
  localeCode: string;
  submitError?: string;
  submitLabel: string;
  value: UserBasicInfoFormValue;
  onCancel: () => void;
  onChange: (value: UserBasicInfoFormValue) => void;
  onSubmit: (value: UserBasicInfoFormValue) => void;
};

export function UserBasicInfoForm({
  cancelLabel,
  countries,
  disabled = false,
  emailRequired = false,
  locales,
  localeCode,
  submitError,
  submitLabel,
  value,
  onCancel,
  onChange,
  onSubmit,
}: UserBasicInfoFormProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const selectedLocaleCode = value.preferred_locale_code || localeCode;
  const orderedNameFields = useMemo(
    () => getOrderedNameFields(locales, selectedLocaleCode),
    [locales, selectedLocaleCode],
  );
  const alertMessages = [...validationErrors, ...(submitError ? [submitError] : [])];

  function updateValue(next: Partial<UserBasicInfoFormValue>) {
    onChange({ ...value, ...next });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateUserBasicInfo(value, emailRequired);
    setValidationErrors(nextErrors);

    if (nextErrors.length > 0) {
      return;
    }

    onSubmit({
      ...value,
      family_name: value.family_name.trim(),
      given_name: value.given_name.trim(),
      email: value.email?.trim(),
      phone: value.phone.trim(),
      preferred_locale_code: value.preferred_locale_code.trim(),
    });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {alertMessages.length > 0 && (
        <FormAlert>
          {alertMessages.length === 1 ? (
            alertMessages[0]
          ) : (
            <ul className="list-disc pl-4">
              {alertMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </FormAlert>
      )}

      <div className="grid gap-4">
        <FormField label="Preferred locale" required>
          <select
            className="lm-form-input"
            disabled={disabled}
            value={value.preferred_locale_code}
            onChange={(event) =>
              updateValue({ preferred_locale_code: event.target.value })
            }
          >
            <option value="">--</option>
            {locales.map((localeOption) => (
              <option key={localeOption.code} value={localeOption.code}>
                {localeOption.native_name || localeOption.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid items-start gap-4 md:grid-cols-2">
          {orderedNameFields.map((field) => (
            <FormField key={field.name} label={field.label} required>
              <input
                {...passwordManagerIgnoreProps}
                className="lm-form-input"
                disabled={disabled}
                maxLength={50}
                value={value[field.name]}
                onChange={(event) => updateValue({ [field.name]: event.target.value })}
              />
            </FormField>
          ))}
        </div>

        {emailRequired && (
          <FormField label="Email" required>
            <input
              {...passwordManagerIgnoreProps}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              className="lm-form-input"
              disabled={disabled}
              maxLength={255}
              spellCheck={false}
              type="email"
              value={value.email ?? ""}
              onChange={(event) => updateValue({ email: event.target.value })}
            />
          </FormField>
        )}

        <FormField label="Phone">
          <PhoneInput
            countries={countries}
            countryId={value.phone_country_id}
            disabled={disabled}
            inputClassName="lm-form-input"
            phone={value.phone}
            onChange={(phoneValue) => updateValue(phoneValue)}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button disabled={disabled} type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button disabled={disabled} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  children,
  label,
  required,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="lm-form-label">
      <span>
        {label}
        {required && <span className="lm-form-required"> *</span>}
      </span>
      {children}
    </label>
  );
}

function validateUserBasicInfo(
  value: UserBasicInfoFormValue,
  emailRequired: boolean,
) {
  const errors: string[] = [];

  if (!value.preferred_locale_code.trim()) {
    errors.push("Preferred locale is required.");
  }

  if (!value.family_name.trim()) {
    errors.push("Family name is required.");
  }

  if (!value.given_name.trim()) {
    errors.push("Given name is required.");
  }

  if (emailRequired) {
    const email = value.email?.trim() ?? "";

    if (!email) {
      errors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Email format is not valid.");
    }
  }

  return errors;
}

function getOrderedNameFields(
  locales: BootstrapLocale[],
  localeCode: string,
): Array<{
  label: string;
  name: "family_name" | "given_name";
}> {
  const locale = locales.find((option) => option.code === localeCode);
  const isFamilyFirst =
    locale?.name_order === "FAMILY_GIVEN" ||
    (!locale?.name_order && !localeCode.toLowerCase().startsWith("en"));

  const fields: Array<{
    label: string;
    name: "family_name" | "given_name";
  }> = [
    { label: "Given name", name: "given_name" },
    { label: "Family name", name: "family_name" },
  ];

  return isFamilyFirst ? fields.reverse() : fields;
}
