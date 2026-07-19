import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, X } from "lucide-react";

import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/layout/PageHeader";
import {
  PhoneInput,
} from "../components/ui/PhoneInput";
import {
  formatPhoneForCountry,
  inferPhoneCountryId,
} from "../components/ui/phoneInputUtils";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import {
  createCurrentUserLegalName,
  deleteCurrentUserLegalName,
  getBootstrapLocales,
  getCurrentUser,
  getCurrentUserLegalNames,
  getProfileCountries,
  updateCurrentUserLegalName,
  updateCurrentUser,
} from "../features/auth/authApi";
import type {
  ProfileCountry,
  UserLegalName,
} from "../features/auth/authTypes";
import { formatPersonName } from "../lib/i18n/nameFormat";
import { useTranslation } from "../lib/i18n/useTranslation";
import { useTheme } from "../lib/theme/useTheme";
import type { ThemePreference } from "../lib/theme/themeContext";

export function ProfilePage() {
  const { locale, t } = useTranslation();
  const { preference: themePreference, setPreference: setThemePreference } =
    useTheme();
  const queryClient = useQueryClient();
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    family_name: "",
    given_name: "",
    phone: "",
    phone_country_id: "",
    preferred_locale_code: "",
  });
  const [editingLegalNameId, setEditingLegalNameId] = useState<string | null>(
    null,
  );
  const [legalNameForm, setLegalNameForm] = useState({
    country_id: "",
    locale_code: "",
    full_name: "",
  });
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const user = currentUser.data;
  const legalNames = useQuery({
    queryKey: ["current-user", "legal-names"],
    queryFn: getCurrentUserLegalNames,
    retry: false,
  });
  const locales = useQuery({
    queryKey: ["bootstrap-locales"],
    queryFn: getBootstrapLocales,
    staleTime: Infinity,
  });
  const countries = useQuery({
    queryKey: ["profile-countries"],
    queryFn: getProfileCountries,
    staleTime: Infinity,
  });
  const userLocale = locales.data?.find(
    (localeOption) => localeOption.code === user?.preferred_locale_code,
  );
  const preferredLocaleLabel =
    userLocale?.native_name || userLocale?.name || user?.preferred_locale_code;
  const userPhoneCountry = countries.data?.find(
    (country) => country.id === user?.phone_country_id,
  );
  const displayName = user
    ? formatPersonName(
        user.family_name,
        user.given_name,
        userLocale,
      )
    : "";
  const updateProfile = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["current-user"], updatedUser);
      setIsEditingUser(false);
    },
  });
  const createLegalName = useMutation({
    mutationFn: createCurrentUserLegalName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "legal-names"] });
      resetLegalNameForm();
    },
  });
  const updateLegalName = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: typeof legalNameForm;
    }) => updateCurrentUserLegalName(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "legal-names"] });
      resetLegalNameForm();
    },
  });
  const deleteLegalName = useMutation({
    mutationFn: deleteCurrentUserLegalName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "legal-names"] });
      resetLegalNameForm();
    },
  });
  useEffect(() => {
    if (!user || isEditingUser) {
      return;
    }

    setUserForm({
      family_name: user.family_name,
      given_name: user.given_name,
      phone: user.phone ?? "",
      phone_country_id:
        user.phone_country_id || inferPhoneCountryId(user.preferred_locale_code, countries.data),
      preferred_locale_code: user.preferred_locale_code ?? "",
    });
  }, [countries.data, isEditingUser, user]);

  function beginCreateLegalName() {
    if (editingLegalNameId === "new") {
      resetLegalNameForm();
      return;
    }

    const defaultCountry = countries.data?.[0];
    setEditingLegalNameId("new");
    setLegalNameForm({
      country_id: defaultCountry?.id ?? "",
      locale_code:
        defaultCountry?.default_locale_code || user?.preferred_locale_code || locale,
      full_name: "",
    });
  }

  function beginEditLegalName(legalName: UserLegalName) {
    setEditingLegalNameId(legalName.id);
    setLegalNameForm({
      country_id: legalName.country_id,
      locale_code: legalName.locale_code,
      full_name: legalName.full_name,
    });
  }

  function resetLegalNameForm() {
    setEditingLegalNameId(null);
    setLegalNameForm({
      country_id: "",
      locale_code: "",
      full_name: "",
    });
  }

  function submitLegalName() {
    const payload = {
      country_id: legalNameForm.country_id,
      locale_code: legalNameForm.locale_code,
      full_name: legalNameForm.full_name,
    };

    if (editingLegalNameId === "new") {
      createLegalName.mutate(payload);
      return;
    }

    if (editingLegalNameId) {
      updateLegalName.mutate({ id: editingLegalNameId, payload });
    }
  }

  return (
    <section className="grid gap-4">
      <PageHeader
        description={t("profile.description")}
        eyebrow={t("shell.user")}
        title={t("profile.title")}
      />

      {currentUser.isLoading && (
        <ProfileNotice message={t("profile.loading")} />
      )}
      {currentUser.isError && (
        <ProfileNotice message={t("profile.loadError")} tone="error" />
      )}

      {user && (
        <>
          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <SectionHeader
              action={
                !isEditingUser && (
                  <Button
                    className="min-h-8 px-2.5 text-sm"
                    variant="secondary"
                    onClick={() => setIsEditingUser(true)}
                  >
                    <Edit2 aria-hidden="true" size={16} />
                    {t("profile.edit")}
                  </Button>
                )
              }
              title={t("profile.accountSection")}
            />
            {isEditingUser ? (
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateProfile.mutate({
                    family_name: userForm.family_name,
                    given_name: userForm.given_name,
                    phone: userForm.phone || null,
                    phone_country_id: userForm.phone_country_id || null,
                    preferred_locale_code: userForm.preferred_locale_code || null,
                  });
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <ProfileField label={t("form.familyName")}>
                    <input
                      className={inputClass}
                      maxLength={50}
                      value={userForm.family_name}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          family_name: event.target.value,
                        }))
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t("form.givenName")}>
                    <input
                      className={inputClass}
                      maxLength={50}
                      value={userForm.given_name}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          given_name: event.target.value,
                        }))
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t("profile.field.phone")}>
                    <PhoneInput
                      countries={countries.data ?? []}
                      countryId={userForm.phone_country_id}
                      inputClassName={inputClass}
                      phone={userForm.phone}
                      onChange={(value) =>
                        setUserForm((current) => ({
                          ...current,
                          ...value,
                        }))
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t("profile.field.preferredLocale")}>
                    <select
                      className={inputClass}
                      value={userForm.preferred_locale_code}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          preferred_locale_code: event.target.value,
                        }))
                      }
                    >
                      {locales.data?.map((localeOption) => (
                        <option key={localeOption.code} value={localeOption.code}>
                          {localeOption.native_name || localeOption.name}
                        </option>
                      ))}
                    </select>
                  </ProfileField>
                </div>
                {updateProfile.isError && (
                  <p className="text-sm font-semibold text-red-700">
                    {updateProfile.error.message}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <Button
                    disabled={updateProfile.isPending}
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditingUser(false)}
                  >
                    {t("profile.cancel")}
                  </Button>
                  <Button disabled={updateProfile.isPending} type="submit">
                    {updateProfile.isPending
                      ? t("profile.saving")
                      : t("profile.save")}
                  </Button>
                </div>
              </form>
            ) : (
              <DefinitionGrid
                items={[
                  [t("profile.field.name"), displayName],
                  [t("form.email"), user.email],
                  [
                    t("profile.field.phone"),
                    formatPhoneDisplay(user.phone, userPhoneCountry),
                  ],
                  [t("profile.field.preferredLocale"), preferredLocaleLabel],
                ]}
              />
            )}
          </section>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <SectionTitle>{t("profile.appearanceSection")}</SectionTitle>
            <p className="text-sm text-slate-600">
              {t("profile.themeDescription")}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {(
                [
                  ["light", t("profile.themeLight")],
                  ["dark", t("profile.themeDark")],
                  ["auto", t("profile.themeAuto")],
                ] satisfies [ThemePreference, string][]
              ).map(([value, label]) => (
                <label
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-semibold transition",
                    themePreference === value
                      ? "lm-button-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                  key={value}
                >
                  <input
                    checked={themePreference === value}
                    className="h-4 w-4 accent-slate-950"
                    name="themePreference"
                    type="radio"
                    value={value}
                    onChange={() => setThemePreference(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <SectionHeader
              action={
                editingLegalNameId && editingLegalNameId !== "new" ? undefined : (
                  <Button
                    className="min-h-8 px-2.5 text-sm"
                    variant="secondary"
                    onClick={beginCreateLegalName}
                  >
                    {editingLegalNameId === "new" ? (
                      <X aria-hidden="true" size={16} />
                    ) : (
                      <Plus aria-hidden="true" size={16} />
                    )}
                    {editingLegalNameId === "new"
                      ? t("profile.cancel")
                      : t("profile.add")}
                  </Button>
                )
              }
              title={t("profile.legalNamesSection")}
            />
            {editingLegalNameId === "new" && (
              <LegalNameForm
                countries={countries.data ?? []}
                disabled={createLegalName.isPending}
                error={createLegalName.error?.message}
                form={legalNameForm}
                locales={locales.data ?? []}
                submitLabel={
                  createLegalName.isPending ? t("profile.saving") : t("profile.save")
                }
                onCancel={resetLegalNameForm}
                onChange={setLegalNameForm}
                onSubmit={submitLegalName}
              />
            )}
            {legalNames.isLoading && (
              <p className="text-sm font-semibold text-slate-500">
                {t("profile.loading")}
              </p>
            )}
            {legalNames.isError && (
              <p className="text-sm font-semibold text-red-700">
                {t("profile.loadError")}
              </p>
            )}
            {legalNames.data?.length === 0 && (
              <p className="text-sm font-semibold text-slate-500">
                {t("profile.noLegalNames")}
              </p>
            )}
            {legalNames.data && legalNames.data.length > 0 && (
              <div className="grid gap-3">
                {legalNames.data.map((legalName) => (
                  <LegalNamePanel
                    key={legalName.id}
                    countryLabel={formatCountryLabel(
                      countries.data?.find(
                        (country) => country.id === legalName.country_id,
                      ),
                    )}
                    legalName={legalName}
                    isDeleting={deleteLegalName.isPending}
                    isEditing={editingLegalNameId === legalName.id}
                    onDelete={() => {
                      if (window.confirm(t("profile.deleteConfirm"))) {
                        deleteLegalName.mutate(legalName.id);
                      }
                    }}
                    onEdit={() => beginEditLegalName(legalName)}
                    renderEditForm={() => (
                      <LegalNameForm
                        countries={countries.data ?? []}
                        disabled={updateLegalName.isPending}
                        error={updateLegalName.error?.message}
                        form={legalNameForm}
                        locales={locales.data ?? []}
                        submitLabel={
                          updateLegalName.isPending
                            ? t("profile.saving")
                            : t("profile.save")
                        }
                        onCancel={resetLegalNameForm}
                        onChange={setLegalNameForm}
                        onSubmit={submitLegalName}
                      />
                    )}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <SectionTitle>{t("profile.systemSection")}</SectionTitle>
            <DefinitionGrid
              items={[
                [t("profile.field.createdAt"), formatDate(user.created_at, locale)],
                [t("profile.field.updatedAt"), formatDate(user.updated_at, locale)],
              ]}
            />
          </section>
        </>
      )}
    </section>
  );
}

function LegalNamePanel({
  countryLabel,
  isDeleting,
  isEditing,
  legalName,
  onDelete,
  onEdit,
  renderEditForm,
}: {
  countryLabel: string;
  isDeleting: boolean;
  isEditing: boolean;
  legalName: UserLegalName;
  onDelete: () => void;
  onEdit: () => void;
  renderEditForm: () => ReactNode;
}) {
  const { t } = useTranslation();
  if (isEditing) {
    return (
      <article className="rounded-lg border border-slate-300 bg-slate-50 p-4">
        {renderEditForm()}
      </article>
    );
  }

  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <DefinitionGrid
        items={[
          [t("profile.field.country"), countryLabel],
          [t("profile.field.fullName"), legalName.full_name],
        ]}
      />
      <div className="flex justify-end gap-1.5">
        <button
          aria-label={t("profile.edit")}
          className="inline-grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          type="button"
          onClick={onEdit}
        >
          <Edit2 aria-hidden="true" size={15} />
        </button>
        <button
          aria-label={t("profile.delete")}
          className="inline-grid size-8 place-items-center rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDeleting}
          type="button"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </div>
    </article>
  );
}

function LegalNameForm({
  countries,
  disabled,
  error,
  form,
  locales,
  submitLabel,
  onCancel,
  onChange,
  onSubmit,
}: {
  countries: ProfileCountry[];
  disabled?: boolean;
  error?: string;
  form: { country_id: string; locale_code: string; full_name: string };
  locales: { code: string; name: string; native_name?: string | null }[];
  submitLabel: string;
  onCancel: () => void;
  onChange: (form: { country_id: string; locale_code: string; full_name: string }) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ProfileField label={t("profile.field.country")}>
          <SearchableSelect
            disabled={disabled}
            options={countries.map((country) => ({
              label: formatCountryLabel(country),
              searchText: `${country.name} ${country.native_name ?? ""} ${country.code} ${country.alpha2}`,
              value: country.id,
            }))}
            placeholder="--"
            value={form.country_id}
            onChange={(value) => {
              const country = countries.find(
                (option) => option.id === value,
              );
              onChange({
                ...form,
                country_id: value,
                locale_code: country?.default_locale_code || form.locale_code,
              });
            }}
          />
        </ProfileField>
        <ProfileField label={t("profile.field.localeCode")}>
          <select
            className={inputClass}
            disabled={disabled}
            required
            value={form.locale_code}
            onChange={(event) =>
              onChange({ ...form, locale_code: event.target.value })
            }
          >
            <option value="">--</option>
            {locales.map((localeOption) => (
              <option key={localeOption.code} value={localeOption.code}>
                {formatLocaleLabel(localeOption)}
              </option>
            ))}
          </select>
        </ProfileField>
        <ProfileField label={t("profile.field.fullName")}>
          <input
            className={inputClass}
            disabled={disabled}
            maxLength={150}
            required
            value={form.full_name}
            onChange={(event) =>
              onChange({ ...form, full_name: event.target.value })
            }
          />
        </ProfileField>
      </div>
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button disabled={disabled} type="button" variant="secondary" onClick={onCancel}>
          {t("profile.cancel")}
        </Button>
        <Button disabled={disabled} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10";

function ProfileField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function SectionHeader({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <SectionTitle>{title}</SectionTitle>
      {action}
    </div>
  );
}

function DefinitionGrid({ items }: { items: [string, unknown][] }) {
  return (
    <dl className="grid gap-x-5 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div className="min-w-0" key={label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
      {children}
    </h2>
  );
}

function ProfileNotice({
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

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return String(value);
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCountryLabel(
  country:
    | { code: string; name: string; native_name?: string | null }
    | null
    | undefined,
) {
  if (!country) {
    return "";
  }
  return country.native_name
    ? `${country.native_name} (${country.code})`
    : `${country.name} (${country.code})`;
}

function formatLocaleLabel(
  localeOption:
    | { code: string; name: string; native_name?: string | null }
    | null
    | undefined,
) {
  if (!localeOption) {
    return "";
  }
  return localeOption.native_name || localeOption.name || localeOption.code;
}

function formatPhoneDisplay(
  value: string | null | undefined,
  country: ProfileCountry | undefined,
) {
  if (!value) {
    return "";
  }

  const formatted = formatPhoneForCountry(value, country);
  return country?.phone_prefix ? `${country.phone_prefix} ${formatted}` : formatted;
}
