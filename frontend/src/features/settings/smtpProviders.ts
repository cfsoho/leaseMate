export type SmtpProviderKey =
  | "gmail"
  | "microsoft"
  | "yahoo"
  | "icloud"
  | "other";

export type SmtpProviderOption = {
  key: SmtpProviderKey;
  label: string;
  host?: string;
  port?: number;
  useTls?: boolean;
};

export const OTHER_SMTP_PROVIDER_KEY: SmtpProviderKey = "other";

export const SMTP_PROVIDER_OPTIONS: SmtpProviderOption[] = [
  {
    key: "gmail",
    label: "Gmail / Google Workspace",
    host: "smtp.gmail.com",
    port: 587,
    useTls: true,
  },
  {
    key: "microsoft",
    label: "Microsoft 365 / Outlook",
    host: "smtp.office365.com",
    port: 587,
    useTls: true,
  },
  {
    key: "yahoo",
    label: "Yahoo Mail",
    host: "smtp.mail.yahoo.com",
    port: 587,
    useTls: true,
  },
  {
    key: "icloud",
    label: "iCloud Mail",
    host: "smtp.mail.me.com",
    port: 587,
    useTls: true,
  },
  {
    key: OTHER_SMTP_PROVIDER_KEY,
    label: "Other",
  },
];

export function getSmtpProvider(key: SmtpProviderKey) {
  return (
    SMTP_PROVIDER_OPTIONS.find((provider) => provider.key === key) ??
    SMTP_PROVIDER_OPTIONS[0]
  );
}

export function detectSmtpProvider(
  host?: string | null,
  port?: number | null,
  useTls?: boolean | null,
): SmtpProviderKey {
  const normalizedHost = (host ?? "").trim().toLowerCase();
  const provider = SMTP_PROVIDER_OPTIONS.find(
    (option) =>
      option.key !== OTHER_SMTP_PROVIDER_KEY &&
      option.host === normalizedHost &&
      option.port === port &&
      option.useTls === useTls,
  );

  return provider?.key ?? OTHER_SMTP_PROVIDER_KEY;
}
