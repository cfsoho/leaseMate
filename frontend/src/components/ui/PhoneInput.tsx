import type { ProfileCountry } from "../../features/auth/authTypes";
import { SearchableSelect } from "./SearchableSelect";
import {
  formatPhoneCountryLabel,
  formatPhoneForCountry,
} from "./phoneInputUtils";

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
    <div className="lm-phone-input">
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
        className={inputClassName || "lm-form-input"}
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
