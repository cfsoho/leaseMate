import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { CollapsibleCard } from "../components/ui/CollapsibleCard";
import { CollapsibleCardContainer } from "../components/ui/CollapsibleCardContainer";
import { FormAlert } from "../components/ui/FormAlert";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/layout/PageHeader";
import {
  formatPhoneForCountry,
  inferPhoneCountryId,
} from "../components/ui/phoneInputUtils";
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
import { setAuthRedirectReason } from "../features/auth/authUiTransition";
import type { ProfileCountry, UserLegalNamePayload } from "../features/auth/authTypes";
import { LegalNamesCard } from "../features/legalNames/LegalNamesCard";
import { UserDelegationsCard } from "../features/users/UserDelegationsCard";
import {
  UserBasicInfoForm,
  type UserBasicInfoFormValue,
} from "../features/users/UserBasicInfoForm";
import {
  createUserDelegation,
  deleteUserDelegation,
  listUserDelegations,
  listUserSelectOptions,
  updateUserDelegation,
} from "../features/users/usersApi";
import { formatPersonName } from "../lib/i18n/nameFormat";
import { useTranslation } from "../lib/i18n/useTranslation";
import { clearTokens, setLastLoginEmail } from "../lib/auth/tokenStorage";
import { useTheme } from "../lib/theme/useTheme";
import type { ThemePreference } from "../lib/theme/themeContext";

export function ProfilePage() {
  const navigate = useNavigate();
  const { locale, t } = useTranslation();
  const { preference: themePreference, setPreference: setThemePreference } =
    useTheme();
  const queryClient = useQueryClient();
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState<UserBasicInfoFormValue>({
    family_name: "",
    given_name: "",
    email: "",
    phone: "",
    phone_country_id: "",
    preferred_locale_code: "",
  });
  const [pendingEmailChange, setPendingEmailChange] = useState<
    Parameters<typeof updateCurrentUser>[0] | null
  >(null);
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
  const users = useQuery({
    queryKey: ["users", "select-options", "created-by-current-user"],
    queryFn: () => listUserSelectOptions({ createdByCurrentUser: true }),
    enabled: Boolean(user),
  });
  const delegations = useQuery({
    queryKey: ["users", user?.id, "delegations"],
    queryFn: () => listUserDelegations(user!.id),
    enabled: Boolean(user?.id),
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
    onSuccess: (updatedUser, payload) => {
      const emailChanged = Boolean(
        user?.email && payload.email && payload.email !== user.email,
      );

      if (emailChanged) {
        setPendingEmailChange(null);
        setLastLoginEmail(updatedUser.email);
        setAuthRedirectReason("email_changed");
        clearTokens();
        queryClient.removeQueries({ queryKey: ["current-user"] });
        navigate("/login", { replace: true });
        return;
      }

      queryClient.setQueryData(["current-user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setIsEditingUser(false);
    },
  });
  const createLegalName = useMutation({
    mutationFn: createCurrentUserLegalName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "legal-names"] });
    },
  });
  const updateLegalName = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UserLegalNamePayload;
    }) => updateCurrentUserLegalName(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "legal-names"] });
    },
  });
  const deleteLegalName = useMutation({
    mutationFn: deleteCurrentUserLegalName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "legal-names"] });
    },
  });
  const createDelegation = useMutation({
    mutationFn: (payload: Parameters<typeof createUserDelegation>[1]) =>
      createUserDelegation(user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", user?.id, "delegations"] });
    },
  });
  const updateDelegation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateUserDelegation>[2];
    }) => updateUserDelegation(user!.id, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", user?.id, "delegations"] });
    },
  });
  const deleteDelegation = useMutation({
    mutationFn: (delegationId: string) => deleteUserDelegation(user!.id, delegationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", user?.id, "delegations"] });
    },
  });
  useEffect(() => {
    if (!user || isEditingUser) {
      return;
    }

    setUserForm({
      family_name: user.family_name,
      given_name: user.given_name,
      email: user.email,
      phone: user.phone ?? "",
      phone_country_id:
        user.phone_country_id || inferPhoneCountryId(user.preferred_locale_code, countries.data),
      preferred_locale_code: user.preferred_locale_code ?? "",
    });
  }, [countries.data, isEditingUser, user]);

  return (
    <CollapsibleCardContainer
      className="lm-card-page-compact"
      layout="masonry"
      header={
        <>
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
        </>
      }
    >

      {user && (
        <>
          <CollapsibleCard
            collapsible={false}
            isOpen
            onOpenChange={() => undefined}
            title={t("profile.accountSection")}
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
            >
            {isEditingUser ? (
              <UserBasicInfoForm
                cancelLabel={t("profile.cancel")}
                countries={countries.data ?? []}
                disabled={updateProfile.isPending}
                emailEditable
                localeCode={locale}
                locales={locales.data ?? []}
                submitError={
                  updateProfile.isError ? updateProfile.error.message : undefined
                }
                submitLabel={
                  updateProfile.isPending
                    ? t("profile.saving")
                    : t("profile.save")
                }
                value={userForm}
                onCancel={() => setIsEditingUser(false)}
                onChange={setUserForm}
                onSubmit={(nextValue) => {
                  const payload = {
                    email: nextValue.email,
                    family_name: nextValue.family_name,
                    given_name: nextValue.given_name,
                    phone: nextValue.phone || null,
                    phone_country_id: nextValue.phone_country_id || null,
                    preferred_locale_code:
                      nextValue.preferred_locale_code || null,
                  };

                  if (user.email !== nextValue.email) {
                    setPendingEmailChange(payload);
                    return;
                  }

                  updateProfile.mutate(payload);
                }}
              />
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
          </CollapsibleCard>

          <CollapsibleCard
            collapsible={false}
            isOpen
            onOpenChange={() => undefined}
            title={t("profile.appearanceSection")}
          >
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
          </CollapsibleCard>

          <LegalNamesCard
            countries={countries.data ?? []}
            defaultCountryId={user.phone_country_id ?? undefined}
            defaultLocaleCode={user.preferred_locale_code || locale}
            deleteError={deleteLegalName.error?.message}
            isDeleting={deleteLegalName.isPending}
            isLoading={legalNames.isLoading}
            legalNames={legalNames.data ?? []}
            loadError={legalNames.isError ? t("profile.loadError") : undefined}
            locales={locales.data ?? []}
            onCreate={(payload) => createLegalName.mutateAsync(payload)}
            onDelete={(id) => deleteLegalName.mutateAsync(id)}
            onUpdate={(id, payload) =>
              updateLegalName.mutateAsync({ id, payload })
            }
          />

          <UserDelegationsCard
            delegations={delegations.data ?? []}
            description="Let another individual manage selected records for you. Use this when a trusted person helps manage your legal names, bank accounts, or properties."
            isLoading={delegations.isLoading}
            locale={userLocale}
            subjectUser={user}
            users={users.data ?? []}
            onCreate={(payload) => createDelegation.mutateAsync(payload)}
            onDelete={(id) => deleteDelegation.mutateAsync(id)}
            onUpdate={(id, payload) =>
              updateDelegation.mutateAsync({ id, payload })
            }
          />

          <CollapsibleCard
            collapsible={false}
            isOpen
            onOpenChange={() => undefined}
            title={t("profile.systemSection")}
          >
            <DefinitionGrid
              items={[
                [t("profile.field.createdAt"), formatDate(user.created_at, locale)],
                [t("profile.field.updatedAt"), formatDate(user.updated_at, locale)],
              ]}
            />
          </CollapsibleCard>
        </>
      )}

      {pendingEmailChange && (
        <Modal title={t("profile.emailChangeConfirmTitle")}>
          {updateProfile.isError && (
            <FormAlert messages={[updateProfile.error.message]} />
          )}
          <p className="text-sm leading-6 text-slate-600">
            {t("profile.emailChangeConfirmBody")}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              disabled={updateProfile.isPending}
              variant="secondary"
              onClick={() => setPendingEmailChange(null)}
            >
              {t("profile.cancel")}
            </Button>
            <Button
              disabled={updateProfile.isPending}
              onClick={() => updateProfile.mutate(pendingEmailChange)}
            >
              {t("profile.emailChangeConfirmAction")}
            </Button>
          </div>
        </Modal>
      )}
    </CollapsibleCardContainer>
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
