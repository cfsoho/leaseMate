import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "../../components/ui/Button";
import {
  inferPhoneCountryId,
  PhoneInput,
} from "../../components/ui/PhoneInput";
import { getBootstrapLocales, getProfileCountries } from "../auth/authApi";
import { useLocaleContext } from "../../lib/i18n/localeContext";
import { isSupportedLocale } from "../../lib/i18n/localeUtils";
import {
  localeOptionLabels,
  supportedLocales,
} from "../../lib/i18n/translations";
import { generateStrongPassword } from "../../lib/auth/passwordGenerator";
import type { SupportedLocale } from "../../lib/i18n/translations";
import type { UserFormValue } from "./userFormTypes";

type UserFormProps = {
  value: UserFormValue;
  onChange: (value: UserFormValue) => void;
  onSubmit: (value: UserFormValue) => void;
  submitLabel: string;
  cancelLabel?: string;
  confirmEmailError?: string;
  confirmEmailValue?: string;
  resetLabel?: string;
  disabled?: boolean;
  density?: "default" | "compact";
  mode?: "edit" | "search";
  syncLocaleToUi?: boolean;
  requireEmailConfirmation?: boolean;
  roleOptions?: { label: string; value: string }[];
  showInvitationHelp?: boolean;
  showPhone?: boolean;
  showPassword?: boolean;
  onCancel?: () => void;
  onConfirmEmailChange?: (value: string) => void;
  onReset?: () => void;
};

const inputClass =
  "min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:bg-slate-100 disabled:text-slate-500";
const USER_FIELD_MAX_LENGTHS = {
  email: 254,
  familyName: 50,
  givenName: 50,
  password: 128,
  phone: 20,
};

export function UserForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  cancelLabel,
  confirmEmailError,
  confirmEmailValue = "",
  resetLabel,
  disabled,
  density = "default",
  mode = "edit",
  syncLocaleToUi = true,
  requireEmailConfirmation = false,
  roleOptions = [],
  showInvitationHelp = true,
  showPhone = true,
  showPassword = true,
  onCancel,
  onConfirmEmailChange,
  onReset,
}: UserFormProps) {
  const { locale, setLocale, t } = useLocaleContext();
  const bootstrapLocales = useQuery({
    queryKey: ["bootstrap-locales"],
    queryFn: getBootstrapLocales,
    staleTime: Infinity,
  });
  const countries = useQuery({
    queryKey: ["profile-countries"],
    queryFn: getProfileCountries,
    enabled: showPhone,
    staleTime: Infinity,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValue, string>>>(
    {},
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const isSearchMode = mode === "search";
  const selectedLocale = value.preferred_locale_code;
  const selectedLocaleForNameOrder = isSupportedLocale(value.preferred_locale_code)
    ? value.preferred_locale_code
    : locale;
  const dbLocaleOptions = (bootstrapLocales.data ?? [])
    .filter((localeOption) => isSupportedLocale(localeOption.code))
    .map((localeOption) => ({
      code: localeOption.code,
      label: localeOption.native_name || localeOption.name,
    }));
  const fallbackLocaleOptions = supportedLocales.map((localeOption) => ({
    code: localeOption,
    label: localeOptionLabels[localeOption],
  }));
  const visibleLocaleOptions =
    dbLocaleOptions.length > 0 ? dbLocaleOptions : fallbackLocaleOptions;
  const selectedLocaleOption = bootstrapLocales.data?.find(
    (localeOption) => localeOption.code === selectedLocale,
  );
  const selectedNameOrder =
    selectedLocaleOption?.name_order === "FAMILY_GIVEN"
      ? "family-first"
      : getNameOrder(selectedLocaleForNameOrder);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateUserForm(value, {
      emailInvalid: t("form.emailInvalid"),
      passwordMismatch: t("form.passwordMismatch"),
      passwordWeak: t("form.passwordWeak"),
      searchMode: isSearchMode,
      requirePassword: showPassword,
      required: t("form.requiredMessage"),
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(value);
  }

  function handleLocaleChange(nextLocale: string) {
    if (syncLocaleToUi && isSupportedLocale(nextLocale)) {
      setLocale(nextLocale);
    }

    const hasPhoneNumber = value.phone.replace(/\D/g, "").length > 0;
    const nextPhoneCountryId =
      value.phone_country_id && hasPhoneNumber
        ? value.phone_country_id
        : inferPhoneCountryId(nextLocale, countries.data);

    onChange({
      ...value,
      phone_country_id: nextPhoneCountryId,
      preferred_locale_code: nextLocale,
    });
  }

  const familyNameField = (
    <Field
      density={density}
      error={errors.family_name}
      key="family-name"
      label={t("form.familyName")}
      required={!isSearchMode}
    >
      <input
        autoComplete="family-name"
        className={inputClass}
        disabled={disabled}
        maxLength={USER_FIELD_MAX_LENGTHS.familyName}
        value={value.family_name}
        onChange={(event) =>
          onChange({ ...value, family_name: event.target.value })
        }
      />
    </Field>
  );

  const givenNameField = (
    <Field
      density={density}
      error={errors.given_name}
      key="given-name"
      label={t("form.givenName")}
      required={!isSearchMode}
    >
      <input
        autoComplete="given-name"
        className={inputClass}
        disabled={disabled}
        maxLength={USER_FIELD_MAX_LENGTHS.givenName}
        value={value.given_name}
        onChange={(event) =>
          onChange({ ...value, given_name: event.target.value })
        }
      />
    </Field>
  );
  const passwordChecks = getPasswordChecks(value.password);
  const passwordInputType = isPasswordVisible ? "text" : "password";
  const passwordField = (
    <Field
      density={density}
      error={errors.password}
      label={t("form.password")}
      required
    >
      <div className="relative">
        <input
          autoComplete="new-password"
          className={`${inputClass} pr-11`}
          disabled={disabled}
          maxLength={USER_FIELD_MAX_LENGTHS.password}
          type={passwordInputType}
          value={value.password}
          onChange={(event) =>
            onChange({ ...value, password: event.target.value })
          }
        />
        <button
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          disabled={disabled}
          tabIndex={-1}
          type="button"
          onClick={() => setIsPasswordVisible((current) => !current)}
        >
          {isPasswordVisible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>
      <button
        className="w-fit text-xs font-semibold text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
        type="button"
        onClick={() => {
          const generatedPassword = generateStrongPassword();
          onChange({
            ...value,
            confirm_password: generatedPassword,
            password: generatedPassword,
          });
        }}
      >
        {t("form.generatePassword")}
      </button>
      <PasswordStrengthList
        checks={[
          {
            isMet: passwordChecks.minLength,
            label: t("form.passwordMinLength"),
          },
          {
            isMet: passwordChecks.uppercase,
            label: t("form.passwordUppercase"),
          },
          {
            isMet: passwordChecks.lowercase,
            label: t("form.passwordLowercase"),
          },
          {
            isMet: passwordChecks.number,
            label: t("form.passwordNumber"),
          },
          {
            isMet: passwordChecks.symbol,
            label: t("form.passwordSymbol"),
          },
        ]}
        title={t("form.passwordStrength")}
      />
    </Field>
  );
  const confirmPasswordField = (
    <Field
      density={density}
      error={errors.confirm_password}
      label={t("form.confirmPassword")}
      required
    >
      <div className="relative">
        <input
          autoComplete="new-password"
          className={`${inputClass} pr-11`}
          disabled={disabled}
          maxLength={USER_FIELD_MAX_LENGTHS.password}
          type={isConfirmPasswordVisible ? "text" : "password"}
          value={value.confirm_password}
          onChange={(event) =>
            onChange({ ...value, confirm_password: event.target.value })
          }
        />
        <button
          aria-label={
            isConfirmPasswordVisible ? "Hide password" : "Show password"
          }
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          disabled={disabled}
          tabIndex={-1}
          type="button"
          onClick={() => setIsConfirmPasswordVisible((current) => !current)}
        >
          {isConfirmPasswordVisible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>
    </Field>
  );

  const sectionClass = density === "compact" ? "grid gap-3" : "grid gap-4";
  const fieldGridClass =
    density === "compact" ? "grid gap-3 lg:grid-cols-2" : "grid gap-4 lg:grid-cols-2";
  return (
    <form className={density === "compact" ? "grid gap-4" : "grid gap-6"} onSubmit={handleSubmit}>
      <section className={sectionClass}>
        <SectionTitle title={t("form.contactPreferences")} />
        <Field
          density={density}
          error={errors.preferred_locale_code}
          label={t("form.preferredLocale")}
          required={!isSearchMode}
        >
          <select
            className={inputClass}
            disabled={disabled}
            value={selectedLocale}
            onChange={(event) => handleLocaleChange(event.target.value)}
          >
            {!selectedLocale && <option value="">--</option>}
            {visibleLocaleOptions.map((localeOption) => (
              <option key={localeOption.code} value={localeOption.code}>
                {localeOption.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className={sectionClass}>
        <SectionTitle title={t("form.identity")} />
        <div className={fieldGridClass}>
            {selectedNameOrder === "family-first" ? (
            <>
              {familyNameField}
              {givenNameField}
            </>
          ) : (
            <>
              {givenNameField}
              {familyNameField}
            </>
          )}
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle title={t("form.login")} />
        {!showPassword && showInvitationHelp && (
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            {t("users.invitationPasswordHelp")}
          </p>
        )}
        <Field
          density={density}
          error={errors.email}
          label={t("form.email")}
          required={!isSearchMode}
        >
          <input
            autoComplete="email"
            className={inputClass}
            disabled={disabled}
            inputMode="email"
            maxLength={USER_FIELD_MAX_LENGTHS.email}
            type="text"
            value={value.email}
            onChange={(event) =>
              onChange({ ...value, email: event.target.value })
            }
          />
        </Field>
        {requireEmailConfirmation && (
          <Field
            density={density}
            error={confirmEmailError}
            label={t("users.confirmNewEmail")}
            required
          >
            <input
              autoComplete="off"
              className={inputClass}
              disabled={disabled}
              inputMode="email"
              maxLength={USER_FIELD_MAX_LENGTHS.email}
              type="text"
              value={confirmEmailValue}
              onChange={(event) => onConfirmEmailChange?.(event.target.value)}
            />
          </Field>
        )}
        {showPassword && (
          <div className={fieldGridClass}>
            {passwordField}
            {confirmPasswordField}
          </div>
        )}
      </section>

      {showPhone && (
        <section className={sectionClass}>
          <SectionTitle title={t("form.contact")} />
          <Field density={density} label={t("profile.field.phone")}>
            <PhoneInput
              countries={countries.data ?? []}
              countryId={value.phone_country_id}
              disabled={disabled}
              inputClassName={inputClass}
              phone={value.phone}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  ...nextValue,
                })
              }
            />
          </Field>
        </section>
      )}

      {roleOptions.length > 0 && (
        <section className={sectionClass}>
          <SectionTitle title={t("users.accessSection")} />
          <Field density={density} label={t("users.role")} required>
            <select
              className={inputClass}
              disabled={disabled}
              value={value.role_id}
              onChange={(event) =>
                onChange({ ...value, role_id: event.target.value })
              }
            >
              {roleOptions.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </Field>
        </section>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        {onCancel && (
          <Button disabled={disabled} type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel ?? t("profile.cancel")}
          </Button>
        )}
        {onReset && (
          <Button disabled={disabled} type="button" variant="secondary" onClick={onReset}>
            {resetLabel ?? "Clear"}
          </Button>
        )}
        <Button disabled={disabled} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  density?: "default" | "compact";
  children: ReactNode;
};

function Field({
  label,
  required,
  error,
  density = "default",
  children,
}: FieldProps) {
  return (
    <label
      className={[
        "grid content-start text-sm font-bold text-slate-700",
        density === "compact" ? "gap-1.5" : "gap-2",
      ].join(" ")}
    >
      <span>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {density === "compact" ? (
        error && <span className="text-sm font-normal text-red-700">{error}</span>
      ) : (
        <span className="min-h-5 text-sm font-semibold text-red-700">
          {error ?? ""}
        </span>
      )}
    </label>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
      {title}
    </h2>
  );
}

function getNameOrder(locale: SupportedLocale) {
  return locale === "en" || locale === "th" ? "given-first" : "family-first";
}

function PasswordStrengthList({
  checks,
  title,
}: {
  checks: { isMet: boolean; label: string }[];
  title: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <ul className="grid gap-1 text-xs font-semibold">
        {checks.map((check) => (
          <li
            className={check.isMet ? "text-emerald-700" : "text-slate-500"}
            key={check.label}
          >
            {check.isMet ? "OK" : "--"} {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getPasswordChecks(password: string) {
  return {
    lowercase: /[a-z]/.test(password),
    minLength: password.length >= 8,
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };
}

function isStrongPassword(password: string) {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUserForm(
  value: UserFormValue,
  messages: {
    emailInvalid: string;
    passwordMismatch: string;
    passwordWeak: string;
    searchMode: boolean;
    requirePassword: boolean;
    required: string;
  },
) {
  const errors: Partial<Record<keyof UserFormValue, string>> = {};
  const requiredFields: (keyof UserFormValue)[] = messages.searchMode
    ? []
    : ["family_name", "given_name", "email", "preferred_locale_code"];

  if (messages.requirePassword || value.password || value.confirm_password) {
    requiredFields.push("password", "confirm_password");
  }

  for (const field of requiredFields) {
    if (!value[field].trim()) {
      errors[field] = messages.required;
    }
  }

  if (!messages.searchMode && value.email.trim() && !isValidEmail(value.email)) {
    errors.email = messages.emailInvalid;
  }

  if (value.password.trim() && !isStrongPassword(value.password)) {
    errors.password = messages.passwordWeak;
  }

  if (
    value.password.trim() &&
    value.confirm_password.trim() &&
    value.password !== value.confirm_password
  ) {
    errors.confirm_password = messages.passwordMismatch;
  }

  return errors;
}
