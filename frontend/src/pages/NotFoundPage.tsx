import { Link, useLocation } from "react-router-dom";

import { useTranslation } from "../lib/i18n/useTranslation";

export function NotFoundPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const requestedUrl = `${location.pathname}${location.search}${location.hash}`;

  return (
    <section className="grid min-h-[calc(100vh-140px)] place-items-center">
      <div className="grid w-full max-w-[520px] gap-[18px] rounded-lg border border-slate-200 bg-white p-6">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          404
        </p>
        <h1 className="text-3xl font-bold leading-tight text-slate-950">
          {t("page.notFoundTitle")}
        </h1>
        <div className="grid gap-2 text-sm leading-relaxed text-slate-600">
          <p>{t("page.notFoundBody")}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
            {requestedUrl}
          </p>
        </div>
        <Link
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          to="/dashboard"
        >
          {t("page.backToDashboard")}
        </Link>
      </div>
    </section>
  );
}
