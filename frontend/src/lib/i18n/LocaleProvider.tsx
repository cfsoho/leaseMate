import { useMemo, useState, type PropsWithChildren } from "react";

import { LocaleContext, type LocaleContextValue } from "./localeContext";
import { isSupportedLocale } from "./localeUtils";
import {
  translations,
  type SupportedLocale,
} from "./translations";

export const LOCALE_STORAGE_KEY = "leasemate.lastPreferredLocale";

function getStoredLocale(): SupportedLocale {
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale && isSupportedLocale(storedLocale) ? storedLocale : "en";
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getStoredLocale);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        setLocaleState(nextLocale);
      },
      t: (key) => translations[locale][key] ?? translations.en[key],
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function clearStoredLocale() {
  localStorage.removeItem(LOCALE_STORAGE_KEY);
}
