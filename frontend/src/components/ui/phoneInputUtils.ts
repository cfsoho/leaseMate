import type { ProfileCountry } from "../../features/auth/authTypes";

export function inferPhoneCountryId(
  localeCode: string | null | undefined,
  countries: ProfileCountry[] | undefined,
) {
  if (!countries?.length) {
    return "";
  }

  const alpha2ByLocale: Record<string, string> = {
    en: "US",
    ja: "JP",
    th: "TH",
    "zh-Hant-HK": "HK",
    "zh-Hant-TW": "TW",
  };
  const alpha2 = alpha2ByLocale[localeCode ?? ""];

  return countries.find((country) => country.alpha2 === alpha2)?.id ?? "";
}

export function formatPhoneCountryLabel(country: ProfileCountry) {
  const countryLabel = country.native_name || country.name;
  return country.phone_prefix
    ? `${country.phone_prefix} ${countryLabel}`
    : countryLabel;
}

export function formatPhoneForCountry(
  value: string,
  country: ProfileCountry | undefined,
  preferredFormat: "mobile" | "landline" = "mobile",
) {
  const mask =
    preferredFormat === "landline"
      ? country?.landline_phone_format || country?.mobile_phone_format
      : country?.mobile_phone_format || country?.landline_phone_format;

  if (!mask) {
    return value;
  }

  const maxDigits = (mask.match(/X/g) ?? []).length;
  const digits = value.replace(/\D/g, "").slice(0, maxDigits);

  if (!digits) {
    return "";
  }

  let digitIndex = 0;
  let output = "";

  for (const character of mask) {
    if (character === "X") {
      if (digitIndex >= digits.length) {
        break;
      }
      output += digits[digitIndex];
      digitIndex += 1;
      continue;
    }

    if (digitIndex < digits.length) {
      output += character;
    }
  }

  return output;
}
