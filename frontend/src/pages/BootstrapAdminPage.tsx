import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthLanguageSelector } from "../components/auth/AuthLanguageSelector";
import { bootstrapAdmin, getBootstrapDefaultLocale } from "../features/auth/authApi";
import { UserForm } from "../features/users/UserForm";
import { defaultBootstrapAdminUserForm } from "../features/users/userFormTypes";
import {
  setAccessToken,
  setLastLoginEmail,
  setRefreshToken,
} from "../lib/auth/tokenStorage";
import { resolveDefaultLocale } from "../lib/i18n/defaultLocale";
import { useLocaleContext } from "../lib/i18n/localeContext";
import { useTranslation } from "../lib/i18n/useTranslation";

const LEASEMATE_STORAGE_PREFIX = "leasemate.";

export function BootstrapAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setLocale } = useLocaleContext();
  const { t } = useTranslation();
  const [form, setForm] = useState(defaultBootstrapAdminUserForm);
  const hasClearedBootstrapStorage = useRef(false);
  const hasAppliedDefaultLocale = useRef(false);
  const bootstrapDefaultLocale = useQuery({
    queryKey: ["bootstrap-default-locale"],
    queryFn: getBootstrapDefaultLocale,
    staleTime: 0,
  });

  useEffect(() => {
    if (hasClearedBootstrapStorage.current) {
      return;
    }

    hasClearedBootstrapStorage.current = true;
    clearLeaseMateLocalStorage();
    setLocale("en");
  }, [setLocale]);

  useEffect(() => {
    if (hasAppliedDefaultLocale.current || !bootstrapDefaultLocale.data) {
      return;
    }

    const nextLocale = resolveDefaultLocale(
      bootstrapDefaultLocale.data.locale_code,
      bootstrapDefaultLocale.data.country_alpha2,
    );

    hasAppliedDefaultLocale.current = true;
    setLocale(nextLocale);
    setForm((currentForm) => ({
      ...currentForm,
      preferred_locale_code: nextLocale,
    }));
  }, [bootstrapDefaultLocale.data, setLocale]);

  const createAdmin = useMutation({
    mutationFn: () =>
      bootstrapAdmin({
        family_name: form.family_name,
        given_name: form.given_name,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        preferred_locale_code: form.preferred_locale_code || null,
      }),
    onSuccess: (tokens) => {
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      setLastLoginEmail(form.email.trim());
      queryClient.setQueryData(["bootstrap-status"], {
        admin_exists: true,
        bootstrap_required: false,
      });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      navigate("/dashboard", {
        replace: true,
        state: tokens.email_sent ? undefined : { setupWarning: "smtp" },
      });
    },
  });

  return (
    <>
      <AuthLanguageSelector />
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid max-w-5xl gap-6">
          <header className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("auth.initialSetup")}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-slate-950">
              {t("auth.createAdmin")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              {t("auth.createAdminDescription")}
            </p>
          </header>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <UserForm
              disabled={createAdmin.isPending}
              showPhone={false}
              submitError={
                createAdmin.isError ? createAdmin.error.message : undefined
              }
              submitLabel={
                createAdmin.isPending ? t("auth.creating") : t("auth.createAdmin")
              }
              value={form}
              onChange={setForm}
              onSubmit={() => createAdmin.mutate()}
            />

            {createAdmin.isSuccess && (
              <p className="mt-4 font-bold text-emerald-700">
                {t("auth.adminCreated")}
              </p>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

function clearLeaseMateLocalStorage() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(LEASEMATE_STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
