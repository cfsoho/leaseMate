import { createContext, useContext } from "react";

import type { SupportedLocale, TranslationKey } from "./translations";

export type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey) => string;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocaleContext() {
  const value = useContext(LocaleContext);

  if (!value) {
    throw new Error("useLocaleContext must be used inside LocaleProvider");
  }

  return value;
}
