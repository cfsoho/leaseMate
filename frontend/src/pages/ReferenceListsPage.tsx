import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

import { DataGridRowActions } from "../components/data/DataGridRowActions";
import { GridManagementPage } from "../components/data/GridManagementPage";
import type { DataGridColumn } from "../components/data/dataTypes";
import { useDataGridPageSize } from "../components/data/useDataGridPageSize";
import { useUrlDataGridState } from "../components/data/useUrlDataGridState";
import { referenceNavItems } from "../components/layout/navigation";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { FormAlert } from "../components/ui/FormAlert";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { formatPhoneForCountry } from "../components/ui/phoneInputUtils";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { SortPositionSelect, type SortPositionItem } from "../components/ui/SortPositionSelect";
import {
  isReferenceListSlug,
  isLocalizedReferenceListSlug,
  createReferenceRecord,
  deleteReferenceRecord,
  downloadReferenceTranslationTemplate,
  listReferenceRecords,
  listReferenceTranslations,
  uploadReferenceTranslations,
  updateReferenceRecord,
  type ReferenceListSlug,
  type ReferenceRecord,
} from "../features/ref/refApi";
import type { ProfileCountry } from "../features/auth/authTypes";
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
  dividerAfter?: boolean;
  defaultValue?: string | boolean;
  displayValue?: string;
  fullWidth?: boolean;
  helpText?: string;
  labelIcon?: "search";
  name: string;
  label: string;
  options?: ReferenceFormOption[];
  pattern?: RegExp;
  phoneCountry?: ProfileCountry;
  required?: boolean;
  sortItems?: SortPositionItem[];
  textTransform?: "upper-snake";
  transient?: boolean;
  type?:
    | "checkbox"
    | "hidden"
    | "number"
    | "phone-static"
    | "readonly"
    | "search-select"
    | "select"
    | "sort-position"
    | "textarea"
    | "text";
};

type ReferenceFormOption = {
  countryDefaultLocaleCode?: string | null;
  label: string;
  searchText?: string;
  value: string;
};

type ReferenceFormValue = Record<string, string | boolean>;

type ReferenceDrawerMode = "create" | "edit" | "search";
type ReferenceActionMode = "activate" | "deactivate" | "delete" | null;

export function ReferenceListsPage() {
  const { listSlug } = useParams();
  const { locale, t } = useTranslation();
  const queryClient = useQueryClient();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const referenceSlug = listSlug && isReferenceListSlug(listSlug) ? listSlug : "countries";
  const shouldRedirect = referenceSlug !== listSlug;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTranslationUploadOpen, setIsTranslationUploadOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<ReferenceDrawerMode>("create");
  const [actionMode, setActionMode] = useState<ReferenceActionMode>(null);
  const [selectedRecord, setSelectedRecord] = useState<ReferenceRecord | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<ReferenceFormValue>({});
  const [translationBaseRecord, setTranslationBaseRecord] =
    useState<ReferenceRecord | null>(null);
  const isCompactGridViewport = useCompactGridViewport();
  const { pageSize, setPageSize } = useDataGridPageSize();
  const { pageIndex, setPageIndex, setSortState, sortState } =
    useUrlDataGridState();
  const isLocalizedList = isLocalizedReferenceListSlug(referenceSlug);
  const selectedTranslationId = urlSearchParams.get("selected");
  const isBankBranchMode =
    referenceSlug === "financial-institutions" && Boolean(selectedTranslationId);
  const isTranslationMode =
    isLocalizedList && Boolean(translationBaseRecord || selectedTranslationId);
  const activeTranslationId = translationBaseRecord?.sharedId ?? selectedTranslationId;
  const activeDataSlug: ReferenceListSlug = isBankBranchMode
    ? "financial-institution-branches"
    : referenceSlug;
  const activeActionRecordId = selectedRecord?.id ?? null;

  const item = referenceListBySlug.get(referenceSlug);
  const records = useQuery({
    queryKey: ["setup-lists", referenceSlug],
    queryFn: () => listReferenceRecords(referenceSlug),
  });
  const localeRecords = useQuery({
    queryKey: ["setup-lists", "locales", "translation-form-options"],
    queryFn: () => listReferenceRecords("locales"),
    staleTime: 5 * 60 * 1000,
  });
  const translationRecords = useQuery({
    queryKey: [
      "setup-list-translations",
      referenceSlug,
      activeTranslationId,
    ],
    enabled:
      Boolean(activeTranslationId) &&
      isLocalizedList,
    queryFn: () =>
      listReferenceTranslations(
        referenceSlug,
        activeTranslationId!,
      ),
  });
  const branchRecords = useQuery({
    queryKey: [
      "setup-list-branches",
      referenceSlug,
      selectedTranslationId,
    ],
    enabled: isBankBranchMode,
    queryFn: () => listReferenceRecords("financial-institution-branches"),
  });
  const regions = useQuery({
    queryKey: ["setup-lists", "regions", "options"],
    queryFn: () => listReferenceRecords("regions"),
    staleTime: 5 * 60 * 1000,
  });
  const countries = useQuery({
    queryKey: ["setup-lists", "countries", "options"],
    queryFn: () => listReferenceRecords("countries"),
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
  const countryOptions = useMemo(
    () =>
      (countries.data ?? [])
        .filter((country) => country.isActive !== false)
        .map((country) => {
          const code = readRaw(country, "code");
          const alpha2 = readRaw(country, "alpha2");
          const nativeName = readRaw(country, "native_name");

          return {
            countryDefaultLocaleCode: normalizeReferenceLocaleCode(
              resolveCountryDefaultLocaleCode(
                country,
                localeRecords.data ?? [],
              ),
            ),
            label: `${country.name}${code ? ` (${code})` : ""}`,
            searchText: [
              country.name,
              nativeName,
              code,
              alpha2,
            ]
              .filter(Boolean)
              .join(" "),
            value: country.sharedId,
          };
        }),
    [countries.data, localeRecords.data],
  );
  const statusGroupOptions = useMemo(() => {
    if (referenceSlug !== "status-codes") {
      return [];
    }

    const groupCodes = new Set<string>();
    (records.data ?? []).forEach((record) => {
      const groupCode = readRaw(record, "group_code");
      if (typeof groupCode === "string" && groupCode.trim()) {
        groupCodes.add(groupCode);
      }
    });

    return [...groupCodes].sort().map((groupCode) => ({
      label: groupCode,
      searchText: groupCode,
      value: groupCode,
    }));
  }, [records.data, referenceSlug]);
  const translationLocaleOptions = useMemo(
    () =>
      buildTranslationLocaleOptions(
        localeRecords.data ?? [],
        translationRecords.data ?? [],
        drawerMode,
        selectedRecord,
      ),
    [drawerMode, localeRecords.data, selectedRecord, translationRecords.data],
  );
  const translationCountryOptions = useMemo(
    () =>
      buildTranslationCountryOptions(
        countryOptions,
        translationLocaleOptions,
      ),
    [countryOptions, translationLocaleOptions],
  );
  const currentRecords = useMemo(
    () =>
      isBankBranchMode
        ? (branchRecords.data ?? []).filter(
            (record) =>
              readRaw(record, "financial_institution_id") === selectedTranslationId,
          )
        : isTranslationMode
          ? (translationRecords.data ?? [])
          : (records.data ?? []),
    [
      branchRecords.data,
      isBankBranchMode,
      isTranslationMode,
      records.data,
      selectedTranslationId,
      translationRecords.data,
    ],
  );
  const selectedMasterRecord =
    translationBaseRecord ??
    records.data?.find((record) => record.sharedId === selectedTranslationId) ??
    null;
  const masterRecordName = selectedMasterRecord?.name ?? t(item?.labelKey ?? "nav.refData");
  const pageTitle = isTranslationMode
    ? t("refLists.translationsForTitle").replace("{name}", masterRecordName)
    : isBankBranchMode
      ? masterRecordName
      : t(item?.labelKey ?? "nav.refData");
  const usesFixedSortOrder = usesReferenceSortOrder(activeDataSlug);
  const allColumns = useMemo(
    () => {
      const referenceColumns = buildReferenceColumns(activeDataSlug, t, regionNameById);

      return usesFixedSortOrder
        ? referenceColumns.map(disableColumnSorting)
        : referenceColumns;
    },
    [activeDataSlug, regionNameById, t, usesFixedSortOrder],
  );
  const translationColumns = useMemo(
    () => usesFixedSortOrder
      ? buildTranslationColumns(t).map(disableColumnSorting)
      : buildTranslationColumns(t),
    [t, usesFixedSortOrder],
  );
  const formFields = useMemo(
    () => {
      const fields = buildReferenceFormFields(
        activeDataSlug,
        isTranslationMode,
        drawerMode,
        t,
        isTranslationMode ? translationCountryOptions : countryOptions,
        regionOptions,
        statusGroupOptions,
        currentRecords,
        translationLocaleOptions,
      );

      if (isBankBranchMode) {
        const bankCountryId = selectedMasterRecord
          ? String(readRaw(selectedMasterRecord, "country_id") ?? "")
          : "";
        const bankCountry = (countries.data ?? [])
          .map(toProfileCountry)
          .find((country) => country.id === bankCountryId);

        return fields
          .filter((field) => field.name !== "financial_institution_id")
          .map((field) =>
            field.name === "phone"
              ? {
                  ...field,
                  phoneCountry: bankCountry,
                  type: "phone-static" as const,
                }
              : field,
          );
      }

      return fields;
    },
    [
      activeDataSlug,
      countryOptions,
      drawerMode,
      isBankBranchMode,
      isTranslationMode,
      regionOptions,
      statusGroupOptions,
      currentRecords,
      countries.data,
      t,
      translationCountryOptions,
      translationLocaleOptions,
      selectedMasterRecord,
    ],
  );
  const visibleRecords = useMemo(
    () => filterReferenceRecords(currentRecords, searchCriteria, formFields),
    [currentRecords, formFields, searchCriteria],
  );
  const createMutation = useMutation({
    mutationFn: (value: ReferenceFormValue) => {
      assertUniqueTranslationLocale({
        currentRecord: null,
        records: translationRecords.data ?? [],
        shouldCheck: isTranslationMode,
        value,
      });

      return createReferenceRecord(
        activeDataSlug,
        buildReferencePayload(value, formFields, {
          branchFinancialInstitutionId: isBankBranchMode
            ? selectedTranslationId
            : null,
          translationBaseRecord: translationBaseRecord ?? records.data?.find(
            (record) => record.sharedId === activeTranslationId,
          ),
        }),
      );
    },
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, activeDataSlug, activeTranslationId);
      if (isBankBranchMode) {
        invalidateReferenceQueries(queryClient, referenceSlug, selectedTranslationId);
      }
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
    }) => {
      assertUniqueTranslationLocale({
        currentRecord: record,
        records: translationRecords.data ?? [],
        shouldCheck: isTranslationMode,
        value,
      });

      return updateReferenceRecord(
        activeDataSlug,
        record,
        buildReferencePayload(value, formFields, {
          branchFinancialInstitutionId: isBankBranchMode
            ? selectedTranslationId
            : null,
        }),
      );
    },
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, activeDataSlug, activeTranslationId);
      if (isBankBranchMode) {
        invalidateReferenceQueries(queryClient, referenceSlug, selectedTranslationId);
      }
      setIsFormOpen(false);
      setSelectedRecord(null);
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: (record: ReferenceRecord) =>
      updateReferenceRecord(activeDataSlug, record, { is_active: false }),
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, activeDataSlug, activeTranslationId);
      if (isBankBranchMode) {
        invalidateReferenceQueries(queryClient, referenceSlug, selectedTranslationId);
      }
      setActionMode(null);
      setSelectedRecord(null);
    },
  });
  const activateMutation = useMutation({
    mutationFn: (record: ReferenceRecord) =>
      updateReferenceRecord(activeDataSlug, record, { is_active: true }),
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, activeDataSlug, activeTranslationId);
      if (isBankBranchMode) {
        invalidateReferenceQueries(queryClient, referenceSlug, selectedTranslationId);
      }
      setActionMode(null);
      setSelectedRecord(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (record: ReferenceRecord) =>
      deleteReferenceRecord(activeDataSlug, record),
    onSuccess: () => {
      invalidateReferenceQueries(queryClient, activeDataSlug, activeTranslationId);
      if (isBankBranchMode) {
        invalidateReferenceQueries(queryClient, referenceSlug, selectedTranslationId);
      }
      setActionMode(null);
      setSelectedRecord(null);
    },
  });
  function openCreateForm() {
    createMutation.reset();
    updateMutation.reset();
    setDrawerMode("create");
    setSelectedRecord(null);
    setIsFormOpen(true);
  }

  const openEditForm = useCallback((record: ReferenceRecord) => {
    createMutation.reset();
    updateMutation.reset();
    deactivateMutation.reset();
    activateMutation.reset();
    deleteMutation.reset();
    setActionMode(null);
    setDrawerMode("edit");
    setSelectedRecord(record);
    setIsFormOpen(true);
  }, [activateMutation, createMutation, deactivateMutation, deleteMutation, updateMutation]);

  const openDeactivateModal = useCallback((record: ReferenceRecord) => {
    activateMutation.reset();
    deactivateMutation.reset();
    deleteMutation.reset();
    setActionMode("deactivate");
    setSelectedRecord(record);
  }, [activateMutation, deactivateMutation, deleteMutation]);

  const openDeleteModal = useCallback((record: ReferenceRecord) => {
    activateMutation.reset();
    deactivateMutation.reset();
    deleteMutation.reset();
    setActionMode("delete");
    setSelectedRecord(record);
  }, [activateMutation, deactivateMutation, deleteMutation]);

  const openActivateModal = useCallback((record: ReferenceRecord) => {
    activateMutation.reset();
    deactivateMutation.reset();
    deleteMutation.reset();
    setActionMode("activate");
    setSelectedRecord(record);
  }, [activateMutation, deactivateMutation, deleteMutation]);

  function openSearchForm() {
    createMutation.reset();
    updateMutation.reset();
    setDrawerMode("search");
    setSelectedRecord(null);
    setIsFormOpen(true);
  }

  function closeFormDrawer() {
    setIsFormOpen(false);
    setSelectedRecord(null);
  }

  function closeActionModal() {
    setActionMode(null);
    setSelectedRecord(null);
  }

  const selectableColumns = isTranslationMode ? translationColumns : allColumns;
  const defaultColumnKeys = useMemo(
    () => getDefaultDisplayedColumnKeys(selectableColumns, isCompactGridViewport),
    [isCompactGridViewport, selectableColumns],
  );
  const columnSelectionStorageKey = isTranslationMode
    ? `${activeDataSlug}:${activeTranslationId ?? "translations"}`
    : activeDataSlug;
  const columns = useMemo(() => {
    if (isTranslationMode) {
      return [
        ...translationColumns,
        buildRowActionColumn(t, {
          onActivate: openActivateModal,
          onDeactivate: openDeactivateModal,
          onDelete: openDeleteModal,
          onEdit: openEditForm,
        }),
      ];
    }

    if (isBankBranchMode) {
      return [
        ...allColumns,
        buildRowActionColumn(t, {
          onActivate: openActivateModal,
          onDeactivate: openDeactivateModal,
          onDelete: openDeleteModal,
          onEdit: openEditForm,
        }),
      ];
    }

    return [
      ...allColumns,
      buildRowActionColumn(t, {
        onActivate: openActivateModal,
        onDeactivate: openDeactivateModal,
        onDelete: openDeleteModal,
        onEdit: openEditForm,
        onTranslate: isLocalizedList
          ? (record) => {
              setSearchCriteria({});
              setIsFormOpen(false);
              setTranslationBaseRecord(record);
              setUrlSearchParams(
                (currentParams) => {
                  return selectChildGridRecord(currentParams, record.sharedId);
                },
                { replace: true },
              );
            }
          : undefined,
        onChild:
          referenceSlug === "financial-institutions"
            ? (record) => {
                setSearchCriteria({});
                setIsFormOpen(false);
                setSelectedRecord(null);
                setUrlSearchParams(
                  (currentParams) => {
                    return selectChildGridRecord(currentParams, record.sharedId);
                  },
                  { replace: true },
                );
              }
            : undefined,
      }),
    ];
  }, [
    allColumns,
    isBankBranchMode,
    isLocalizedList,
    isTranslationMode,
    openActivateModal,
    openDeactivateModal,
    openDeleteModal,
    openEditForm,
    referenceSlug,
    setUrlSearchParams,
    t,
    translationColumns,
  ]);

  async function uploadTranslationCsv(rows: ReferenceFormValue[]) {
    if (!selectedMasterRecord) {
      throw new Error(t("refLists.uploadMissingMaster"));
    }

    const result = await uploadReferenceTranslations(
      activeDataSlug,
      selectedMasterRecord.sharedId,
      rows,
    );

    invalidateReferenceQueries(queryClient, activeDataSlug, activeTranslationId);
    return {
      insertedLocales: result.inserted_locales,
      skippedLocales: result.skipped_locales,
    };
  }

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
        leadingActions={
          isTranslationMode || isBankBranchMode ? (
            <IconButton
              label={
                isBankBranchMode
                  ? t("refLists.backToBanks")
                  : t("refLists.backToEnglishList")
              }
              onClick={() => {
                setTranslationBaseRecord(null);
                setUrlSearchParams(
                  (currentParams) => {
                    return clearChildGridSelection(currentParams);
                  },
                  { replace: true },
                );
              }}
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </IconButton>
          ) : undefined
        }
        actions={
          <>
            <IconButton
              label={t("refLists.search")}
              onClick={openSearchForm}
            >
              <Search aria-hidden="true" size={16} />
            </IconButton>
            {isTranslationMode && (
              <IconButton
                label={t("refLists.upload")}
                onClick={() => setIsTranslationUploadOpen(true)}
              >
                <Upload aria-hidden="true" size={16} />
              </IconButton>
            )}
            <IconButton
              disabled={
                isBankBranchMode
                  ? branchRecords.isFetching
                  : isTranslationMode
                  ? translationRecords.isFetching
                  : records.isFetching
              }
              label={t("users.reload")}
              onClick={() => {
                if (isBankBranchMode) {
                  branchRecords.refetch();
                  return;
                }

                if (isTranslationMode) {
                  translationRecords.refetch();
                  return;
                }

                records.refetch();
              }}
            >
              <RefreshCw
                aria-hidden="true"
                className={
                  (
                    isBankBranchMode
                      ? branchRecords.isFetching
                      : isTranslationMode
                      ? translationRecords.isFetching
                      : records.isFetching
                  )
                    ? "animate-spin"
                    : ""
                }
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
        }
        actionsClassName="md:self-end"
        columnSelectionStorageKey={columnSelectionStorageKey}
        columns={columns}
        defaultVisibleColumnKeys={defaultColumnKeys}
        description={
          isBankBranchMode
            ? t("refLists.branchDescription")
            : isTranslationMode
            ? buildReferenceTranslationDescription(
                getReferenceEntityLabel(referenceSlug, locale),
                masterRecordName,
                t,
              )
            : getReferenceDescription(referenceSlug, locale)
        }
        activeRecordId={activeActionRecordId}
        emptyMessage={
          records.isLoading || translationRecords.isLoading || branchRecords.isLoading
            ? t("refLists.loading")
            : t("refLists.empty")
        }
        errorMessage={
          records.isError
            ? records.error.message
            : branchRecords.isError
              ? branchRecords.error.message
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
        isRecordInactive={(record) => record.isActive === false}
        pageIndex={pageIndex}
        paginationLabels={{
          firstPage: t("grid.firstPage"),
          lastPage: t("grid.lastPage"),
          nextPage: t("grid.nextPage"),
          paginationMode: t("grid.pagination"),
          previousPage: t("grid.previousPage"),
          rows: t("grid.rows"),
          showAllMode: t("grid.showAllRows"),
          switchToPagination: t("grid.switchToPagination"),
          switchToShowAll: t("grid.switchToShowAll"),
        }}
        pageSize={pageSize}
        records={visibleRecords}
        sortState={usesFixedSortOrder ? undefined : sortState}
        title={pageTitle}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSortChange={usesFixedSortOrder ? undefined : setSortState}
      />

      <Drawer
        isOpen={isFormOpen}
        title={getDrawerTitle(drawerMode, t)}
        onClose={closeFormDrawer}
      >
        <ReferenceRecordForm
          errorMessage={createMutation.error?.message ?? updateMutation.error?.message}
          fields={formFields}
          initialValue={drawerMode === "search" ? searchCriteria : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          mode={drawerMode}
          record={drawerMode === "search" ? null : selectedRecord}
          onCancel={closeFormDrawer}
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
      {isTranslationMode && isTranslationUploadOpen && (
        <TranslationUploadDrawer
          fields={formFields}
          masterName={masterRecordName}
          t={t}
          onClose={() => setIsTranslationUploadOpen(false)}
          onDownloadTemplate={() => {
            if (!selectedMasterRecord) {
              throw new Error(t("refLists.uploadMissingMaster"));
            }

            return downloadReferenceTranslationTemplate(
              activeDataSlug,
              selectedMasterRecord.sharedId,
              `${sanitizeCsvFileName(masterRecordName)}-translations-template.csv`,
            );
          }}
          onUpload={uploadTranslationCsv}
        />
      )}
      {selectedRecord && actionMode && (
        <ReferenceActionConfirmModal
          disabled={
            activateMutation.isPending ||
            deactivateMutation.isPending ||
            deleteMutation.isPending
          }
          error={
            actionMode === "activate"
              ? activateMutation.error?.message
              : actionMode === "deactivate"
              ? deactivateMutation.error?.message
              : deleteMutation.error?.message
          }
          mode={actionMode}
          recordName={selectedRecord.name}
          referenceSlug={activeDataSlug}
          locale={locale}
          t={t}
          onCancel={closeActionModal}
          onConfirm={() => {
            if (actionMode === "activate") {
              activateMutation.mutate(selectedRecord);
              return;
            }

            if (actionMode === "deactivate") {
              deactivateMutation.mutate(selectedRecord);
              return;
            }

            deleteMutation.mutate(selectedRecord);
          }}
        />
      )}
    </>
  );
}

function buildRowActionColumn(
  t: (key: TranslationKey) => string,
  actions: {
    onActivate: (record: ReferenceRecord) => void;
    onDeactivate: (record: ReferenceRecord) => void;
    onDelete: (record: ReferenceRecord) => void;
    onEdit: (record: ReferenceRecord) => void;
    onChild?: (record: ReferenceRecord) => void;
    onTranslate?: (record: ReferenceRecord) => void;
  },
): ReferenceColumn {
  return {
    align: "right",
    defaultVisible: true,
    header: "",
    key: "actions",
    render: (record) => (
      <DataGridRowActions
        isActive={record.isActive}
        labels={{
          activate: t("refLists.activate"),
          child: t("refLists.manageBranches"),
          deactivate: t("refLists.deactivate"),
          delete: t("refLists.delete"),
          edit: t("refLists.edit"),
          translate: t("refLists.manageTranslations"),
        }}
        record={record}
        onActivate={actions.onActivate}
        onDeactivate={actions.onDeactivate}
        onDelete={actions.onDelete}
        onEdit={actions.onEdit}
        onChild={actions.onChild}
        onTranslate={actions.onTranslate}
      />
    ),
    width: actions.onTranslate || actions.onChild ? "180px" : "136px",
  };
}

function TranslationUploadDrawer({
  fields,
  masterName,
  t,
  onClose,
  onDownloadTemplate,
  onUpload,
}: {
  fields: ReferenceFormField[];
  masterName: string;
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onDownloadTemplate: () => Promise<void>;
  onUpload: (
    rows: ReferenceFormValue[],
  ) => Promise<{ insertedLocales: string[]; skippedLocales: string[] }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    insertedLocales: string[];
    skippedLocales: string[];
  } | null>(null);
  const csvFields = getTranslationCsvFields(fields);
  const expectedHeaders = csvFields.map((field) => field.name);

  async function downloadTemplate() {
    setError(null);
    try {
      await onDownloadTemplate();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : t("refLists.uploadFailed"),
      );
    }
  }

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    setError(null);
    setResult(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(t("refLists.uploadCsvOnly"));
      return;
    }

    try {
      setIsUploading(true);
      const csvText = await file.text();
      const rows = parseCsv(csvText);
      if (rows.length < 2) {
        throw new Error(t("refLists.uploadNoRows"));
      }

      const [headers, ...bodyRows] = rows;
      if (!sameHeaders(headers, expectedHeaders)) {
        throw new Error(t("refLists.uploadHeaderMismatch"));
      }

      const values = bodyRows
        .filter((row) => row.some((cell) => cell.trim()))
        .map((row) =>
          csvFields.reduce<ReferenceFormValue>((currentValue, field, index) => {
            const rawValue = row[index] ?? "";
            return {
              ...currentValue,
              [field.name]:
                field.type === "checkbox"
                  ? parseCsvCheckboxValue(rawValue)
                  : rawValue.trim(),
            };
          }, {}),
        );

      setResult(await onUpload(values));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : t("refLists.uploadFailed"),
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Drawer
      isOpen
      title={t("refLists.batchUploadTranslationsTitle").replace(
        "{name}",
        masterName,
      )}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <p className="text-sm font-normal leading-relaxed text-slate-600">
          {t("refLists.uploadInstructions")}
        </p>
        <p className="text-sm font-normal leading-relaxed text-slate-500">
          {t("refLists.uploadEnglishSkipped")}
        </p>
        <label
          className="grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-normal text-slate-600 hover:border-slate-950 hover:bg-white"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files[0] ?? null);
          }}
        >
          <input
            accept=".csv,text/csv"
            className="sr-only"
            disabled={isUploading}
            type="file"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
          <span>
            {isUploading
              ? t("refLists.uploading")
              : t("refLists.uploadDropCsv")}
          </span>
        </label>

        {result && result.insertedLocales.length > 0 && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-normal text-green-800">
            {t("refLists.uploadInserted").replace("{name}", masterName)}
          </p>
        )}
        {result && result.skippedLocales.length > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-normal text-amber-900">
            {t("refLists.uploadSkipped").replace(
              "{locales}",
              result.skippedLocales.join(", "),
            )}
          </p>
        )}
        {result &&
          result.insertedLocales.length === 0 &&
          result.skippedLocales.length === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-normal text-amber-900">
              {t("refLists.uploadNoInsert")}
            </p>
          )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-normal text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download aria-hidden="true" size={16} />
            {t("refLists.downloadCsv")}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t("profile.cancel")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
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

function ReferenceActionConfirmModal({
  disabled,
  error,
  locale,
  mode,
  recordName,
  referenceSlug,
  t,
  onCancel,
  onConfirm,
}: {
  disabled: boolean;
  error?: string;
  locale: string;
  mode: Exclude<ReferenceActionMode, null>;
  recordName: string;
  referenceSlug: ReferenceListSlug;
  t: (key: TranslationKey) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isActivate = mode === "activate";
  const isDelete = mode === "delete";
  const entityLabel = getReferenceEntityLabel(referenceSlug, locale);

  return (
    <Modal
      title={buildReferenceActionTitle(mode, entityLabel, locale)}
    >
      <div className="mt-4 grid gap-4">
        <p className="text-sm font-normal leading-relaxed text-slate-600">
          {buildReferenceActionBody(mode, entityLabel, locale)}
        </p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700">
          {recordName}
        </p>
        {isDelete && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-normal leading-relaxed text-red-700">
            {t("refLists.deleteCannotRollback")}
          </p>
        )}
        {error && <p className="text-sm font-normal text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button
            disabled={disabled}
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            {t("profile.cancel")}
          </Button>
          <Button
            className={isDelete ? "bg-red-700 hover:bg-red-800" : undefined}
            disabled={disabled}
            type="button"
            onClick={onConfirm}
          >
            {isActivate
              ? t("refLists.activate")
              : isDelete
              ? t("refLists.delete")
              : t("refLists.deactivate")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function getReferenceEntityLabel(slug: ReferenceListSlug, locale: string) {
  const language = getUiLanguage(locale);
  const labels: Record<ReferenceListSlug, Record<string, string>> = {
    "contractor-types": {
      en: "contractor type",
      ja: "業者タイプ",
      "zh-HK": "承辦商類型",
      "zh-TW": "承辦商類型",
      th: "ประเภทผู้รับเหมา",
    },
    countries: {
      en: "country",
      ja: "国",
      "zh-HK": "國家",
      "zh-TW": "國家",
      th: "ประเทศ",
    },
    "document-types": {
      en: "document type",
      ja: "書類タイプ",
      "zh-HK": "文件類型",
      "zh-TW": "文件類型",
      th: "ประเภทเอกสาร",
    },
    "expense-types": {
      en: "expense type",
      ja: "支出タイプ",
      "zh-HK": "支出類型",
      "zh-TW": "支出類型",
      th: "ประเภทรายจ่าย",
    },
    "financial-institution-branches": {
      en: "bank branch",
      ja: "銀行支店",
      "zh-HK": "銀行分行",
      "zh-TW": "銀行分行",
      th: "สาขาธนาคาร",
    },
    "financial-institutions": {
      en: "bank",
      ja: "銀行",
      "zh-HK": "銀行",
      "zh-TW": "銀行",
      th: "ธนาคาร",
    },
    locales: {
      en: "language",
      ja: "言語",
      "zh-HK": "語言",
      "zh-TW": "語言",
      th: "ภาษา",
    },
    "property-access-levels": {
      en: "property access level",
      ja: "物件アクセス権限",
      "zh-HK": "物業存取層級",
      "zh-TW": "物件存取層級",
      th: "ระดับการเข้าถึงทรัพย์สิน",
    },
    "reference-codes": {
      en: "reference code",
      ja: "参照コード",
      "zh-HK": "參照代碼",
      "zh-TW": "參照代碼",
      th: "รหัสอ้างอิง",
    },
    regions: {
      en: "region",
      ja: "地域",
      "zh-HK": "地區",
      "zh-TW": "地區",
      th: "ภูมิภาค",
    },
    roles: {
      en: "role",
      ja: "ロール",
      "zh-HK": "角色",
      "zh-TW": "角色",
      th: "บทบาท",
    },
    "status-codes": {
      en: "status code",
      ja: "ステータスコード",
      "zh-HK": "狀態代碼",
      "zh-TW": "狀態代碼",
      th: "รหัสสถานะ",
    },
    "utility-types": {
      en: "utility type",
      ja: "公共料金タイプ",
      "zh-HK": "公用事業類型",
      "zh-TW": "公用事業類型",
      th: "ประเภทสาธารณูปโภค",
    },
  };

  return labels[slug][language] ?? labels[slug].en;
}

function buildReferenceTranslationDescription(
  entityLabel: string,
  recordName: string,
  t: (key: TranslationKey) => string,
) {
  return t("refLists.translationDescription")
    .replace("{entity}", entityLabel)
    .replace("{name}", recordName);
}

function getReferenceDescription(slug: ReferenceListSlug, locale: string) {
  const language = getUiLanguage(locale);
  const descriptions: Record<ReferenceListSlug, Record<string, string>> = {
    "contractor-types": {
      en: "Define the contractor categories used when recording vendors, maintenance work, and property service history.",
      ja: "業者、保守作業、物件サービス履歴で使う業者カテゴリを管理します。",
      "zh-HK": "管理供應商、維修工作同物業服務記錄所使用嘅承辦商分類。",
      "zh-TW": "管理供應商、維修工作與物業服務紀錄所使用的承包商分類。",
      th: "กำหนดประเภทผู้รับเหมาที่ใช้กับผู้ให้บริการ งานซ่อมบำรุง และประวัติบริการของทรัพย์สิน",
    },
    countries: {
      en: "Maintain country data used for addresses, phone formats, currencies, regions, and locale defaults.",
      ja: "住所、電話番号形式、通貨、地域、既定言語で使う国データを管理します。",
      "zh-HK": "管理地址、電話格式、貨幣、地區同預設語言會用到嘅國家資料。",
      "zh-TW": "管理地址、電話格式、貨幣、地區與預設語言會用到的國家資料。",
      th: "ดูแลข้อมูลประเทศที่ใช้กับที่อยู่ รูปแบบโทรศัพท์ สกุลเงิน ภูมิภาค และภาษาเริ่มต้น",
    },
    "document-types": {
      en: "Define the document categories used to organize leases, tax papers, receipts, IDs, and property files.",
      ja: "賃貸契約、税務書類、領収書、本人確認書類、物件資料を整理する書類カテゴリを管理します。",
      "zh-HK": "管理用嚟整理租約、稅務文件、收據、身份文件同物業檔案嘅文件分類。",
      "zh-TW": "管理用來整理租約、稅務文件、收據、身分文件與物業檔案的文件分類。",
      th: "กำหนดหมวดเอกสารสำหรับสัญญาเช่า เอกสารภาษี ใบเสร็จ เอกสารยืนยันตัวตน และไฟล์ทรัพย์สิน",
    },
    "expense-types": {
      en: "Define expense categories for repairs, fees, tax, insurance, utilities, and reporting.",
      ja: "修繕、手数料、税金、保険、公共料金、レポートで使う支出カテゴリを管理します。",
      "zh-HK": "管理維修、費用、稅項、保險、公用服務同報表會用到嘅開支分類。",
      "zh-TW": "管理維修、費用、稅項、保險、公用服務與報表會用到的支出分類。",
      th: "กำหนดหมวดรายจ่ายสำหรับค่าซ่อม ค่าธรรมเนียม ภาษี ประกัน สาธารณูปโภค และรายงาน",
    },
    "financial-institution-branches": {
      en: "Keep branch details for each bank, so rent deposits, expenses, tax payments, and account records can point to the correct branch.",
      ja: "家賃入金、経費、税金支払い、口座情報で正しい支店を選べるように、各銀行の支店情報を管理します。",
      "zh-HK": "管理各銀行嘅分行資料，方便租金入帳、開支、稅務付款同帳戶記錄選到正確分行。",
      "zh-TW": "管理各銀行的分行資料，方便租金入帳、支出、稅務付款與帳戶紀錄選到正確分行。",
      th: "ดูแลข้อมูลสาขาของแต่ละธนาคาร เพื่อให้เงินค่าเช่า ค่าใช้จ่าย ภาษี และบัญชีอ้างอิงสาขาที่ถูกต้องได้",
    },
    "financial-institutions": {
      en: "Maintain the banks used for rent deposits, expense payments, tax payments, and property-related bank accounts.",
      ja: "家賃入金、経費支払い、税金支払い、物件関連の銀行口座で使う銀行を管理します。",
      "zh-HK": "管理租金入帳、開支付款、稅務付款同物業相關銀行帳戶會用到嘅銀行。",
      "zh-TW": "管理租金入帳、支出付款、稅務付款與物件相關銀行帳戶會用到的銀行。",
      th: "ดูแลรายชื่อธนาคารที่ใช้กับเงินค่าเช่า ค่าใช้จ่าย ภาษี และบัญชีธนาคารที่เกี่ยวข้องกับทรัพย์สิน",
    },
    locales: {
      en: "Manage LeaseMate languages, native names, and whether names display as given name first or family name first.",
      ja: "LeaseMate に表示する言語、各言語のネイティブ名、名と姓の表示順を管理します。",
      "zh-HK": "管理 LeaseMate 內可選嘅語言、各語言嘅原生名稱，以及名同姓嘅顯示次序。",
      "zh-TW": "管理 LeaseMate 內可選的語言、各語言的原生名稱，以及名字與姓氏的顯示順序。",
      th: "จัดการภาษาที่แสดงใน LeaseMate ชื่อภาษาแบบท้องถิ่น และลำดับการแสดงชื่อกับนามสกุล",
    },
    "property-access-levels": {
      en: "Define how people can access a property, such as owner, manager, viewer, or agent.",
      ja: "所有者、管理者、閲覧者、エージェントなど、物件へのアクセス権限を管理します。",
      "zh-HK": "管理人員對物業嘅存取層級，例如業主、管理者、檢視者或代理。",
      "zh-TW": "管理人員對物件的存取層級，例如屋主、管理者、檢視者或代理。",
      th: "กำหนดระดับการเข้าถึงทรัพย์สิน เช่น เจ้าของ ผู้จัดการ ผู้ดู หรือเอเจนต์",
    },
    "reference-codes": {
      en: "Maintain stable backend codes for login roles, user states, document states, transaction sources, and ledger logic so these values are selectable data instead of scattered enums.",
      ja: "ログイン権限、ユーザー状態、書類状態、取引元、台帳処理で使う安定したコードを管理し、値をコード内の enum ではなく選択可能なデータとして扱います。",
      "zh-HK": "管理登入角色、用戶狀態、文件狀態、交易來源同帳目邏輯所使用嘅穩定後端代碼，避免呢啲值散落喺程式 enum 入面。",
      "zh-TW": "管理登入角色、使用者狀態、文件狀態、交易來源與帳務邏輯所使用的穩定後端代碼，避免這些值散落在程式 enum 裡。",
      th: "ดูแลรหัสระบบที่คงที่สำหรับบทบาทผู้ใช้ สถานะผู้ใช้ สถานะเอกสาร แหล่งที่มาธุรกรรม และตรรกะบัญชี แทนการกระจายค่าไว้ใน enum ของโค้ด",
    },
    regions: {
      en: "Group countries into broad regions for filtering, reporting, and country setup.",
      ja: "国設定、絞り込み、レポートで使う広域地域を管理します。",
      "zh-HK": "管理國家設定、篩選同報表會用到嘅大區域。",
      "zh-TW": "管理國家設定、篩選與報表會用到的大區域。",
      th: "จัดกลุ่มประเทศเป็นภูมิภาคสำหรับการกรอง รายงาน และการตั้งค่าประเทศ",
    },
    roles: {
      en: "Define system roles used by authentication and admin permissions.",
      ja: "認証と管理者権限で使うシステムロールを管理します。",
      "zh-HK": "管理認證同管理員權限會用到嘅系統角色。",
      "zh-TW": "管理認證與管理員權限會用到的系統角色。",
      th: "กำหนดบทบาทของระบบที่ใช้กับการเข้าสู่ระบบและสิทธิ์ผู้ดูแล",
    },
    "status-codes": {
      en: "Define workflow statuses for properties, leases, expenses, deposits, utilities, schedules, and reminders.",
      ja: "物件、賃貸契約、支出、預り金、公共料金、予定、リマインダーのワークフローステータスを管理します。",
      "zh-HK": "管理物業、租約、開支、按金、公用帳單、排程同提醒嘅流程狀態。",
      "zh-TW": "管理物業、租約、支出、押金、公用帳單、排程與提醒的流程狀態。",
      th: "กำหนดสถานะเวิร์กโฟลว์สำหรับทรัพย์สิน สัญญาเช่า รายจ่าย เงินมัดจำ สาธารณูปโภค ตารางงาน และการเตือน",
    },
    "utility-types": {
      en: "Define utility categories such as electricity, water, gas, internet, and other recurring property services.",
      ja: "電気、水道、ガス、インターネットなど、物件の継続サービスカテゴリを管理します。",
      "zh-HK": "管理電力、水費、煤氣、網絡同其他物業定期服務分類。",
      "zh-TW": "管理電力、水費、瓦斯、網路與其他物業定期服務分類。",
      th: "กำหนดประเภทสาธารณูปโภค เช่น ไฟฟ้า น้ำ แก๊ส อินเทอร์เน็ต และบริการประจำของทรัพย์สิน",
    },
  };

  return descriptions[slug][language] ?? descriptions[slug].en;
}

function buildReferenceActionTitle(
  mode: Exclude<ReferenceActionMode, null>,
  entityLabel: string,
  locale: string,
) {
  const language = getUiLanguage(locale);

  if (language === "ja") {
    if (mode === "activate") {
      return `${entityLabel}を有効化`;
    }

    return mode === "delete"
      ? `${entityLabel}を削除`
      : `${entityLabel}を無効化`;
  }

  if (language === "zh-TW") {
    if (mode === "activate") {
      return `啟用${entityLabel}`;
    }

    return mode === "delete"
      ? `刪除${entityLabel}`
      : `停用${entityLabel}`;
  }

  if (language === "zh-HK") {
    if (mode === "activate") {
      return `啟用${entityLabel}`;
    }

    return mode === "delete"
      ? `刪除${entityLabel}`
      : `停用${entityLabel}`;
  }

  if (language === "th") {
    if (mode === "activate") {
      return `เปิดใช้งาน${entityLabel}`;
    }

    return mode === "delete"
      ? `ลบ${entityLabel}`
      : `ปิดใช้งาน${entityLabel}`;
  }

  return mode === "activate"
    ? `Activate ${entityLabel}`
    : mode === "delete"
    ? `Delete ${entityLabel}`
    : `Deactivate ${entityLabel}`;
}

function buildReferenceActionBody(
  mode: Exclude<ReferenceActionMode, null>,
  entityLabel: string,
  locale: string,
) {
  const language = getUiLanguage(locale);

  if (language === "ja") {
    if (mode === "activate") {
      return `この${entityLabel}を有効化しますか？有効な値として再び選択できるようになります。`;
    }

    return mode === "delete"
      ? `この${entityLabel}を削除しますか？`
      : `この${entityLabel}を無効化しますか？データベースには残りますが、有効な値としては扱われなくなります。`;
  }

  if (language === "zh-TW") {
    if (mode === "activate") {
      return `要啟用這個${entityLabel}嗎？它會再次成為可選用的資料。`;
    }

    return mode === "delete"
      ? `要刪除這個${entityLabel}嗎？`
      : `要停用這個${entityLabel}嗎？資料會保留在資料庫，但不再視為啟用。`;
  }

  if (language === "zh-HK") {
    if (mode === "activate") {
      return `要啟用呢個${entityLabel}嗎？佢會再次成為可選用嘅資料。`;
    }

    return mode === "delete"
      ? `要刪除呢個${entityLabel}嗎？`
      : `要停用呢個${entityLabel}嗎？資料會保留喺資料庫，但唔會再當成啟用。`;
  }

  if (language === "th") {
    if (mode === "activate") {
      return `ต้องการเปิดใช้งาน${entityLabel}นี้หรือไม่? รายการนี้จะกลับมาเป็นตัวเลือกที่ใช้งานได้`;
    }

    return mode === "delete"
      ? `ต้องการลบ${entityLabel}นี้หรือไม่?`
      : `ต้องการปิดใช้งาน${entityLabel}นี้หรือไม่? ข้อมูลจะยังอยู่ในฐานข้อมูล แต่จะไม่ถือว่าใช้งานอยู่`;
  }

  return mode === "activate"
    ? `Activate this ${entityLabel}? It will be available for selection again.`
    : mode === "delete"
    ? `Delete this ${entityLabel}?`
    : `Deactivate this ${entityLabel}? It will stay in the database but will no longer be treated as active.`;
}

function getUiLanguage(locale: string) {
  if (locale.startsWith("ja")) {
    return "ja";
  }

  if (locale.startsWith("th")) {
    return "th";
  }

  if (locale === "zh-HK" || locale === "zh-Hant-HK") {
    return "zh-HK";
  }

  if (locale.startsWith("zh")) {
    return "zh-TW";
  }

  return "en";
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

function getTranslationCsvFields(fields: ReferenceFormField[]) {
  return fields.filter((field) =>
    ["locale", "name", "description", "is_active"].includes(field.name),
  );
}

function parseCsvCheckboxValue(rawValue: string) {
  const normalizedValue = rawValue.trim().toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  return !["false", "0", "no", "n"].includes(normalizedValue);
}

function parseCsv(csvText: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let isQuoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (isQuoted && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (character === "," && !isQuoted) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !isQuoted) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  if (currentValue || currentRow.length) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

function sameHeaders(actualHeaders: string[], expectedHeaders: string[]) {
  return (
    actualHeaders.length === expectedHeaders.length &&
    actualHeaders.every(
      (header, index) => header.trim() === expectedHeaders[index],
    )
  );
}

function sanitizeCsvFileName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "setup-list"
  );
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
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    setValue(initialValue ?? buildInitialReferenceFormValue(fields, record));
    setFormErrors([]);
  }, [fields, initialValue, record]);

  const getOptionsForField = (field: ReferenceFormField) => {
    if (field.name !== "locale") {
      return field.options ?? [];
    }

    const countryFilterField = fields.find(
      (candidate) => candidate.name === "__locale_country_filter",
    );
    if (!countryFilterField) {
      return field.options ?? [];
    }

    const selectedCountryId = String(value[countryFilterField.name] ?? "");
    if (!selectedCountryId) {
      return field.options ?? [];
    }

    const countryOption = countryFilterField.options?.find(
      (option) => option.value === selectedCountryId,
    );
    const defaultLocaleCode = normalizeReferenceLocaleCode(
      countryOption?.countryDefaultLocaleCode,
    );

    if (!defaultLocaleCode) {
      return [];
    }

    return (field.options ?? []).filter(
      (option) =>
        normalizeReferenceLocaleCode(option.value) === defaultLocaleCode,
    );
  };

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const validationErrors = validateReferenceForm(value, fields, mode, t);
        if (validationErrors.length > 0) {
          setFormErrors(validationErrors);
          return;
        }

        setFormErrors([]);
        onSubmit(value);
      }}
    >
      {(formErrors.length > 0 || errorMessage) && (
        <FormAlert
          messages={[
            ...formErrors,
            ...(errorMessage ? [errorMessage] : []),
          ]}
        />
      )}
      <div className="grid items-start gap-3 md:grid-cols-2">
        {fields.map((field) => {
          if (field.type === "hidden") {
            return null;
          }

          if (field.type === "checkbox") {
            return (
              <Fragment key={field.name}>
                <label
                  className={[
                    "flex min-h-10 items-center gap-3 self-start rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700",
                    "md:col-span-2",
                  ].join(" ")}
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
                  <span className="grid gap-0.5">
                    <span className="whitespace-nowrap">{field.label}</span>
                    {field.helpText && (
                      <span className="text-xs font-normal leading-5 text-slate-500">
                        {field.helpText}
                      </span>
                    )}
                  </span>
                </label>
                {field.dividerAfter && (
                  <div className="md:col-span-2 border-t border-slate-200" />
                )}
              </Fragment>
              );
          }

          return (
            <Fragment key={field.name}>
              <label
                className={[
                  "grid self-start gap-1.5 text-sm font-semibold text-slate-700",
                  field.fullWidth || field.type === "textarea" ? "md:col-span-2" : "",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {field.labelIcon === "search" && (
                    <Search aria-hidden="true" className="text-slate-500" size={15} />
                  )}
                  <span>
                    {field.label}
                    {mode !== "search" && field.required && (
                      <span className="text-red-600"> *</span>
                    )}
                  </span>
                </span>
              {field.type === "textarea" ? (
                <textarea
                  className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  value={String(value[field.name] ?? "")}
                  onChange={(event) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              ) : field.type === "search-select" ? (
                <SearchableSelect
                  options={getOptionsForField(field)}
                  value={String(value[field.name] ?? "")}
                  onChange={(nextValue) =>
                    setValue((currentValue) => {
                      setFormErrors([]);
                      if (field.name === "__locale_country_filter") {
                        const countryOption = field.options?.find(
                          (option) => option.value === nextValue,
                        );
                        const defaultLocaleCode = normalizeReferenceLocaleCode(
                          countryOption?.countryDefaultLocaleCode,
                        );
                        const localeField = fields.find(
                          (candidate) => candidate.name === "locale",
                        );
                        const currentLocale = String(currentValue.locale ?? "");
                        const isClearingCountryFilter = !nextValue;
                        const currentLocaleMatchesCountry =
                          Boolean(defaultLocaleCode) &&
                          normalizeReferenceLocaleCode(currentLocale) ===
                            defaultLocaleCode;
                        const canUseDefaultLocale = Boolean(
                          defaultLocaleCode &&
                            localeField?.options?.some(
                              (option) =>
                                normalizeReferenceLocaleCode(option.value) ===
                                defaultLocaleCode,
                            ),
                        );

                        return {
                          ...currentValue,
                          [field.name]: nextValue,
                          locale: isClearingCountryFilter
                            ? currentValue.locale
                            : currentLocaleMatchesCountry
                              ? currentValue.locale
                              : canUseDefaultLocale
                                ? defaultLocaleCode
                                : "",
                        };
                      }

                      return {
                        ...currentValue,
                        [field.name]: nextValue,
                      };
                    })
                  }
                />
              ) : field.type === "sort-position" ? (
                <SortPositionSelect
                  currentItemId={record?.id}
                  currentValue={String(value[field.name] ?? "")}
                  groupValue={String(value.group_code ?? "")}
                  items={field.sortItems ?? []}
                  labels={{
                    before: (name) =>
                      t("refLists.sortBefore").replace("{name}", name),
                    end: t("refLists.sortEndOfGroup"),
                  }}
                  onChange={(nextValue) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: nextValue,
                    }))
                  }
                />
              ) : field.type === "phone-static" ? (
                <StaticCountryPhoneInput
                  country={field.phoneCountry}
                  inputClassName="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  phone={String(value[field.name] ?? "")}
                  onChange={(nextPhone) =>
                    setValue((currentValue) => ({
                      ...currentValue,
                      [field.name]: nextPhone,
                    }))
                  }
                />
              ) : field.type === "select" ? (
                <select
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  value={String(value[field.name] ?? "")}
                  onChange={(event) =>
                    setValue((currentValue) => {
                      setFormErrors([]);
                      return {
                        ...currentValue,
                        [field.name]: event.target.value,
                      };
                    })
                  }
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "readonly" ? (
                <input
                  className="min-h-10 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-normal text-slate-700 outline-none"
                  readOnly
                  value={field.displayValue ?? String(value[field.name] ?? "")}
                />
              ) : (
                <input
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  type={field.type === "number" ? "number" : "text"}
                  value={String(value[field.name] ?? "")}
                  onChange={(event) =>
                    setValue((currentValue) => {
                      const nextValue =
                        field.textTransform === "upper-snake"
                          ? toUpperSnakeInput(event.target.value)
                          : event.target.value;
                      setFormErrors([]);
                      return {
                        ...currentValue,
                        [field.name]: nextValue,
                      };
                    })
                  }
                />
              )}
              {field.helpText && (
                <span className="text-xs font-normal leading-5 text-slate-500">
                  {field.helpText}
                </span>
              )}
              </label>
              {field.dividerAfter && (
                <div className="md:col-span-2 border-t border-slate-200" />
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
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

function StaticCountryPhoneInput({
  country,
  inputClassName,
  phone,
  onChange,
}: {
  country?: ProfileCountry;
  inputClassName: string;
  phone: string;
  onChange: (phone: string) => void;
}) {
  const phonePrefix = country?.phone_prefix ?? "";
  const countryLabel = country
    ? `${phonePrefix ? `${phonePrefix} ` : ""}${country.native_name || country.name}`
    : "--";

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(150px,0.45fr)_minmax(0,1fr)]">
      <input
        className="min-h-10 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-normal text-slate-700 outline-none"
        readOnly
        value={countryLabel}
      />
      <input
        className={inputClassName}
        maxLength={20}
        placeholder={
          country?.landline_phone_format || country?.mobile_phone_format || ""
        }
        type="tel"
        value={phone}
        onChange={(event) =>
          onChange(formatPhoneForCountry(event.target.value, country, "landline"))
        }
      />
    </div>
  );
}

function buildInitialReferenceFormValue(
  fields: ReferenceFormField[],
  record: ReferenceRecord | null,
) {
  const recordLocale = normalizeReferenceLocaleCode(record?.locale ?? "");

  return Object.fromEntries(
    fields.map((field) => {
      if (field.name === "__locale_country_filter" && recordLocale) {
        return [field.name, findCountryOptionValueForLocale(field, recordLocale)];
      }

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

function findCountryOptionValueForLocale(
  field: ReferenceFormField,
  localeCode: string,
) {
  return (
    field.options?.find(
      (option) =>
        normalizeReferenceLocaleCode(option.countryDefaultLocaleCode) === localeCode,
    )?.value ?? ""
  );
}

function toProfileCountry(record: ReferenceRecord): ProfileCountry {
  return {
    id: record.sharedId,
    alpha2: String(readRaw(record, "alpha2") ?? ""),
    code: String(readRaw(record, "code") ?? ""),
    default_locale_code:
      typeof readRaw(record, "default_locale_code") === "string"
        ? String(readRaw(record, "default_locale_code"))
        : null,
    landline_phone_format:
      typeof readRaw(record, "landline_phone_format") === "string"
        ? String(readRaw(record, "landline_phone_format"))
        : null,
    mobile_phone_format:
      typeof readRaw(record, "mobile_phone_format") === "string"
        ? String(readRaw(record, "mobile_phone_format"))
        : null,
    name: record.name,
    native_name:
      typeof readRaw(record, "native_name") === "string"
        ? String(readRaw(record, "native_name"))
        : null,
    phone_prefix:
      typeof readRaw(record, "phone_prefix") === "string"
        ? String(readRaw(record, "phone_prefix"))
        : null,
  };
}

function validateReferenceForm(
  value: ReferenceFormValue,
  fields: ReferenceFormField[],
  mode: ReferenceDrawerMode,
  t: (key: TranslationKey) => string,
) {
  const errors: string[] = [];

  for (const field of fields) {
    if (field.type === "hidden" || field.type === "checkbox") {
      continue;
    }

    const fieldValue = String(value[field.name] ?? "").trim();
    if (mode !== "search" && field.required && !fieldValue) {
      errors.push(`${field.label}: ${t("form.requiredMessage")}`);
      continue;
    }

    if (fieldValue && field.pattern && !field.pattern.test(fieldValue)) {
      errors.push(`${field.label}: ${t("refLists.upperSnakeValidation")}`);
    }
  }

  return errors;
}

function toUpperSnakeInput(value: string) {
  return value
    .trimStart()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toUpperCase();
}

function buildTranslationLocaleOptions(
  localeRecords: ReferenceRecord[],
  translationRecords: ReferenceRecord[],
  drawerMode: ReferenceDrawerMode,
  selectedRecord: ReferenceRecord | null,
) {
  const existingLocaleCodes = new Set(
    translationRecords
      .map((record) => normalizeReferenceLocaleCode(record.locale ?? ""))
      .filter(Boolean),
  );
  const selectedLocaleCode = normalizeReferenceLocaleCode(
    selectedRecord?.locale ?? "",
  );

  if (drawerMode === "search") {
    return [...existingLocaleCodes].sort().map((localeCode) =>
      buildLocaleOption(localeCode, localeRecords),
    );
  }

  return getAvailableTranslationLocaleCodes(localeRecords)
    .filter((localeCode) => {
      if (drawerMode === "edit" && localeCode === selectedLocaleCode) {
        return true;
      }

      return !existingLocaleCodes.has(localeCode);
    })
    .map((localeCode) => buildLocaleOption(localeCode, localeRecords));
}

function buildTranslationCountryOptions(
  countryOptions: ReferenceFormOption[],
  localeOptions: ReferenceFormOption[],
) {
  const allowedLocaleCodes = new Set(
    localeOptions.map((option) => normalizeReferenceLocaleCode(option.value)),
  );

  return countryOptions.filter((country) => {
    const countryLocaleCode = normalizeReferenceLocaleCode(
      country.countryDefaultLocaleCode,
    );

    return countryLocaleCode && allowedLocaleCodes.has(countryLocaleCode);
  });
}

function assertUniqueTranslationLocale({
  currentRecord,
  records,
  shouldCheck,
  value,
}: {
  currentRecord: ReferenceRecord | null;
  records: ReferenceRecord[];
  shouldCheck: boolean;
  value: ReferenceFormValue;
}) {
  if (!shouldCheck) {
    return;
  }

  const nextLocaleCode = normalizeReferenceLocaleCode(value.locale);
  if (!nextLocaleCode || nextLocaleCode === "en") {
    return;
  }

  const duplicateRecord = records.find((record) => {
    if (currentRecord && record.id === currentRecord.id) {
      return false;
    }

    return normalizeReferenceLocaleCode(record.locale ?? "") === nextLocaleCode;
  });

  if (duplicateRecord) {
    throw new Error(`Translation already exists for locale ${nextLocaleCode}.`);
  }
}

function getAvailableTranslationLocaleCodes(localeRecords: ReferenceRecord[]) {
  const localeCodes = localeRecords
    .map((record) => normalizeReferenceLocaleCode(readRaw(record, "code")))
    .filter((localeCode) => localeCode && localeCode !== "en");

  return [...new Set(localeCodes)];
}

function resolveCountryDefaultLocaleCode(
  country: ReferenceRecord,
  localeRecords: ReferenceRecord[],
) {
  const rawDefaultLocaleCode = normalizeReferenceLocaleCode(
    readRaw(country, "default_locale_code"),
  );
  const alpha2 = String(readRaw(country, "alpha2") ?? "").toUpperCase();
  const availableLocaleCodes = new Set(
    localeRecords
      .map((record) => normalizeReferenceLocaleCode(readRaw(record, "code")))
      .filter(Boolean),
  );

  const candidates =
    rawDefaultLocaleCode === "zh"
      ? [
          alpha2 === "CN" ? "zh-Hans-CN" : null,
          alpha2 === "SG" ? "zh-Hans-SG" : null,
          alpha2 === "TW" ? "zh-TW" : null,
          alpha2 === "HK" ? "zh-HK" : null,
          alpha2 === "MO" ? "zh-Hant-MO" : null,
          "zh-Hans",
          "zh",
        ]
      : [rawDefaultLocaleCode];

  return (
    candidates
      .filter(Boolean)
      .map((candidate) => normalizeReferenceLocaleCode(candidate))
      .find((candidate) => availableLocaleCodes.has(candidate)) ??
    rawDefaultLocaleCode
  );
}

function buildLocaleOption(
  localeCode: string,
  localeRecords: ReferenceRecord[],
) {
  const localeRecord = localeRecords.find(
    (record) => normalizeReferenceLocaleCode(readRaw(record, "code")) === localeCode,
  );
  const nativeName = localeRecord ? readRaw(localeRecord, "native_name") : null;
  const labelName = localeRecord?.name ?? localeCode;

  return {
    label: `${labelName} (${localeCode})`,
    searchText: [localeCode, labelName, nativeName].filter(Boolean).join(" "),
    value: localeCode,
  };
}

function normalizeReferenceLocaleCode(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  if (value === "zh-Hant-HK") {
    return "zh-HK";
  }

  if (value === "zh-Hant-TW") {
    return "zh-TW";
  }

  return value;
}

function buildReferenceFormFields(
  slug: ReferenceListSlug,
  isTranslationMode: boolean,
  drawerMode: ReferenceDrawerMode,
  t: (key: TranslationKey) => string,
  countryOptions: { label: string; searchText?: string; value: string }[],
  regionOptions: { label: string; searchText?: string; value: string }[],
  statusGroupOptions: { label: string; searchText?: string; value: string }[],
  currentRecords: ReferenceRecord[],
  translationLocaleOptions: { label: string; searchText?: string; value: string }[],
): ReferenceFormField[] {
  if (isTranslationMode) {
    return localizedFields(t, {
      countryOptions,
      drawerMode,
      includeCode: false,
      localeOptions: translationLocaleOptions,
    });
  }

  const localized = localizedFields(t, { includeCode: true });
  const propertyAccessFields = [
    field("code", t("refLists.code"), { required: true }),
    field("locale", t("profile.field.localeCode"), {
      defaultValue: "en",
      displayValue: "English",
      required: true,
      type: "readonly",
    }),
    field("name", t("field.name"), { required: true }),
    field("sort_order", t("refLists.sortOrder"), {
      sortItems: buildPropertyAccessSortPositionItems(currentRecords),
      type: "sort-position",
    }),
    field("description", t("refLists.descriptionColumn"), { type: "textarea" }),
    checkboxField("allow_multiple", t("refLists.allowMultiple"), {
      helpText: t("refLists.allowMultipleHelp"),
    }),
    checkboxField("record_readonly", t("refLists.recordReadonly"), {
      helpText: t("refLists.recordReadonlyHelp"),
    }),
    checkboxField("record_writable", t("refLists.recordWritable"), {
      helpText: t("refLists.recordWritableHelp"),
    }),
    checkboxField("record_deletable", t("refLists.recordDeletable"), {
      helpText: t("refLists.recordDeletableHelp"),
    }),
    checkboxField("is_active", t("refLists.active")),
  ];
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
      field("country_id", t("profile.field.country"), {
        options: countryOptions,
        required: true,
        type: "search-select",
      }),
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
    "property-access-levels": propertyAccessFields,
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
      buildStatusGroupField(t, statusGroupOptions),
      field("code", t("refLists.code"), { required: true }),
      field("name", t("field.name"), { required: true }),
      field("sort_order", t("refLists.sortOrder"), {
        sortItems: buildStatusSortPositionItems(currentRecords),
        type: "sort-position",
      }),
      field("description", t("refLists.descriptionColumn"), {
        helpText: t("refLists.statusDescriptionHelp"),
        type: "textarea",
      }),
      checkboxField("is_terminal", t("refLists.terminal"), {
        helpText: t("refLists.terminalHelp"),
      }),
      checkboxField("is_success", t("refLists.success"), {
        helpText: t("refLists.successHelp"),
      }),
      checkboxField("is_active", t("refLists.active")),
    ],
    "utility-types": localized,
  };

  return fieldsBySlug[slug] ?? localized;
}

function buildStatusGroupField(
  t: (key: TranslationKey) => string,
  statusGroupOptions: { label: string; searchText?: string; value: string }[],
) {
  if (statusGroupOptions.length) {
    return field("group_code", t("refLists.group"), {
      options: statusGroupOptions,
      required: true,
      type: "search-select",
    });
  }

  return field("group_code", t("refLists.group"), {
    pattern: /^[A-Z][A-Z0-9_]*$/,
    required: true,
    textTransform: "upper-snake",
  });
}

function localizedFields(
  t: (key: TranslationKey) => string,
  {
    countryOptions = [],
    drawerMode = "create",
    includeCode,
    localeOptions = [],
  }: {
    countryOptions?: ReferenceFormOption[];
    drawerMode?: ReferenceDrawerMode;
    includeCode: boolean;
    localeOptions?: ReferenceFormOption[];
  },
): ReferenceFormField[] {
  return [
    ...(includeCode ? [field("code", t("refLists.code"), { required: true })] : []),
    ...(includeCode
      ? [
          field("locale", t("profile.field.localeCode"), {
            defaultValue: "en",
            displayValue: "English",
            required: true,
            type: "readonly",
          }),
        ]
      : []),
    ...(!includeCode
      ? [
          field("__locale_country_filter", t("profile.field.country"), {
            dividerAfter: true,
            fullWidth: true,
            helpText:
              drawerMode === "search"
                ? undefined
                : t("refLists.localeCountryFilterHelp"),
            labelIcon: drawerMode === "search" ? undefined : "search",
            options: countryOptions.filter((country) =>
              Boolean(country.countryDefaultLocaleCode),
            ),
            transient: true,
            type: "search-select",
          }),
        ]
      : []),
    ...(!includeCode
      ? [
          field("locale", t("profile.field.localeCode"), {
            defaultValue: "",
            fullWidth: true,
            options: localeOptions,
            required: true,
            type: "search-select",
          }),
        ]
      : []),
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

function checkboxField(
  name: string,
  label: string,
  options: Omit<ReferenceFormField, "label" | "name" | "type"> = {},
): ReferenceFormField {
  return { name, label, type: "checkbox", ...options };
}

function buildStatusSortPositionItems(records: ReferenceRecord[]): SortPositionItem[] {
  return records.map((record) => ({
    groupValue: String(readRaw(record, "group_code") ?? ""),
    id: record.id,
    name: record.name,
    sortOrder: Number(readRaw(record, "sort_order") ?? 0),
  }));
}

function buildPropertyAccessSortPositionItems(records: ReferenceRecord[]): SortPositionItem[] {
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    sortOrder: Number(readRaw(record, "sort_order") ?? 0),
  }));
}

function filterReferenceRecords(
  records: ReferenceRecord[],
  searchCriteria: ReferenceFormValue,
  fields: ReferenceFormField[],
) {
  const activeCriteria = Object.entries(searchCriteria).filter(([key, value]) => {
    const field = fields.find((candidate) => candidate.name === key);

    if (!field || field.transient) {
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
  options: {
    branchFinancialInstitutionId?: string | null;
    translationBaseRecord?: ReferenceRecord | null;
  } = {},
) {
  const payload: Record<string, unknown> = {};

  fields.forEach((field) => {
    if (field.transient) {
      return;
    }

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
    copySharedTranslationPayloadFields(payload, options.translationBaseRecord, [
      "group_code",
      "is_terminal",
      "is_success",
      "sort_order",
    ]);
  }

  if (options.branchFinancialInstitutionId) {
    payload.financial_institution_id = options.branchFinancialInstitutionId;
  }

  return payload;
}

function copySharedTranslationPayloadFields(
  payload: Record<string, unknown>,
  baseRecord: ReferenceRecord,
  fieldNames: string[],
) {
  fieldNames.forEach((fieldName) => {
    const value = readRaw(baseRecord, fieldName);
    if (value !== undefined && value !== null) {
      payload[fieldName] = value;
    }
  });
}

function invalidateReferenceQueries(
  queryClient: QueryClient,
  slug: ReferenceListSlug,
  translationBaseRecordId: string | null,
) {
  queryClient.invalidateQueries({ queryKey: ["setup-lists", slug] });

  if (slug === "financial-institution-branches") {
    queryClient.invalidateQueries({ queryKey: ["setup-list-branches"] });
  }

  if (slug === "regions") {
    queryClient.invalidateQueries({ queryKey: ["setup-lists", "regions", "options"] });
  }

  if (translationBaseRecordId) {
    queryClient.invalidateQueries({
      queryKey: ["setup-list-translations", slug, translationBaseRecordId],
    });
  }
}

function useCompactGridViewport() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsCompact(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isCompact;
}

function getDefaultDisplayedColumnKeys(
  columns: ReferenceColumn[],
  isCompactGridViewport: boolean,
) {
  const defaultColumnKeys = columns
    .filter((column) => column.defaultVisible)
    .map((column) => column.key);

  if (!isCompactGridViewport) {
    return defaultColumnKeys;
  }

  const nameColumnKey =
    columns.find((column) => column.key === "name")?.key ??
    columns.find((column) => column.key === "branchName")?.key ??
    defaultColumnKeys[0] ??
    columns[0]?.key;

  return nameColumnKey ? [nameColumnKey] : [];
}

function usesReferenceSortOrder(slug: ReferenceListSlug) {
  return (
    slug === "locales" ||
    slug === "property-access-levels" ||
    slug === "regions" ||
    slug === "status-codes"
  );
}

function disableColumnSorting(column: ReferenceColumn): ReferenceColumn {
  return {
    ...column,
    sortable: false,
  };
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
      textColumn(
        "address",
        t("refLists.address"),
        (record) => readRaw(record, "address"),
        false,
      ),
      textColumn(
        "phone",
        t("profile.field.phone"),
        (record) => readRaw(record, "phone"),
        false,
      ),
      activeColumn,
    ],
    "property-access-levels": [
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      ...commonColumns,
      booleanColumn(
        "allowMultiple",
        t("refLists.allowMultiple"),
        (record) => readRaw(record, "allow_multiple"),
        t("profile.value.yes"),
        t("profile.value.no"),
      ),
      booleanColumn(
        "recordReadonly",
        t("refLists.recordReadonly"),
        (record) => readRaw(record, "record_readonly"),
        t("profile.value.yes"),
        t("profile.value.no"),
        false,
      ),
      booleanColumn(
        "recordWritable",
        t("refLists.recordWritable"),
        (record) => readRaw(record, "record_writable"),
        t("profile.value.yes"),
        t("profile.value.no"),
        false,
      ),
      booleanColumn(
        "recordDeletable",
        t("refLists.recordDeletable"),
        (record) => readRaw(record, "record_deletable"),
        t("profile.value.yes"),
        t("profile.value.no"),
        false,
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
      activeColumn,
    ],
    "status-codes": [
      textColumn("group", t("refLists.group"), (record) => readRaw(record, "group_code")),
      textColumn("code", t("refLists.code"), (record) => readRaw(record, "code")),
      ...commonColumns,
      textColumn("locale", t("profile.field.localeCode"), (record) =>
        readRaw(record, "locale"),
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

function selectChildGridRecord(
  currentParams: URLSearchParams,
  selectedId: string,
) {
  const nextParams = new URLSearchParams(currentParams);
  const currentPage = nextParams.get("page");

  if (currentPage) {
    nextParams.set("returnPage", currentPage);
  } else {
    nextParams.delete("returnPage");
  }

  nextParams.set("selected", selectedId);
  nextParams.delete("page");
  return nextParams;
}

function clearChildGridSelection(currentParams: URLSearchParams) {
  const nextParams = new URLSearchParams(currentParams);
  const returnPage = nextParams.get("returnPage");

  nextParams.delete("selected");
  nextParams.delete("returnPage");

  if (returnPage && returnPage !== "1") {
    nextParams.set("page", returnPage);
  } else {
    nextParams.delete("page");
  }

  return nextParams;
}
