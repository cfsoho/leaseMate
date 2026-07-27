import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { EmailVerificationPrompt } from "../components/auth/EmailVerificationPrompt";
import { PageHeader } from "../components/layout/PageHeader";
import {
  getBootstrapStatus,
  getCurrentUser,
  getCurrentUserPasskeys,
  getCurrentUserReadiness,
} from "../features/auth/authApi";
import {
  PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY,
  passkeysAreSupported,
  registerCurrentUserPasskey,
} from "../features/auth/passkeys";
import type { CurrentUserReadiness } from "../features/auth/authTypes";
import { getSystemEmailSettingsStatus } from "../features/settings/settingsApi";
import { getEmailLinkDashboardStats } from "../features/users/usersApi";
import { getAccessToken } from "../lib/auth/tokenStorage";
import { useTranslation } from "../lib/i18n/useTranslation";
import { Button } from "../components/ui/Button";
import { CollapsibleCard } from "../components/ui/CollapsibleCard";
import { CollapsibleCardContainer } from "../components/ui/CollapsibleCardContainer";
import { Modal } from "../components/ui/Modal";

const SETUP_COMPLETED_CARD_SEEN_KEY = "leasemate.dashboard.setupCompletedCardSeen";
const READINESS_COMPLETED_KEY_PREFIX = "leasemate.dashboard.readinessComplete";
const noopOpenChange = () => undefined;

export function DashboardPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [hasSeenCompletedSetupCard] = useState(
    () => localStorage.getItem(SETUP_COMPLETED_CARD_SEEN_KEY) === "true",
  );
  const [isPasskeyPromptDismissed, setIsPasskeyPromptDismissed] = useState(
    false,
  );
  const [readinessReminderComplete, setReadinessReminderComplete] = useState<
    boolean | null
  >(null);
  const routeState = location.state as { setupWarning?: string } | null;
  const showSmtpWarning = routeState?.setupWarning === "smtp";
  const hasToken = Boolean(getAccessToken());
  const passkeySupported = passkeysAreSupported();
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
  const isAdmin = currentUser.data?.role_code === "ADMIN";
  const readiness = useQuery({
    queryKey: ["current-user", "readiness"],
    queryFn: getCurrentUserReadiness,
    enabled:
      hasToken &&
      currentUser.isSuccess &&
      readinessReminderComplete === false,
    retry: false,
  });
  const emailLinkStats = useQuery({
    queryKey: ["users", "email-links", "stats"],
    queryFn: getEmailLinkDashboardStats,
    enabled:
      hasToken &&
      currentUser.isSuccess &&
      Boolean(currentUser.data?.email_verified_at) &&
      isAdmin,
    retry: false,
  });
  const emailSettingsStatus = useQuery({
    queryKey: ["system-settings", "email", "status"],
    queryFn: getSystemEmailSettingsStatus,
    enabled: hasToken && currentUser.isSuccess && isAdmin,
    retry: false,
  });
  const passkeys = useQuery({
    queryKey: ["current-user", "passkeys"],
    queryFn: getCurrentUserPasskeys,
    enabled:
      hasToken &&
      currentUser.isSuccess &&
      Boolean(currentUser.data?.email_verified_at) &&
      !currentUser.data?.password_must_change &&
      passkeySupported,
    retry: false,
  });
  const addPasskey = useMutation({
    mutationFn: () => registerCurrentUserPasskey(),
    onSuccess: () => {
      sessionStorage.removeItem(PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY);
      setIsPasskeyPromptDismissed(true);
      queryClient.invalidateQueries({ queryKey: ["current-user", "passkeys"] });
    },
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
  const readinessIsComplete = Boolean(
    readiness.data &&
      readiness.data.legal_name_count > 0 &&
      readiness.data.property_count > 0,
  );
  const shouldPromptForPasskey =
    !isPasskeyPromptDismissed &&
    sessionStorage.getItem(PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY) ===
      "true" &&
    Boolean(currentUser.data?.email_verified_at) &&
    !currentUser.data?.password_must_change &&
    passkeySupported &&
    passkeys.isSuccess &&
    (passkeys.data?.length ?? 0) === 0;

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

  useEffect(() => {
    if (!currentUser.data?.id) {
      setReadinessReminderComplete(null);
      return;
    }

    setReadinessReminderComplete(
      localStorage.getItem(`${READINESS_COMPLETED_KEY_PREFIX}.${currentUser.data.id}`) ===
        "true",
    );
  }, [currentUser.data?.id]);

  useEffect(() => {
    if (!currentUser.data?.id || !readinessIsComplete) {
      return;
    }

    localStorage.setItem(
      `${READINESS_COMPLETED_KEY_PREFIX}.${currentUser.data.id}`,
      "true",
    );
    setReadinessReminderComplete(true);
  }, [currentUser.data?.id, readinessIsComplete]);

  useEffect(() => {
    if (!passkeys.isSuccess || (passkeys.data?.length ?? 0) === 0) {
      return;
    }

    sessionStorage.removeItem(PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY);
    setIsPasskeyPromptDismissed(true);
  }, [passkeys.data, passkeys.isSuccess]);

  return (
    <section className="grid gap-6">
      <PageHeader
        description={t("dashboard.description")}
        eyebrow={t("nav.workspace")}
        title={t("nav.dashboard")}
        actions={
          bootstrapStatus.data?.bootstrap_required ? (
          <Link
            className="lm-button-primary inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm font-semibold"
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

      {emailSettingsStatus.isSuccess && !emailSettingsStatus.data.is_ready && (
        <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
            />
            <div>
              <h2 className="font-bold">
                {t("dashboard.emailSettingsMissingTitle")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                {t("dashboard.emailSettingsMissingMessage")}
              </p>
            </div>
          </div>
          <Link
            className="lm-button lm-button-primary inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm"
            to="/settings"
          >
            {t("dashboard.openSettings")}
          </Link>
        </section>
      )}

      {(readiness.isSuccess && !readinessIsComplete) ||
      showBackendStatus ||
      emailLinkStats.isSuccess ? (
        <CollapsibleCardContainer>
          {readiness.isSuccess && !readinessIsComplete && (
            <DashboardReadiness readiness={readiness.data} />
          )}

          {showBackendStatus && (
            <CollapsibleCard
              collapsible={false}
              isOpen
              onOpenChange={noopOpenChange}
              title={t("dashboard.backendConnection")}
            >
              <div className="flex items-start gap-3.5">
                <ShieldCheck aria-hidden="true" size={22} />
                <div>
                  <p className="leading-relaxed text-slate-500">
                    {backendStatusMessage}
                  </p>
                </div>
              </div>
            </CollapsibleCard>
          )}

          {emailLinkStats.isSuccess && (
            <CollapsibleCard
              collapsible={false}
              description={t("dashboard.emailLinkStatsDescription")}
              isOpen
              onOpenChange={noopOpenChange}
              title={t("dashboard.emailLinkStatsTitle")}
            >
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
            </CollapsibleCard>
          )}
        </CollapsibleCardContainer>
      ) : null}

      {shouldPromptForPasskey && (
        <Modal title="Create a passkey?">
          <div className="mt-4 grid gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-grid size-9 shrink-0 place-items-center rounded-md bg-slate-950 text-white">
                <KeyRound aria-hidden="true" size={18} />
              </span>
              <div>
                <p className="m-0 text-sm leading-relaxed text-slate-700">
                  Use this browser to sign in next time without typing your
                  password.
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  You can also add or remove passkeys later from Profile.
                </p>
              </div>
            </div>

            {addPasskey.isError && (
              <p className="m-0 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-normal text-red-700">
                {addPasskey.error.message === "PASSKEY_UNSUPPORTED"
                  ? t("auth.passkeyUnsupported")
                  : addPasskey.error.message}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button
                disabled={addPasskey.isPending}
                type="button"
                variant="secondary"
                onClick={() => {
                  sessionStorage.removeItem(
                    PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY,
                  );
                  setIsPasskeyPromptDismissed(true);
                }}
              >
                Maybe later
              </Button>
              <Button
                disabled={addPasskey.isPending}
                type="button"
                onClick={() => addPasskey.mutate()}
              >
                {addPasskey.isPending ? "Creating..." : "Create passkey"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function DashboardReadiness({
  readiness,
}: {
  readiness: CurrentUserReadiness;
}) {
  const { t } = useTranslation();
  const items = [
    {
      count: readiness.legal_name_count,
      href: "/profile",
      icon: UserRound,
      label: t("dashboard.readinessLegalNames"),
    },
    {
      count: readiness.property_count,
      icon: Building2,
      label: t("dashboard.readinessProperties"),
    },
  ];
  const completedCount = items.filter((item) => item.count > 0).length;

  return (
    <CollapsibleCard
      action={
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {completedCount} / {items.length}
        </div>
      }
      collapsible={false}
      description={t("dashboard.readinessDescription")}
      isOpen
      onOpenChange={noopOpenChange}
      title={t("dashboard.readinessTitle")}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <DashboardReadinessItem key={item.label} {...item} />
        ))}
      </div>
    </CollapsibleCard>
  );
}

function DashboardReadinessItem({
  count,
  href,
  icon: Icon,
  label,
}: {
  count: number;
  href?: string;
  icon: LucideIcon;
  label: string;
}) {
  const { t } = useTranslation();
  const isReady = count > 0;
  const content = (
    <div
      className={[
        "grid gap-4",
        isReady ? "" : "text-rose-950 dark:text-rose-950",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
        {isReady ? (
          <CheckCircle2 aria-hidden="true" className="text-emerald-600" size={20} />
        ) : (
          <span className="h-5 w-5 rounded-full border border-slate-300" />
        )}
      </div>
      <div>
        <h3
          className={[
            "font-semibold",
            isReady
              ? "text-slate-950 dark:text-slate-100"
              : "text-rose-950 dark:text-rose-950",
          ].join(" ")}
        >
          {label}
        </h3>
        <p
          className={[
            "mt-1 text-sm",
            isReady
              ? "text-slate-500 dark:text-slate-400"
              : "text-rose-700 dark:text-rose-700",
          ].join(" ")}
        >
          {isReady
            ? t("dashboard.readinessReady")
            : t("dashboard.readinessMissing")}
        </p>
      </div>
    </div>
  );

  const className = [
    "grid min-h-[120px] gap-4 rounded-lg border p-4 text-left transition",
    isReady
      ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
      : "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-200 dark:bg-rose-50 dark:text-rose-950",
    href
      ? isReady
        ? "hover:border-slate-400 hover:bg-white dark:hover:border-slate-500 dark:hover:bg-slate-800"
        : "hover:border-rose-300 hover:bg-rose-50 dark:hover:border-rose-300 dark:hover:bg-rose-50"
      : "",
  ].join(" ");

  if (href) {
    return (
      <Link className={className} to={href}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
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
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-950">{value}</span>
      </div>
      <progress
        aria-label={label}
        className={[
          "dashboard-progress",
          danger ? "dashboard-progress-danger" : "dashboard-progress-normal",
        ].join(" ")}
        max={max}
        value={value}
      />
    </div>
  );
}
