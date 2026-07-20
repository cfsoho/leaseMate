import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Columns3 } from "lucide-react";

import { PageHeader } from "../layout/PageHeader";
import { Drawer } from "../ui/Drawer";
import { IconButton } from "../ui/IconButton";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { DataGrid } from "./DataGrid";
import type { DataGridPaginationLabels } from "./DataGrid";
import type { DataGridColumn, DataGridSortState } from "./dataTypes";

type GridManagementPageProps<TRecord extends { id: string }> = {
  actions?: ReactNode;
  actionsClassName?: string;
  activeRecordId?: string | null;
  columns: DataGridColumn<TRecord>[];
  columnSelectionStorageKey?: string;
  defaultVisibleColumnKeys?: string[];
  description?: string;
  emptyMessage?: string;
  errorMessage?: string;
  fitViewport?: boolean;
  eyebrow?: string;
  getRowClassName?: (record: TRecord) => string;
  heightClassName?: string;
  isRecordInactive?: (record: TRecord) => boolean;
  leadingActions?: ReactNode;
  paginationLabels?: Partial<DataGridPaginationLabels>;
  pageIndex?: number;
  pageSize?: number;
  records: TRecord[];
  selectedId?: string;
  sortState?: DataGridSortState;
  title: string;
  totalRecords?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSelect?: (record: TRecord) => void;
  onSortChange?: (sortState: DataGridSortState) => void;
};

export function GridManagementPage<TRecord extends { id: string }>({
  actions,
  actionsClassName,
  activeRecordId,
  columns,
  columnSelectionStorageKey,
  defaultVisibleColumnKeys,
  description,
  emptyMessage,
  errorMessage,
  fitViewport = true,
  eyebrow,
  getRowClassName,
  heightClassName,
  isRecordInactive,
  leadingActions,
  paginationLabels,
  pageIndex,
  pageSize,
  records,
  selectedId,
  sortState,
  title,
  totalRecords,
  onPageIndexChange,
  onPageSizeChange,
  onSelect,
  onSortChange,
}: GridManagementPageProps<TRecord>) {
  const { t } = useTranslation();
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const isSuperWideViewport = useMinWidth(1536);
  const availableColumnKeys = useMemo(
    () =>
      columns
        .filter((column) => !isAlwaysVisibleColumn(column))
        .map((column) => column.key),
    [columns],
  );
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    getDefaultVisibleColumnKeys(availableColumnKeys, defaultVisibleColumnKeys),
  );

  useEffect(() => {
    if (!columnSelectionStorageKey) {
      const nextKeys = getDefaultVisibleColumnKeys(
        availableColumnKeys,
        defaultVisibleColumnKeys,
      );
      setVisibleColumnKeys((currentKeys) =>
        areStringArraysEqual(currentKeys, nextKeys) ? currentKeys : nextKeys,
      );
      return;
    }

    const nextKeys = readSavedColumnKeys(
      columnSelectionStorageKey,
      availableColumnKeys,
      defaultVisibleColumnKeys,
    );
    setVisibleColumnKeys((currentKeys) =>
      areStringArraysEqual(currentKeys, nextKeys) ? currentKeys : nextKeys,
    );
  }, [
    availableColumnKeys,
    columnSelectionStorageKey,
    defaultVisibleColumnKeys,
  ]);

  useEffect(() => {
    if (!columnSelectionStorageKey) {
      return;
    }

    const safeKeys = sanitizeColumnKeys(
      visibleColumnKeys,
      availableColumnKeys,
      defaultVisibleColumnKeys,
    );
    if (!areStringArraysEqual(visibleColumnKeys, safeKeys)) {
      setVisibleColumnKeys(safeKeys);
      saveColumnKeys(columnSelectionStorageKey, safeKeys);
    }
  }, [
    availableColumnKeys,
    columnSelectionStorageKey,
    defaultVisibleColumnKeys,
    visibleColumnKeys,
  ]);

  const displayColumns = useMemo(() => {
    if (!columnSelectionStorageKey) {
      return columns;
    }

    if (isSuperWideViewport) {
      return columns;
    }

    return columns.filter(
      (column) =>
        isAlwaysVisibleColumn(column) || visibleColumnKeys.includes(column.key),
    );
  }, [
    columnSelectionStorageKey,
    columns,
    isSuperWideViewport,
    visibleColumnKeys,
  ]);

  function updateVisibleColumn(columnKey: string, shouldShow: boolean) {
    if (!columnSelectionStorageKey) {
      return;
    }

    setVisibleColumnKeys((currentKeys) => {
      const nextKeys = shouldShow
        ? [...currentKeys, columnKey]
        : currentKeys.filter((key) => key !== columnKey);
      const safeKeys = sanitizeColumnKeys(
        nextKeys,
        availableColumnKeys,
        defaultVisibleColumnKeys,
      );
      saveColumnKeys(columnSelectionStorageKey, safeKeys);
      return safeKeys;
    });
  }

  function setAllVisibleColumns(shouldShowAll: boolean) {
    if (!columnSelectionStorageKey) {
      return;
    }

    const nextKeys = shouldShowAll
      ? availableColumnKeys
      : sanitizeColumnKeys([], availableColumnKeys, defaultVisibleColumnKeys);
    saveColumnKeys(columnSelectionStorageKey, nextKeys);
    setVisibleColumnKeys(nextKeys);
  }

  const areAllColumnsVisible =
    availableColumnKeys.length > 0 &&
    availableColumnKeys.every((key) => visibleColumnKeys.includes(key));

  const composedActions = columnSelectionStorageKey ? (
    <>
      {leadingActions}
      <IconButton label={t("grid.columns")} onClick={() => setIsColumnsOpen(true)}>
        <Columns3 aria-hidden="true" size={16} />
      </IconButton>
      {actions}
    </>
  ) : (
    <>
      {leadingActions}
      {actions}
    </>
  );

  return (
    <>
      <section className="grid-management-page">
        <PageHeader
          actions={composedActions}
          actionsClassName={actionsClassName}
          description={description}
          descriptionPlacement="aside"
          eyebrow={eyebrow}
          title={title}
        />

        <section className="grid-management-grid">
          {errorMessage && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
              {errorMessage}
            </p>
          )}
          <DataGrid
            activeRecordId={activeRecordId}
            columns={displayColumns}
            emptyMessage={emptyMessage}
            fitViewport={fitViewport}
            getRowClassName={getRowClassName}
            heightClassName={heightClassName}
            isRecordInactive={isRecordInactive}
            paginationLabels={paginationLabels}
            pageIndex={pageIndex}
            pageSize={pageSize}
            records={records}
            selectedId={selectedId}
            sortState={sortState}
            totalRecords={totalRecords}
            onPageIndexChange={onPageIndexChange}
            onPageSizeChange={onPageSizeChange}
            onSelect={onSelect}
            onSortChange={onSortChange}
          />
        </section>
      </section>

      {columnSelectionStorageKey && (
        <Drawer
          isOpen={isColumnsOpen}
          title={t("grid.displayedColumns")}
          onClose={() => setIsColumnsOpen(false)}
        >
          <div className="grid gap-3">
            <button
              className="lm-button-primary justify-self-start rounded-md border px-3 py-2 text-sm font-normal"
              type="button"
              onClick={() => setAllVisibleColumns(!areAllColumnsVisible)}
            >
              {areAllColumnsVisible ? t("grid.clearColumns") : t("grid.selectAllColumns")}
            </button>
            {columns
              .filter((column) => !isAlwaysVisibleColumn(column))
              .map((column) => {
                const isChecked =
                  isSuperWideViewport || visibleColumnKeys.includes(column.key);
                return (
                  <label
                    key={column.key}
                    className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700"
                  >
                    <input
                      checked={isChecked}
                      className="size-4 accent-slate-950"
                      disabled={
                        isSuperWideViewport ||
                        (isChecked && visibleColumnKeys.length === 1)
                      }
                      type="checkbox"
                      onChange={(event) =>
                        updateVisibleColumn(column.key, event.target.checked)
                      }
                    />
                    <span className="whitespace-nowrap">{column.header}</span>
                  </label>
                );
              })}
          </div>
        </Drawer>
      )}
    </>
  );
}

function getStorageKey(storageKey: string) {
  return `datagrid:${storageKey}:columns`;
}

function isAlwaysVisibleColumn<TRecord>(column: DataGridColumn<TRecord>) {
  return column.key === "actions" || !column.header.trim();
}

function getDefaultVisibleColumnKeys(
  availableColumnKeys: string[],
  defaultVisibleColumnKeys?: string[],
) {
  return sanitizeColumnKeys(
    defaultVisibleColumnKeys ?? availableColumnKeys,
    availableColumnKeys,
  );
}

function readSavedColumnKeys(
  storageKey: string,
  availableColumnKeys: string[],
  defaultVisibleColumnKeys?: string[],
) {
  if (!availableColumnKeys.length) {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(getStorageKey(storageKey));
    if (!savedValue) {
      return getDefaultVisibleColumnKeys(
        availableColumnKeys,
        defaultVisibleColumnKeys,
      );
    }

    const parsedValue = JSON.parse(savedValue) as unknown;
    const savedColumnKeys = Array.isArray(parsedValue)
      ? parsedValue.filter((key): key is string => typeof key === "string")
      : [];

    return sanitizeColumnKeys(
      savedColumnKeys,
      availableColumnKeys,
      defaultVisibleColumnKeys,
    );
  } catch {
    return getDefaultVisibleColumnKeys(
      availableColumnKeys,
      defaultVisibleColumnKeys,
    );
  }
}

function saveColumnKeys(storageKey: string, columnKeys: string[]) {
  window.localStorage.setItem(getStorageKey(storageKey), JSON.stringify(columnKeys));
}

function useMinWidth(minWidth: number) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`);
    const updateMatches = () => setMatches(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);

    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, [minWidth]);

  return matches;
}

function sanitizeColumnKeys(
  columnKeys: string[],
  availableColumnKeys: string[],
  fallbackColumnKeys?: string[],
) {
  const available = new Set(availableColumnKeys);
  const nextKeys = columnKeys.filter((key) => available.has(key));

  if (nextKeys.length) {
    return [...new Set(nextKeys)];
  }

  const fallbackKeys = fallbackColumnKeys?.filter((key) => available.has(key)) ?? [];
  if (fallbackKeys.length) {
    return [...new Set(fallbackKeys)];
  }

  return availableColumnKeys[0] ? [availableColumnKeys[0]] : [];
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
