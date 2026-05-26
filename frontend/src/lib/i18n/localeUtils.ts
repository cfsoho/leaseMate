import { supportedLocales, type SupportedLocale } from "./translations";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}
