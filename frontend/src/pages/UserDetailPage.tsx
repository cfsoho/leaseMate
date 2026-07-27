import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit2, Mail } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { CollapsibleCard } from "../components/ui/CollapsibleCard";
import { CollapsibleCardContainer } from "../components/ui/CollapsibleCardContainer";
import { FormAlert } from "../components/ui/FormAlert";
import { IconButton } from "../components/ui/IconButton";
import {
  getBootstrapLocales,
  getProfileCountries,
} from "../features/auth/authApi";
import type { UserLegalNamePayload } from "../features/auth/authTypes";
import { LegalNamesCard } from "../features/legalNames/LegalNamesCard";
import {
  createUserLegalName,
  deleteUserLegalName,
  listUserLegalNames,
  updateUserLegalName,
} from "../features/legalNames/legalNamesApi";
import { UserDelegationsCard } from "../features/users/UserDelegationsCard";
import {
  UserBasicInfoForm,
  type UserBasicInfoFormValue,
} from "../features/users/UserBasicInfoForm";
import {
  createUser,
  createUserDelegation,
  deleteUserDelegation,
  getUser,
  listUserDelegations,
  listUserSelectOptions,
  sendUserVerificationEmail,
  updateUser,
  updateUserDelegation,
} from "../features/users/usersApi";
import { formatPersonName } from "../lib/i18n/nameFormat";
import { useTranslation } from "../lib/i18n/useTranslation";
import { NotFoundPage } from "./NotFoundPage";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | undefined) {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale, t } = useTranslation();
  const isCreateMode = !userId || userId === "create";
  const hasValidUserId = isCreateMode || isValidUuid(userId);
  const [authMessage, setAuthMessage] = useState("");
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(isCreateMode);
  const [basicInfoForm, setBasicInfoForm] = useState<UserBasicInfoFormValue>({
    family_name: "",
    given_name: "",
    email: "",
    phone: "",
    phone_country_id: "",
    preferred_locale_code: "",
  });

  const user = useQuery({
    enabled: Boolean(userId) && !isCreateMode && hasValidUserId,
    queryKey: ["users", "detail", userId],
    queryFn: () => getUser(userId!),
  });
  const users = useQuery({
    queryKey: ["users", "select-options", "created-by-current-user"],
    queryFn: () => listUserSelectOptions({ createdByCurrentUser: true }),
  });
  const delegations = useQuery({
    enabled: Boolean(userId) && !isCreateMode && hasValidUserId,
    queryKey: ["users", userId, "delegations"],
    queryFn: () => listUserDelegations(userId!),
  });
  const legalNames = useQuery({
    enabled: Boolean(userId) && !isCreateMode && hasValidUserId,
    queryKey: ["users", userId, "legal-names"],
    queryFn: () => listUserLegalNames(userId!),
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

  const localeByCode = useMemo(
    () =>
      new Map(
        (locales.data ?? []).map((localeOption) => [
          localeOption.code,
          localeOption,
        ]),
      ),
    [locales.data],
  );

  const selectedLocale = user.data?.preferred_locale_code
    ? localeByCode.get(user.data.preferred_locale_code)
    : undefined;
  const displayName = user.data
    ? formatPersonName(user.data.family_name, user.data.given_name, selectedLocale)
    : "";
  const preferredLocaleLabel = user.data?.preferred_locale_code
    ? localeByCode.get(user.data.preferred_locale_code)?.name ||
      user.data.preferred_locale_code
    : "--";
  const showBasicInfoForm = isCreateMode || isEditingBasicInfo;
  const showManagementCards = !isCreateMode && Boolean(user.data);

  useEffect(() => {
    if (isCreateMode) {
      setIsEditingBasicInfo(true);
      return;
    }

    if (!user.data || isEditingBasicInfo) {
      return;
    }

    setBasicInfoForm({
      family_name: user.data.family_name,
      given_name: user.data.given_name,
      email: user.data.email,
      phone: user.data.phone ?? "",
      phone_country_id: user.data.phone_country_id ?? "",
      preferred_locale_code: user.data.preferred_locale_code ?? "",
    });
  }, [isCreateMode, isEditingBasicInfo, user.data]);

  const createUserMutation = useMutation({
    mutationFn: (value: UserBasicInfoFormValue) =>
      createUser({
        family_name: value.family_name,
        given_name: value.given_name,
        email: value.email ?? "",
        phone: value.phone || null,
        phone_country_id: value.phone_country_id || null,
        preferred_locale_code: value.preferred_locale_code || null,
      }),
    onSuccess: async (createdUser) => {
      queryClient.setQueryData(["users", "detail", createdUser.id], createdUser);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditingBasicInfo(false);
      navigate(`/users/${createdUser.id}`, { replace: true });
    },
  });
  const updateUserMutation = useMutation({
    mutationFn: (value: UserBasicInfoFormValue) =>
      updateUser(userId!, {
        family_name: value.family_name,
        given_name: value.given_name,
        email: user.data?.email ?? value.email ?? "",
        phone: value.phone || null,
        phone_country_id: value.phone_country_id || null,
        preferred_locale_code: value.preferred_locale_code || null,
      }),
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(["users", "detail", updatedUser.id], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditingBasicInfo(false);
    },
  });

  const createLegalNameMutation = useMutation({
    mutationFn: (payload: UserLegalNamePayload) =>
      createUserLegalName(userId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", userId, "legal-names"],
      });
    },
  });
  const updateLegalNameMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UserLegalNamePayload;
    }) => updateUserLegalName(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", userId, "legal-names"],
      });
    },
  });
  const deleteLegalNameMutation = useMutation({
    mutationFn: deleteUserLegalName,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", userId, "legal-names"],
      });
    },
  });
  const createDelegationMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createUserDelegation>[1]) =>
      createUserDelegation(userId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", userId, "delegations"],
      });
    },
  });
  const updateDelegationMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateUserDelegation>[2];
    }) => updateUserDelegation(userId!, id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", userId, "delegations"],
      });
    },
  });
  const deleteDelegationMutation = useMutation({
    mutationFn: (delegationId: string) => deleteUserDelegation(userId!, delegationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", userId, "delegations"],
      });
    },
  });
  const sendAuthEmailMutation = useMutation({
    mutationFn: () => sendUserVerificationEmail(userId!),
    onSuccess: (result) => {
      setAuthMessage(
        result.already_verified
          ? "This individual is already verified."
          : "Authentication email has been sent.",
      );
    },
  });

  if (!isCreateMode && !hasValidUserId) {
    return <NotFoundPage />;
  }

  if (!isCreateMode && user.isLoading) {
    return (
      <div className="grid min-h-[calc(100dvh-8rem)] place-items-center">
        <span
          aria-label="Loading"
          className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950"
          role="status"
        />
      </div>
    );
  }

  if (!isCreateMode && (user.isError || !user.data)) {
    if (user.error?.message.includes("404")) {
      return <NotFoundPage />;
    }

    return <FormAlert>{user.error?.message || "Unable to load individual."}</FormAlert>;
  }

  const pageTitle = isCreateMode
    ? "Create individual"
    : displayName || "Individual";

  return (
    <CollapsibleCardContainer
      className="lm-card-page-compact"
      layout="masonry"
      header={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="grid min-w-0 gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("nav.workspace")} &gt; {t("nav.users")}
            </p>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">
              {pageTitle}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Manage this individual’s profile, legal names, relationships, and login access.
            </p>
          </div>
          <div className="flex justify-end md:pb-0.5">
            <IconButton label="Back to Individuals" onClick={() => navigate("/users")}>
              <ArrowLeft aria-hidden="true" size={16} />
            </IconButton>
          </div>
        </div>
      }
    >
      <CollapsibleCard
        collapsible={false}
        isOpen
        onOpenChange={() => undefined}
        title="Basic info"
        action={
          !showBasicInfoForm &&
          user.data && (
            <Button
              className="min-h-8 px-2.5 text-sm"
              variant="secondary"
              onClick={() => {
                setBasicInfoForm({
                  family_name: user.data.family_name,
                  given_name: user.data.given_name,
                  email: user.data.email,
                  phone: user.data.phone ?? "",
                  phone_country_id: user.data.phone_country_id ?? "",
                  preferred_locale_code: user.data.preferred_locale_code ?? "",
                });
                setIsEditingBasicInfo(true);
              }}
            >
              <Edit2 aria-hidden="true" size={16} />
              {t("profile.edit")}
            </Button>
          )
        }
      >
        {showBasicInfoForm ? (
          <UserBasicInfoForm
            cancelLabel={t("profile.cancel")}
            countries={countries.data ?? []}
            disabled={
              createUserMutation.isPending || updateUserMutation.isPending
            }
            emailEditable={!isCreateMode}
            emailRequired={isCreateMode}
            localeCode={locale}
            locales={locales.data ?? []}
            submitError={
              createUserMutation.isError
                ? createUserMutation.error.message
                : updateUserMutation.isError
                  ? updateUserMutation.error.message
                  : undefined
            }
            submitLabel={
              createUserMutation.isPending || updateUserMutation.isPending
                ? t("profile.saving")
                : isCreateMode
                  ? "Create"
                  : t("profile.save")
            }
            value={basicInfoForm}
            onCancel={() => {
              if (isCreateMode) {
                navigate("/users");
                return;
              }
              setIsEditingBasicInfo(false);
            }}
            onChange={setBasicInfoForm}
            onSubmit={(value) => {
              if (isCreateMode) {
                createUserMutation.mutate(value);
                return;
              }

              updateUserMutation.mutate(value);
            }}
          />
        ) : (
          user.data && (
            <dl className="grid gap-4 md:grid-cols-2">
              <DetailField label={t("profile.field.name")} value={displayName} />
              <DetailField label={t("form.email")} value={user.data.email} />
              <DetailField label="Phone" value={user.data.phone || "--"} />
              <DetailField
                label={t("form.preferredLocale")}
                value={preferredLocaleLabel}
              />
              <DetailField label={t("profile.field.status")} value={user.data.status || "--"} />
              <DetailField
                label="Email verified"
                value={user.data.email_verified_at ? t("profile.value.yes") : t("profile.value.no")}
              />
            </dl>
          )
        )}
      </CollapsibleCard>

      {showManagementCards && (
        <>
          <LegalNamesCard
            countries={countries.data ?? []}
            defaultLocaleCode={user.data!.preferred_locale_code || locale}
            deleteError={deleteLegalNameMutation.error?.message}
            isDeleting={deleteLegalNameMutation.isPending}
            isLoading={legalNames.isLoading}
            legalNames={legalNames.data ?? []}
            loadError={legalNames.isError ? legalNames.error.message : undefined}
            locales={locales.data ?? []}
            title={t("profile.legalNamesSection")}
            onCreate={(payload) => createLegalNameMutation.mutateAsync(payload)}
            onDelete={(id) => deleteLegalNameMutation.mutateAsync(id)}
            onUpdate={(id, payload) =>
              updateLegalNameMutation.mutateAsync({ id, payload })
            }
          />

          <UserDelegationsCard
            delegations={delegations.data ?? []}
            isLoading={delegations.isLoading}
            locale={localeByCode.get(locale)}
            subjectUser={user.data!}
            users={users.data ?? []}
            onCreate={(payload) => createDelegationMutation.mutateAsync(payload)}
            onUpdate={(id, payload) =>
              updateDelegationMutation.mutateAsync({ id, payload })
            }
            onDelete={(id) => deleteDelegationMutation.mutateAsync(id)}
          />

          <CollapsibleCard
            collapsible={false}
            description="Property-specific access will be listed here after properties are connected to individuals."
            isOpen
            onOpenChange={() => undefined}
            summary={
              <FormAlert tone="info">
                No property access records are available yet.
              </FormAlert>
            }
            title="Property access"
          />

          <CollapsibleCard
            collapsible={false}
            description="Send an authentication email only when this individual needs login access."
            isOpen
            onOpenChange={() => undefined}
            title="Authentication"
          >
            <div className="grid gap-4">
              {authMessage && <FormAlert tone="success">{authMessage}</FormAlert>}
              {sendAuthEmailMutation.isError && (
                <FormAlert>{sendAuthEmailMutation.error.message}</FormAlert>
              )}
              <Button
                className="w-fit"
                disabled={
                  Boolean(user.data!.email_verified_at) ||
                  sendAuthEmailMutation.isPending
                }
                type="button"
                onClick={() => sendAuthEmailMutation.mutate()}
              >
                <Mail aria-hidden="true" size={16} />
                {sendAuthEmailMutation.isPending
                  ? t("dashboard.sendingVerificationEmail")
                  : "Send authentication email"}
              </Button>
            </div>
          </CollapsibleCard>
        </>
      )}
    </CollapsibleCardContainer>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
