import type { ReactNode } from "react";

export type DataGridSortDirection = "asc" | "desc";

export type DataGridSortState = {
  columnKey: string;
  direction: DataGridSortDirection;
} | null;

export type DataGridColumn<TRecord> = {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  sortValue?: (record: TRecord) => string | number | boolean | Date | null | undefined;
  align?: "left" | "right" | "center";
  render?: (record: TRecord) => ReactNode;
};

export type FormFieldType =
  | "text"
  | "textarea"
  | "money"
  | "date"
  | "select"
  | "checkbox";

export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormFieldConfig<TPayload> = {
  name: keyof TPayload & string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  helpText?: string;
};

export type EntityApi<TRecord, TCreate, TUpdate = Partial<TCreate>> = {
  list: () => Promise<TRecord[]>;
  get: (id: string) => Promise<TRecord>;
  create: (payload: TCreate) => Promise<TRecord>;
  update: (id: string, payload: TUpdate) => Promise<TRecord>;
  remove: (id: string) => Promise<void>;
};

export type MasterDetailPageConfig<
  TRecord extends { id: string },
  TCreate,
  TUpdate = Partial<TCreate>,
> = {
  title: string;
  eyebrow?: string;
  queryKey: readonly unknown[];
  api: EntityApi<TRecord, TCreate, TUpdate>;
  columns: DataGridColumn<TRecord>[];
  formFields: FormFieldConfig<TCreate>[];
  getRecordLabel?: (record: TRecord) => string;
};
