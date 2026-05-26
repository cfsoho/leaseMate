import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";

import type { DataGridColumn, DataGridSortState } from "./dataTypes";

type DataGridProps<TRecord extends { id: string }> = {
  columns: DataGridColumn<TRecord>[];
  records: TRecord[];
  selectedId?: string;
  onSelect?: (record: TRecord) => void;
  emptyMessage?: string;
  pageSize?: number;
  pageIndex?: number;
  totalRecords?: number;
  sortState?: DataGridSortState;
  heightClassName?: string;
  getRowClassName?: (record: TRecord) => string;
  onPageIndexChange?: (pageIndex: number) => void;
  onSortChange?: (sortState: DataGridSortState) => void;
};

export function DataGrid<TRecord extends { id: string }>({
  columns,
  records,
  selectedId,
  onSelect,
  emptyMessage = "No records found.",
  pageSize = 10,
  pageIndex,
  totalRecords,
  sortState,
  heightClassName = "h-[420px]",
  getRowClassName,
  onPageIndexChange,
  onSortChange,
}: DataGridProps<TRecord>) {
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [internalSortState, setInternalSortState] = useState<DataGridSortState>(null);
  const activePageIndex = pageIndex ?? internalPageIndex;
  const activeSortState = sortState ?? internalSortState;
  const isServerPaged = totalRecords !== undefined;
  const recordCount = totalRecords ?? records.length;
  const sortedRecords = useMemo(() => {
    if (isServerPaged || !activeSortState) {
      return records;
    }

    const column = columns.find(
      (candidate) => candidate.key === activeSortState.columnKey,
    );
    if (!column?.sortable) {
      return records;
    }

    return [...records].sort((left, right) => {
      const result = compareSortValues(
        getSortValue(column, left),
        getSortValue(column, right),
      );

      return activeSortState.direction === "asc" ? result : -result;
    });
  }, [activeSortState, columns, isServerPaged, records]);
  const pageCount = Math.max(Math.ceil(recordCount / pageSize), 1);
  const currentPageIndex = Math.min(activePageIndex, pageCount - 1);
  const pageStart = currentPageIndex * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, recordCount);
  const visibleRecords = useMemo(
    () => (isServerPaged ? sortedRecords : sortedRecords.slice(pageStart, pageEnd)),
    [isServerPaged, pageEnd, pageStart, sortedRecords],
  );

  useEffect(() => {
    if (activePageIndex > pageCount - 1) {
      setPage(pageCount - 1);
    }
  }, [activePageIndex, pageCount]);

  function handleSort(column: DataGridColumn<TRecord>) {
    if (!column.sortable) {
      return;
    }

    const nextSortState = (() => {
      const current = activeSortState;
      if (current?.columnKey !== column.key) {
        return { columnKey: column.key, direction: "asc" };
      }

      return {
        columnKey: column.key,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    })() as DataGridSortState;

    if (currentPageIndex !== 0) {
      setPage(0);
    }
    setSort(nextSortState);
  }

  function setPage(nextPageIndex: number) {
    onPageIndexChange?.(nextPageIndex);
    if (pageIndex === undefined) {
      setInternalPageIndex(nextPageIndex);
    }
  }

  function setSort(nextSortState: DataGridSortState) {
    onSortChange?.(nextSortState);
    if (sortState === undefined) {
      setInternalSortState(nextSortState);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={`${heightClassName} overflow-auto`}>
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-xs font-normal uppercase tracking-wide text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-slate-200 px-4 py-3"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      className={[
                        "flex w-full items-center gap-1 whitespace-nowrap text-left font-normal uppercase tracking-wide text-white hover:text-slate-200",
                        column.align === "right"
                          ? "justify-end text-right"
                          : column.align === "center"
                            ? "justify-center text-center"
                            : "",
                      ].join(" ")}
                      type="button"
                      onClick={() => handleSort(column)}
                    >
                      <span>{column.header}</span>
                      {activeSortState?.columnKey === column.key ? (
                        activeSortState.direction === "asc" ? (
                          <ArrowUp aria-hidden="true" size={14} />
                        ) : (
                          <ArrowDown aria-hidden="true" size={14} />
                        )
                      ) : (
                        <ChevronsUpDown aria-hidden="true" size={14} />
                      )}
                    </button>
                  ) : (
                    <span
                      className={
                        column.align === "right"
                          ? "block whitespace-nowrap text-right"
                          : column.align === "center"
                            ? "block whitespace-nowrap text-center"
                            : "whitespace-nowrap"
                      }
                    >
                      {column.header}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record, index) => (
              <tr
                key={record.id}
                className={[
                  "border-b border-slate-100 last:border-0 hover:bg-slate-100",
                  index % 2 === 1 ? "bg-slate-50/70" : "bg-white",
                  onSelect ? "cursor-pointer" : "",
                  selectedId === record.id ? "bg-slate-100" : "",
                  getRowClassName?.(record) ?? "",
                ].join(" ")}
                onClick={() => onSelect?.(record)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3 text-slate-700"
                  >
                    <div
                      className={
                        column.align === "right"
                          ? "flex justify-end text-right"
                          : column.align === "center"
                            ? "flex justify-center text-center"
                            : undefined
                      }
                    >
                      {column.render?.(record) ?? ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="grid h-[calc(100%-42px)] min-h-[240px] place-items-center px-4 text-center text-sm font-semibold text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
      <div className="flex min-h-12 items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
        <p className="font-normal">
          {recordCount === 0 ? "0 / 0" : `${pageStart + 1}-${pageEnd} / ${recordCount}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous page"
            className="grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPageIndex === 0}
            type="button"
            onClick={() => setPage(Math.max(currentPageIndex - 1, 0))}
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <span className="min-w-12 text-center font-semibold text-slate-700">
            {recordCount === 0 ? 0 : currentPageIndex + 1} / {pageCount}
          </span>
          <button
            aria-label="Next page"
            className="grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPageIndex >= pageCount - 1}
            type="button"
            onClick={() => setPage(Math.min(currentPageIndex + 1, pageCount - 1))}
          >
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function getSortValue<TRecord>(
  column: DataGridColumn<TRecord>,
  record: TRecord,
) {
  if (column.sortValue) {
    return column.sortValue(record);
  }

  return record[column.key as keyof TRecord] as
    | string
    | number
    | boolean
    | Date
    | null
    | undefined;
}

function compareSortValues(
  left: string | number | boolean | Date | null | undefined,
  right: string | number | boolean | Date | null | undefined,
) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (left instanceof Date || right instanceof Date) {
    return toTime(left) - toTime(right);
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function toTime(value: string | number | boolean | Date) {
  if (value instanceof Date) {
    return value.getTime();
  }

  return new Date(String(value)).getTime();
}
