import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataGrid } from "../components/data/DataGrid";
import { PageHeader } from "../components/layout/PageHeader";
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
  const pageSize = useDataGridPageSize();
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

  return (
    <section className="grid gap-4">
      <PageHeader
        description={t("users.activeEmailLinksDescription")}
        eyebrow={t("nav.admin")}
        title={t("users.activeEmailLinks")}
      />

      {activeEmailLinks.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {activeEmailLinks.error.message}
        </p>
      )}
      {expireEmailLinkMutation.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {expireEmailLinkMutation.error.message}
        </p>
      )}
      {resendEmailLinkMutation.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {resendEmailLinkMutation.error.message}
        </p>
      )}

      <DataGrid<ActiveEmailLink>
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
            key: "action",
            header: "",
            render: (link) => (
              <div className="flex justify-end gap-2">
                <button
                  className="inline-flex min-h-8 items-center justify-center rounded-md bg-slate-950 px-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
        heightClassName="h-[calc(100vh-260px)] min-h-[560px]"
        pageIndex={pageIndex}
        pageSize={pageSize}
        records={activeEmailLinks.data ?? []}
        sortState={sortState}
        onPageIndexChange={setPageIndex}
        onSortChange={setSortState}
      />
    </section>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
