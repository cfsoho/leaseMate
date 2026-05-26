import type { ReactNode } from "react";

import { PageHeader } from "../layout/PageHeader";
import { DataGrid } from "./DataGrid";
import type { DataGridColumn, DataGridSortState } from "./dataTypes";

type GridManagementPageProps<TRecord extends { id: string }> = {
  actions?: ReactNode;
  actionsClassName?: string;
  columns: DataGridColumn<TRecord>[];
  description?: string;
  emptyMessage?: string;
  errorMessage?: string;
  eyebrow?: string;
  getRowClassName?: (record: TRecord) => string;
  heightClassName?: string;
  pageIndex?: number;
  pageSize?: number;
  records: TRecord[];
  selectedId?: string;
  sortState?: DataGridSortState;
  title: string;
  totalRecords?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  onSelect?: (record: TRecord) => void;
  onSortChange?: (sortState: DataGridSortState) => void;
};

export function GridManagementPage<TRecord extends { id: string }>({
  actions,
  actionsClassName,
  columns,
  description,
  emptyMessage,
  errorMessage,
  eyebrow,
  getRowClassName,
  heightClassName,
  pageIndex,
  pageSize,
  records,
  selectedId,
  sortState,
  title,
  totalRecords,
  onPageIndexChange,
  onSelect,
  onSortChange,
}: GridManagementPageProps<TRecord>) {
  return (
    <section className="grid gap-3">
      <PageHeader
        actions={actions}
        actionsClassName={actionsClassName}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <section className="grid gap-0">
        {errorMessage && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
            {errorMessage}
          </p>
        )}
        <DataGrid
          columns={columns}
          emptyMessage={emptyMessage}
          getRowClassName={getRowClassName}
          heightClassName={heightClassName}
          pageIndex={pageIndex}
          pageSize={pageSize}
          records={records}
          selectedId={selectedId}
          sortState={sortState}
          totalRecords={totalRecords}
          onPageIndexChange={onPageIndexChange}
          onSelect={onSelect}
          onSortChange={onSortChange}
        />
      </section>
    </section>
  );
}
