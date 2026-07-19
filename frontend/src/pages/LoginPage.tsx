import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthCard } from "../components/auth/AuthCard";
import { Button } from "../components/ui/Button";
import { FormAlert } from "../components/ui/FormAlert";
import { PasswordInput } from "../components/ui/PasswordInput";
import { appBrand } from "../config/appBrand";
import { getBootstrapDefaultLocale, login } from "../features/auth/authApi";
import {
  consumeAuthRedirectReason,
  consumeTransitionFlag,
  LOGIN_EXIT_MS,
  LOGIN_TO_APP_TRANSITION_KEY,
  LOGOUT_TO_LOGIN_TRANSITION_KEY,
} from "../features/auth/authUiTransition";
import {
  authenticateWithPasskey,
  PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY,
  passkeysAreSupported,
} from "../features/auth/passkeys";
import {
  getLastLoginEmail,
  setAccessToken,
  setLastLoginEmail,
  setRefreshToken,
} from "../lib/auth/tokenStorage";
import { resolveDefaultLocale } from "../lib/i18n/defaultLocale";
import { useLocaleContext } from "../lib/i18n/localeContext";
import { useTranslation } from "../lib/i18n/useTranslation";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setLocale } = useLocaleContext();
  const { t } = useTranslation();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [lastLoginEmail, setLastLoginEmailState] = useState(
    () => getLastLoginEmail() ?? "",
  );
  const [isChangingEmail, setIsChangingEmail] = useState(
    () => !getLastLoginEmail(),
  );
  const [form, setForm] = useState({ email: lastLoginEmail, password: "" });
  const [stage, setStage] = useState<"email" | "password">("email");
  const [passkeySupportMessage, setPasskeySupportMessage] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [shouldEnter] = useState(() =>
    consumeTransitionFlag(LOGOUT_TO_LOGIN_TRANSITION_KEY),
  );
  const [authRedirectReason] = useState(() => consumeAuthRedirectReason());
  const bootstrapDefaultLocale = useQuery({
    queryKey: ["bootstrap-default-locale"],
    queryFn: getBootstrapDefaultLocale,
    staleTime: 0,
  });
  const displayedEmail =
    stage === "password" ? form.email.trim() : lastLoginEmail;
  const currentYear = new Date().getFullYear();
  const authRedirectMessage = authRedirectReason
    ? t(
        authRedirectReason === "session_revoked"
          ? "auth.sessionRevoked"
          : "auth.sessionExpired",
      )
    : "";

  const loginUser = useMutation({
    mutationFn: login,
    onSuccess: (tokens) => {
      const normalizedEmail = form.email.trim();
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      setLastLoginEmail(normalizedEmail);
      setLastLoginEmailState(normalizedEmail);
      sessionStorage.setItem(PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY, "true");
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      startLoginTransition();
    },
  });

  const loginWithPasskey = useMutation({
    mutationFn: async () => {
      const emailHint = isChangingEmail ? form.email.trim() : lastLoginEmail;
      return authenticateWithPasskey(emailHint);
    },
    onSuccess: (tokens) => {
      if (!tokens) {
        setStage("password");
        window.setTimeout(() => passwordInputRef.current?.focus(), 0);
        return;
      }

      const normalizedEmail = (isChangingEmail ? form.email : lastLoginEmail).trim();
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      if (normalizedEmail) {
        setLastLoginEmail(normalizedEmail);
        setLastLoginEmailState(normalizedEmail);
      }
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      startLoginTransition();
    },
  });

  useEffect(() => {
    if (!bootstrapDefaultLocale.data) {
      return;
    }

    setLocale(
      resolveDefaultLocale(
        bootstrapDefaultLocale.data.locale_code,
        bootstrapDefaultLocale.data.country_alpha2,
      ),
    );
  }, [bootstrapDefaultLocale.data, setLocale]);

  useEffect(() => {
    if (lastLoginEmail && !isChangingEmail) {
      passwordInputRef.current?.focus();
      return;
    }

    emailInputRef.current?.focus();
  }, [isChangingEmail, lastLoginEmail]);

  function beginChangingEmail() {
    setIsChangingEmail(true);
    setStage("email");
    setForm({ email: "", password: "" });
    window.setTimeout(() => emailInputRef.current?.focus(), 0);
  }

  function revertToLastLoginEmail() {
    if (!lastLoginEmail) {
      return;
    }

    setIsChangingEmail(false);
    setStage("email");
    setForm({ email: lastLoginEmail, password: "" });
    window.setTimeout(() => passwordInputRef.current?.focus(), 0);
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage === "email") {
      setPasskeySupportMessage("");
      if (!passkeysAreSupported()) {
        setPasskeySupportMessage(t("auth.passkeyUnsupported"));
        setStage("password");
        window.setTimeout(() => passwordInputRef.current?.focus(), 0);
        return;
      }

      loginWithPasskey.mutate();
      return;
    }

    loginUser.mutate(form);
  }

  function startLoginTransition() {
    sessionStorage.setItem(LOGIN_TO_APP_TRANSITION_KEY, "true");
    setIsExiting(true);
    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, LOGIN_EXIT_MS);
  }

  return (
    <AuthCard
      action={
        <span className="group relative inline-flex">
          <button
            aria-label={t("auth.forgotPassword")}
            className="grid size-8 place-items-center rounded-md border border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
            type="button"
            onClick={() => navigate("/forgot-password")}
          >
            <CircleHelp aria-hidden="true" size={16} />
          </button>
          <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden max-w-48 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-normal text-white shadow-lg group-hover:block group-focus-within:block">
            {t("auth.forgotPassword")}
          </span>
        </span>
      }
      as="form"
      className={[
        shouldEnter ? "auth-card-login-enter" : "",
        isExiting ? "auth-card-login-exit" : "",
      ].join(" ")}
      eyebrow={appBrand.name}
      footer={
        <p className="text-center text-[11px] font-normal leading-none text-slate-400">
          &copy; {appBrand.copyrightName} {currentYear}
        </p>
      }
      title={t("auth.loginTitle")}
      onSubmit={submitLogin}
    >
      {authRedirectMessage && (
        <FormAlert tone="info">{authRedirectMessage}</FormAlert>
      )}
      {loginUser.isError && <FormAlert>{loginUser.error.message}</FormAlert>}
      {passkeySupportMessage && (
        <FormAlert tone="info">{passkeySupportMessage}</FormAlert>
      )}
      {loginWithPasskey.isError && (
        <FormAlert>{loginWithPasskey.error.message}</FormAlert>
      )}

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        {t("form.email")}
        {displayedEmail && (stage === "password" || !isChangingEmail) ? (
          <>
            <button
              className="min-h-[42px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-normal text-slate-950 hover:border-slate-300 hover:bg-white focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              type="button"
              onClick={beginChangingEmail}
            >
              {displayedEmail}
            </button>
            <button
              className="w-fit text-xs font-semibold text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
              type="button"
              onClick={beginChangingEmail}
            >
              {t("auth.useAnotherEmail")}
            </button>
          </>
        ) : (
          <input
            ref={emailInputRef}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            onKeyDown={(event) => {
              if (
                lastLoginEmail &&
                (event.key === "Escape" ||
                  ((event.ctrlKey || event.metaKey) &&
                    event.key.toLowerCase() === "z"))
              ) {
                event.preventDefault();
                revertToLastLoginEmail();
              }
            }}
          />
        )}
      </label>

      {stage === "password" && (
        <PasswordInput
          autoComplete="current-password"
          inputClassName="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
          label={t("form.password")}
          ref={passwordInputRef}
          value={form.password}
          onChange={(password) =>
            setForm((current) => ({
              ...current,
              password,
            }))
          }
        />
      )}

      <Button
        disabled={
          loginUser.isPending ||
          loginWithPasskey.isPending ||
          (stage === "email" &&
            !(isChangingEmail ? form.email : lastLoginEmail).trim()) ||
          (stage === "password" && !form.password)
        }
        type="submit"
      >
        {loginWithPasskey.isPending
          ? t("auth.checkingPasskey")
          : loginUser.isPending
            ? t("auth.loggingIn")
            : stage === "email"
              ? t("auth.continue")
              : t("auth.loginTitle")}
      </Button>

      {loginUser.isSuccess && (
        <p className="m-0 font-bold text-emerald-700">
          {t("auth.loginSaved")}
        </p>
      )}
    </AuthCard>
  );
}
