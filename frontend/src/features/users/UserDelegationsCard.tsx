import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import type { BootstrapLocale, CurrentUser } from "../auth/authTypes";
import { Button } from "../../components/ui/Button";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { FormAlert } from "../../components/ui/FormAlert";
import { IconButton } from "../../components/ui/IconButton";
import { Modal } from "../../components/ui/Modal";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { formatPersonName } from "../../lib/i18n/nameFormat";
import type {
  CreateUserDelegationPayload,
  UserDelegation,
} from "./usersApi";

type UserDelegationsCardProps = {
  delegations: UserDelegation[];
  isLoading?: boolean;
  locale: BootstrapLocale | undefined;
  locales: BootstrapLocale[];
  subjectUser: CurrentUser;
  users: CurrentUser[];
  onCreate: (payload: CreateUserDelegationPayload) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

const defaultForm = {
  delegate_user_id: "",
  relationship_type: "",
  can_view_legal_names: true,
  can_manage_legal_names: false,
  can_view_bank_accounts: false,
  can_manage_bank_accounts: false,
  can_create_properties_for_subject: false,
  is_active: true,
};

type DelegationFlagKey =
  | "can_view_legal_names"
  | "can_manage_legal_names"
  | "can_view_bank_accounts"
  | "can_manage_bank_accounts"
  | "can_create_properties_for_subject";

const delegationFlagOptions: Array<[DelegationFlagKey, string]> = [
  ["can_view_legal_names", "View legal names"],
  ["can_manage_legal_names", "Manage legal names"],
  ["can_view_bank_accounts", "View bank accounts"],
  ["can_manage_bank_accounts", "Manage bank accounts"],
  ["can_create_properties_for_subject", "Create properties for this person"],
];

const relationshipTypeOptions = [
  { value: "PARENT", label: "Parent" },
  { value: "CHILD", label: "Child" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "FAMILY_MEMBER", label: "Family member" },
  { value: "MANAGER", label: "Manager" },
  { value: "PROPERTY_MANAGER", label: "Property manager" },
  { value: "ASSISTANT", label: "Assistant" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "LEGAL_REPRESENTATIVE", label: "Legal representative" },
  { value: "REAL_ESTATE_AGENT", label: "Real estate agent" },
  { value: "OTHER", label: "Other" },
];

export function UserDelegationsCard({
  delegations,
  isLoading = false,
  locale,
  locales,
  subjectUser,
  users,
  onCreate,
  onDelete,
}: UserDelegationsCardProps) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDelegation, setDeletingDelegation] =
    useState<UserDelegation | null>(null);

  const delegatedUserIds = useMemo(
    () => new Set(delegations.map((delegation) => delegation.delegate_user_id)),
    [delegations],
  );

  const localeByCode = useMemo(
    () =>
      new Map(
        locales.map((localeOption) => [localeOption.code, localeOption]),
      ),
    [locales],
  );

  const delegateOptions = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.id !== subjectUser.id &&
            (!delegatedUserIds.has(user.id) || user.id === form.delegate_user_id),
        )
        .map((user) => ({
          value: user.id,
          label: formatPersonName(
            user.family_name,
            user.given_name,
            user.preferred_locale_code
              ? localeByCode.get(user.preferred_locale_code) ?? locale
              : locale,
          ),
          searchText: `${user.family_name} ${user.given_name} ${user.email}`,
        })),
    [
      delegatedUserIds,
      form.delegate_user_id,
      locale,
      localeByCode,
      subjectUser.id,
      users,
    ],
  );

  async function handleCreate() {
    setError("");

    if (!form.delegate_user_id) {
      setError("Select an individual first.");
      return;
    }

    setIsSaving(true);
    try {
      await onCreate({
        ...form,
        relationship_type: form.relationship_type.trim() || null,
      });
      setForm(defaultForm);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to save this relationship.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingDelegation) {
      return;
    }

    setError("");
    try {
      await onDelete(deletingDelegation.id);
      setDeletingDelegation(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove this relationship.",
      );
    }
  }

  function updateFlag(key: DelegationFlagKey, value: boolean) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  return (
    <CollapsibleCard
      collapsible={false}
      description="Let another individual manage selected records for this person. This is for cases like managing a parent's records without exposing unrelated accounts to agents."
      isOpen
      onOpenChange={() => undefined}
      summary={
        delegations.length === 0 ? (
          <FormAlert tone="info">No relationships added yet.</FormAlert>
        ) : undefined
      }
      title="Relationships"
    >
      <div className="grid gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="lm-form-label">Managed by</span>
            <SearchableSelect
              options={delegateOptions}
              value={form.delegate_user_id}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  delegate_user_id: value,
                }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="lm-form-label">Relationship</span>
            <SearchableSelect
              options={relationshipTypeOptions}
              value={form.relationship_type}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  relationship_type: value,
                }))
              }
            />
          </label>
        </div>
        <div className="grid gap-2">
          <span className="lm-form-label">Allowed access</span>
          {delegationFlagOptions.map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
            >
              <input
                checked={form[key]}
                type="checkbox"
                onChange={(event) => updateFlag(key, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={isSaving || isLoading} onClick={handleCreate}>
            Add relationship
          </Button>
        </div>
        {delegations.length > 0 && (
          <div className="grid gap-2">
            {delegations.map((delegation) => (
              <div
                key={delegation.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {formatPersonName(
                      delegation.delegate_family_name,
                      delegation.delegate_given_name,
                      locale,
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {delegation.delegate_email}
                    {delegation.relationship_type
                      ? ` · ${delegation.relationship_type}`
                      : ""}
                  </p>
                </div>
                <IconButton
                  label="Remove relationship"
                  onClick={() => setDeletingDelegation(delegation)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {deletingDelegation && (
        <Modal title="Remove relationship">
          <p className="text-sm text-slate-600">
            Remove this relationship from{" "}
            {formatPersonName(
              subjectUser.family_name,
              subjectUser.given_name,
              locale,
            )}
            ?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeletingDelegation(null)}>
              Cancel
            </Button>
            <Button onClick={handleDelete}>Remove</Button>
          </div>
        </Modal>
      )}
    </CollapsibleCard>
  );
}
