import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { login } from "../features/auth/authApi";
import {
  getLastLoginEmail,
  setAccessToken,
  setLastLoginEmail,
  setRefreshToken,
} from "../lib/auth/tokenStorage";
import { useTranslation } from "../lib/i18n/useTranslation";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [lastLoginEmail, setLastLoginEmailState] = useState(
    () => getLastLoginEmail() ?? "",
  );
  const [isChangingEmail, setIsChangingEmail] = useState(
    () => !getLastLoginEmail(),
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [form, setForm] = useState({ email: lastLoginEmail, password: "" });
  const currentYear = new Date().getFullYear();

  const loginUser = useMutation({
    mutationFn: login,
    onSuccess: (tokens) => {
      const normalizedEmail = form.email.trim();
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      setLastLoginEmail(normalizedEmail);
      setLastLoginEmailState(normalizedEmail);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      navigate("/dashboard", { replace: true });
    },
  });

  useEffect(() => {
    if (lastLoginEmail && !isChangingEmail) {
      passwordInputRef.current?.focus();
      return;
    }

    emailInputRef.current?.focus();
  }, [isChangingEmail, lastLoginEmail]);

  function beginChangingEmail() {
    setIsChangingEmail(true);
    setForm((current) => ({ ...current, email: "" }));
    window.setTimeout(() => emailInputRef.current?.focus(), 0);
  }

  function revertToLastLoginEmail() {
    if (!lastLoginEmail) {
      return;
    }

    setIsChangingEmail(false);
    setForm((current) => ({ ...current, email: lastLoginEmail }));
    window.setTimeout(() => passwordInputRef.current?.focus(), 0);
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form
        className="grid w-full max-w-[420px] gap-[18px] rounded-lg border border-slate-200 bg-white p-6"
        onSubmit={(event) => {
          event.preventDefault();
          loginUser.mutate(form);
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-900 font-bold text-white">
            LM
          </span>
          <div className="flex h-11 min-w-0 flex-col justify-between">
            <p className="text-xs font-bold uppercase leading-none tracking-wide text-slate-500">
              {t("auth.welcomeBack")}
            </p>
            <h1 className="text-3xl font-bold leading-none text-slate-950">
              {t("auth.loginTitle")}
            </h1>
          </div>
        </div>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          {t("form.email")}
          {lastLoginEmail && !isChangingEmail ? (
            <>
              <button
                className="min-h-[42px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-normal text-slate-950 hover:border-slate-300 hover:bg-white focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                type="button"
                onClick={beginChangingEmail}
              >
                {lastLoginEmail}
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

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          {t("form.password")}
          <span className="relative">
            <input
              ref={passwordInputRef}
              className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-10 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
              autoComplete="current-password"
              type={isPasswordVisible ? "text" : "password"}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
            <button
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 inline-grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              tabIndex={-1}
              type="button"
              onClick={() => setIsPasswordVisible((current) => !current)}
            >
              {isPasswordVisible ? (
                <EyeOff aria-hidden="true" size={16} />
              ) : (
                <Eye aria-hidden="true" size={16} />
              )}
            </button>
          </span>
        </label>

        <Button disabled={loginUser.isPending} type="submit">
          {loginUser.isPending ? t("auth.loggingIn") : t("auth.loginTitle")}
        </Button>

        {loginUser.isError && (
          <p className="m-0 text-sm font-normal text-red-700">
            {loginUser.error.message}
          </p>
        )}
        {loginUser.isSuccess && (
          <p className="m-0 font-bold text-emerald-700">
            {t("auth.loginSaved")}
          </p>
        )}

        <p className="border-t border-slate-100 pt-2 text-center text-[11px] font-normal leading-none text-slate-400">
          &copy; LeaseMate {currentYear}
        </p>
      </form>
    </main>
  );
}
