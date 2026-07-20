import { useState } from "react";
import type { ReactNode } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { FormAlert } from "../../components/ui/FormAlert";
import { Modal } from "../../components/ui/Modal";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import type {
  BootstrapLocale,
  ProfileCountry,
  UserLegalName,
  UserLegalNamePayload,
} from "../auth/authTypes";
import { useTranslation } from "../../lib/i18n/useTranslation";

type LegalNameFormValue = UserLegalNamePayload;

type LegalNamesCardProps = {
  countries: ProfileCountry[];
  defaultCountryId?: string;
  defaultLocaleCode?: string;
  deleteError?: string;
  isDeleting?: boolean;
  isLoading?: boolean;
  legalNames: UserLegalName[];
  loadError?: string;
  locales: BootstrapLocale[];
  title?: string;
  onCreate: (payload: UserLegalNamePayload) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onUpdate: (id: string, payload: UserLegalNamePayload) => Promise<unknown>;
};

const emptyForm: LegalNameFormValue = {
  country_id: "",
  locale_code: "",
  full_name: "",
};

export function LegalNamesCard({
  countries,
  defaultCountryId,
  defaultLocaleCode,
  deleteError,
  isDeleting,
  isLoading,
  legalNames,
  loadError,
  locales,
  title,
  onCreate,
  onDelete,
  onUpdate,
}: LegalNamesCardProps) {
  const { locale, t } = useTranslation();
  const [editingLegalNameId, setEditingLegalNameId] = useState<string | null>(
    null,
  );
  const [legalNameToDelete, setLegalNameToDelete] =
    useState<UserLegalName | null>(null);
  const [legalNameForm, setLegalNameForm] = useState<LegalNameFormValue>(
    emptyForm,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function resetLegalNameForm() {
    setEditingLegalNameId(null);
    setLegalNameForm(emptyForm);
    setFormError(null);
  }

  function beginCreateLegalName() {
    if (editingLegalNameId === "new") {
      resetLegalNameForm();
      return;
    }

    const defaultCountry =
      countries.find((country) => country.id === defaultCountryId) ?? countries[0];
    setEditingLegalNameId("new");
    setLegalNameForm({
      country_id: defaultCountry?.id ?? "",
      locale_code:
        defaultCountry?.default_locale_code || defaultLocaleCode || locale,
      full_name: "",
    });
    setFormError(null);
  }

  function beginEditLegalName(legalName: UserLegalName) {
    setEditingLegalNameId(legalName.id);
    setLegalNameForm({
      country_id: legalName.country_id,
      locale_code: legalName.locale_code,
      full_name: legalName.full_name,
    });
    setFormError(null);
  }

  async function submitLegalName() {
    const payload = {
      country_id: legalNameForm.country_id,
      locale_code: legalNameForm.locale_code,
      full_name: legalNameForm.full_name.trim(),
    };

    if (!payload.country_id || !payload.locale_code || !payload.full_name) {
      setFormError(t("form.requiredMessage"));
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingLegalNameId === "new") {
        await onCreate(payload);
      } else if (editingLegalNameId) {
        await onUpdate(editingLegalNameId, payload);
      }
      resetLegalNameForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteLegalName() {
    if (!legalNameToDelete) {
      return;
    }

    try {
      await onDelete(legalNameToDelete.id);
      setLegalNameToDelete(null);
      resetLegalNameForm();
    } catch {
      // The parent mutation exposes the translated/server error.
    }
  }

  return (
    <>
      <CollapsibleCard
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
        collapsible={false}
        isOpen
        summary={
          <>
            {legalNames.length === 0 && (
              <FormAlert>{t("profile.noLegalNames")}</FormAlert>
            )}
            {loadError && <FormAlert>{loadError}</FormAlert>}
          </>
        }
        title={title ?? t("profile.legalNamesSection")}
        onOpenChange={() => undefined}
      >
        {editingLegalNameId === "new" && (
          <LegalNameForm
            countries={countries}
            disabled={isSaving}
            error={formError}
            form={legalNameForm}
            locales={locales}
            submitLabel={isSaving ? t("profile.saving") : t("profile.save")}
            onCancel={resetLegalNameForm}
            onChange={(nextForm) => {
              setFormError(null);
              setLegalNameForm(nextForm);
            }}
            onSubmit={submitLegalName}
          />
        )}
        {isLoading && (
          <p className="text-sm font-semibold text-slate-500">
            {t("profile.loading")}
          </p>
        )}
        {legalNames.length > 0 && (
          <div className="grid gap-3">
            {legalNames.map((legalName) => (
              <LegalNamePanel
                key={legalName.id}
                countryLabel={formatCountryLabel(
                  countries.find((country) => country.id === legalName.country_id),
                )}
                isDeleting={Boolean(isDeleting)}
                isEditing={editingLegalNameId === legalName.id}
                legalName={legalName}
                onDelete={() => setLegalNameToDelete(legalName)}
                onEdit={() => beginEditLegalName(legalName)}
                renderEditForm={() => (
                  <LegalNameForm
                    countries={countries}
                    disabled={isSaving}
                    error={formError}
                    form={legalNameForm}
                    locales={locales}
                    submitLabel={
                      isSaving ? t("profile.saving") : t("profile.save")
                    }
                    onCancel={resetLegalNameForm}
                    onChange={(nextForm) => {
                      setFormError(null);
                      setLegalNameForm(nextForm);
                    }}
                    onSubmit={submitLegalName}
                  />
                )}
              />
            ))}
          </div>
        )}
      </CollapsibleCard>

      {legalNameToDelete && (
        <Modal title={t("profile.deleteConfirm")}>
          <div className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <DefinitionGrid
                items={[
                  [
                    t("profile.field.country"),
                    formatCountryLabel(
                      countries.find(
                        (country) => country.id === legalNameToDelete.country_id,
                      ),
                    ),
                  ],
                  [
                    t("profile.field.localeCode"),
                    formatLocaleLabel(
                      locales.find(
                        (localeOption) =>
                          localeOption.code === legalNameToDelete.locale_code,
                      ),
                    ),
                  ],
                  [t("profile.field.fullName"), legalNameToDelete.full_name],
                ]}
              />
            </div>
            {deleteError && <FormAlert>{deleteError}</FormAlert>}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button
                disabled={isDeleting}
                variant="secondary"
                onClick={() => setLegalNameToDelete(null)}
              >
                {t("profile.cancel")}
              </Button>
              <Button
                disabled={isDeleting}
                onClick={confirmDeleteLegalName}
              >
                {isDeleting ? t("profile.deleting") : t("profile.delete")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
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
  error?: string | null;
  form: LegalNameFormValue;
  locales: BootstrapLocale[];
  submitLabel: string;
  onCancel: () => void;
  onChange: (form: LegalNameFormValue) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {error && <FormAlert>{error}</FormAlert>}
      <div className="grid gap-4 md:grid-cols-3">
        <LegalNameField label={t("profile.field.country")} required>
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
              const country = countries.find((option) => option.id === value);
              onChange({
                ...form,
                country_id: value,
                locale_code: country?.default_locale_code || form.locale_code,
              });
            }}
          />
        </LegalNameField>
        <LegalNameField label={t("profile.field.localeCode")} required>
          <select
            className="lm-form-input"
            disabled={disabled}
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
        </LegalNameField>
        <LegalNameField label={t("profile.field.fullName")} required>
          <input
            className="lm-form-input"
            disabled={disabled}
            maxLength={150}
            value={form.full_name}
            onChange={(event) =>
              onChange({ ...form, full_name: event.target.value })
            }
          />
        </LegalNameField>
      </div>
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

function LegalNameField({
  children,
  label,
  required,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      <span>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
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

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return String(value);
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
