import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GridManagementPage } from "../components/data/GridManagementPage";
import { useDataGridPageSize } from "../components/data/useDataGridPageSize";
import { useUrlDataGridState } from "../components/data/useUrlDataGridState";
import { getBootstrapLocales } from "../features/auth/authApi";
import {
  expireEmailLink,
  listActiveEmailLinks,
  resendEmailLink,
} from "../features/users/usersApi";
import type { ActiveEmailLink } from "../features/users/usersApi";
import { formatPersonName } from "../lib/i18n/nameFormat";
import { useTranslation } from "../lib/i18n/useTranslation";

export function EmailLinksPage() {
  const { locale, t } = useTranslation();
  const queryClient = useQueryClient();
  const { pageSize, setPageSize } = useDataGridPageSize();
  const { pageIndex, setPageIndex, setSortState, sortState } =
    useUrlDataGridState();
  const activeEmailLinks = useQuery({
    queryKey: ["users", "email-links", "active"],
    queryFn: listActiveEmailLinks,
  });
  const locales = useQuery({
    queryKey: ["bootstrap-locales"],
    queryFn: getBootstrapLocales,
    staleTime: Infinity,
  });
  const localeByCode = new Map(
    (locales.data ?? []).map((localeOption) => [localeOption.code, localeOption]),
  );
  const expireEmailLinkMutation = useMutation({
    mutationFn: expireEmailLink,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", "email-links", "active"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["users", "email-links", "stats"],
      });
    },
  });
  const resendEmailLinkMutation = useMutation({
    mutationFn: resendEmailLink,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", "email-links", "active"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["users", "email-links", "stats"],
      });
    },
  });
  const errorMessage =
    activeEmailLinks.isError
      ? activeEmailLinks.error.message
      : expireEmailLinkMutation.isError
        ? expireEmailLinkMutation.error.message
        : resendEmailLinkMutation.isError
          ? resendEmailLinkMutation.error.message
          : undefined;

  return (
    <GridManagementPage<ActiveEmailLink>
        actionsClassName="md:self-end"
        columnSelectionStorageKey="auth-control"
        columns={[
          {
            key: "name",
            header: t("profile.field.name"),
            render: (link) =>
              formatPersonName(
                link.family_name,
                link.given_name,
                link.preferred_locale_code
                  ? localeByCode.get(link.preferred_locale_code)
                  : undefined,
              ),
            sortable: true,
            sortValue: (link) =>
              formatPersonName(
                link.family_name,
                link.given_name,
                link.preferred_locale_code
                  ? localeByCode.get(link.preferred_locale_code)
                  : undefined,
              ),
          },
          {
            key: "email",
            header: t("form.email"),
            render: (link) => link.email,
            sortable: true,
            sortValue: (link) => link.email,
          },
          {
            key: "issued",
            header: t("users.linkIssuedAt"),
            render: (link) =>
              link.created_at ? formatDateTime(link.created_at, locale) : "--",
            sortable: true,
            sortValue: (link) => link.created_at,
          },
          {
            key: "expires",
            header: t("users.linkExpiresAt"),
            render: (link) => formatDateTime(link.expires_at, locale),
            sortable: true,
            sortValue: (link) => link.expires_at,
          },
          {
            align: "right",
            key: "actions",
            header: "",
            render: (link) => (
              <div className="flex justify-end gap-2">
                <button
                  className="lm-button-primary inline-flex min-h-8 items-center justify-center rounded-md border px-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    resendEmailLinkMutation.isPending ||
                    expireEmailLinkMutation.isPending
                  }
                  type="button"
                  onClick={() => resendEmailLinkMutation.mutate(link.id)}
                >
                  {resendEmailLinkMutation.isPending
                    ? t("dashboard.sendingVerificationEmail")
                    : t("users.resendVerification")}
                </button>
                <button
                  className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    expireEmailLinkMutation.isPending ||
                    resendEmailLinkMutation.isPending
                  }
                  type="button"
                  onClick={() => expireEmailLinkMutation.mutate(link.id)}
                >
                  {t("users.expireLink")}
                </button>
              </div>
            ),
          },
        ]}
        emptyMessage={
          activeEmailLinks.isLoading
            ? t("users.loadingEmailLinks")
            : t("users.noActiveEmailLinks")
        }
        errorMessage={errorMessage}
        description={t("users.activeEmailLinksDescription")}
        eyebrow={t("nav.admin")}
        heightClassName="h-[calc(100vh-260px)] min-h-[560px]"
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
        records={activeEmailLinks.data ?? []}
        sortState={sortState}
        title={t("users.activeEmailLinks")}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSortChange={setSortState}
      />
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
