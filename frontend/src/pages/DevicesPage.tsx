import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { AccountPasskeysPanel } from "../components/account/AccountPasskeysPanel";
import { AccountPasswordSection } from "../components/account/AccountPasswordSection";
import { LoginSessionsPanel } from "../components/account/LoginSessionsPanel";
import { PageHeader } from "../components/layout/PageHeader";
import { useTranslation } from "../lib/i18n/useTranslation";

export function DevicesPage() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#devices") {
      return;
    }

    window.requestAnimationFrame(() => {
      document
        .getElementById("devices")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  return (
    <section className="grid gap-6">
      <PageHeader
        description={t("security.description")}
        eyebrow={t("shell.user")}
        title={t("shell.security")}
      />
      <AccountPasswordSection />
      <AccountPasskeysPanel />
      <div id="devices">
        <LoginSessionsPanel />
      </div>
    </section>
  );
}
