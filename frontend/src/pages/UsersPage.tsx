import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit2,
  History,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import { GridManagementPage } from "../components/data/GridManagementPage";
import { useDataGridPageSize } from "../components/data/useDataGridPageSize";
import { useUrlDataGridState } from "../components/data/useUrlDataGridState";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { getBootstrapLocales } from "../features/auth/authApi";
import type { CurrentUser } from "../features/auth/authTypes";
import { UserForm } from "../features/users/UserForm";
import type { UserFormValue } from "../features/users/userFormTypes";
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  listUserLoginSessions,
  listUsers,
  sendUserVerificationEmail,
  updateUser,
  type UserLoginSession,
} from "../features/users/usersApi";
import { formatPersonName } from "../lib/i18n/nameFormat";
import { useTranslation } from "../lib/i18n/useTranslation";

const defaultUserForm: UserFormValue = {
  family_name: "",
  given_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  phone_country_id: "",
  role_id: "",
  preferred_locale_code: "",
  status: "NEEDS_EMAIL_VERIFICATION",
};

const defaultUserSearchForm: UserFormValue = {
  ...defaultUserForm,
  status: "",
};

type DrawerMode = "create" | "edit" | "search";

export function UsersPage() {
  const { locale, t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultUserForm);
  const [searchForm, setSearchForm] = useState(defaultUserSearchForm);
  const [searchCriteria, setSearchCriteria] = useState(defaultUserSearchForm);
  const [selectedUser, setSelectedUser] = useState<CurrentUser | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmEmailError, setConfirmEmailError] = useState("");
  const [deactivationUser, setDeactivationUser] = useState<CurrentUser | null>(
    null,
  );
  const [activationUser, setActivationUser] = useState<CurrentUser | null>(
    null,
  );
  const [deletionUser, setDeletionUser] = useState<CurrentUser | null>(null);
  const [verificationUser, setVerificationUser] = useState<CurrentUser | null>(
    null,
  );
  const [loginSessionUser, setLoginSessionUser] = useState<CurrentUser | null>(
    null,
  );
  const { pageSize, setPageSize } = useDataGridPageSize();
  const { pageIndex, setPageIndex, setSortState, sortState } =
    useUrlDataGridState();
  const users = useQuery({
    queryKey: [
      "users",
      "page",
      pageIndex,
      pageSize,
      sortState?.columnKey ?? "created_at",
      sortState?.direction ?? "asc",
      searchCriteria.family_name,
      searchCriteria.given_name,
      searchCriteria.email,
      searchCriteria.phone,
      searchCriteria.preferred_locale_code,
    ],
    queryFn: () =>
      listUsers({
        page: pageIndex + 1,
        pageSize,
        email: searchCriteria.email,
        familyName: searchCriteria.family_name,
        givenName: searchCriteria.given_name,
        phone: searchCriteria.phone,
        preferredLocaleCode: searchCriteria.preferred_locale_code,
        sortBy: toUserSortBy(sortState?.columnKey),
        sortDirection: sortState?.direction ?? "asc",
      }),
  });
  const loginSessions = useQuery({
    queryKey: ["users", loginSessionUser?.id, "login-sessions"],
    enabled: Boolean(loginSessionUser),
    queryFn: () => listUserLoginSessions(loginSessionUser!.id),
  });
  const locales = useQuery({
    queryKey: ["bootstrap-locales"],
    queryFn: getBootstrapLocales,
    staleTime: Infinity,
  });
  const localeLabelByCode = useMemo(
    () =>
      new Map(
        (locales.data ?? []).map((localeOption) => [
          localeOption.code,
          getLocaleDisplayName(localeOption.code, locale) ||
            localeOption.native_name ||
            localeOption.name,
        ]),
      ),
    [locale, locales.data],
  );
  const localeByCode = useMemo(
    () =>
      new Map((locales.data ?? []).map((localeOption) => [localeOption.code, localeOption])),
    [locales.data],
  );
  const visibleUsers = users.data?.items ?? [];
  const isFormDirty = useMemo(
    () =>
      !isEffectivelyEmptyUserForm(form) &&
      !areUserFormsEqual(form, selectedUser ? userToForm(selectedUser) : defaultUserForm),
    [form, selectedUser],
  );
  const activeActionUserId =
    selectedUser?.id ||
    activationUser?.id ||
    deactivationUser?.id ||
    deletionUser?.id ||
    verificationUser?.id ||
    loginSessionUser?.id ||
    null;
  const isEditing = selectedUser !== null;
  const isEmailChanged = isEditing && form.email !== selectedUser.email;

  const createUserMutation = useMutation({
    mutationFn: (value: UserFormValue) => {
      return createUser(buildUserPayload(value));
    },
    onSuccess: async () => {
      closeDrawer();
      await invalidateUserQueries(queryClient);
    },
  });
  const updateUserMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: UserFormValue }) =>
      updateUser(id, buildUserPayload(value)),
    onSuccess: async () => {
      closeDrawer();
      await invalidateUserQueries(queryClient);
    },
  });
  const sendVerificationMutation = useMutation({
    mutationFn: sendUserVerificationEmail,
    onSuccess: async () => {
      setVerificationUser(null);
      await invalidateUserQueries(queryClient);
    },
  });
  const activateUserMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: async () => {
      setActivationUser(null);
      await invalidateUserQueries(queryClient);
    },
  });
  const deactivateUserMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      setDeactivationUser(null);
      await invalidateUserQueries(queryClient);
    },
  });
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setDeletionUser(null);
      await invalidateUserQueries(queryClient);
    },
  });

  function openCreateDrawer() {
    setSelectedUser(null);
    setConfirmEmail("");
    setConfirmEmailError("");
    setForm(defaultUserForm);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  }

  function openSearchDrawer() {
    setSelectedUser(null);
    setConfirmEmail("");
    setConfirmEmailError("");
    setSearchForm(searchCriteria);
    setDrawerMode("search");
    setIsDrawerOpen(true);
  }

  function openEditDrawer(user: CurrentUser) {
    setSelectedUser(user);
    setConfirmEmail("");
    setConfirmEmailError("");
    setForm(userToForm(user));
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setSelectedUser(null);
    setConfirmEmail("");
    setConfirmEmailError("");
    setForm(defaultUserForm);
    setSearchForm(searchCriteria);
    setIsDrawerOpen(false);
  }

  function handleSubmit(value: UserFormValue) {
    if (drawerMode === "search") {
      setSearchCriteria(value);
      if (pageIndex !== 0) {
        setPageIndex(0);
      }
      setIsDrawerOpen(false);
      return false;
    }

    if (selectedUser) {
      if (value.email !== selectedUser.email && confirmEmail !== value.email) {
        setConfirmEmailError(t("users.emailConfirmationMismatch"));
        return false;
      }

      updateUserMutation.mutate({ id: selectedUser.id, value });
      return true;
    }

    createUserMutation.mutate(value);
    return true;
  }

  if (loginSessionUser) {
    return (
      <GridManagementPage<UserLoginSession>
        actions={
          <>
            <IconButton
              label={t("users.backToUsers")}
              tone="primary"
              onClick={() => setLoginSessionUser(null)}
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </IconButton>
            <IconButton
              disabled={loginSessions.isFetching}
              label={t("users.reload")}
              tone="primary"
              onClick={() => loginSessions.refetch()}
            >
              <RefreshCw
                aria-hidden="true"
                className={loginSessions.isFetching ? "animate-spin" : ""}
                size={16}
              />
            </IconButton>
          </>
        }
        actionsClassName="md:self-end"
        columnSelectionStorageKey="user-login-sessions"
        columns={buildLoginSessionColumns(t, locale)}
        description={t("users.loginSessionsDescription")}
        emptyMessage={
          loginSessions.isLoading
            ? t("users.loading")
            : t("users.noLoginSessions")
        }
        errorMessage={
          loginSessions.isError ? loginSessions.error.message : undefined
        }
        eyebrow={`${t("nav.admin")} > ${t("nav.users")}`}
        heightClassName="h-[calc(100vh-260px)] min-h-[560px]"
        pageIndex={0}
        paginationLabels={{
          firstPage: t("grid.firstPage"),
          lastPage: t("grid.lastPage"),
          nextPage: t("grid.nextPage"),
          previousPage: t("grid.previousPage"),
          rows: t("grid.rows"),
        }}
        pageSize={pageSize}
        records={loginSessions.data ?? []}
        sortState={sortState}
        title={formatPersonName(
          loginSessionUser.family_name,
          loginSessionUser.given_name,
          loginSessionUser.preferred_locale_code
            ? localeByCode.get(loginSessionUser.preferred_locale_code)
            : undefined,
        )}
        totalRecords={loginSessions.data?.length ?? 0}
        onSortChange={setSortState}
      />
    );
  }

  return (
    <>
      <GridManagementPage<CurrentUser>
        actions={
          <>
            <IconButton
              label={t("users.searchUsers")}
              tone="primary"
              onClick={openSearchDrawer}
            >
              <Search aria-hidden="true" size={16} />
            </IconButton>
            <IconButton
              disabled={users.isFetching}
              label={t("users.reload")}
              tone="primary"
              onClick={() => users.refetch()}
            >
              <RefreshCw
                aria-hidden="true"
                className={users.isFetching ? "animate-spin" : ""}
                size={16}
              />
            </IconButton>
            <IconButton
              label={t("users.createUser")}
              tone="primary"
              onClick={openCreateDrawer}
            >
              <Plus aria-hidden="true" size={16} />
            </IconButton>
          </>
        }
        actionsClassName="md:self-end"
        columnSelectionStorageKey="users"
        columns={[
            {
              key: "name",
              header: t("profile.field.name"),
              sortable: true,
              render: (user) =>
                formatPersonName(
                  user.family_name,
                  user.given_name,
                  user.preferred_locale_code
                    ? localeByCode.get(user.preferred_locale_code)
                    : undefined,
                ),
              sortValue: (user) =>
                formatPersonName(
                  user.family_name,
                  user.given_name,
                  user.preferred_locale_code
                    ? localeByCode.get(user.preferred_locale_code)
                    : undefined,
                ),
            },
            {
              key: "email",
              header: t("form.email"),
              render: (user) => user.email,
              sortable: true,
              sortValue: (user) => user.email,
            },
            {
              key: "locale",
              header: t("form.preferredLocale"),
              render: (user) =>
                user.preferred_locale_code
                  ? localeLabelByCode.get(user.preferred_locale_code) ||
                    user.preferred_locale_code
                  : "--",
              sortable: true,
              sortValue: (user) =>
                user.preferred_locale_code
                  ? localeLabelByCode.get(user.preferred_locale_code) ||
                    user.preferred_locale_code
                  : "",
            },
            {
              key: "status",
              header: t("profile.field.status"),
              render: (user) => user.status ?? "--",
              sortable: true,
              sortValue: (user) => user.status ?? "",
            },
            {
              key: "verified",
              header: t("users.emailVerified"),
              render: (user) =>
                user.email_verified_at ? t("profile.value.yes") : t("profile.value.no"),
              sortable: true,
              sortValue: (user) => Boolean(user.email_verified_at),
            },
            {
              align: "right",
              key: "actions",
              header: "",
              width: "180px",
              render: (user) =>
                user.status === "INACTIVE" ? (
                  <div className="flex justify-end gap-1">
                    <IconButton
                      label={t("users.viewLoginSessions")}
                      onClick={() => setLoginSessionUser(user)}
                    >
                      <History aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      disabled={activateUserMutation.isPending}
                      label={t("users.activateUser")}
                      onClick={() => setActivationUser(user)}
                    >
                      <UserCheck aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      disabled={deleteUserMutation.isPending}
                      label={t("users.deleteUser")}
                      onClick={() => setDeletionUser(user)}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </IconButton>
                  </div>
                ) : (
                  <div className="relative flex justify-end gap-1">
                    <IconButton
                      label={t("users.editUser")}
                      onClick={() => openEditDrawer(user)}
                    >
                      <Edit2 aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      label={t("users.viewLoginSessions")}
                      onClick={() => setLoginSessionUser(user)}
                    >
                      <History aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      disabled={
                        Boolean(user.email_verified_at) ||
                        sendVerificationMutation.isPending
                      }
                      label={t("users.sendVerification")}
                      onClick={() => setVerificationUser(user)}
                    >
                      <Mail aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      disabled={deactivateUserMutation.isPending}
                      label={t("users.deactivateUser")}
                      onClick={() => setDeactivationUser(user)}
                    >
                      <UserX aria-hidden="true" size={16} />
                    </IconButton>
                  </div>
                ),
            },
        ]}
        activeRecordId={activeActionUserId}
        description={t("users.description")}
        emptyMessage={
          users.isLoading ? t("users.loading") : t("users.empty")
        }
        errorMessage={
          users.isError ? users.error.message : undefined
        }
        eyebrow={t("nav.admin")}
        heightClassName="h-[calc(100vh-260px)] min-h-[560px]"
        isRecordInactive={(user) => user.status === "INACTIVE"}
        pageIndex={pageIndex}
        paginationLabels={{
          firstPage: t("grid.firstPage"),
          lastPage: t("grid.lastPage"),
          nextPage: t("grid.nextPage"),
          previousPage: t("grid.previousPage"),
          rows: t("grid.rows"),
        }}
        pageSize={pageSize}
        records={visibleUsers}
        sortState={sortState}
        title={t("nav.users")}
        totalRecords={users.data?.total ?? 0}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSortChange={setSortState}
      />

      <Drawer
        closeOnOverlayClick={!isFormDirty}
        isOpen={isDrawerOpen}
        title={
          drawerMode === "search"
            ? t("users.searchUsers")
            : isEditing
              ? t("users.editUser")
              : t("users.createUser")
        }
        onClose={closeDrawer}
      >
        <div className="grid gap-4">
          <UserForm
            confirmEmailError={confirmEmailError}
            confirmEmailValue={confirmEmail}
            density="compact"
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
            mode={drawerMode === "search" ? "search" : "edit"}
            requireEmailConfirmation={isEmailChanged}
            resetLabel={t("users.clearForm")}
            showInvitationHelp={!isEditing && drawerMode !== "search"}
            showPassword={false}
            submitError={
              createUserMutation.isError || updateUserMutation.isError
                ? createUserMutation.error?.message ||
                  updateUserMutation.error?.message
                : undefined
            }
            submitLabel={
              drawerMode === "search"
                ? t("users.search")
                : createUserMutation.isPending || updateUserMutation.isPending
                ? t("profile.saving")
                : t("profile.save")
            }
            syncLocaleToUi={false}
            value={drawerMode === "search" ? searchForm : form}
            onChange={(nextValue) => {
              if (drawerMode === "search") {
                setSearchForm(nextValue);
              } else {
                setForm(nextValue);
              }
              if (confirmEmailError) {
                setConfirmEmailError("");
              }
            }}
            onCancel={closeDrawer}
            onConfirmEmailChange={setConfirmEmail}
            onReset={() => {
              if (drawerMode === "search") {
                setSearchForm(defaultUserSearchForm);
              } else {
                setForm(selectedUser ? userToForm(selectedUser) : defaultUserForm);
              }
              setConfirmEmail("");
              setConfirmEmailError("");
            }}
            onSubmit={handleSubmit}
          />
        </div>
      </Drawer>
      {verificationUser && (
        <Modal title={t("users.sendVerificationConfirmTitle")}>
          <div className="mt-4 grid gap-4">
            <p className="text-sm font-normal leading-relaxed text-slate-600">
              {t("users.sendVerificationConfirmBody")}
            </p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700">
              {verificationUser.email}
            </p>
            <p className="text-sm font-normal leading-relaxed text-red-700">
              {t("users.sendVerificationInvalidatesPrevious")}
            </p>
            {sendVerificationMutation.isError && (
              <p className="text-sm font-normal text-red-700">
                {sendVerificationMutation.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button
                disabled={sendVerificationMutation.isPending}
                type="button"
                variant="secondary"
                onClick={() => setVerificationUser(null)}
              >
                {t("profile.cancel")}
              </Button>
              <Button
                disabled={sendVerificationMutation.isPending}
                type="button"
                onClick={() => sendVerificationMutation.mutate(verificationUser.id)}
              >
                {sendVerificationMutation.isPending
                  ? t("dashboard.sendingVerificationEmail")
                  : t("users.sendVerification")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {deactivationUser && (
        <UserActionConfirmModal
          body={t("users.deactivateConfirmBody")}
          cancelLabel={t("profile.cancel")}
          confirmLabel={t("users.deactivateUser")}
          disabled={deactivateUserMutation.isPending}
          error={deactivateUserMutation.error?.message}
          name={formatPersonName(
            deactivationUser.family_name,
            deactivationUser.given_name,
            deactivationUser.preferred_locale_code
              ? localeByCode.get(deactivationUser.preferred_locale_code)
              : undefined,
          )}
          title={t("users.deactivateConfirmTitle")}
          variant="secondary"
          onCancel={() => setDeactivationUser(null)}
          onConfirm={() => deactivateUserMutation.mutate(deactivationUser.id)}
        />
      )}
      {activationUser && (
        <UserActionConfirmModal
          body={t("users.activateConfirmBody")}
          cancelLabel={t("profile.cancel")}
          confirmLabel={t("users.activateUser")}
          disabled={activateUserMutation.isPending}
          error={activateUserMutation.error?.message}
          name={formatPersonName(
            activationUser.family_name,
            activationUser.given_name,
            activationUser.preferred_locale_code
              ? localeByCode.get(activationUser.preferred_locale_code)
              : undefined,
          )}
          title={t("users.activateConfirmTitle")}
          variant="secondary"
          onCancel={() => setActivationUser(null)}
          onConfirm={() => activateUserMutation.mutate(activationUser.id)}
        />
      )}
      {deletionUser && (
        <UserActionConfirmModal
          body={t("users.deleteConfirmBody")}
          cancelLabel={t("profile.cancel")}
          confirmLabel={t("users.deleteUser")}
          disabled={deleteUserMutation.isPending}
          error={deleteUserMutation.error?.message}
          name={formatPersonName(
            deletionUser.family_name,
            deletionUser.given_name,
            deletionUser.preferred_locale_code
              ? localeByCode.get(deletionUser.preferred_locale_code)
              : undefined,
          )}
          title={t("users.deleteConfirmTitle")}
          variant="danger"
          warning={t("users.deleteCannotRollback")}
          onCancel={() => setDeletionUser(null)}
          onConfirm={() => deleteUserMutation.mutate(deletionUser.id)}
        />
      )}
    </>
  );
}

function areUserFormsEqual(left: UserFormValue, right: UserFormValue) {
  return (
    left.family_name === right.family_name &&
    left.given_name === right.given_name &&
    left.email === right.email &&
    left.password === right.password &&
    left.confirm_password === right.confirm_password &&
    left.phone === right.phone &&
    left.phone_country_id === right.phone_country_id &&
    left.role_id === right.role_id &&
    left.preferred_locale_code === right.preferred_locale_code &&
    left.status === right.status
  );
}

function userToForm(user: CurrentUser): UserFormValue {
  return {
    family_name: user.family_name,
    given_name: user.given_name,
    email: user.email,
    password: "",
    confirm_password: "",
    phone: user.phone ?? "",
    phone_country_id: user.phone_country_id ?? "",
    role_id: user.role_id ?? "",
    preferred_locale_code: user.preferred_locale_code ?? "",
    status: user.status ?? "NEEDS_EMAIL_VERIFICATION",
  };
}

function buildUserPayload(value: UserFormValue) {
  const hasPhoneNumber = value.phone.replace(/\D/g, "").length > 0;

  return {
    family_name: value.family_name,
    given_name: value.given_name,
    email: value.email,
    phone: hasPhoneNumber ? value.phone : null,
    phone_country_id: hasPhoneNumber ? value.phone_country_id || null : null,
    preferred_locale_code: value.preferred_locale_code || null,
  };
}

function getLocaleDisplayName(targetLocale: string, displayLocale: string) {
  try {
    return new Intl.DisplayNames([displayLocale], { type: "language" }).of(
      targetLocale,
    );
  } catch {
    return undefined;
  }
}

function toUserSortBy(columnKey?: string) {
  const sortFields: Record<string, string> = {
    email: "email",
    locale: "preferred_locale",
    name: "name",
    status: "status",
    verified: "email_verified",
  };

  return columnKey ? sortFields[columnKey] ?? "created_at" : "created_at";
}

function buildLoginSessionColumns(
  t: ReturnType<typeof useTranslation>["t"],
  locale: string,
) {
  return [
    {
      key: "createdAt",
      header: t("users.loginAt"),
      render: (session: UserLoginSession) => formatDateTime(session.created_at, locale),
      sortable: true,
      sortValue: (session: UserLoginSession) => session.created_at ?? "",
    },
    {
      key: "lastUsedAt",
      header: t("users.lastUsedAt"),
      render: (session: UserLoginSession) => formatDateTime(session.last_used_at, locale),
      sortable: true,
      sortValue: (session: UserLoginSession) => session.last_used_at ?? "",
    },
    {
      key: "status",
      header: t("users.sessionStatus"),
      render: (session: UserLoginSession) => getSessionStatus(session, t),
      sortable: true,
      sortValue: (session: UserLoginSession) => getSessionStatus(session, t),
    },
    {
      key: "expiresAt",
      header: t("users.expiresAt"),
      render: (session: UserLoginSession) => formatDateTime(session.expires_at, locale),
      sortable: true,
      sortValue: (session: UserLoginSession) => session.expires_at,
    },
    {
      key: "revokedAt",
      header: t("users.revokedAt"),
      render: (session: UserLoginSession) => formatDateTime(session.revoked_at, locale),
      sortable: true,
      sortValue: (session: UserLoginSession) => session.revoked_at ?? "",
    },
    {
      key: "deviceInfo",
      header: t("users.deviceInfo"),
      render: (session: UserLoginSession) => session.device_info || "--",
      sortable: true,
      sortValue: (session: UserLoginSession) => session.device_info ?? "",
    },
    {
      key: "ipAddress",
      header: t("users.ipAddress"),
      render: (session: UserLoginSession) => session.ip_address || "--",
      sortable: true,
      sortValue: (session: UserLoginSession) => session.ip_address ?? "",
    },
  ];
}

function getSessionStatus(
  session: UserLoginSession,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (session.revoked_at) {
    return t("users.revokedSession");
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    return t("users.expiredSession");
  }

  return t("users.activeSession");
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function invalidateUserQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["users"] });
  await queryClient.invalidateQueries({
    queryKey: ["users", "email-links", "active"],
  });
  await queryClient.invalidateQueries({
    queryKey: ["users", "email-links", "stats"],
  });
}

function UserActionConfirmModal({
  body,
  cancelLabel,
  confirmLabel,
  disabled,
  email,
  error,
  name,
  title,
  variant,
  warning,
  onCancel,
  onConfirm,
}: {
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  disabled: boolean;
  email?: string;
  error?: string;
  name?: string;
  title: string;
  variant: "danger" | "secondary";
  warning?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title}>
      <div className="mt-4 grid gap-4">
        <p className="text-sm font-normal leading-relaxed text-slate-600">
          {body}
        </p>
        {name && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700">
            {name}
          </p>
        )}
        {email && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700">
            {email}
          </p>
        )}
        {warning && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-normal leading-relaxed text-red-700">
            {warning}
          </p>
        )}
        {error && <p className="text-sm font-normal text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button
            disabled={disabled}
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            className={
              variant === "danger"
                ? "bg-red-700 hover:bg-red-800"
                : undefined
            }
            disabled={disabled}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function isEffectivelyEmptyUserForm(value: UserFormValue) {
  return (
    value.family_name === "" &&
    value.given_name === "" &&
    value.email === "" &&
    value.password === "" &&
    value.confirm_password === "" &&
    value.phone === "" &&
    value.role_id === defaultUserForm.role_id &&
    value.preferred_locale_code === defaultUserForm.preferred_locale_code &&
    value.status === defaultUserForm.status
  );
}
