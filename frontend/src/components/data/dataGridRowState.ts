export const dataGridActiveActionRowClassName =
  "!bg-slate-700 hover:!bg-slate-700 [&>td]:!bg-slate-700 [&>td]:!text-white [&_button]:!border-slate-500 [&_button]:!bg-slate-800 [&_button]:!text-white [&_button:hover]:!bg-slate-900";

export const dataGridInactiveRowClassName =
  "[&>td:not(:last-child)]:text-slate-400 [&>td:not(:last-child)]:line-through";

export function getDataGridRowStateClassName({
  activeRecordId,
  isInactive,
  recordId,
}: {
  activeRecordId?: string | null;
  isInactive?: boolean;
  recordId: string;
}) {
  if (activeRecordId && recordId === activeRecordId) {
    return dataGridActiveActionRowClassName;
  }

  return isInactive ? dataGridInactiveRowClassName : "";
}
