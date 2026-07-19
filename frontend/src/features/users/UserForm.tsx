import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../../components/ui/Button";
import { FormAlert } from "../../components/ui/FormAlert";
import { getPasswordGenerationLabels } from "../../components/ui/GeneratePasswordButton";
import { PasswordInput } from "../../components/ui/PasswordInput";
import {
  buildPasswordStrengthItems,
  getPasswordChecks,
  getPasswordStrengthLabels,
  isStrongPassword,
} from "../../components/ui/PasswordStrength";
import { PhoneInput } from "../../components/ui/PhoneInput";
import { inferPhoneCountryId } from "../../components/ui/phoneInputUtils";
import { getBootstrapLocales, getProfileCountries } from "../auth/authApi";
import { useLocaleContext } from "../../lib/i18n/localeContext";
import { isSupportedLocale } from "../../lib/i18n/localeUtils";
import {
  localeOptionLabels,
  supportedLocales,
} from "../../lib/i18n/translations";
import type { SupportedLocale } from "../../lib/i18n/translations";
import type { UserFormValue } from "./userFormTypes";

type UserFormProps = {
  value: UserFormValue;
  onChange: (value: UserFormValue) => void;
  onSubmit: (value: UserFormValue) => boolean | void;
  submitLabel: string;
  cancelLabel?: string;
  confirmEmailError?: string;
  confirmEmailValue?: string;
  resetLabel?: string;
  submitError?: string;
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
  submitError,
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
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
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
  const isFormDisabled = disabled || isSubmitLocked;

  useEffect(() => {
    if (!disabled) {
      setIsSubmitLocked(false);
    }
  }, [disabled]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFormDisabled) {
      return;
    }

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

    const didSubmit = onSubmit(value);
    if (didSubmit !== false && !isSearchMode) {
      setIsSubmitLocked(true);
    }
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
        disabled={isFormDisabled}
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
        disabled={isFormDisabled}
        maxLength={USER_FIELD_MAX_LENGTHS.givenName}
        value={value.given_name}
        onChange={(event) =>
          onChange({ ...value, given_name: event.target.value })
        }
      />
    </Field>
  );
  const passwordChecks = getPasswordChecks(value.password);
  const passwordGenerationLabels = getPasswordGenerationLabels(t);
  const passwordStrengthItems = buildPasswordStrengthItems(passwordChecks, t);
  const passwordStrengthLabels = getPasswordStrengthLabels(t);
  const passwordField = (
    <PasswordInput
      autoComplete="new-password"
      disabled={isFormDisabled}
      error={errors.password}
      generate={{
        label: t("form.generatePassword"),
        labels: passwordGenerationLabels,
        onGenerate: (generatedPassword) => {
          onChange({
            ...value,
            confirm_password: generatedPassword,
            password: generatedPassword,
          });
        },
      }}
      inputClassName={inputClass}
      label={t("form.password")}
      maxLength={USER_FIELD_MAX_LENGTHS.password}
      required
      strength={{
        checks: passwordStrengthItems,
        labels: passwordStrengthLabels,
        title: t("form.passwordStrength"),
      }}
      value={value.password}
      onChange={(password) => onChange({ ...value, password })}
    />
  );
  const confirmPasswordField = (
    <PasswordInput
      autoComplete="new-password"
      disabled={isFormDisabled}
      error={errors.confirm_password}
      inputClassName={inputClass}
      label={t("form.confirmPassword")}
      maxLength={USER_FIELD_MAX_LENGTHS.password}
      required
      value={value.confirm_password}
      onChange={(confirm_password) => onChange({ ...value, confirm_password })}
    />
  );

  const sectionClass = density === "compact" ? "grid gap-3" : "grid gap-4";
  const fieldGridClass =
    density === "compact" ? "grid gap-3 lg:grid-cols-2" : "grid gap-4 lg:grid-cols-2";
  return (
    <form className={density === "compact" ? "grid gap-4" : "grid gap-6"} onSubmit={handleSubmit}>
      {submitError && (
        <FormAlert>{submitError}</FormAlert>
      )}

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
            disabled={isFormDisabled}
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
      disabled={isFormDisabled}
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
      disabled={isFormDisabled}
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
              disabled={isFormDisabled}
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
              disabled={isFormDisabled}
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
          <Button disabled={isFormDisabled} type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel ?? t("profile.cancel")}
          </Button>
        )}
        {onReset && (
          <Button disabled={isFormDisabled} type="button" variant="secondary" onClick={onReset}>
            {resetLabel ?? "Clear"}
          </Button>
        )}
        <Button disabled={isFormDisabled} type="submit">
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
