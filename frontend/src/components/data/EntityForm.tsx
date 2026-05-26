import type { FormEvent } from "react";

import { Button } from "../ui/Button";
import type { FormFieldConfig } from "./dataTypes";

type EntityFormProps<TPayload extends Record<string, unknown>> = {
  fields: FormFieldConfig<TPayload>[];
  value: TPayload;
  onChange: (value: TPayload) => void;
  onSubmit: (value: TPayload) => void;
  submitLabel?: string;
  disabled?: boolean;
};

export function EntityForm<TPayload extends Record<string, unknown>>({
  fields,
  value,
  onChange,
  onSubmit,
  submitLabel = "Save",
  disabled,
}: EntityFormProps<TPayload>) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label
          className="grid gap-2 text-sm font-bold text-slate-700"
          key={field.name}
        >
          {field.label}
          {renderField(field, value, onChange, disabled)}
          {field.helpText && (
            <span className="text-xs font-semibold text-slate-500">
              {field.helpText}
            </span>
          )}
        </label>
      ))}
      <Button disabled={disabled} type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}

function renderField<TPayload extends Record<string, unknown>>(
  field: FormFieldConfig<TPayload>,
  value: TPayload,
  onChange: (value: TPayload) => void,
  disabled?: boolean,
) {
  const currentValue = value[field.name];
const baseClass =
  "min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:bg-slate-100";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${baseClass} min-h-24 py-2`}
        disabled={disabled}
        placeholder={field.placeholder}
        value={String(currentValue ?? "")}
        onChange={(event) =>
          onChange({ ...value, [field.name]: event.target.value })
        }
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={baseClass}
        disabled={disabled}
        value={String(currentValue ?? "")}
        onChange={(event) =>
          onChange({ ...value, [field.name]: event.target.value })
        }
      >
        <option value="">Select...</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        checked={Boolean(currentValue)}
        className="size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
        disabled={disabled}
        type="checkbox"
        onChange={(event) =>
          onChange({ ...value, [field.name]: event.target.checked })
        }
      />
    );
  }

  return (
    <input
      className={baseClass}
      disabled={disabled}
      placeholder={field.placeholder}
      type={field.type === "money" ? "number" : field.type}
      value={String(currentValue ?? "")}
      onChange={(event) =>
        onChange({ ...value, [field.name]: event.target.value })
      }
    />
  );
}
