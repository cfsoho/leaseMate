import { isSupportedLocale } from "./localeUtils";
import type { SupportedLocale } from "./translations";

const TIME_ZONE_LOCALE_MAP = new Map<string, SupportedLocale>([
  ["Asia/Tokyo", "ja"],
  ["Asia/Taipei", "zh-Hant-TW"],
  ["Asia/Hong_Kong", "zh-Hant-HK"],
  ["Asia/Bangkok", "th"],
]);

export function resolveDefaultLocale(
  backendLocale: string,
  backendCountryAlpha2?: string | null,
): SupportedLocale {
  if (backendCountryAlpha2 && isSupportedLocale(backendLocale)) {
    return backendLocale;
  }

  const timeZoneLocale = TIME_ZONE_LOCALE_MAP.get(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  if (timeZoneLocale) {
    return timeZoneLocale;
  }

  const browserLocale = normalizeBrowserLocale(
    navigator.languages?.[0] ?? navigator.language,
  );
  if (browserLocale) {
    return browserLocale;
  }

  return isSupportedLocale(backendLocale) ? backendLocale : "en";
}

function normalizeBrowserLocale(browserLocale?: string): SupportedLocale | null {
  if (!browserLocale) {
    return null;
  }

  if (browserLocale.startsWith("ja")) {
    return "ja";
  }
  if (browserLocale.startsWith("th")) {
    return "th";
  }
  if (browserLocale === "zh-TW" || browserLocale === "zh-Hant-TW") {
    return "zh-Hant-TW";
  }
  if (browserLocale === "zh-HK" || browserLocale === "zh-Hant-HK") {
    return "zh-Hant-HK";
  }
  if (browserLocale.startsWith("en")) {
    return "en";
  }

  return null;
}
