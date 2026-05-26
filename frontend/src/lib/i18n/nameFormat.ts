import type { BootstrapLocale } from "../../features/auth/authTypes";

export function formatPersonName(
  familyName: string,
  givenName: string,
  locale: BootstrapLocale | undefined,
) {
  const mask =
    locale?.name_format_mask ||
    (locale?.name_order === "FAMILY_GIVEN"
      ? "{family_name}{given_name}"
      : "{given_name} {family_name}");

  return mask
    .split("{family_name}")
    .join(familyName)
    .split("{given_name}")
    .join(givenName)
    .replace(/\s+/g, " ")
    .trim();
}
