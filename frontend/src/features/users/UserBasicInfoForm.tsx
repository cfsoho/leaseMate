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
  emailEditable?: boolean;
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

type UserBasicInfoField =
  | "email"
  | "family_name"
  | "given_name"
  | "preferred_locale_code";

export function UserBasicInfoForm({
  cancelLabel,
  countries,
  disabled = false,
  emailEditable,
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
  const [invalidFields, setInvalidFields] = useState<UserBasicInfoField[]>([]);
  const shouldShowEmail = emailEditable || emailRequired;
  const selectedLocaleCode = value.preferred_locale_code || localeCode;
  const orderedNameFields = useMemo(
    () => getOrderedNameFields(locales, selectedLocaleCode),
    [locales, selectedLocaleCode],
  );
  const alertMessages = [...validationErrors, ...(submitError ? [submitError] : [])];

  function updateValue(next: Partial<UserBasicInfoFormValue>) {
    const changedInvalidFields = userBasicInfoFields.filter((field) => field in next);
    if (changedInvalidFields.length > 0) {
      setInvalidFields((current) =>
        current.filter((field) => !changedInvalidFields.includes(field)),
      );
    }
    onChange({ ...value, ...next });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValidation = validateUserBasicInfo(value, shouldShowEmail);
    setValidationErrors(nextValidation.messages);
    setInvalidFields(nextValidation.fields);

    if (nextValidation.messages.length > 0) {
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
      {alertMessages.length > 0 && <FormAlert messages={alertMessages} />}

      <div className="grid gap-4">
        <FormField
          invalid={invalidFields.includes("preferred_locale_code")}
          label="Preferred locale"
          required
        >
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
            <FormField
              invalid={invalidFields.includes(field.name)}
              key={field.name}
              label={field.label}
              required
            >
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

        {shouldShowEmail && (
          <FormField invalid={invalidFields.includes("email")} label="Email" required>
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
  invalid,
  label,
  required,
}: {
  children: ReactNode;
  invalid?: boolean;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      className={["lm-form-label", invalid ? "lm-form-field-invalid" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="lm-form-label-line">
        {label}
        {required && <span className="lm-form-required"> *</span>}
      </span>
      {children}
    </label>
  );
}

function validateUserBasicInfo(
  value: UserBasicInfoFormValue,
  validateEmail: boolean,
) {
  const messages: string[] = [];
  const fields: UserBasicInfoField[] = [];

  if (!value.preferred_locale_code.trim()) {
    messages.push("Preferred locale is required.");
    fields.push("preferred_locale_code");
  }

  if (!value.family_name.trim()) {
    messages.push("Family name is required.");
    fields.push("family_name");
  }

  if (!value.given_name.trim()) {
    messages.push("Given name is required.");
    fields.push("given_name");
  }

  if (validateEmail) {
    const email = value.email?.trim() ?? "";

    if (!email) {
      messages.push("Email is required.");
      fields.push("email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      messages.push("Email format is not valid.");
      fields.push("email");
    }
  }

  return { fields, messages };
}

const userBasicInfoFields: UserBasicInfoField[] = [
  "email",
  "family_name",
  "given_name",
  "preferred_locale_code",
];

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
