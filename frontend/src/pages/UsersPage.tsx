import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, RefreshCw, Search, Trash2, UserCheck, UserX } from "lucide-react";

import { GridManagementPage } from "../components/data/GridManagementPage";
import { useDataGridPageSize } from "../components/data/useDataGridPageSize";
import { useUrlDataGridState } from "../components/data/useUrlDataGridState";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { getBootstrapLocales, getCurrentUser } from "../features/auth/authApi";
import type { CurrentUser } from "../features/auth/authTypes";
import { UserForm } from "../features/users/UserForm";
import type { UserFormValue } from "../features/users/userFormTypes";
import {
  defaultUserSearchForm,
  isEffectivelyEmptyUserForm,
} from "../features/users/userFormUtils";
import {
  activateUser,
  deactivateUser,
  deleteUser,
  listUsers,
} from "../features/users/usersApi";
import { formatPersonName } from "../lib/i18n/nameFormat";
import { useTranslation } from "../lib/i18n/useTranslation";

export function UsersPage() {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchForm, setSearchForm] = useState(defaultUserSearchForm);
  const [searchCriteria, setSearchCriteria] = useState(defaultUserSearchForm);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [deactivationUser, setDeactivationUser] = useState<CurrentUser | null>(null);
  const [activationUser, setActivationUser] = useState<CurrentUser | null>(null);
  const [deletionUser, setDeletionUser] = useState<CurrentUser | null>(null);
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
  const locales = useQuery({
    queryKey: ["bootstrap-locales"],
    queryFn: getBootstrapLocales,
    staleTime: Infinity,
  });
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });
  const canManageLoginAccess = currentUser.data?.role_code === "ADMIN";
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
      new Map(
        (locales.data ?? []).map((localeOption) => [
          localeOption.code,
          localeOption,
        ]),
      ),
    [locales.data],
  );

  const visibleUsers = users.data?.items ?? [];
  const activeActionUserId =
    activationUser?.id || deactivationUser?.id || deletionUser?.id || null;
  const isSearchDirty = useMemo(
    () => !isEffectivelyEmptyUserForm(searchForm),
    [searchForm],
  );

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

  function openSearchDrawer() {
    setSearchForm(searchCriteria);
    setIsSearchDrawerOpen(true);
  }

  function closeSearchDrawer() {
    setSearchForm(searchCriteria);
    setIsSearchDrawerOpen(false);
  }

  function handleSearchSubmit(value: UserFormValue) {
    setSearchCriteria(value);
    if (pageIndex !== 0) {
      setPageIndex(0);
    }
    setIsSearchDrawerOpen(false);
    return false;
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
              onClick={() => navigate("/users/create")}
            >
              <Plus aria-hidden="true" size={16} />
            </IconButton>
          </>
        }
        actionsClassName="md:self-end"
        activeRecordId={activeActionUserId}
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
          ...(canManageLoginAccess
            ? [
                {
                  key: "status",
                  header: t("profile.field.status"),
                  render: (user: CurrentUser) => user.status ?? "--",
                  sortable: true,
                  sortValue: (user: CurrentUser) => user.status ?? "",
                },
                {
                  key: "verified",
                  header: t("users.emailVerified"),
                  render: (user: CurrentUser) =>
                    user.email_verified_at
                      ? t("profile.value.yes")
                      : t("profile.value.no"),
                  sortable: true,
                  sortValue: (user: CurrentUser) => Boolean(user.email_verified_at),
                },
              ]
            : []),
          {
            align: "right",
            key: "actions",
            header: "",
            width: canManageLoginAccess ? "132px" : "52px",
            render: (user) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label={t("users.editUser")}
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <Edit2 aria-hidden="true" size={16} />
                </IconButton>
                {canManageLoginAccess &&
                  (user.status === "INACTIVE" ? (
                    <>
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
                    </>
                  ) : (
                    <IconButton
                      disabled={deactivateUserMutation.isPending}
                      label={t("users.deactivateUser")}
                      onClick={() => setDeactivationUser(user)}
                    >
                      <UserX aria-hidden="true" size={16} />
                    </IconButton>
                  ))}
              </div>
            ),
          },
        ]}
        description={t("users.description")}
        emptyMessage={users.isLoading ? t("users.loading") : t("users.empty")}
        errorMessage={users.isError ? users.error.message : undefined}
        eyebrow={t("nav.workspace")}
        heightClassName="h-[calc(100vh-260px)] min-h-[560px]"
        isRecordInactive={(user) => user.status === "INACTIVE"}
        pageIndex={pageIndex}
        paginationLabels={{
          firstPage: t("grid.firstPage"),
          lastPage: t("grid.lastPage"),
          nextPage: t("grid.nextPage"),
          paginationMode: t("grid.pagination"),
          previousPage: t("grid.previousPage"),
          rows: t("grid.rows"),
          showAllMode: t("grid.showAllRows"),
          switchToPagination: t("grid.switchToPagination"),
          switchToShowAll: t("grid.switchToShowAll"),
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
        closeOnOverlayClick={!isSearchDirty}
        isOpen={isSearchDrawerOpen}
        title={t("users.searchUsers")}
        onClose={closeSearchDrawer}
      >
        <div className="grid gap-4">
          <UserForm
            density="compact"
            mode="search"
            resetLabel={t("users.clearForm")}
            showPassword={false}
            submitLabel={t("users.search")}
            syncLocaleToUi={false}
            value={searchForm}
            onCancel={closeSearchDrawer}
            onChange={setSearchForm}
            onReset={() => setSearchForm(defaultUserSearchForm)}
            onSubmit={handleSearchSubmit}
          />
        </div>
      </Drawer>

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
