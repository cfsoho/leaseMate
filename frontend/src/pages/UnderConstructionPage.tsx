import { Link } from "react-router-dom";

import { PageHeader } from "../components/layout/PageHeader";
import type { TranslationKey } from "../lib/i18n/translations";
import { useTranslation } from "../lib/i18n/useTranslation";

type UnderConstructionPageProps = {
  titleKey: TranslationKey;
};

export function UnderConstructionPage({ titleKey }: UnderConstructionPageProps) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-6">
      <PageHeader
        description={t("page.underConstructionDescription")}
        eyebrow={t("page.underConstructionEyebrow")}
        title={t(titleKey)}
      />

      <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-[18px]">
        <div>
          <h2 className="font-bold text-slate-950">
            {t("page.underConstructionTitle")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {t("page.underConstructionBody").replace("{page}", t(titleKey))}
          </p>
        </div>
        <Link
          className="inline-flex min-h-8 w-fit items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          to="/dashboard"
        >
          {t("page.backToDashboard")}
        </Link>
      </article>
    </section>
  );
}
