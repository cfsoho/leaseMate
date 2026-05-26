import type { ReactNode } from "react";

import { LocaleProvider } from "../lib/i18n/LocaleProvider";

type RouteLocaleProviderProps = {
  children: ReactNode;
};

export function RouteLocaleProvider({ children }: RouteLocaleProviderProps) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
