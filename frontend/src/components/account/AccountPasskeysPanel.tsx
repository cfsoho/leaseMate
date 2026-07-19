import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2 } from "lucide-react";

import {
  deleteCurrentUserPasskey,
  getCurrentUser,
  getCurrentUserPasskeys,
} from "../../features/auth/authApi";
import {
  passkeysAreSupported,
  registerCurrentUserPasskey,
} from "../../features/auth/passkeys";
import type { UserPasskey } from "../../features/auth/authTypes";
import { useTranslation } from "../../lib/i18n/useTranslation";
import type { TranslationKey } from "../../lib/i18n/translations";
import { Button } from "../ui/Button";

export function AccountPasskeysPanel() {
  const { locale, t } = useTranslation();
  const passkeySupported = passkeysAreSupported();
  const queryClient = useQueryClient();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const user = currentUser.data;
  const passkeys = useQuery({
    queryKey: ["current-user", "passkeys"],
    queryFn: getCurrentUserPasskeys,
    enabled: Boolean(user?.email_verified_at),
    retry: false,
  });
  const addPasskey = useMutation({
    mutationFn: () => registerCurrentUserPasskey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "passkeys"] });
    },
  });
  const removePasskey = useMutation({
    mutationFn: deleteCurrentUserPasskey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", "passkeys"] });
    },
  });

  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-slate-500">
          {t("security.passkeysTitle")}
        </h2>
        <Button
          disabled={
            addPasskey.isPending ||
            !passkeySupported ||
            !user?.email_verified_at ||
            Boolean(user?.password_must_change)
          }
          onClick={() => addPasskey.mutate()}
        >
          <KeyRound aria-hidden="true" size={16} />
          {addPasskey.isPending
            ? t("security.addingPasskey")
            : t("security.addPasskey")}
        </Button>
      </div>
      <p className="m-0 text-sm font-normal leading-relaxed text-slate-600">
        {t("security.passkeysDescription")}
      </p>
      {addPasskey.isError && (
        <PasskeyNotice message={addPasskey.error.message} tone="error" />
      )}
      {!passkeySupported && (
        <PasskeyNotice message={t("auth.passkeyUnsupported")} />
      )}
      {removePasskey.isError && (
        <PasskeyNotice message={removePasskey.error.message} tone="error" />
      )}
      {passkeys.isLoading && (
        <PasskeyNotice message={t("security.loadingPasskeys")} />
      )}
      {passkeys.data?.length === 0 && (
        <PasskeyNotice message={t("security.noPasskeys")} />
      )}
      {passkeys.data && passkeys.data.length > 0 && (
        <div className="grid gap-2">
          {passkeys.data.map((passkey) => (
            <PasskeyPanel
              key={passkey.id}
              isDeleting={removePasskey.isPending}
              locale={locale}
              passkey={passkey}
              t={t}
              onDelete={() => removePasskey.mutate(passkey.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PasskeyPanel({
  isDeleting,
  locale,
  passkey,
  t,
  onDelete,
}: {
  isDeleting: boolean;
  locale: string;
  passkey: UserPasskey;
  t: (key: TranslationKey) => string;
  onDelete: () => void;
}) {
  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-grid size-8 shrink-0 place-items-center rounded-md bg-slate-950 text-white">
          <KeyRound aria-hidden="true" size={16} />
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold text-slate-950">
            {passkey.name || t("security.passkey")}
          </p>
          <p className="m-0 text-xs font-normal text-slate-500">
            {withToken(
              t("security.createdAt"),
              "date",
              formatDate(passkey.created_at, locale),
            )}
          </p>
          {passkey.last_used_at && (
            <p className="m-0 text-xs font-normal text-slate-500">
              {withToken(
                t("security.lastUsedAt"),
                "date",
                formatDate(passkey.last_used_at, locale),
              )}
            </p>
          )}
        </div>
      </div>
      <Button
        disabled={isDeleting}
        type="button"
        variant="secondary"
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" size={15} />
        {t("security.remove")}
      </Button>
    </article>
  );
}

function withToken(template: string, token: string, value: string) {
  return template.replace(`{${token}}`, value);
}

function PasskeyNotice({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <p
      className={[
        "m-0 rounded-lg border p-3 text-sm font-normal",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {message}
    </p>
  );
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
