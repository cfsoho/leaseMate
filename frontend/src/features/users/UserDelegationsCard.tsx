import { useMemo, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";

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
  UpdateUserDelegationPayload,
  UserDelegation,
} from "./usersApi";

type UserDelegationsCardProps = {
  delegations: UserDelegation[];
  description?: string;
  isLoading?: boolean;
  locale: BootstrapLocale | undefined;
  subjectUser: CurrentUser;
  users: CurrentUser[];
  onCreate: (payload: CreateUserDelegationPayload) => Promise<unknown>;
  onUpdate: (id: string, payload: UpdateUserDelegationPayload) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

const defaultForm = {
  delegate_user_id: "",
  relationship_type: "",
  can_view_legal_names: false,
  can_manage_legal_names: false,
  can_view_bank_accounts: false,
  can_manage_bank_accounts: false,
  can_view_user_account_info: false,
  can_manage_user_account_info: false,
  can_view_properties: false,
  can_manage_properties: false,
  is_active: true,
};

type DelegationFlagKey =
  | "can_view_legal_names"
  | "can_manage_legal_names"
  | "can_view_bank_accounts"
  | "can_manage_bank_accounts"
  | "can_view_user_account_info"
  | "can_manage_user_account_info"
  | "can_view_properties"
  | "can_manage_properties";

const delegationFlagOptions: Array<[DelegationFlagKey, string]> = [
  ["can_view_legal_names", "View legal names"],
  ["can_manage_legal_names", "Manage legal names"],
  ["can_view_bank_accounts", "View bank accounts"],
  ["can_manage_bank_accounts", "Manage bank accounts"],
  ["can_view_user_account_info", "View user account information"],
  ["can_manage_user_account_info", "Manage user account information"],
  ["can_view_properties", "View properties"],
  ["can_manage_properties", "Manage properties"],
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

function formFromDelegation(delegation: UserDelegation) {
  return {
    delegate_user_id: delegation.delegate_user_id,
    relationship_type: delegation.relationship_type ?? "",
    can_view_legal_names: delegation.can_view_legal_names,
    can_manage_legal_names: delegation.can_manage_legal_names,
    can_view_bank_accounts: delegation.can_view_bank_accounts,
    can_manage_bank_accounts: delegation.can_manage_bank_accounts,
    can_view_user_account_info: delegation.can_view_user_account_info,
    can_manage_user_account_info: delegation.can_manage_user_account_info,
    can_view_properties: delegation.can_view_properties,
    can_manage_properties: delegation.can_manage_properties,
    is_active: delegation.is_active,
  };
}

function getRelationshipLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  return (
    relationshipTypeOptions.find((option) => option.value === value)?.label ??
    value
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function UserDelegationsCard({
  delegations,
  description = "Let another individual manage selected records for this person. This is for cases like managing a parent's records without exposing unrelated accounts to agents.",
  isLoading = false,
  locale,
  subjectUser,
  users,
  onCreate,
  onUpdate,
  onDelete,
}: UserDelegationsCardProps) {
  const [form, setForm] = useState(defaultForm);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDelegation, setEditingDelegation] =
    useState<UserDelegation | null>(null);
  const [deletingDelegation, setDeletingDelegation] =
    useState<UserDelegation | null>(null);

  const delegatedUserIds = useMemo(
    () => new Set(delegations.map((delegation) => delegation.delegate_user_id)),
    [delegations],
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
          label: formatPersonName(user.family_name, user.given_name, locale),
          searchText: `${user.family_name} ${user.given_name} ${user.email}`,
        })),
    [delegatedUserIds, form.delegate_user_id, locale, subjectUser.id, users],
  );

  const selectedDelegateLabel =
    delegateOptions.find((option) => option.value === form.delegate_user_id)
      ?.label ?? "--";

  const allAccessSelected = delegationFlagOptions.every(
    ([key]) => form[key],
  );

  const showForm = isCreating || Boolean(editingDelegation);
  const canCreateRelationship = delegateOptions.length > 0;

  function beginCreate() {
    if (isCreating) {
      cancelEdit();
      return;
    }

    setErrorMessages([]);
    setEditingDelegation(null);
    setIsCreating(true);
    setForm(defaultForm);
  }

  async function handleSubmit() {
    const validationErrors: string[] = [];

    if (!form.delegate_user_id) {
      validationErrors.push("Select an individual first.");
    }

    if (!form.relationship_type.trim()) {
      validationErrors.push("Select a relationship first.");
    }

    if (!delegationFlagOptions.some(([key]) => form[key])) {
      validationErrors.push("Select at least one allowed access.");
    }

    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors);
      return;
    }

    setErrorMessages([]);

    setIsSaving(true);
    try {
      const payload = {
        relationship_type: form.relationship_type.trim(),
        can_view_legal_names: form.can_view_legal_names,
        can_manage_legal_names: form.can_manage_legal_names,
        can_view_bank_accounts: form.can_view_bank_accounts,
        can_manage_bank_accounts: form.can_manage_bank_accounts,
        can_view_user_account_info: form.can_view_user_account_info,
        can_manage_user_account_info: form.can_manage_user_account_info,
        can_view_properties: form.can_view_properties,
        can_manage_properties: form.can_manage_properties,
        is_active: form.is_active,
      };

      if (editingDelegation) {
        await onUpdate(editingDelegation.id, payload);
      } else {
        await onCreate({
          delegate_user_id: form.delegate_user_id,
          ...payload,
        });
      }

      setForm(defaultForm);
      setEditingDelegation(null);
      setIsCreating(false);
    } catch (saveError) {
      setErrorMessages([
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this relationship.",
      ]);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(delegation: UserDelegation) {
    setErrorMessages([]);
    setIsCreating(false);
    setEditingDelegation(delegation);
    setForm(formFromDelegation(delegation));
  }

  function cancelEdit() {
    setErrorMessages([]);
    setIsCreating(false);
    setEditingDelegation(null);
    setForm(defaultForm);
  }

  async function handleDelete() {
    if (!deletingDelegation) {
      return;
    }

    setErrorMessages([]);
    try {
      await onDelete(deletingDelegation.id);
      setDeletingDelegation(null);
    } catch (deleteError) {
      setErrorMessages([
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove this relationship.",
      ]);
    }
  }

  function updateFlag(key: DelegationFlagKey, value: boolean) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function toggleAllAccess() {
    const nextValue = !allAccessSelected;

    setForm((currentForm) => ({
      ...currentForm,
      ...Object.fromEntries(
        delegationFlagOptions.map(([key]) => [key, nextValue]),
      ),
    }));
  }

  return (
    <CollapsibleCard
      action={
        editingDelegation ? undefined : (
          (isCreating || canCreateRelationship) && (
            <Button
              className="min-h-8 px-2.5 text-sm"
              variant="secondary"
              onClick={beginCreate}
            >
              {isCreating ? (
                <X aria-hidden="true" size={16} />
              ) : (
                <Plus aria-hidden="true" size={16} />
              )}
              {isCreating ? "Cancel" : "Add"}
            </Button>
          )
        )
      }
      collapsible={false}
      description={description}
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
        {errorMessages.length > 0 && <FormAlert messages={errorMessages} />}
        {delegations.length > 0 && (
          <div className="grid gap-2">
            {delegations.map((delegation) => {
              const relationshipLabel = getRelationshipLabel(
                delegation.relationship_type,
              );
              const personName = formatPersonName(
                delegation.delegate_family_name,
                delegation.delegate_given_name,
                locale,
              );

              return (
                <div
                  key={delegation.id}
                  className={[
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                    editingDelegation?.id === delegation.id
                      ? "border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
                      : "border-slate-200 dark:border-slate-800",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {relationshipLabel
                        ? `${relationshipLabel} - ${personName}`
                        : personName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {delegation.delegate_email}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <IconButton
                      label="Edit relationship"
                      onClick={() => handleEdit(delegation)}
                    >
                      <Edit2 aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      label="Remove relationship"
                      onClick={() => setDeletingDelegation(delegation)}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showForm && (
          <div className="grid gap-4 rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="lm-form-label">
                  <span className="lm-form-label-line lm-form-label-required">
                    Managed by
                  </span>
                </span>
                <SearchableSelect
                  disabled={Boolean(editingDelegation)}
                  options={delegateOptions}
                  value={form.delegate_user_id}
                  placeholder={editingDelegation ? selectedDelegateLabel : "--"}
                  onChange={(value) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      delegate_user_id: value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-1">
                <span className="lm-form-label">
                  <span className="lm-form-label-line lm-form-label-required">
                    Relationship
                  </span>
                </span>
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
              <div className="flex items-center justify-between gap-3">
                <span className="lm-form-label">
                  <span className="lm-form-label-line lm-form-label-required">
                    Allowed access
                  </span>
                </span>
                <button
                  className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
                  type="button"
                  onClick={toggleAllAccess}
                >
                  {allAccessSelected ? "Clear all" : "Select all"}
                </button>
              </div>
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
            <div className="flex justify-end gap-2">
              <Button
                disabled={isSaving || isLoading}
                variant="secondary"
                onClick={cancelEdit}
              >
                {editingDelegation ? "Cancel edit" : "Cancel"}
              </Button>
              <Button disabled={isSaving || isLoading} onClick={handleSubmit}>
                {editingDelegation ? "Save relationship" : "Add relationship"}
              </Button>
            </div>
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
