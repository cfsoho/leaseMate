import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Columns3,
  Edit2,
  Globe2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { GridManagementPage } from "../components/data/GridManagementPage";
import type { DataGridColumn } from "../components/data/dataTypes";
import { useDataGridPageSize } from "../components/data/useDataGridPageSize";
import { useUrlDataGridState } from "../components/data/useUrlDataGridState";
import { referenceNavItems } from "../components/layout/navigation";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { IconButton } from "../components/ui/IconButton";
import {
  isReferenceListSlug,
  isLocalizedReferenceListSlug,
  createReferenceRecord,
  listReferenceRecords,
  listReferenceTranslations,
  updateReferenceRecord,
  type ReferenceListSlug,
  type ReferenceRecord,
} from "../features/ref/refApi";
import type { TranslationKey } from "../lib/i18n/translations";
import { useTranslation } from "../lib/i18n/useTranslation";

const referenceListBySlug = new Map(
  referenceNavItems.map((item) => [
    item.href.slice(item.href.lastIndexOf("/") + 1),
    item,
  ]),
);

type ReferenceColumn = DataGridColumn<ReferenceRecord> & {
  defaultVisible?: boolean;
};

type ReferenceFormField = {
  defaultValue?: string | boolean;
  name: string;
  label: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  type?: "checkbox" | "number" | "select" | "textarea" | "text";
};

type ReferenceFormValue = Record<string, string | boolean>;

type ReferenceDrawerMode = "create" | "edit" | "search";

export function ReferenceListsPage() {
  const { listSlug } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const referenceSlug = listSlug && isReferenceListSlug(listSlug) ? listSlug : "countries";
  const shouldRedirect = referenceSlug !== listSlug;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<ReferenceDrawerMode>("create");
  const [selectedRecord, setSelectedRecord] = useState<ReferenceRecord | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<ReferenceFormValue>({});
  const [displayedColumnKeys, setDisplayedColumnKeys] = useState<string[]>([]);
  const [translationBaseRecord, setTranslationBaseRecord] =
    useState<ReferenceRecord | null>(null);
  const pageSize = useDataGridPageSize();
  const { pageIndex, setPageIndex, setSortState, sortState } =
    useUrlDataGridState();
  const isLocalizedList = isLocalizedReferenceListSlug(referenceSlug);
  const selectedTranslationId = urlSearchParams.get("selected");
  const isTranslationMode = Boolean(translationBaseRecord || selectedTranslationId);
  const activeTranslationId = translationBaseRecord?.sharedId ?? selectedTranslationId;

  const item = referenceListBySlug.get(referenceSlug);
  const records = useQuery({
    queryKey: ["setup-lists", referenceSlug],
    queryFn: () => listReferenceRecords(referenceSlug),
  });
  const translationRecords = useQuery({
    queryKey: [
      "setup-list-translations",
      referenceSlug,
      activeTranslationId,
    ],
    enabled: Boolean(activeTranslationId) && isLocalizedList,
    queryFn: () =>
      listReferenceTranslations(referenceSlug, activeTranslationId!),
  });
  const regions = useQuery({
    queryKey: ["setup-lists", "regions", "options"],
    queryFn: () => listReferenceRecords("regions"),
    staleTime: 5 * 60 * 1000,
  });
  const regionOptions = useMemo(
    () =>
      (regions.data ?? []).map((region) => ({
        label: region.name,
        value: region.sharedId,
      })),
    [regions.data],
  );
  const regionNameById = useMemo(
    () => new Map(regionOptions.map((region) => [region.value, region.label])),
    [regionOptions],
  );
  const currentRecords = isTranslationMode
    ? (translationRecords.data ?? [])
    : (records.data ?? []);
  const allColumns = useMemo(
    () => buildReferenceColumns(referenceSlug, t, regionNameById),
    [referenceSlug, regionNameById, t],
  );
  const translationColumns = useMemo(
    () => buildTranslationColumns(t),
    [t],
  );
  const formFields = useMemo(
    () =>
      buildReferenceFormFields(
        referenceSlug,
        isTranslationMode,
        t,
        regionOptions,
    ),
    [isTranslationMode, referenceSlug, regionOptions, t],
  );
  const visibleRecords = useMemo(
    () => filterReferenceRecords(currentRecords, searchCriteria, formFields),
    [currentRecords, formFields, searchCriteria],
  );
  const createMutation = useMutation({
    mutationFn: (value: ReferenceFormValue) =>
      createReferenceRecord(
        referenceSlug,
        buildReferencePayload(value, formFields, {
          translationBaseRecord: translationBaseRecord ?? records.data?.find(
            (record) => record.sharedId === activeTranslationId,
          ),
        }),
      ),
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, referenceSlug, activeTranslationId);
      setIsFormOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      record,
      value,
    }: {
      record: ReferenceRecord;
      value: ReferenceFormValue;
    }) =>
      updateReferenceRecord(
        referenceSlug,
        record,
        buildReferencePayload(value, formFields),
      ),
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, referenceSlug, activeTranslationId);
      setIsFormOpen(false);
      setSelectedRecord(null);
    },
  });
  const defaultColumnKeys = useMemo(
    () =>
      allColumns
        .filter((column) => column.defaultVisible)
        .map((column) => column.key),
    [allColumns],
  );
  const columns = useMemo(() => {
    if (isTranslationMode) {
      return [
        ...translationColumns,
        buildRowActionColumn(t, {
          onDeactivate: (record) => setSelectedRecord(record),
          onDelete: (record) => setSelectedRecord(record),
          onEdit: openEditForm,
        }),
      ];
    }

    const selectedColumnKeys = displayedColumnKeys.length
      ? displayedColumnKeys
      : defaultColumnKeys;
    const selectedColumns = allColumns.filter((column) =>
      selectedColumnKeys.includes(column.key),
    );

    const baseColumns = selectedColumns.length
      ? selectedColumns
      : allColumns.slice(0, 1);

    return [
      ...baseColumns,
      buildRowActionColumn(t, {
        onDeactivate: (record) => setSelectedRecord(record),
        onDelete: (record) => setSelectedRecord(record),
        onEdit: openEditForm,
        onTranslate: isLocalizedList
          ? (record) => {
              setSearchCriteria({});
              setIsColumnsOpen(false);
              setIsFormOpen(false);
              setTranslationBaseRecord(record);
              setUrlSearchParams(
                (currentParams) => {
                  const nextParams = new URLSearchParams(currentParams);
                  nextParams.set("selected", record.sharedId);
                  nextParams.delete("page");
                  return nextParams;
                },
                { replace: true },
              );
            }
          : undefined,
      }),
    ];
  }, [
    allColumns,
    defaultColumnKeys,
    displayedColumnKeys,
    isLocalizedList,
    isTranslationMode,
    setUrlSearchParams,
    t,
    translationColumns,
  ]);

  function openCreateForm() {
    createMutation.reset();
    updateMutation.reset();
    setDrawerMode("create");
    setSelectedRecord(null);
    setIsFormOpen(true);
  }

  function openEditForm(record: ReferenceRecord) {
    createMutation.reset();
    updateMutation.reset();
    setDrawerMode("edit");
    setSelectedRecord(record);
    setIsFormOpen(true);
  }

  function openSearchForm() {
    createMutation.reset();
    updateMutation.reset();
    setDrawerMode("search");
    setSelectedRecord(null);
    setIsFormOpen(true);
  }

  useEffect(() => {
    setDisplayedColumnKeys(readDisplayedColumnKeys(referenceSlug, allColumns));
  }, [allColumns, referenceSlug]);

  useEffect(() => {
    setTranslationBaseRecord(null);
  }, [referenceSlug]);

  useEffect(() => {
    if (!selectedTranslationId) {
      setTranslationBaseRecord(null);
      return;
    }

    const matchingRecord = records.data?.find(
      (record) => record.sharedId === selectedTranslationId,
    );

    if (matchingRecord) {
      setTranslationBaseRecord(matchingRecord);
    }
  }, [records.data, selectedTranslationId]);

  if (shouldRedirect || !item) {
    return <Navigate replace to="/setup-lists/countries" />;
  }

  return (
    <>
      <GridManagementPage<ReferenceRecord>
        actions={
          isTranslationMode ? (
            <>
              <IconButton
                label={t("refLists.backToEnglishList")}
                onClick={() => {
                  setTranslationBaseRecord(null);
                  setUrlSearchParams(
                    (currentParams) => {
                      const nextParams = new URLSearchParams(currentParams);
                      nextParams.delete("selected");
                      nextParams.delete("page");
                      return nextParams;
                    },
                    { replace: true },
                  );
                }}
              >
                <ArrowLeft aria-hidden="true" size={16} />
              </IconButton>
              <IconButton
                label={t("refLists.search")}
                onClick={openSearchForm}
              >
                <Search aria-hidden="true" size={16} />
              </IconButton>
              <IconButton
                disabled={translationRecords.isFetching}
                label={t("users.reload")}
                onClick={() => translationRecords.refetch()}
              >
                <RefreshCw
                  aria-hidden="true"
                  className={translationRecords.isFetching ? "animate-spin" : ""}
                  size={16}
                />
              </IconButton>
              <IconButton
                label={t("refLists.create")}
                onClick={openCreateForm}
              >
                <Plus aria-hidden="true" size={16} />
              </IconButton>
            </>
          ) : (
            <>
            <IconButton
              label={t("refLists.columns")}
              onClick={() => setIsColumnsOpen(true)}
            >
              <Columns3 aria-hidden="true" size={16} />
            </IconButton>
            <IconButton
              label={t("refLists.search")}
              onClick={openSearchForm}
            >
              <Search aria-hidden="true" size={16} />
            </IconButton>
            <IconButton
              disabled={records.isFetching}
              label={t("users.reload")}
              onClick={() => records.refetch()}
            >
              <RefreshCw
                aria-hidden="true"
                className={records.isFetching ? "animate-spin" : ""}
                size={16}
              />
            </IconButton>
            <IconButton
              label={t("refLists.create")}
              onClick={openCreateForm}
            >
              <Plus aria-hidden="true" size={16} />
            </IconButton>
            </>
          )
        }
        actionsClassName="md:self-end"
        columns={columns}
        description={
          isTranslationMode
            ? t("refLists.translationDescription")
            : t("refLists.description")
        }
        emptyMessage={
          records.isLoading || translationRecords.isLoading
            ? t("refLists.loading")
            : t("refLists.empty")
        }
        errorMessage={
          records.isError
            ? records.error.message
            : translationRecords.isError
              ? translationRecords.error.message
              : undefined
        }
        eyebrow={
          isTranslationMode
            ? `${t("nav.admin")} > ${t("nav.refData")} > ${t(item.labelKey)}`
            : `${t("nav.admin")} > ${t("nav.refData")}`
        }
        heightClassName="h-[calc(100vh-260px)] min-h-[560px]"
        pageIndex={pageIndex}
        pageSize={pageSize}
        records={visibleRecords}
        sortState={sortState}
        title={translationBaseRecord?.name ?? selectedTranslationId ?? t(item.labelKey)}
        onPageIndexChange={setPageIndex}
        onSortChange={setSortState}
      />

      <Drawer
        isOpen={isColumnsOpen}
        title={t("refLists.displayedColumns")}
        onClose={() => setIsColumnsOpen(false)}
      >
        <div className="grid gap-3">
          {allColumns.map((column) => {
            const isChecked = columns.some(
              (displayedColumn) => displayedColumn.key === column.key,
            );
            return (
              <label
                key={column.key}
                className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700"
              >
                <input
                  checked={isChecked}
                  className="size-4 accent-slate-950"
                  disabled={isChecked && columns.length === 1}
                  type="checkbox"
                  onChange={(event) => {
                    updateDisplayedColumns(
                      referenceSlug,
                      allColumns,
                      column.key,
                      event.target.checked,
                      setDisplayedColumnKeys,
                    );
                  }}
                />
                <span className="whitespace-nowrap">{column.header}</span>
              </label>
            );
          })}
        </div>
      </Drawer>

      <Drawer
        isOpen={isFormOpen}
        title={getDrawerTitle(drawerMode, t)}
        onClose={() => setIsFormOpen(false)}
      >
        <ReferenceRecordForm
          errorMessage={createMutation.error?.message ?? updateMutation.error?.message}
          fields={formFields}
          initialValue={drawerMode === "search" ? searchCriteria : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          mode={drawerMode}
          record={drawerMode === "search" ? null : selectedRecord}
          onCancel={() => setIsFormOpen(false)}
          onReset={
            drawerMode === "search"
              ? () => {
                  setSearchCriteria({});
                  setIsFormOpen(false);
                }
              : undefined
          }
          onSubmit={(value) => {
            if (drawerMode === "search") {
              setSearchCriteria(value);
              setIsFormOpen(false);
              return;
            }

            if (drawerMode === "edit" && selectedRecord) {
              updateMutation.mutate({ record: selectedRecord, value });
              return;
            }

            createMutation.mutate(value);
          }}
        />
      </Drawer>
    </>
  );
}

function buildRowActionColumn(
  t: (key: TranslationKey) => string,
  actions: {
    onDeactivate: (record: ReferenceRecord) => void;
    onDelete: (record: ReferenceRecord) => void;
    onEdit: (record: ReferenceRecord) => void;
    onTranslate?: (record: ReferenceRecord) => void;
  },
): ReferenceColumn {
  return {
    align: "right",
    defaultVisible: true,
    header: "",
    key: "actions",
    render: (record) => (
      <div
        className="flex justify-end gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton
          label={t("refLists.edit")}
          onClick={() => actions.onEdit(record)}
        >
          <Edit2 aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          label={t("refLists.deactivate")}
          onClick={() => actions.onDeactivate(record)}
        >
          <Ban aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          label={t("refLists.delete")}
          onClick={() => actions.onDelete(record)}
        >
          <Trash2 aria-hidden="true" size={16} />
        </IconButton>
        {actions.onTranslate && (
        <IconButton
          label={t("refLists.manageTranslations")}
          onClick={() => actions.onTranslate?.(record)}
        >
          <Globe2 aria-hidden="true" size={16} />
        </IconButton>
        )}
      </div>
    ),
    width: actions.onTranslate ? "180px" : "136px",
  };
}

function buildTranslationColumns(
  t: (key: TranslationKey) => string,
): ReferenceColumn[] {
  return [
    textColumn("locale", t("profile.field.localeCode"), (record) =>
      readRaw(record, "locale"),
    ),
    textColumn("name", t("field.name"), (record) => record.name),
    textColumn(
      "description",
      t("refLists.descriptionColumn"),
      (record) => readRaw(record, "description"),
    ),
    booleanColumn(
      "active",
      t("refLists.active"),
      (record) => record.isActive,
      t("profile.value.yes"),
      t("profile.value.no"),
    ),
  ];
}

function getDrawerTitle(
  mode: ReferenceDrawerMode,
  t: (key: TranslationKey) => string,
) {
  if (mode === "edit") {
    return t("refLists.edit");
  }

  if (mode === "search") {
    return t("refLists.search");
  }

  return t("refLists.create");
}

function getSubmitLabel(
  mode: ReferenceDrawerMode,
  t: (key: TranslationKey) => string,
) {
  if (mode === "edit") {
    return t("profile.save");
  }

  if (mode === "search") {
    return t("users.search");
  }

  return t("refLists.create");
}

function ReferenceRecordForm({
  errorMessage,
  fields,
  initialValue,
  isSubmitting,
  mode,
  record,
  onCancel,
  onReset,
  onSubmit,
}: {
  errorMessage?: string;
  fields: ReferenceFormField[];
  initialValue?: ReferenceFormValue;
  isSubmitting?: boolean;
  mode: ReferenceDrawerMode;
  record: ReferenceRecord | null;
  onCancel: () => void;
  onReset?: () => void;
  onSubmit: (value: ReferenceFormValue) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState<ReferenceFormValue>({});

  useEffect(() => {
    setValue(initialValue ?? buildInitialReferenceFormValue(fields, record));
  }, [fields, initialValue, record]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => {
          if (field.type === "checkbox") {
            return (
              <label
                key={field.name}
                className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700"
              >
                <input
                  checked={Boolean(value[field.name])}
                  className="size-4 accent-slate-950"
                  type="checkbox"
                  onChange={(event) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: event.target.checked,
                    }))
                  }
                />
                <span className="whitespace-nowrap">{field.label}</span>
              </label>
              );
          }

          return (
            <label
              key={field.name}
              className={[
                "grid gap-1.5 text-sm font-semibold text-slate-700",
                field.type === "textarea" ? "md:col-span-2" : "",
              ].join(" ")}
            >
              <span className="whitespace-nowrap">
                {field.label}
                {mode !== "search" && field.required && (
                  <span className="text-red-600"> *</span>
                )}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  required={mode !== "search" && field.required}
                  value={String(value[field.name] ?? "")}
                  onChange={(event) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              ) : field.type === "select" ? (
                <select
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  required={mode !== "search" && field.required}
                  value={String(value[field.name] ?? "")}
                  onChange={(event) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: event.target.value,
                    }))
                  }
                >
                  <option value="">--</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  required={mode !== "search" && field.required}
                  type={field.type === "number" ? "number" : "text"}
                  value={String(value[field.name] ?? "")}
                  onChange={(event) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        {errorMessage && (
          <p className="mr-auto text-sm font-normal text-red-600">
            {errorMessage}
          </p>
        )}
        <Button variant="secondary" onClick={onCancel}>
          {t("profile.cancel")}
        </Button>
        {mode === "search" && (
          <Button type="button" variant="secondary" onClick={onReset}>
            {t("users.clearForm")}
          </Button>
        )}
        <Button disabled={isSubmitting} type="submit">
          {getSubmitLabel(mode, t)}
        </Button>
      </div>
    </form>
  );
}

function buildInitialReferenceFormValue(
  fields: ReferenceFormField[],
  record: ReferenceRecord | null,
) {
  return Object.fromEntries(
    fields.map((field) => {
      const rawValue = record?.raw[field.name];
      const value =
        rawValue === undefined || rawValue === null
          ? field.defaultValue !== undefined
            ? field.defaultValue
            : field.type === "checkbox"
              ? field.name === "is_active"
              : ""
          : rawValue;

      return [field.name, typeof value === "boolean" ? value : String(value)];
    }),
  );
}

function buildReferenceFormFields(
  slug: ReferenceListSlug,
  isTranslationMode: boolean,
  t: (key: TranslationKey) => string,
  regionOptions: { label: string; value: string }[],
): ReferenceFormField[] {
  if (isTranslationMode) {
    return localizedFields(t, { includeCode: false });
  }

  const localized = localizedFields(t, { includeCode: true });
  const fieldsBySlug: Partial<Record<ReferenceListSlug, ReferenceFormField[]>> = {
    "contractor-types": localized,
    countries: [
      field("code", t("refLists.code"), { required: true }),
      field("alpha2", t("refLists.alpha2"), { required: true }),
      field("name", t("field.name"), { required: true }),
      field("native_name", t("refLists.nativeName")),
      field("phone_prefix", t("refLists.phonePrefix")),
      field("mobile_phone_format", t("refLists.mobileFormat")),
      field("landline_phone_format", t("refLists.landlineFormat")),
      field("region_id", t("refLists.region"), {
        options: regionOptions,
        type: "select",
      }),
      field("currency_code", t("refLists.currency"), { required: true }),
      field("default_locale_code", t("refLists.defaultLocale")),
    ],
    "document-types": localized,
    "expense-types": localized,
    "financial-institution-branches": [
      field("financial_institution_id", t("refLists.financialInstitutionId"), {
        required: true,
      }),
      field("branch_name", t("refLists.branchName"), { required: true }),
      field("branch_code", t("refLists.branchCode")),
      field("address", t("refLists.address"), { type: "textarea" }),
      field("phone", t("profile.field.phone")),
      checkboxField("is_active", t("refLists.active")),
    ],
    "financial-institutions": [
      field("country_id", t("refLists.countryId")),
      field("name", t("field.name"), { required: true }),
      field("swift_code", t("refLists.swiftCode")),
      field("website", t("refLists.website")),
      checkboxField("is_active", t("refLists.active")),
    ],
    locales: [
      field("code", t("refLists.code"), { required: true }),
      field("name", t("field.name"), { required: true }),
      field("native_name", t("refLists.nativeName")),
      field("name_order", t("refLists.nameOrder"), { required: true }),
      field("name_format_mask", t("refLists.formatMask"), { required: true }),
      field("sort_order", t("refLists.sortOrder"), { type: "number" }),
      checkboxField("is_default", t("refLists.default")),
      checkboxField("is_active", t("refLists.active")),
    ],
    "property-access-levels": localized,
    "reference-codes": [
      field("code", t("refLists.code"), { required: true }),
      field("name", t("field.name"), { required: true }),
      field("description", t("refLists.descriptionColumn"), { type: "textarea" }),
      checkboxField("is_income", t("refLists.income")),
      checkboxField("is_active", t("refLists.active")),
    ],
    regions: [
      field("code", t("refLists.code"), { required: true }),
      field("name", t("field.name"), { required: true }),
      field("description", t("refLists.descriptionColumn"), { type: "textarea" }),
      field("sort_order", t("refLists.sortOrder"), { type: "number" }),
      checkboxField("is_active", t("refLists.active")),
    ],
    roles: [field("code", t("refLists.code"), { required: true })],
    "status-codes": [
      field("locale", t("profile.field.localeCode"), { required: true }),
      field("group_code", t("refLists.group"), { required: true }),
      field("code", t("refLists.code"), { required: true }),
      field("name", t("field.name"), { required: true }),
      field("description", t("refLists.descriptionColumn"), { type: "textarea" }),
      checkboxField("is_terminal", t("refLists.terminal")),
      checkboxField("is_success", t("refLists.success")),
      checkboxField("is_active", t("refLists.active")),
      field("sort_order", t("refLists.sortOrder"), { type: "number" }),
    ],
    "utility-types": localized,
  };

  return fieldsBySlug[slug] ?? localized;
}

function localizedFields(
  t: (key: TranslationKey) => string,
  { includeCode }: { includeCode: boolean },
): ReferenceFormField[] {
  return [
    ...(includeCode ? [field("code", t("refLists.code"), { required: true })] : []),
    field("locale", t("profile.field.localeCode"), {
      defaultValue: includeCode ? "en" : "",
      required: true,
    }),
    field("name", t("field.name"), { required: true }),
    field("description", t("refLists.descriptionColumn"), { type: "textarea" }),
    checkboxField("is_active", t("refLists.active")),
  ];
}

function field(
  name: string,
  label: string,
  options: Omit<ReferenceFormField, "label" | "name"> = {},
): ReferenceFormField {
  return { name, label, type: "text", ...options };
}

function checkboxField(name: string, label: string): ReferenceFormField {
  return { name, label, type: "checkbox" };
}

function filterReferenceRecords(
  records: ReferenceRecord[],
  searchCriteria: ReferenceFormValue,
  fields: ReferenceFormField[],
) {
  const activeCriteria = Object.entries(searchCriteria).filter(([key, value]) => {
    const field = fields.find((candidate) => candidate.name === key);

    if (!field) {
      return false;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value.trim() !== "";
  });

  if (!activeCriteria.length) {
    return records;
  }

  return records.filter((record) => {
    return activeCriteria.every(([key, value]) => {
      const rawValue = record.raw[key];

      if (typeof value === "boolean") {
        return rawValue === value;
      }

      return String(rawValue ?? "")
        .toLowerCase()
        .includes(value.toLowerCase());
    });
  });
}

function buildReferencePayload(
  value: ReferenceFormValue,
  fields: ReferenceFormField[],
  options: { translationBaseRecord?: ReferenceRecord | null } = {},
) {
  const payload: Record<string, unknown> = {};

  fields.forEach((field) => {
    const fieldValue = value[field.name];

    if (typeof fieldValue === "boolean") {
      payload[field.name] = fieldValue;
      return;
    }

    const stringValue = String(fieldValue ?? "").trim();

    if (!stringValue && !field.required) {
      payload[field.name] = null;
      return;
    }

    payload[field.name] =
      field.type === "number" && stringValue ? Number(stringValue) : stringValue;
  });

  if (options.translationBaseRecord) {
    payload.id = options.translationBaseRecord.sharedId;
    payload.code = options.translationBaseRecord.code;
  }

  return payload;
}

function invalidateReferenceQueries(
  queryClient: QueryClient,
  slug: ReferenceListSlug,
  translationBaseRecordId: string | null,
) {
  queryClient.invalidateQueries({ queryKey: ["setup-lists", slug] });

  if (slug === "regions") {
    queryClient.invalidateQueries({ queryKey: ["setup-lists", "regions", "options"] });
  }

  if (translationBaseRecordId) {
    queryClient.invalidateQueries({
      queryKey: ["setup-list-translations", slug, translationBaseRecordId],
    });
  }
}

function readDisplayedColumnKeys(
  slug: ReferenceListSlug,
  columns: ReferenceColumn[],
) {
  const availableColumnKeys = new Set(columns.map((column) => column.key));
  const defaultColumnKeys = columns
    .filter((column) => column.defaultVisible)
    .map((column) => column.key);

  try {
    const savedValue = window.localStorage.getItem(slug);
    const parsedValue = savedValue
      ? (JSON.parse(savedValue) as { cols_displayed?: unknown })
      : null;
    const savedColumnKeys = Array.isArray(parsedValue?.cols_displayed)
      ? parsedValue.cols_displayed.filter(
          (key): key is string =>
            typeof key === "string" && availableColumnKeys.has(key),
        )
      : [];

    return savedColumnKeys.length ? savedColumnKeys : defaultColumnKeys;
  } catch {
    return defaultColumnKeys;
  }
}

function updateDisplayedColumns(
  slug: ReferenceListSlug,
  columns: ReferenceColumn[],
  columnKey: string,
  shouldDisplay: boolean,
  setDisplayedColumnKeys: (keys: string[]) => void,
) {
  const currentColumnKeys = readDisplayedColumnKeys(slug, columns);
  const nextColumnKeys = shouldDisplay
    ? [...new Set([...currentColumnKeys, columnKey])]
    : currentColumnKeys.filter((key) => key !== columnKey);
  const safeColumnKeys = nextColumnKeys.length
    ? nextColumnKeys
    : currentColumnKeys.slice(0, 1);

  window.localStorage.setItem(
    slug,
    JSON.stringify({ cols_displayed: safeColumnKeys }),
  );
  setDisplayedColumnKeys(safeColumnKeys);
}

function buildReferenceColumns(
  slug: ReferenceListSlug,
  t: (key: TranslationKey) => string,
  regionNameById: Map<string, string>,
) {
  const commonColumns = [
    textColumn("name", t("field.name"), (record) => record.name),
  ];
  const activeColumn = booleanColumn(
    "active",
    t("refLists.active"),
    (record) => record.isActive,
    t("profile.value.yes"),
    t("profile.value.no"),
  );

  const columnsBySlug: Partial<
    Record<ReferenceListSlug, ReferenceColumn[]>
  > = {
    countries: [
      ...commonColumns,
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      textColumn("alpha2", t("refLists.alpha2"), (record) => readRaw(record, "alpha2")),
      textColumn(
        "nativeName",
        t("refLists.nativeName"),
        (record) => readRaw(record, "native_name"),
        false,
      ),
      textColumn("phonePrefix", t("refLists.phonePrefix"), (record) =>
        readRaw(record, "phone_prefix"),
      ),
      textColumn(
        "mobileFormat",
        t("refLists.mobileFormat"),
        (record) => readRaw(record, "mobile_phone_format"),
        false,
      ),
      textColumn(
        "landlineFormat",
        t("refLists.landlineFormat"),
        (record) => readRaw(record, "landline_phone_format"),
        false,
      ),
      textColumn("currency", t("refLists.currency"), (record) =>
        readRaw(record, "currency_code"),
      ),
      textColumn(
        "defaultLocale",
        t("refLists.defaultLocale"),
        (record) => readRaw(record, "default_locale_code"),
        false,
      ),
      textColumn(
        "region",
        t("refLists.region"),
        (record) => {
          const regionId = readRaw(record, "region_id");

          return typeof regionId === "string"
            ? regionNameById.get(regionId) || regionId
            : regionId;
        },
        false,
      ),
    ],
    locales: [
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      ...commonColumns,
      textColumn("nativeName", t("refLists.nativeName"), (record) =>
        readRaw(record, "native_name"),
      ),
      textColumn(
        "formatMask",
        t("refLists.formatMask"),
        (record) => readRaw(record, "name_format_mask"),
        false,
      ),
      numberColumn("sortOrder", t("refLists.sortOrder"), (record) =>
        readRaw(record, "sort_order"),
      ),
      activeColumn,
    ],
    "financial-institutions": [
      ...commonColumns,
      textColumn("swiftCode", t("refLists.swiftCode"), (record) =>
        readRaw(record, "swift_code"),
      ),
      textColumn("website", t("refLists.website"), (record) => readRaw(record, "website")),
      activeColumn,
    ],
    "financial-institution-branches": [
      textColumn("name", t("field.name"), (record) => readRaw(record, "branch_name")),
      textColumn("branchCode", t("refLists.branchCode"), (record) =>
        readRaw(record, "branch_code"),
      ),
      activeColumn,
    ],
    roles: [
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
    ],
    regions: [
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      ...commonColumns,
      textColumn(
        "description",
        t("refLists.descriptionColumn"),
        (record) => readRaw(record, "description"),
        false,
      ),
      numberColumn("sortOrder", t("refLists.sortOrder"), (record) =>
        readRaw(record, "sort_order"),
      ),
      activeColumn,
    ],
    "status-codes": [
      textColumn("group", t("refLists.group"), (record) => readRaw(record, "group_code")),
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      ...commonColumns,
      textColumn("locale", t("profile.field.localeCode"), (record) =>
        readRaw(record, "locale"),
      ),
      numberColumn("sortOrder", t("refLists.sortOrder"), (record) =>
        readRaw(record, "sort_order"),
      ),
      activeColumn,
    ],
  };

  return (
    columnsBySlug[slug] ?? [
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      ...commonColumns,
      textColumn("locale", t("profile.field.localeCode"), (record) =>
        readRaw(record, "locale"),
      ),
      activeColumn,
    ]
  );
}

function textColumn(
  key: string,
  header: string,
  getValue: (record: ReferenceRecord) => unknown,
  defaultVisible = true,
): ReferenceColumn {
  return {
    defaultVisible,
    key,
    header,
    render: (record) => formatCellValue(getValue(record), "Yes", "No"),
    sortable: true,
    sortValue: (record) => formatCellValue(getValue(record), "Yes", "No"),
  };
}

function numberColumn(
  key: string,
  header: string,
  getValue: (record: ReferenceRecord) => unknown,
  defaultVisible = true,
): ReferenceColumn {
  return {
    defaultVisible,
    key,
    header,
    render: (record) => formatCellValue(getValue(record), "Yes", "No"),
    sortable: true,
    sortValue: (record) => Number(getValue(record) ?? 0),
  };
}

function booleanColumn(
  key: string,
  header: string,
  getValue: (record: ReferenceRecord) => unknown,
  yesLabel: string,
  noLabel: string,
  defaultVisible = true,
): ReferenceColumn {
  return {
    defaultVisible,
    key,
    header,
    render: (record) => formatCellValue(getValue(record), yesLabel, noLabel),
    sortable: true,
    sortValue: (record) => Boolean(getValue(record)),
  };
}

function readRaw(record: ReferenceRecord, key: string) {
  return record.raw[key];
}

function formatCellValue(value: unknown, yesLabel: string, noLabel: string) {
  if (typeof value === "boolean") {
    return value ? yesLabel : noLabel;
  }

  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return String(value);
}
