import type { ProfileCountry } from "../../features/auth/authTypes";
import { SearchableSelect } from "./SearchableSelect";

type PhoneInputProps = {
  countries: ProfileCountry[];
  countryId: string;
  disabled?: boolean;
  inputClassName: string;
  phone: string;
  onChange: (value: { phone: string; phone_country_id: string }) => void;
};

export function PhoneInput({
  countries,
  countryId,
  disabled = false,
  inputClassName,
  phone,
  onChange,
}: PhoneInputProps) {
  const selectedCountry = countries.find((country) => country.id === countryId);

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(150px,0.45fr)_minmax(0,1fr)]">
      <SearchableSelect
        disabled={disabled}
        options={countries.map((country) => ({
          label: formatPhoneCountryLabel(country),
          searchText: `${country.name} ${country.native_name ?? ""} ${country.code} ${country.alpha2} ${country.phone_prefix ?? ""}`,
          value: country.id,
        }))}
        value={countryId}
        onChange={(value) => {
          const country = countries.find((option) => option.id === value);
          onChange({
            phone_country_id: value,
            phone: formatPhoneForCountry(phone, country),
          });
        }}
      />
      <input
        className={inputClassName}
        disabled={disabled}
        maxLength={20}
        placeholder={
          selectedCountry?.mobile_phone_format ||
          selectedCountry?.landline_phone_format ||
          ""
        }
        type="tel"
        value={phone}
        onChange={(event) =>
          onChange({
            phone_country_id: countryId,
            phone: formatPhoneForCountry(event.target.value, selectedCountry),
          })
        }
      />
    </div>
  );
}

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
) {
  const mask = country?.mobile_phone_format || country?.landline_phone_format;

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
