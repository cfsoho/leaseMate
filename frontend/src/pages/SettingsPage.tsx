import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { CollapsibleCard } from "../components/ui/CollapsibleCard";
import { CollapsibleCardContainer } from "../components/ui/CollapsibleCardContainer";
import { FormAlert } from "../components/ui/FormAlert";
import { PasswordInput } from "../components/ui/PasswordInput";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "../components/ui/SearchableSelect";
import {
  detectSmtpProvider,
  getSmtpProvider,
  OTHER_SMTP_PROVIDER_KEY,
  SMTP_PROVIDER_OPTIONS,
  type SmtpProviderKey,
} from "../features/settings/smtpProviders";
import {
  getSystemEmailSettings,
  getSystemStorageSettings,
  testSystemEmailSettings,
  testSystemStorageSettings,
  updateSystemEmailSettings,
  updateSystemStorageSettings,
  type StorageProvider,
  type SystemEmailSettingsUpdate,
  type SystemStorageSettingsUpdate,
} from "../features/settings/settingsApi";
import { useTranslation } from "../lib/i18n/useTranslation";

type EmailSettingsForm = {
  smtp_provider: SmtpProviderKey;
  smtp_host: string;
  smtp_port: string;
  smtp_use_tls: boolean;
  noreply_user: string;
  noreply_password: string;
  noreply_from: string;
  clear_noreply_password: boolean;
  system_user: string;
  system_password: string;
  system_from: string;
  clear_system_password: boolean;
};

type StorageSettingsForm = {
  provider: StorageProvider;
  local_folder: string;
  s3_bucket: string;
  s3_region: string;
  s3_endpoint_url: string;
  s3_base_prefix: string;
  s3_use_path_style: boolean;
  s3_access_key_id: string;
  s3_secret_access_key: string;
  clear_s3_secret_access_key: boolean;
};

const emptyForm: EmailSettingsForm = {
  smtp_provider: OTHER_SMTP_PROVIDER_KEY,
  smtp_host: "",
  smtp_port: "",
  smtp_use_tls: false,
  noreply_user: "",
  noreply_password: "",
  noreply_from: "",
  clear_noreply_password: false,
  system_user: "",
  system_password: "",
  system_from: "",
  clear_system_password: false,
};

const emptyStorageForm: StorageSettingsForm = {
  provider: "LOCAL_MOUNT",
  local_folder: "",
  s3_bucket: "",
  s3_region: "",
  s3_endpoint_url: "",
  s3_base_prefix: "",
  s3_use_path_style: false,
  s3_access_key_id: "",
  s3_secret_access_key: "",
  clear_s3_secret_access_key: false,
};

const S3_REGION_OPTIONS: SearchableSelectOption[] = [
  { label: "Asia Pacific (Tokyo) - ap-northeast-1", value: "ap-northeast-1" },
  { label: "Asia Pacific (Seoul) - ap-northeast-2", value: "ap-northeast-2" },
  { label: "Asia Pacific (Osaka) - ap-northeast-3", value: "ap-northeast-3" },
  { label: "Asia Pacific (Hong Kong) - ap-east-1", value: "ap-east-1" },
  { label: "Asia Pacific (Singapore) - ap-southeast-1", value: "ap-southeast-1" },
  { label: "Asia Pacific (Sydney) - ap-southeast-2", value: "ap-southeast-2" },
  { label: "Asia Pacific (Jakarta) - ap-southeast-3", value: "ap-southeast-3" },
  { label: "Asia Pacific (Mumbai) - ap-south-1", value: "ap-south-1" },
  { label: "US East (N. Virginia) - us-east-1", value: "us-east-1" },
  { label: "US East (Ohio) - us-east-2", value: "us-east-2" },
  { label: "US West (N. California) - us-west-1", value: "us-west-1" },
  { label: "US West (Oregon) - us-west-2", value: "us-west-2" },
  { label: "Canada (Central) - ca-central-1", value: "ca-central-1" },
  { label: "Europe (Ireland) - eu-west-1", value: "eu-west-1" },
  { label: "Europe (London) - eu-west-2", value: "eu-west-2" },
  { label: "Europe (Paris) - eu-west-3", value: "eu-west-3" },
  { label: "Europe (Frankfurt) - eu-central-1", value: "eu-central-1" },
  { label: "Europe (Stockholm) - eu-north-1", value: "eu-north-1" },
  { label: "South America (Sao Paulo) - sa-east-1", value: "sa-east-1" },
  { label: "Middle East (Bahrain) - me-south-1", value: "me-south-1" },
  { label: "Africa (Cape Town) - af-south-1", value: "af-south-1" },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EmailSettingsForm>(emptyForm);
  const [saved, setSaved] = useState(false);
  const [saveTestCompleted, setSaveTestCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(true);
  const [emailSettingsOpenInitialized, setEmailSettingsOpenInitialized] =
    useState(false);
  const [isEmailSettingsDirty, setIsEmailSettingsDirty] = useState(false);
  const [storageSettingsOpen, setStorageSettingsOpen] = useState(false);
  const [storageSettingsOpenInitialized, setStorageSettingsOpenInitialized] =
    useState(false);
  const [storageForm, setStorageForm] =
    useState<StorageSettingsForm>(emptyStorageForm);
  const [isStorageSettingsDirty, setIsStorageSettingsDirty] = useState(false);
  const [storageSaved, setStorageSaved] = useState(false);
  const [storageSaveTestCompleted, setStorageSaveTestCompleted] = useState(false);
  const [storageValidationErrors, setStorageValidationErrors] = useState<
    string[]
  >([]);
  const settings = useQuery({
    queryKey: ["system-settings", "email"],
    queryFn: getSystemEmailSettings,
    retry: false,
  });
  const storageSettings = useQuery({
    queryKey: ["system-settings", "storage"],
    queryFn: getSystemStorageSettings,
    retry: false,
  });
  const saveSettings = useMutation({
    mutationFn: (payload: SystemEmailSettingsUpdate) =>
      updateSystemEmailSettings(payload),
    onSuccess: (data) => {
      setSaved(true);
      setIsEmailSettingsDirty(false);
      setSaveTestCompleted(false);
      queryClient.setQueryData(["system-settings", "email"], data);
      queryClient.invalidateQueries({
        queryKey: ["system-settings", "email", "status"],
      });
      setForm((current) => ({
        ...current,
        noreply_password: "",
        system_password: "",
        clear_noreply_password: false,
        clear_system_password: false,
      }));
      testSettings.mutate(undefined, {
        onSettled: () => setSaveTestCompleted(true),
      });
    },
  });
  const testSettings = useMutation({
    mutationFn: testSystemEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings", "email"] });
      queryClient.invalidateQueries({
        queryKey: ["system-settings", "email", "status"],
      });
    },
  });
  const saveStorageSettings = useMutation({
    mutationFn: (payload: SystemStorageSettingsUpdate) =>
      updateSystemStorageSettings(payload),
    onSuccess: (data) => {
      setStorageSaved(true);
      setIsStorageSettingsDirty(false);
      setStorageSaveTestCompleted(false);
      queryClient.setQueryData(["system-settings", "storage"], data);
      setStorageForm((current) => ({
        ...current,
        s3_secret_access_key: "",
        clear_s3_secret_access_key: false,
      }));
      testStorageSettings.mutate(undefined, {
        onSettled: () => setStorageSaveTestCompleted(true),
      });
    },
  });
  const testStorageSettings = useMutation({
    mutationFn: testSystemStorageSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings", "storage"] });
    },
  });

  useEffect(() => {
    if (!settings.data) {
      return;
    }

    const hasSmtpServer = Boolean(settings.data.smtp_host);
    const smtpProvider = hasSmtpServer
      ? detectSmtpProvider(
          settings.data.smtp_host,
          settings.data.smtp_port,
          settings.data.smtp_use_tls,
        )
      : OTHER_SMTP_PROVIDER_KEY;

    setForm({
      smtp_provider: smtpProvider,
      smtp_host: settings.data.smtp_host ?? "",
      smtp_port:
        hasSmtpServer && settings.data.smtp_port
          ? String(settings.data.smtp_port)
          : "",
      smtp_use_tls: hasSmtpServer ? Boolean(settings.data.smtp_use_tls) : false,
      noreply_user: settings.data.noreply_user ?? "",
      noreply_password: "",
      noreply_from: settings.data.noreply_from ?? "",
      clear_noreply_password: false,
      system_user: settings.data.system_user ?? "",
      system_password: "",
      system_from: settings.data.system_from ?? "",
      clear_system_password: false,
    });
  }, [settings.data]);

  useEffect(() => {
    if (!settings.data || emailSettingsOpenInitialized) {
      return;
    }

    setEmailSettingsOpen(!settings.data.is_ready);
    setEmailSettingsOpenInitialized(true);
  }, [emailSettingsOpenInitialized, settings.data]);

  useEffect(() => {
    if (!storageSettings.data) {
      return;
    }

    setStorageForm({
      provider: storageSettings.data.provider ?? "LOCAL_MOUNT",
      local_folder: storageSettings.data.local_folder ?? "",
      s3_bucket: storageSettings.data.s3_bucket ?? "",
      s3_region: storageSettings.data.s3_region ?? "",
      s3_endpoint_url: storageSettings.data.s3_endpoint_url ?? "",
      s3_base_prefix: storageSettings.data.s3_base_prefix ?? "",
      s3_use_path_style: Boolean(storageSettings.data.s3_use_path_style),
      s3_access_key_id: storageSettings.data.s3_access_key_id ?? "",
      s3_secret_access_key: "",
      clear_s3_secret_access_key: false,
    });
  }, [storageSettings.data]);

  useEffect(() => {
    if (!storageSettings.data || storageSettingsOpenInitialized) {
      return;
    }

    setStorageSettingsOpen(!storageSettings.data.is_ready);
    setStorageSettingsOpenInitialized(true);
  }, [storageSettings.data, storageSettingsOpenInitialized]);

  function updateField<K extends keyof EmailSettingsForm>(
    key: K,
    value: EmailSettingsForm[K],
  ) {
    setIsEmailSettingsDirty(true);
    setSaved(false);
    setSaveTestCompleted(false);
    setValidationErrors([]);
    saveSettings.reset();
    testSettings.reset();
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (
        key === "noreply_user" &&
        typeof value === "string" &&
        !current.noreply_from.trim()
      ) {
        next.noreply_from = value.trim();
      }
      if (
        key === "system_user" &&
        typeof value === "string" &&
        !current.system_from.trim()
      ) {
        next.system_from = value.trim();
      }
      return next;
    });
  }

  function handleProviderChange(value: SmtpProviderKey) {
    const provider = getSmtpProvider(value);
    setIsEmailSettingsDirty(true);
    setSaved(false);
    setSaveTestCompleted(false);
    setValidationErrors([]);
    saveSettings.reset();
    testSettings.reset();
    setForm((current) => ({
      ...current,
      smtp_provider: value,
      ...(value === OTHER_SMTP_PROVIDER_KEY
        ? {
            smtp_host: "",
            smtp_port: "",
            smtp_use_tls: false,
          }
        : {
            smtp_host: provider.host ?? "",
            smtp_port: String(provider.port ?? 587),
            smtp_use_tls: provider.useTls ?? true,
          }),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSettings.reset();
    testSettings.reset();
    setSaveTestCompleted(false);
    setEmailSettingsOpen(true);

    const nextValidationErrors = validateEmailSettingsForm();
    if (nextValidationErrors.length > 0) {
      setSaved(false);
      setValidationErrors(nextValidationErrors);
      return;
    }

    setValidationErrors([]);
    const payload: SystemEmailSettingsUpdate = {
      smtp_host: form.smtp_host.trim() || null,
      smtp_port: Number(form.smtp_port),
      smtp_use_tls: form.smtp_use_tls,
      noreply_user: form.noreply_user.trim() || null,
      noreply_password: form.noreply_password || null,
      noreply_from: form.noreply_from.trim() || null,
      clear_noreply_password: form.clear_noreply_password,
      system_user: form.system_user.trim() || null,
      system_password: form.system_password || null,
      system_from: form.system_from.trim() || null,
      clear_system_password: form.clear_system_password,
    };

    saveSettings.mutate(payload);
  }

  function updateStorageField<K extends keyof StorageSettingsForm>(
    key: K,
    value: StorageSettingsForm[K],
  ) {
    setIsStorageSettingsDirty(true);
    setStorageSaved(false);
    setStorageSaveTestCompleted(false);
    setStorageValidationErrors([]);
    saveStorageSettings.reset();
    testStorageSettings.reset();
    setStorageForm((current) => ({ ...current, [key]: value }));
  }

  function handleStorageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveStorageSettings.reset();
    testStorageSettings.reset();
    setStorageSaveTestCompleted(false);
    setStorageSettingsOpen(true);

    const nextValidationErrors = validateStorageSettingsForm();
    if (nextValidationErrors.length > 0) {
      setStorageSaved(false);
      setStorageValidationErrors(nextValidationErrors);
      return;
    }

    setStorageValidationErrors([]);
    const payload: SystemStorageSettingsUpdate = {
      provider: storageForm.provider,
      local_folder: storageForm.local_folder.trim() || null,
      s3_bucket: storageForm.s3_bucket.trim() || null,
      s3_region: storageForm.s3_region.trim() || null,
      s3_endpoint_url: storageForm.s3_endpoint_url.trim() || null,
      s3_base_prefix: storageForm.s3_base_prefix.trim() || null,
      s3_use_path_style: storageForm.s3_use_path_style,
      s3_access_key_id: storageForm.s3_access_key_id.trim() || null,
      s3_secret_access_key: storageForm.s3_secret_access_key || null,
      clear_s3_secret_access_key: storageForm.clear_s3_secret_access_key,
    };

    saveStorageSettings.mutate(payload);
  }

  function validateEmailSettingsForm() {
    const required = t("form.requiredMessage");
    const missing = (label: string) => `${label}: ${required}`;
    const errors: string[] = [];

    if (form.smtp_provider === OTHER_SMTP_PROVIDER_KEY) {
      if (!form.smtp_host.trim()) {
        errors.push(missing(t("settings.smtpHost")));
      }
      if (!form.smtp_port.trim()) {
        errors.push(missing(t("settings.smtpPort")));
      } else {
        const port = Number(form.smtp_port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          errors.push(`${t("settings.smtpPort")}: 1-65535`);
        }
      }
    }

    if (!form.noreply_user.trim()) {
      errors.push(missing(`${t("settings.noreplySection")} - ${t("settings.smtpUser")}`));
    }
    if (!form.noreply_from.trim()) {
      errors.push(missing(`${t("settings.noreplySection")} - ${t("settings.fromAddress")}`));
    }
    if (!settings.data?.noreply_password_set && !form.noreply_password) {
      errors.push(missing(`${t("settings.noreplySection")} - ${t("settings.password")}`));
    }
    if (!form.system_user.trim()) {
      errors.push(missing(`${t("settings.systemSection")} - ${t("settings.smtpUser")}`));
    }
    if (!form.system_from.trim()) {
      errors.push(missing(`${t("settings.systemSection")} - ${t("settings.fromAddress")}`));
    }
    if (!settings.data?.system_password_set && !form.system_password) {
      errors.push(missing(`${t("settings.systemSection")} - ${t("settings.password")}`));
    }

    return errors;
  }

  function validateStorageSettingsForm() {
    const required = t("form.requiredMessage");
    const missing = (label: string) => `${label}: ${required}`;
    const errors: string[] = [];

    if (storageForm.provider === "LOCAL_MOUNT") {
      const localFolder = storageForm.local_folder.trim();
      if (!localFolder) {
        errors.push(missing(t("settings.storageLocalFolder")));
      }
      if (localFolder.startsWith("/") || localFolder.split("/").includes("..")) {
        errors.push(t("settings.storageLocalFolderInvalid"));
      }
    }

    if (storageForm.provider === "S3") {
      if (!storageForm.s3_bucket.trim()) {
        errors.push(missing(t("settings.storageS3Bucket")));
      }
      if (!storageForm.s3_region.trim()) {
        errors.push(missing(t("settings.storageS3Region")));
      }
      if (!storageForm.s3_access_key_id.trim()) {
        errors.push(missing(t("settings.storageS3AccessKeyId")));
      }
      if (
        !storageSettings.data?.s3_secret_access_key_set &&
        !storageForm.s3_secret_access_key
      ) {
        errors.push(missing(t("settings.storageS3SecretAccessKey")));
      }
    }

    return errors;
  }

  const disabled =
    settings.isLoading || saveSettings.isPending || testSettings.isPending;
  const storageDisabled =
    storageSettings.isLoading ||
    saveStorageSettings.isPending ||
    testStorageSettings.isPending;
  const canCollapseEmailSettings = Boolean(settings.data?.is_ready);
  const canCollapseStorageSettings = Boolean(storageSettings.data?.is_ready);
  const emailAlertMessages = [
    ...(settings.isError ? [settings.error.message] : []),
    ...(saveSettings.isError ? [saveSettings.error.message] : []),
    ...validationErrors,
  ];
  const storageAlertMessages = [
    ...(storageSettings.isError ? [storageSettings.error.message] : []),
    ...(saveStorageSettings.isError ? [saveStorageSettings.error.message] : []),
    ...storageValidationErrors,
  ];

  return (
    <CollapsibleCardContainer
      header={
        <PageHeader
          description={t("settings.description")}
          eyebrow={t("nav.admin")}
          title={t("nav.settings")}
        />
      }
    >
      <CollapsibleCard
        bodyClassName="grid gap-5 px-5 pb-5"
        collapsible={canCollapseEmailSettings}
        isOpen={canCollapseEmailSettings ? emailSettingsOpen : true}
        title={t("settings.emailTitle")}
        description={t("settings.emailDescription")}
        onOpenChange={setEmailSettingsOpen}
        summary={
          !emailSettingsOpen && settings.data?.is_ready ? (
            <FormAlert tone="success">{t("settings.emailVerified")}</FormAlert>
          ) : undefined
        }
      >
        <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
          {emailAlertMessages.length > 0 && (
            <FormAlert messages={emailAlertMessages} />
          )}
          {settings.data && !settings.data.is_ready && (
            <FormAlert tone="info">{t("settings.emailIncomplete")}</FormAlert>
          )}
          {settings.data?.is_ready && (
            <FormAlert tone="success">{t("settings.emailVerified")}</FormAlert>
          )}
          {saved && saveSettings.isSuccess && testSettings.isPending && (
            <FormAlert tone="info">{t("settings.emailSavedTesting")}</FormAlert>
          )}
          {saved &&
            saveSettings.isSuccess &&
            saveTestCompleted &&
            testSettings.isSuccess && (
              <FormAlert tone="success">
                {t("settings.emailSavedAndVerified")}
              </FormAlert>
            )}
          {saved &&
            saveSettings.isSuccess &&
            saveTestCompleted &&
            testSettings.isError && (
              <FormAlert>
                {t("settings.emailSavedButTestFailed")}{" "}
                {testSettings.error.message}
              </FormAlert>
            )}

          <fieldset className="grid gap-4" disabled={disabled}>
            <FormSection title={t("settings.smtpSection")}>
              <SelectField
                label={t("settings.smtpProvider")}
                value={form.smtp_provider}
                options={SMTP_PROVIDER_OPTIONS.map((provider) => ({
                  label: provider.label,
                  value: provider.key,
                }))}
                onChange={(value) =>
                  handleProviderChange(value as SmtpProviderKey)
                }
              />
              {form.smtp_provider === OTHER_SMTP_PROVIDER_KEY && (
                <div className="grid items-start gap-4 md:grid-cols-[1fr_160px_auto]">
                  <TextField
                    label={t("settings.smtpHost")}
                    required
                    value={form.smtp_host}
                    onChange={(value) => updateField("smtp_host", value)}
                  />
                  <TextField
                    label={t("settings.smtpPort")}
                    min={1}
                    max={65535}
                    required
                    type="number"
                    value={form.smtp_port}
                    onChange={(value) => updateField("smtp_port", value)}
                  />
                  <label className="lm-form-label md:self-end">
                    <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
                      <input
                        checked={form.smtp_use_tls}
                        type="checkbox"
                        onChange={(event) =>
                          updateField("smtp_use_tls", event.target.checked)
                        }
                      />
                      {t("settings.smtpTls")}
                    </span>
                  </label>
                </div>
              )}
            </FormSection>

            <FormSection
              description={t("settings.noreplyDescription")}
              title={t("settings.noreplySection")}
            >
              <div className="grid items-start gap-4 md:grid-cols-2">
                <TextField
                  label={t("settings.smtpUser")}
                  required
                  value={form.noreply_user}
                  onChange={(value) => updateField("noreply_user", value)}
                />
                <TextField
                  label={t("settings.fromAddress")}
                  required
                  type="email"
                  value={form.noreply_from}
                  onChange={(value) => updateField("noreply_from", value)}
                />
              </div>
              <SavedPasswordField
                isSaved={Boolean(settings.data?.noreply_password_set)}
                required={!settings.data?.noreply_password_set}
                value={form.noreply_password}
                onChange={(value) => updateField("noreply_password", value)}
              />
            </FormSection>

            <FormSection
              description={t("settings.systemDescription")}
              title={t("settings.systemSection")}
            >
              <div className="grid items-start gap-4 md:grid-cols-2">
                <TextField
                  label={t("settings.smtpUser")}
                  required
                  value={form.system_user}
                  onChange={(value) => updateField("system_user", value)}
                />
                <TextField
                  label={t("settings.fromAddress")}
                  required
                  type="email"
                  value={form.system_from}
                  onChange={(value) => updateField("system_from", value)}
                />
              </div>
              <SavedPasswordField
                isSaved={Boolean(settings.data?.system_password_set)}
                required={!settings.data?.system_password_set}
                value={form.system_password}
                onChange={(value) => updateField("system_password", value)}
              />
            </FormSection>
          </fieldset>

          {isEmailSettingsDirty && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <Button disabled={disabled} type="submit">
                {saveSettings.isPending
                  ? t("settings.saving")
                  : testSettings.isPending && saved
                    ? t("settings.testingEmail")
                    : t("settings.save")}
              </Button>
            </div>
          )}
        </form>
      </CollapsibleCard>

      <CollapsibleCard
        bodyClassName="grid gap-5 px-5 pb-5"
        collapsible={canCollapseStorageSettings}
        isOpen={canCollapseStorageSettings ? storageSettingsOpen : true}
        title={t("settings.storageTitle")}
        description={t("settings.storageDescription")}
        onOpenChange={setStorageSettingsOpen}
        summary={
          !storageSettingsOpen && storageSettings.data?.is_ready ? (
            <FormAlert tone="success">{t("settings.storageVerified")}</FormAlert>
          ) : undefined
        }
      >
        <form className="grid gap-5" noValidate onSubmit={handleStorageSubmit}>
          {storageAlertMessages.length > 0 && (
            <FormAlert messages={storageAlertMessages} />
          )}
          {storageSettings.data && !storageSettings.data.is_ready && (
            <FormAlert tone="info">{t("settings.storageIncomplete")}</FormAlert>
          )}
          {storageSettings.data?.is_ready && (
            <FormAlert tone="success">{t("settings.storageVerified")}</FormAlert>
          )}
          {storageSaved &&
            saveStorageSettings.isSuccess &&
            testStorageSettings.isPending && (
              <FormAlert tone="info">
                {t("settings.storageSavedTesting")}
              </FormAlert>
            )}
          {storageSaved &&
            saveStorageSettings.isSuccess &&
            storageSaveTestCompleted &&
            testStorageSettings.isSuccess && (
              <FormAlert tone="success">
                {t("settings.storageSavedAndVerified")}
              </FormAlert>
            )}
          {storageSaved &&
            saveStorageSettings.isSuccess &&
            storageSaveTestCompleted &&
            testStorageSettings.isError && (
              <FormAlert>
                {t("settings.storageSavedButTestFailed")}{" "}
                {testStorageSettings.error.message}
              </FormAlert>
            )}

          <fieldset className="grid gap-4" disabled={storageDisabled}>
            <FormSection title={t("settings.storageProviderSection")}>
              <SelectField
                label={t("settings.storageProvider")}
                value={storageForm.provider}
                options={[
                  {
                    label: t("settings.storageProviderLocalMount"),
                    value: "LOCAL_MOUNT",
                  },
                  {
                    label: t("settings.storageProviderS3"),
                    value: "S3",
                  },
                ]}
                onChange={(value) =>
                  updateStorageField("provider", value as StorageProvider)
                }
              />
            </FormSection>

            {storageForm.provider === "LOCAL_MOUNT" && (
              <FormSection
                description={t("settings.storageLocalDescription")}
                title={t("settings.storageLocalSection")}
              >
                <TextField
                  label={t("settings.storageLocalFolder")}
                  required
                  value={storageForm.local_folder}
                  onChange={(value) => updateStorageField("local_folder", value)}
                />
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("settings.storageLocalFolderHelp")}
                </p>
              </FormSection>
            )}

            {storageForm.provider === "S3" && (
              <FormSection
                description={t("settings.storageS3Description")}
                title={t("settings.storageS3Section")}
              >
                <div className="grid items-start gap-4 md:grid-cols-2">
                  <TextField
                    label={t("settings.storageS3Bucket")}
                    required
                    autoComplete="off"
                    value={storageForm.s3_bucket}
                    onChange={(value) => updateStorageField("s3_bucket", value)}
                  />
                  <SearchableSelectField
                    label={t("settings.storageS3Region")}
                    options={S3_REGION_OPTIONS}
                    required
                    value={storageForm.s3_region}
                    onChange={(value) => updateStorageField("s3_region", value)}
                  />
                </div>
                <TextField
                  label={t("settings.storageS3EndpointUrl")}
                  autoComplete="off"
                  value={storageForm.s3_endpoint_url}
                  onChange={(value) =>
                    updateStorageField("s3_endpoint_url", value)
                  }
                />
                <TextField
                  label={t("settings.storageS3BasePrefix")}
                  autoComplete="off"
                  value={storageForm.s3_base_prefix}
                  onChange={(value) =>
                    updateStorageField("s3_base_prefix", value)
                  }
                />
                <div className="grid items-start gap-4 md:grid-cols-2">
                  <TextField
                    label={t("settings.storageS3AccessKeyId")}
                    required
                    autoComplete="off"
                    value={storageForm.s3_access_key_id}
                    onChange={(value) =>
                      updateStorageField("s3_access_key_id", value)
                    }
                  />
                  <SavedSecretField
                    isSaved={Boolean(
                      storageSettings.data?.s3_secret_access_key_set,
                    )}
                    label={t("settings.storageS3SecretAccessKey")}
                    savedLabel={t("settings.storageS3SecretAccessKey")}
                    help={t("settings.storageS3SecretHelp")}
                    required={!storageSettings.data?.s3_secret_access_key_set}
                    value={storageForm.s3_secret_access_key}
                    onChange={(value) =>
                      updateStorageField("s3_secret_access_key", value)
                    }
                  />
                </div>
                <label className="lm-form-label">
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <input
                      checked={storageForm.s3_use_path_style}
                      type="checkbox"
                      onChange={(event) =>
                        updateStorageField(
                          "s3_use_path_style",
                          event.target.checked,
                        )
                      }
                    />
                    {t("settings.storageS3PathStyle")}
                  </span>
                </label>
              </FormSection>
            )}
          </fieldset>

          {isStorageSettingsDirty && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <Button disabled={storageDisabled} type="submit">
                {saveStorageSettings.isPending
                  ? t("settings.saving")
                  : testStorageSettings.isPending && storageSaved
                    ? t("settings.testingStorage")
                    : t("settings.save")}
              </Button>
            </div>
          )}
        </form>
      </CollapsibleCard>
    </CollapsibleCardContainer>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <label className="lm-form-label">
      <span className="lm-form-label-line">{label}</span>
      <select className="lm-form-input" value={value} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchableSelectField({
  label,
  options,
  required,
  value,
  onChange,
}: {
  label: string;
  options: SearchableSelectOption[];
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="lm-form-label">
      <span className="lm-form-label-line">
        {label}
        {required && <span className="lm-form-required"> *</span>}
      </span>
      <SearchableSelect options={options} value={value} onChange={onChange} />
    </label>
  );
}

function TextField({
  autoComplete,
  label,
  max,
  min,
  required,
  type = "text",
  value,
  onChange,
}: {
  autoComplete?: string;
  label: string;
  max?: number;
  min?: number;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <label className="lm-form-label">
      <span className="lm-form-label-line">
        {label}
        {required && <span className="lm-form-required"> *</span>}
      </span>
      <input
        autoComplete={autoComplete}
        className="lm-form-input"
        max={max}
        min={min}
        type={type}
        value={value}
        onChange={handleChange}
      />
    </label>
  );
}

function SavedPasswordField({
  isSaved,
  required,
  value,
  onChange,
}: {
  isSaved: boolean;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-2">
      <PasswordInput
        autoComplete="new-password"
        label={isSaved ? t("settings.replacePassword") : t("settings.password")}
        required={required}
        value={value}
        onChange={onChange}
      />
      {isSaved && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {t("settings.replacePasswordHelp")}
        </p>
      )}
    </div>
  );
}

function SavedSecretField({
  help,
  isSaved,
  label,
  required,
  savedLabel,
  value,
  onChange,
}: {
  help: string;
  isSaved: boolean;
  label: string;
  required: boolean;
  savedLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <PasswordInput
        autoComplete="new-password"
        label={isSaved ? savedLabel : label}
        required={required}
        value={value}
        onChange={onChange}
      />
      {isSaved && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {help}
        </p>
      )}
    </div>
  );
}
