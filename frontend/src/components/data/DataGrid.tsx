import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const setPage = useCallback(
    (nextPageIndex: number) => {
      onPageIndexChange?.(nextPageIndex);
      if (pageIndex === undefined) {
        setInternalPageIndex(nextPageIndex);
      }
    },
    [onPageIndexChange, pageIndex],
  );
  const setGridPageSize = useCallback(
    (nextPageSize: number, options: { keepPage?: boolean } = {}) => {
      const safePageSize = Math.max(1, Math.floor(nextPageSize));
      onPageSizeChange?.(safePageSize);
      if (!onPageSizeChange) {
        setInternalPageSize(safePageSize);
      }
      if (!options.keepPage) {
        setPage(0);
      }
    },
    [onPageSizeChange, setPage],
  );

  useEffect(() => {
    if (recordCount > 0 && activePageIndex > pageCount - 1) {
      setPage(pageCount - 1);
    }
  }, [activePageIndex, pageCount, recordCount, setPage]);

  useEffect(() => {
    if (recordCount > 0 && requestedPageSize > recordCount) {
      setGridPageSize(recordCount, { keepPage: true });
    }
  }, [recordCount, requestedPageSize, setGridPageSize]);

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

  function setSort(nextSortState: DataGridSortState) {
    onSortChange?.(nextSortState);
    if (sortState === undefined) {
      setInternalSortState(nextSortState);
    }
  }

  return (
    <div
      ref={gridRef}
      className="data-grid"
    >
      <div
        className={[
          fitViewport ? "data-grid-body-fit" : heightClassName,
          "data-grid-body",
        ].join(" ")}
      >
        <table
          className={[
            "data-grid-table",
            fitsSingleDataColumn
              ? "data-grid-table-single-column"
              : "data-grid-table-wide",
          ].join(" ")}
        >
          <thead className="data-grid-head">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    "data-grid-head-cell",
                    getColumnWidthClassName(column.width),
                    fitsSingleDataColumn && column.key === "actions"
                      ? "data-grid-column-width-actions-compact"
                      : "",
                  ].join(" ")}
                >
                  {column.sortable ? (
                    <button
                      className={[
                        "data-grid-sort-button",
                        getColumnAlignClassName(column.align),
                      ].join(" ")}
                      type="button"
                      onClick={() => handleSort(column)}
                    >
                      <span className="data-grid-head-label">{column.header}</span>
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
                      className={[
                        "data-grid-head-label data-grid-head-label-static",
                        getColumnAlignClassName(column.align),
                      ].join(" ")}
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
                  "data-grid-row",
                  index % 2 === 1 ? "data-grid-row-even" : "",
                  onSelect ? "data-grid-row-selectable" : "",
                  selectedId === record.id ? "data-grid-row-selected" : "",
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
                    className="data-grid-cell"
                  >
                    <div
                      className={[
                        "data-grid-cell-content",
                        getColumnAlignClassName(column.align),
                      ].join(" ")}
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
          <div className="data-grid-empty">
            {emptyMessage}
          </div>
        )}
      </div>
      <div
        ref={footerRef}
        className="data-grid-footer"
      >
        <div className="data-grid-footer-summary">
          <p className="data-grid-record-count">
            {recordCount === 0 ? "0 / 0" : `${pageStart + 1}-${pageEnd} / ${recordCount}`}
          </p>
          <label className="data-grid-page-size-label">
            <span>{labels.rows}</span>
            <select
              className="data-grid-page-size-select"
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
        <div className="data-grid-pagination">
          <button
            aria-label={labels.firstPage}
            className="data-grid-page-button"
            disabled={currentPageIndex === 0}
            type="button"
            onClick={() => setPage(0)}
          >
            <ChevronsLeft aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={labels.previousPage}
            className="data-grid-page-button"
            disabled={currentPageIndex === 0}
            type="button"
            onClick={() => setPage(Math.max(currentPageIndex - 1, 0))}
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <span className="data-grid-page-count">
            {recordCount === 0 ? 0 : currentPageIndex + 1} / {pageCount}
          </span>
          <button
            aria-label={labels.nextPage}
            className="data-grid-page-button"
            disabled={currentPageIndex >= pageCount - 1}
            type="button"
            onClick={() => setPage(Math.min(currentPageIndex + 1, pageCount - 1))}
          >
            <ChevronRight aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={labels.lastPage}
            className="data-grid-page-button"
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

function getColumnAlignClassName(align?: "left" | "right" | "center") {
  if (align === "right") {
    return "data-grid-align-right";
  }
  if (align === "center") {
    return "data-grid-align-center";
  }
  return "data-grid-align-left";
}

function getColumnWidthClassName(width?: string) {
  switch (width) {
    case "130px":
      return "data-grid-column-width-130";
    case "136px":
      return "data-grid-column-width-136";
    case "140px":
      return "data-grid-column-width-140";
    case "180px":
      return "data-grid-column-width-180";
    default:
      return "";
  }
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
