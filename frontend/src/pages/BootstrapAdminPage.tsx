import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { bootstrapAdmin } from "../features/auth/authApi";
import { UserForm } from "../features/users/UserForm";
import { defaultBootstrapAdminUserForm } from "../features/users/userFormTypes";
import { setAccessToken, setRefreshToken } from "../lib/auth/tokenStorage";
import { useTranslation } from "../lib/i18n/useTranslation";

export function BootstrapAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState(defaultBootstrapAdminUserForm);

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
            submitLabel={
              createAdmin.isPending ? t("auth.creating") : t("auth.createAdmin")
            }
            value={form}
            onChange={setForm}
            onSubmit={() => createAdmin.mutate()}
          />

          {createAdmin.isError && (
            <p className="mt-4 font-bold text-red-700">
              {createAdmin.error.message}
            </p>
          )}
          {createAdmin.isSuccess && (
            <p className="mt-4 font-bold text-emerald-700">
              {t("auth.adminCreated")}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
