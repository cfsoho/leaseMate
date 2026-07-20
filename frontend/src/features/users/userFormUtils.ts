import type { CurrentUser } from "../auth/authTypes";
import type { UserFormValue } from "./userFormTypes";

export const defaultUserForm: UserFormValue = {
  family_name: "",
  given_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  phone_country_id: "",
  role_id: "",
  preferred_locale_code: "",
  status: "NEEDS_EMAIL_VERIFICATION",
};

export const defaultUserSearchForm: UserFormValue = {
  ...defaultUserForm,
  status: "",
};

export function userToForm(user: CurrentUser): UserFormValue {
  return {
    family_name: user.family_name,
    given_name: user.given_name,
    email: user.email,
    password: "",
    confirm_password: "",
    phone: user.phone ?? "",
    phone_country_id: user.phone_country_id ?? "",
    role_id: user.role_id ?? "",
    preferred_locale_code: user.preferred_locale_code ?? "",
    status: user.status ?? "NEEDS_EMAIL_VERIFICATION",
  };
}

export function buildUserPayload(value: UserFormValue) {
  const hasPhoneNumber = value.phone.replace(/\D/g, "").length > 0;

  return {
    family_name: value.family_name,
    given_name: value.given_name,
    email: value.email,
    phone: hasPhoneNumber ? value.phone : null,
    phone_country_id: hasPhoneNumber ? value.phone_country_id || null : null,
    preferred_locale_code: value.preferred_locale_code || null,
  };
}

export function isEffectivelyEmptyUserForm(value: UserFormValue) {
  return (
    value.family_name === "" &&
    value.given_name === "" &&
    value.email === "" &&
    value.password === "" &&
    value.confirm_password === "" &&
    value.phone === "" &&
    value.role_id === defaultUserForm.role_id &&
    value.preferred_locale_code === defaultUserForm.preferred_locale_code &&
    value.status === defaultUserForm.status
  );
}
