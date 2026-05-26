import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { EmailVerificationPrompt } from "../components/auth/EmailVerificationPrompt";
import { PageHeader } from "../components/layout/PageHeader";
import {
  getBootstrapStatus,
  getCurrentUser,
} from "../features/auth/authApi";
import { getEmailLinkDashboardStats } from "../features/users/usersApi";
import { getAccessToken } from "../lib/auth/tokenStorage";
import { useTranslation } from "../lib/i18n/useTranslation";

const SETUP_COMPLETED_CARD_SEEN_KEY = "leasemate.dashboard.setupCompletedCardSeen";

export function DashboardPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const [hasSeenCompletedSetupCard] = useState(
    () => localStorage.getItem(SETUP_COMPLETED_CARD_SEEN_KEY) === "true",
  );
  const routeState = location.state as { setupWarning?: string } | null;
  const showSmtpWarning = routeState?.setupWarning === "smtp";
  const hasToken = Boolean(getAccessToken());
  const bootstrapStatus = useQuery({
    queryKey: ["bootstrap-status"],
    queryFn: getBootstrapStatus,
  });
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hasToken,
    retry: false,
  });
  const emailLinkStats = useQuery({
    queryKey: ["users", "email-links", "stats"],
    queryFn: getEmailLinkDashboardStats,
    enabled: hasToken && currentUser.isSuccess && Boolean(currentUser.data?.email_verified_at),
    retry: false,
  });
  const emailNeedsVerification =
    Boolean(currentUser.data) && !currentUser.data?.email_verified_at;
  const adminSetupCompleted = Boolean(
    bootstrapStatus.data && !bootstrapStatus.data.bootstrap_required,
  );
  const backendStatusMessage = bootstrapStatus.isLoading
    ? t("dashboard.checkingSetup")
    : bootstrapStatus.isError
      ? t("dashboard.backendUnavailable")
      : bootstrapStatus.data?.bootstrap_required
        ? t("dashboard.adminSetupRequired")
        : bootstrapStatus.data
          ? t("dashboard.adminSetupCompleted")
          : "";
  const showBackendStatus =
    Boolean(backendStatusMessage) &&
    (!hasToken || (currentUser.isSuccess && !emailNeedsVerification)) &&
    !(hasToken && adminSetupCompleted && hasSeenCompletedSetupCard);

  useEffect(() => {
    if (
      showBackendStatus &&
      hasToken &&
      adminSetupCompleted &&
      currentUser.isSuccess &&
      !emailNeedsVerification
    ) {
      localStorage.setItem(SETUP_COMPLETED_CARD_SEEN_KEY, "true");
    }
  }, [
    adminSetupCompleted,
    currentUser.isSuccess,
    emailNeedsVerification,
    hasToken,
    showBackendStatus,
  ]);

  return (
    <section className="grid gap-6">
      <PageHeader
        description={t("dashboard.description")}
        eyebrow={t("nav.workspace")}
        title={t("nav.dashboard")}
        actions={
          bootstrapStatus.data?.bootstrap_required ? (
          <Link
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            to="/bootstrap-admin"
          >
            {t("auth.createAdmin")}
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          ) : null
        }
      />

      {emailNeedsVerification && currentUser.data && (
        <EmailVerificationPrompt currentUser={currentUser.data} />
      )}

      {showSmtpWarning && (
        <section className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          <div>
            <h2 className="font-bold">{t("auth.smtpWarningTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              {t("auth.smtpWarning")}
            </p>
          </div>
        </section>
      )}

      {showBackendStatus && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <article className="flex items-start gap-3.5 rounded-lg border border-slate-200 bg-white p-[18px]">
            <ShieldCheck aria-hidden="true" size={22} />
            <div>
              <h2 className="mb-2 font-bold text-slate-950">
                {t("dashboard.backendConnection")}
              </h2>
              <p className="leading-relaxed text-slate-500">
                {backendStatusMessage}
              </p>
            </div>
          </article>
        </div>
      )}

      {emailLinkStats.isSuccess && (
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-[18px]">
          <div className="flex items-start gap-3.5">
            <MailCheck aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
            <div>
              <h2 className="font-bold text-slate-950">
                {t("dashboard.emailLinkStatsTitle")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {t("dashboard.emailLinkStatsDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <DashboardStat
              label={t("dashboard.emailLinksActive")}
              value={emailLinkStats.data.active_link_count}
            />
            <DashboardStat
              label={t("dashboard.emailLinksExpiringToday")}
              value={emailLinkStats.data.expiring_today_count}
            />
            <DashboardStat
              tone={
                emailLinkStats.data.attention_required_count > 0
                  ? "danger"
                  : "normal"
              }
              label={t("dashboard.emailLinksNeedAttention")}
              value={emailLinkStats.data.attention_required_count}
            />
          </div>

          <div className="grid gap-2">
            <DashboardBar
              label={t("dashboard.emailLinksActive")}
              max={Math.max(
                emailLinkStats.data.active_link_count,
                emailLinkStats.data.attention_required_count,
                emailLinkStats.data.expiring_today_count,
                1,
              )}
              value={emailLinkStats.data.active_link_count}
            />
            <DashboardBar
              label={t("dashboard.emailLinksExpiringToday")}
              max={Math.max(
                emailLinkStats.data.active_link_count,
                emailLinkStats.data.attention_required_count,
                emailLinkStats.data.expiring_today_count,
                1,
              )}
              value={emailLinkStats.data.expiring_today_count}
            />
            <DashboardBar
              danger
              label={t("dashboard.emailLinksNeedAttention")}
              max={Math.max(
                emailLinkStats.data.active_link_count,
                emailLinkStats.data.attention_required_count,
                emailLinkStats.data.expiring_today_count,
                1,
              )}
              value={emailLinkStats.data.attention_required_count}
            />
          </div>

          <Link
            className="w-fit text-sm font-semibold text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
            to="/email-links"
          >
            {t("dashboard.viewEmailLinks")}
          </Link>
        </section>
      )}
    </section>
  );
}

function DashboardStat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: number;
  tone?: "normal" | "danger";
}) {
  return (
    <article
      className={[
        "rounded-lg border px-4 py-3",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-950"
          : "border-slate-200 bg-slate-50 text-slate-950",
      ].join(" ")}
    >
      <p className="text-3xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function DashboardBar({
  danger,
  label,
  max,
  value,
}: {
  danger?: boolean;
  label: string;
  max: number;
  value: number;
}) {
  const width = `${Math.max((value / max) * 100, value > 0 ? 6 : 0)}%`;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-950">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={[
            "h-full rounded-full",
            danger ? "bg-rose-500" : "bg-slate-950",
          ].join(" ")}
          style={{ width }}
        />
      </div>
    </div>
  );
}
