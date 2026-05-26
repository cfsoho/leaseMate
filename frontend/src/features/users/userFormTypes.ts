export type UserFormValue = {
  family_name: string;
  given_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  phone_country_id: string;
  role_id: string;
  preferred_locale_code: string;
  status: string;
};

export const defaultBootstrapAdminUserForm: UserFormValue = {
  family_name: "",
  given_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  phone_country_id: "",
  role_id: "ADMIN",
  preferred_locale_code: "en",
  status: "NEEDS_EMAIL_VERIFICATION",
};
