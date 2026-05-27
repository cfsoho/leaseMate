import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from "lucide-react";

import type { DataGridColumn, DataGridSortState } from "./dataTypes";
import { getDataGridRowStateClassName } from "./dataGridRowState";

const GRID_HEADER_HEIGHT_PX = 42;
const GRID_ROW_HEIGHT_PX = 45;
const MIN_GRID_BODY_HEIGHT_PX = 160;
const FALLBACK_GRID_BOTTOM_PADDING_PX = 24;

type DataGridProps<TRecord extends { id: string }> = {
  columns: DataGridColumn<TRecord>[];
  records: TRecord[];
  activeRecordId?: string | null;
  selectedId?: string;
  isRecordInactive?: (record: TRecord) => boolean;
  onSelect?: (record: TRecord) => void;
  emptyMessage?: string;
  paginationLabels?: Partial<DataGridPaginationLabels>;
  pageSize?: number;
  pageIndex?: number;
  totalRecords?: number;
  sortState?: DataGridSortState;
  fitViewport?: boolean;
  heightClassName?: string;
  getRowClassName?: (record: TRecord) => string;
  onPageIndexChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortState: DataGridSortState) => void;
};

export type DataGridPaginationLabels = {
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  rows: string;
};

const defaultPaginationLabels: DataGridPaginationLabels = {
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  rows: "Rows",
};

export function DataGrid<TRecord extends { id: string }>({
  columns,
  records,
  activeRecordId,
  selectedId,
  isRecordInactive,
  onSelect,
  emptyMessage = "No records found.",
  paginationLabels,
  pageSize,
  pageIndex,
  totalRecords,
  sortState,
  fitViewport = false,
  heightClassName = "h-[420px]",
  getRowClassName,
  onPageIndexChange,
  onPageSizeChange,
  onSortChange,
}: DataGridProps<TRecord>) {
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [internalSortState, setInternalSortState] = useState<DataGridSortState>(null);
  const [internalPageSize, setInternalPageSize] = useState<number | null>(null);
  const [viewportGridBodyHeight, setViewportGridBodyHeight] = useState<number | null>(null);
  const [viewportPageSize, setViewportPageSize] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const labels = { ...defaultPaginationLabels, ...paginationLabels };
  const activePageIndex = pageIndex ?? internalPageIndex;
  const activeSortState = sortState ?? internalSortState;
  const isServerPaged = totalRecords !== undefined;
  const recordCount = totalRecords ?? records.length;
  const requestedPageSize =
    internalPageSize ?? pageSize ?? (fitViewport && viewportPageSize ? viewportPageSize : 10);
  const effectivePageSize =
    recordCount > 0
      ? Math.min(requestedPageSize, recordCount)
      : requestedPageSize;
  const pageSizeOptions = useMemo(
    () => buildPageSizeOptions(recordCount, requestedPageSize),
    [recordCount, requestedPageSize],
  );
  const sortedRecords = useMemo(() => {
    if (isServerPaged) {
      return records;
    }

    const column = activeSortState
      ? columns.find((candidate) => candidate.key === activeSortState.columnKey)
      : undefined;

    return records
      .map((record, index) => ({ index, record }))
      .sort((left, right) => {
        const activeResult =
          getActiveSortBucket(left.record) - getActiveSortBucket(right.record);

        if (activeResult !== 0) {
          return activeResult;
        }

        if (column?.sortable && activeSortState) {
          const columnResult = compareSortValues(
            getSortValue(column, left.record),
            getSortValue(column, right.record),
          );

          if (columnResult !== 0) {
            return activeSortState.direction === "asc"
              ? columnResult
              : -columnResult;
          }
        }

        return left.index - right.index;
      })
      .map(({ record }) => record);
  }, [activeSortState, columns, isServerPaged, records]);
  const pageCount = Math.max(Math.ceil(recordCount / effectivePageSize), 1);
  const currentPageIndex = Math.min(activePageIndex, pageCount - 1);
  const pageStart = currentPageIndex * effectivePageSize;
  const pageEnd = Math.min(pageStart + effectivePageSize, recordCount);
  const dataColumnCount = columns.filter((column) => column.key !== "actions").length;
  const fitsSingleDataColumn = dataColumnCount <= 1;
  const visibleRecords = useMemo(
    () => (isServerPaged ? sortedRecords : sortedRecords.slice(pageStart, pageEnd)),
    [isServerPaged, pageEnd, pageStart, sortedRecords],
  );

  useEffect(() => {
    if (recordCount > 0 && activePageIndex > pageCount - 1) {
      setPage(pageCount - 1);
    }
  }, [activePageIndex, pageCount, recordCount]);

  useEffect(() => {
    if (recordCount > 0 && requestedPageSize > recordCount) {
      setGridPageSize(recordCount, { keepPage: true });
    }
  }, [recordCount, requestedPageSize]);

  useLayoutEffect(() => {
    if (!fitViewport) {
      return undefined;
    }

    function measureGrid() {
      const gridElement = gridRef.current;
      if (!gridElement) {
        return;
      }

      const mainElement = gridElement.closest("main");
      const mainStyle = mainElement ? window.getComputedStyle(mainElement) : null;
      const bottomPadding = mainStyle
        ? parseFloat(mainStyle.paddingBottom) || FALLBACK_GRID_BOTTOM_PADDING_PX
        : FALLBACK_GRID_BOTTOM_PADDING_PX;
      const footerHeight = footerRef.current?.getBoundingClientRect().height ?? 48;
      const gridTop = gridElement.getBoundingClientRect().top;
      const availableGridHeight = window.innerHeight - gridTop - bottomPadding;
      const nextBodyHeight = Math.max(
        MIN_GRID_BODY_HEIGHT_PX,
        Math.floor(availableGridHeight - footerHeight),
      );
      const nextPageSize = Math.max(
        1,
        Math.floor((nextBodyHeight - GRID_HEADER_HEIGHT_PX) / GRID_ROW_HEIGHT_PX),
      );

      setViewportGridBodyHeight((current) =>
        current === nextBodyHeight ? current : nextBodyHeight,
      );
      setViewportPageSize((current) =>
        current === nextPageSize ? current : nextPageSize,
      );
    }

    measureGrid();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => measureGrid());
    if (gridRef.current) {
      resizeObserver?.observe(gridRef.current);
    }

    window.addEventListener("resize", measureGrid);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureGrid);
    };
  }, [columns.length, fitViewport, records.length]);

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

  function setGridPageSize(
    nextPageSize: number,
    options: { keepPage?: boolean } = {},
  ) {
    const safePageSize = Math.max(1, Math.floor(nextPageSize));
    onPageSizeChange?.(safePageSize);
    if (!onPageSizeChange) {
      setInternalPageSize(safePageSize);
    }
    if (!options.keepPage) {
      setPage(0);
    }
  }

  return (
    <div
      ref={gridRef}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
    >
      <div
        className={`${fitViewport ? "" : heightClassName} overflow-auto`}
        style={
          fitViewport && viewportGridBodyHeight
            ? { height: `${viewportGridBodyHeight}px` }
            : undefined
        }
      >
        <table
          className={[
            "w-full border-collapse text-left text-sm",
            fitsSingleDataColumn ? "min-w-full table-fixed" : "min-w-[720px]",
          ].join(" ")}
        >
          <thead className="sticky top-0 z-10 bg-slate-950 text-xs font-normal uppercase tracking-wide text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-slate-200 px-4 py-3"
                  style={{
                    width:
                      fitsSingleDataColumn && column.key === "actions"
                        ? "56px"
                        : column.width,
                  }}
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
                      <span className="truncate">{column.header}</span>
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
                            : "block truncate whitespace-nowrap"
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
                  getDataGridRowStateClassName({
                    activeRecordId,
                    isInactive: isRecordInactive?.(record),
                    recordId: record.id,
                  }),
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
                          ? "flex min-w-0 justify-end text-right"
                          : column.align === "center"
                            ? "flex min-w-0 justify-center text-center"
                            : "min-w-0 truncate"
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
      <div
        ref={footerRef}
        className="flex min-h-12 items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-sm text-slate-600"
      >
        <div className="flex min-w-0 items-center gap-3">
          <p className="font-normal">
            {recordCount === 0 ? "0 / 0" : `${pageStart + 1}-${pageEnd} / ${recordCount}`}
          </p>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm font-normal text-slate-600">
            <span>{labels.rows}</span>
            <select
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm font-normal text-slate-700 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              value={String(effectivePageSize)}
              onChange={(event) => setGridPageSize(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={labels.firstPage}
            className="grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPageIndex === 0}
            type="button"
            onClick={() => setPage(0)}
          >
            <ChevronsLeft aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={labels.previousPage}
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
            aria-label={labels.nextPage}
            className="grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPageIndex >= pageCount - 1}
            type="button"
            onClick={() => setPage(Math.min(currentPageIndex + 1, pageCount - 1))}
          >
            <ChevronRight aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={labels.lastPage}
            className="grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPageIndex >= pageCount - 1}
            type="button"
            onClick={() => setPage(pageCount - 1)}
          >
            <ChevronsRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function buildPageSizeOptions(recordCount: number, requestedPageSize: number) {
  const baseOptions = [10, 15, 25, 50, 100];
  const maxRecordCount = Math.max(recordCount, 0);
  const options = new Set<number>();

  baseOptions.forEach((option) => {
    if (maxRecordCount === 0 || option <= maxRecordCount) {
      options.add(option);
    }
  });

  if (requestedPageSize > 0 && (maxRecordCount === 0 || requestedPageSize <= maxRecordCount)) {
    options.add(requestedPageSize);
  }

  if (maxRecordCount > 0 && options.size === 0) {
    options.add(maxRecordCount);
  }

  if (
    maxRecordCount > 0 &&
    (maxRecordCount <= 100 || requestedPageSize > maxRecordCount)
  ) {
    options.add(maxRecordCount);
  }

  return [...options].sort((left, right) => left - right);
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

function getActiveSortBucket(record: unknown) {
  if (!isRecord(record)) {
    return 1;
  }

  if (typeof record.isActive === "boolean") {
    return record.isActive ? 0 : 2;
  }

  if (typeof record.is_active === "boolean") {
    return record.is_active ? 0 : 2;
  }

  if (typeof record.status === "string") {
    return record.status === "INACTIVE" ? 2 : 0;
  }

  return 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
