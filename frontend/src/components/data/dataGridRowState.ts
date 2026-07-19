export const dataGridActiveActionRowClassName =
  "data-grid-row-active-action";

export const dataGridInactiveRowClassName =
  "data-grid-row-inactive";

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
