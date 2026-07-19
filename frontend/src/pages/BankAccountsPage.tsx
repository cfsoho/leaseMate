import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  Edit2,
  Plus,
  RefreshCw,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { GridManagementPage } from "../components/data/GridManagementPage";
import type { DataGridColumn } from "../components/data/dataTypes";
import { useDataGridPageSize } from "../components/data/useDataGridPageSize";
import { useUrlDataGridState } from "../components/data/useUrlDataGridState";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "../components/ui/SearchableSelect";
import { getCurrentUserLegalNames } from "../features/auth/authApi";
import {
  createFinancialAccount,
  deleteFinancialAccount,
  listFinancialAccounts,
  updateFinancialAccount,
  type FinancialAccount,
  type FinancialAccountPayload,
} from "../features/financialAccounts/financialAccountsApi";
import {
  createFinancialTransaction,
  listFinancialTransactionSourceTypes,
  listFinancialTransactions,
  type FinancialTransaction,
  type FinancialTransactionPayload,
} from "../features/financialTransactions/financialTransactionsApi";
import { listReferenceRecords } from "../features/ref/refApi";
import type { ReferenceRecord } from "../features/ref/refApi";
import type { TranslationKey } from "../lib/i18n/translations";
import { useTranslation } from "../lib/i18n/useTranslation";

type BankAccountFormValue = {
  legal_name_id: string;
  branch_country_id: string;
  financial_institution_id: string;
  financial_institution_branch_id: string;
  account_number: string;
  currency_code: string;
  is_active: boolean;
  notes: string;
};

type BankAccountFormErrors = Partial<Record<keyof BankAccountFormValue, string>>;
type DrawerMode = "create" | "edit" | "search";

type TransactionFormValue = {
  transaction_date: string;
  source_type: string;
  deposit_amount: string;
  withdrawal_amount: string;
  balance_after: string;
  currency_code: string;
  counterparty: string;
  reference_no: string;
  notes: string;
};

type TransactionFormErrors = Partial<
  Record<keyof TransactionFormValue | "amount", string>
>;

const defaultForm: BankAccountFormValue = {
  legal_name_id: "",
  branch_country_id: "",
  financial_institution_id: "",
  financial_institution_branch_id: "",
  account_number: "",
  currency_code: "",
  is_active: true,
  notes: "",
};

const defaultSearchForm: BankAccountFormValue = {
  ...defaultForm,
  currency_code: "",
  is_active: true,
};

const defaultTransactionForm: TransactionFormValue = {
  transaction_date: "",
  source_type: "",
  deposit_amount: "",
  withdrawal_amount: "",
  balance_after: "",
  currency_code: "",
  counterparty: "",
  reference_no: "",
  notes: "",
};

export function BankAccountsPage() {
  const { locale, t } = useTranslation();
  const queryClient = useQueryClient();
  const { pageIndex, setPageIndex, setSortState, sortState } =
    useUrlDataGridState();
  const { pageSize, setPageSize } = useDataGridPageSize();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [searchForm, setSearchForm] = useState(defaultSearchForm);
  const [searchCriteria, setSearchCriteria] = useState(defaultSearchForm);
  const [formErrors, setFormErrors] = useState<BankAccountFormErrors>({});
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(
    null,
  );
  const [deactivationAccount, setDeactivationAccount] =
    useState<FinancialAccount | null>(null);
  const [deletionAccount, setDeletionAccount] =
    useState<FinancialAccount | null>(null);
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState(defaultTransactionForm);
  const [transactionFormErrors, setTransactionFormErrors] =
    useState<TransactionFormErrors>({});
  const drawerValue = drawerMode === "search" ? searchForm : form;

  const accounts = useQuery({
    queryKey: ["financial-accounts"],
    queryFn: listFinancialAccounts,
  });
  const selectedTransactionAccountId = searchParams.get("selected");
  const isTransactionMode = Boolean(selectedTransactionAccountId);
  const transactions = useQuery({
    enabled: isTransactionMode && Boolean(selectedTransactionAccountId),
    queryKey: ["financial-transactions", selectedTransactionAccountId],
    queryFn: () =>
      listFinancialTransactions(selectedTransactionAccountId ?? undefined),
  });
  const legalNames = useQuery({
    queryKey: ["current-user", "legal-names"],
    queryFn: getCurrentUserLegalNames,
  });
  const banks = useQuery({
    queryKey: ["ref", "financial-institutions", "options"],
    queryFn: () => listReferenceRecords("financial-institutions"),
  });
  const branches = useQuery({
    queryKey: ["ref", "financial-institution-branches", "options"],
    queryFn: () => listReferenceRecords("financial-institution-branches"),
  });
  const countries = useQuery({
    queryKey: ["ref", "countries", "options"],
    queryFn: () => listReferenceRecords("countries"),
  });
  const transactionSourceTypes = useQuery({
    queryKey: ["ref", "financial-transaction-source-types", "options"],
    queryFn: listFinancialTransactionSourceTypes,
  });

  const legalNameById = useMemo(
    () =>
      new Map(
        (legalNames.data ?? []).map((legalName) => [
          legalName.id,
          legalName.full_name,
        ]),
      ),
    [legalNames.data],
  );
  const bankById = useMemo(
    () => new Map((banks.data ?? []).map((bank) => [bank.id, bank.name])),
    [banks.data],
  );
  const bankRecordById = useMemo(
    () => new Map((banks.data ?? []).map((bank) => [bank.id, bank])),
    [banks.data],
  );
  const branchById = useMemo(
    () => new Map((branches.data ?? []).map((branch) => [branch.id, branch])),
    [branches.data],
  );
  const countryById = useMemo(
    () => new Map((countries.data ?? []).map((country) => [country.id, country])),
    [countries.data],
  );
  const legalNameOptions = useMemo(
    () => [
      ...(legalNames.data ?? []).map((legalName) => ({
        label: formatLegalNameOption(legalName, countryById),
        searchText: `${legalName.full_name} ${getCountryName(
          countryById.get(legalName.country_id),
        )}`,
        value: legalName.id,
      })),
    ],
    [countryById, legalNames.data],
  );
  const filteredBranchOptions = useMemo(
    () =>
      buildBranchOptions(
        branches.data ?? [],
        bankRecordById,
        drawerValue.branch_country_id,
        drawerValue.financial_institution_id,
      ),
    [
      bankRecordById,
      branches.data,
      drawerValue.branch_country_id,
      drawerValue.financial_institution_id,
    ],
  );
  const filteredBankOptions = useMemo(
    () =>
      buildBankOptions(
        banks.data ?? [],
        branches.data ?? [],
        drawerValue.branch_country_id,
        drawerValue.financial_institution_id,
      ),
    [
      banks.data,
      branches.data,
      drawerValue.branch_country_id,
      drawerValue.financial_institution_id,
    ],
  );
  const branchCountryOptions = useMemo(
    () =>
      buildBranchCountryOptions(
        branches.data ?? [],
        bankRecordById,
        countryById,
        drawerValue.branch_country_id,
      ),
    [bankRecordById, branches.data, countryById, drawerValue.branch_country_id],
  );
  const currencyOptions = useMemo(
    () => buildCurrencyOptions(countries.data ?? [], form.currency_code),
    [countries.data, form.currency_code],
  );
  const searchCurrencyOptions = useMemo(
    () => buildCurrencyOptions(countries.data ?? [], searchForm.currency_code),
    [countries.data, searchForm.currency_code],
  );
  const transactionSourceOptions = useMemo(
    () =>
      (transactionSourceTypes.data ?? [])
        .filter((record) => record.is_active !== false)
        .map((record) => ({
          label: `${record.name} (${record.code})`,
          searchText: `${record.name} ${record.code}`,
          value: record.code,
        })),
    [transactionSourceTypes.data],
  );

  const visibleAccounts = useMemo(
    () =>
      filterAccounts(accounts.data ?? [], searchCriteria, branchById, bankRecordById),
    [accounts.data, bankRecordById, branchById, searchCriteria],
  );
  const selectedTransactionAccount = useMemo(
    () =>
      (accounts.data ?? []).find(
        (account) => account.id === selectedTransactionAccountId,
      ) ?? null,
    [accounts.data, selectedTransactionAccountId],
  );

  const createMutation = useMutation({
    mutationFn: createFinancialAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      closeDrawer();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: Partial<FinancialAccountPayload>;
    }) => updateFinancialAccount(accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      closeDrawer();
      setDeactivationAccount(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFinancialAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      setDeletionAccount(null);
    },
  });
  const createTransactionMutation = useMutation({
    mutationFn: createFinancialTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions", selectedTransactionAccountId],
      });
      closeTransactionDrawer();
    },
  });

  const activeActionAccountId =
    selectedAccount?.id ?? deactivationAccount?.id ?? deletionAccount?.id ?? null;
  const isEditing = drawerMode === "edit" && selectedAccount;
  const drawerError =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    deleteMutation.error?.message;
  const transactionDrawerError = createTransactionMutation.error?.message;

  function openCreateDrawer() {
    setDrawerMode("create");
    setSelectedAccount(null);
    setForm(defaultForm);
    setFormErrors({});
    setIsDrawerOpen(true);
  }

  function openEditDrawer(account: FinancialAccount) {
    setDrawerMode("edit");
    setSelectedAccount(account);
    setForm(accountToForm(account, branchById, bankRecordById));
    setFormErrors({});
    setIsDrawerOpen(true);
  }

  function openSearchDrawer() {
    setDrawerMode("search");
    setSelectedAccount(null);
    setSearchForm(searchCriteria);
    setFormErrors({});
    setIsDrawerOpen(true);
  }

  function openTransactions(account: FinancialAccount) {
    closeDrawer();
    closeTransactionDrawer();
    setDeactivationAccount(null);
    setDeletionAccount(null);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("selected", account.id);
      next.set("returnPage", String(pageIndex + 1));
      next.delete("page");
      return next;
    });
  }

  function closeTransactions() {
    closeTransactionDrawer();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      const returnPage = Number(next.get("returnPage"));
      next.delete("selected");
      next.delete("returnPage");
      if (Number.isFinite(returnPage) && returnPage > 1) {
        next.set("page", String(returnPage));
      } else {
        next.delete("page");
      }
      return next;
    });
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
    setSelectedAccount(null);
    setFormErrors({});
  }

  function openCreateTransactionDrawer() {
    if (!selectedTransactionAccountId || !selectedTransactionAccount) {
      return;
    }

    setTransactionForm({
      ...defaultTransactionForm,
      balance_after: formatDecimalInput(selectedTransactionAccount.current_balance),
      currency_code: selectedTransactionAccount.currency_code ?? "",
      transaction_date: getTodayDateInput(),
    });
    setTransactionFormErrors({});
    setIsTransactionDrawerOpen(true);
  }

  function closeTransactionDrawer() {
    setIsTransactionDrawerOpen(false);
    setTransactionFormErrors({});
  }

  function setTransactionValue(nextValue: TransactionFormValue) {
    setTransactionForm(nextValue);
    setTransactionFormErrors((current) =>
      clearResolvedTransactionErrors(current, nextValue),
    );
  }

  function handleTransactionSubmit() {
    if (!selectedTransactionAccountId) {
      return false;
    }

    const nextErrors = validateTransactionForm(
      transactionForm,
      t("form.requiredMessage"),
      t("bankAccounts.transactionAmountRequired"),
    );
    if (Object.keys(nextErrors).length > 0) {
      setTransactionFormErrors(nextErrors);
      return false;
    }

    createTransactionMutation.mutate(
      buildTransactionPayload(selectedTransactionAccountId, transactionForm),
    );
    return true;
  }

  function setDrawerValue(nextValue: BankAccountFormValue) {
    if (drawerMode === "search") {
      setSearchForm(nextValue);
      return;
    }

    setForm(nextValue);
    setFormErrors((current) => clearResolvedErrors(current, nextValue));
  }

  function setBranch(nextBranchId: string) {
    const currentValue = drawerMode === "search" ? searchForm : form;
    const nextBankId = getBranchBankId(nextBranchId, branchById);
    const nextCountryId = getBranchCountryId(
      nextBranchId,
      branchById,
      bankRecordById,
    );
    const branchCurrency = getBranchCurrencyCode(
      nextBranchId,
      branchById,
      bankRecordById,
      countryById,
    );

    setDrawerValue({
      ...currentValue,
      branch_country_id: nextCountryId || currentValue.branch_country_id,
      financial_institution_id: nextBankId || currentValue.financial_institution_id,
      financial_institution_branch_id: nextBranchId,
      currency_code:
        drawerMode === "search"
          ? currentValue.currency_code
          : branchCurrency || currentValue.currency_code,
    });
  }

  function setBranchCountry(nextCountryId: string) {
    const currentValue = drawerMode === "search" ? searchForm : form;
    const selectedBankCountryId = currentValue.financial_institution_id
      ? readRawString(
          bankRecordById.get(currentValue.financial_institution_id),
          "country_id",
        )
      : "";
    const selectedBranchCountryId = getBranchCountryId(
      currentValue.financial_institution_branch_id,
      branchById,
      bankRecordById,
    );
    const shouldClearBank =
      nextCountryId &&
      selectedBankCountryId &&
      selectedBankCountryId !== nextCountryId;
    const shouldClearBranch =
      nextCountryId &&
      selectedBranchCountryId &&
      selectedBranchCountryId !== nextCountryId;

    setDrawerValue({
      ...currentValue,
      branch_country_id: nextCountryId,
      financial_institution_id: shouldClearBank
        ? ""
        : currentValue.financial_institution_id,
      financial_institution_branch_id: shouldClearBank || shouldClearBranch
        ? ""
        : currentValue.financial_institution_branch_id,
    });
  }

  function setBank(nextBankId: string) {
    const currentValue = drawerMode === "search" ? searchForm : form;
    const selectedBranchBankId = getBranchBankId(
      currentValue.financial_institution_branch_id,
      branchById,
    );
    const nextCountryId = nextBankId
      ? readRawString(bankRecordById.get(nextBankId), "country_id")
      : "";

    setDrawerValue({
      ...currentValue,
      branch_country_id: nextCountryId || currentValue.branch_country_id,
      financial_institution_id: nextBankId,
      financial_institution_branch_id:
        nextBankId && selectedBranchBankId && selectedBranchBankId !== nextBankId
          ? ""
          : currentValue.financial_institution_branch_id,
    });
  }

  function handleSubmit() {
    if (drawerMode === "search") {
      setSearchCriteria(searchForm);
      setPageIndex(0);
      closeDrawer();
      return false;
    }

    const nextErrors = validateForm(form, t("form.requiredMessage"));
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return false;
    }

    const payload = buildPayload(form);
    if (isEditing) {
      updateMutation.mutate({ accountId: selectedAccount.id, payload });
      return true;
    }

    createMutation.mutate(payload);
    return true;
  }

  return (
    <>
      {isTransactionMode ? (
        <GridManagementPage<FinancialTransaction>
          leadingActions={
            <IconButton
              label={t("bankAccounts.backToAccounts")}
              tone="primary"
              onClick={closeTransactions}
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </IconButton>
          }
          actions={
            <>
              <IconButton
                disabled={transactions.isFetching}
                label={t("bankAccounts.reloadTransactions")}
                tone="primary"
                onClick={() => transactions.refetch()}
              >
                <RefreshCw
                  aria-hidden="true"
                  className={transactions.isFetching ? "animate-spin" : ""}
                  size={16}
                />
              </IconButton>
              <IconButton
                disabled={!selectedTransactionAccountId}
                label={t("bankAccounts.createTransaction")}
                tone="primary"
                onClick={openCreateTransactionDrawer}
              >
                <Plus aria-hidden="true" size={16} />
              </IconButton>
            </>
          }
          actionsClassName="md:self-end"
          columnSelectionStorageKey="bank-account-transactions"
          columns={buildTransactionColumns(t, locale)}
          description={t("bankAccounts.transactionsDescription")}
          emptyMessage={
            transactions.isLoading
              ? t("bankAccounts.loadingTransactions")
              : t("bankAccounts.noTransactions")
          }
          errorMessage={
            transactions.isError ? transactions.error.message : undefined
          }
          eyebrow={t("nav.workspace")}
          pageIndex={pageIndex}
          paginationLabels={{
            firstPage: t("grid.firstPage"),
            lastPage: t("grid.lastPage"),
            nextPage: t("grid.nextPage"),
            previousPage: t("grid.previousPage"),
            rows: t("grid.rows"),
          }}
          pageSize={pageSize}
          records={transactions.data ?? []}
          sortState={sortState}
          title={t("bankAccounts.transactionsForTitle").replace(
            "{name}",
            selectedTransactionAccount
              ? getTransactionAccountLabel(
                  selectedTransactionAccount,
                  branchById,
                  bankById,
                )
              : t("bankAccounts.transactions"),
          )}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onSortChange={setSortState}
        />
      ) : (
      <GridManagementPage<FinancialAccount>
        actions={
          <>
            <IconButton
              label={t("bankAccounts.search")}
              tone="primary"
              onClick={openSearchDrawer}
            >
              <Search aria-hidden="true" size={16} />
            </IconButton>
            <IconButton
              disabled={accounts.isFetching}
              label={t("bankAccounts.reload")}
              tone="primary"
              onClick={() => accounts.refetch()}
            >
              <RefreshCw
                aria-hidden="true"
                className={accounts.isFetching ? "animate-spin" : ""}
                size={16}
              />
            </IconButton>
            <IconButton
              label={t("bankAccounts.create")}
              tone="primary"
              onClick={openCreateDrawer}
            >
              <Plus aria-hidden="true" size={16} />
            </IconButton>
          </>
        }
        actionsClassName="md:self-end"
        columnSelectionStorageKey="bank-accounts"
        columns={[
          {
            key: "holder",
            header: t("bankAccounts.accountHolder"),
            render: (account) =>
              account.legal_name_id
                ? formatLegalNameById(account.legal_name_id, legalNames.data ?? [], countryById)
                : "--",
            sortable: true,
            sortValue: (account) =>
              account.legal_name_id
                ? legalNameById.get(account.legal_name_id) ?? ""
                : "",
          },
          {
            key: "branch",
            header: t("bankAccounts.bankBranch"),
            render: (account) => formatBranch(account, branchById, bankById),
            sortable: true,
            sortValue: (account) => formatBranch(account, branchById, bankById),
          },
          {
            key: "account_number",
            header: t("bankAccounts.accountNumber"),
            render: (account) => account.account_number || "--",
            sortable: true,
            sortValue: (account) => account.account_number ?? "",
          },
          {
            key: "currency",
            header: t("bankAccounts.currency"),
            render: (account) => account.currency_code,
            sortable: true,
            sortValue: (account) => account.currency_code,
          },
          {
            align: "right",
            key: "balance",
            header: t("bankAccounts.balance"),
            render: (account) =>
              formatMoney(account.current_balance, locale, account.currency_code),
            sortable: true,
            sortValue: (account) => Number(account.current_balance),
          },
          {
            key: "active",
            header: t("refLists.active"),
            render: (account) =>
              account.is_active ? t("profile.value.yes") : t("profile.value.no"),
            sortable: true,
            sortValue: (account) => account.is_active,
          },
          {
            align: "right",
            key: "actions",
            header: "",
            width: "140px",
            render: (account) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label={t("bankAccounts.edit")}
                  onClick={() => openEditDrawer(account)}
                >
                  <Edit2 aria-hidden="true" size={16} />
                </IconButton>
                {account.is_active ? (
                  <>
                    <IconButton
                      label={t("bankAccounts.transactions")}
                      onClick={() => openTransactions(account)}
                    >
                      <ReceiptText aria-hidden="true" size={16} />
                    </IconButton>
                    <IconButton
                      disabled={updateMutation.isPending}
                      label={t("refLists.deactivate")}
                      onClick={() => setDeactivationAccount(account)}
                    >
                      <Ban aria-hidden="true" size={16} />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    disabled={deleteMutation.isPending}
                    label={t("refLists.delete")}
                    onClick={() => setDeletionAccount(account)}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </IconButton>
                )}
              </div>
            ),
          },
        ]}
        activeRecordId={activeActionAccountId}
        description={t("bankAccounts.description")}
        emptyMessage={
          accounts.isLoading ? t("bankAccounts.loading") : t("bankAccounts.empty")
        }
        errorMessage={accounts.isError ? accounts.error.message : undefined}
        eyebrow={t("nav.workspace")}
        isRecordInactive={(account) => !account.is_active}
        pageIndex={pageIndex}
        paginationLabels={{
          firstPage: t("grid.firstPage"),
          lastPage: t("grid.lastPage"),
          nextPage: t("grid.nextPage"),
          previousPage: t("grid.previousPage"),
          rows: t("grid.rows"),
        }}
        pageSize={pageSize}
        records={visibleAccounts}
        sortState={sortState}
        title={t("nav.bankAccounts")}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSortChange={setSortState}
      />
      )}

      <Drawer
        isOpen={isDrawerOpen}
        title={
          drawerMode === "search"
            ? t("bankAccounts.search")
            : isEditing
              ? t("bankAccounts.edit")
              : t("bankAccounts.create")
        }
        onClose={closeDrawer}
      >
        <BankAccountForm
          branchCountryOptions={branchCountryOptions}
          branchOptions={filteredBranchOptions}
          bankOptions={filteredBankOptions}
          currencyOptions={
            drawerMode === "search" ? searchCurrencyOptions : currencyOptions
          }
          disabled={createMutation.isPending || updateMutation.isPending}
          error={drawerError}
          errors={formErrors}
          legalNameOptions={legalNameOptions}
          mode={drawerMode}
          submitLabel={
            drawerMode === "search"
              ? t("users.search")
              : createMutation.isPending || updateMutation.isPending
                ? t("profile.saving")
                : t("profile.save")
          }
          value={drawerValue}
          onCancel={closeDrawer}
          onBankChange={setBank}
          onBranchChange={setBranch}
          onBranchCountryChange={setBranchCountry}
          onChange={setDrawerValue}
          onReset={() => {
            if (drawerMode === "search") {
              setSearchForm(defaultSearchForm);
              setFormErrors({});
              return;
            }
            setForm(
              isEditing
                ? accountToForm(selectedAccount, branchById, bankRecordById)
                : defaultForm,
            );
            setFormErrors({});
          }}
          onSubmit={handleSubmit}
        />
      </Drawer>

      <Drawer
        isOpen={isTransactionDrawerOpen}
        title={t("bankAccounts.createTransaction")}
        onClose={closeTransactionDrawer}
      >
        <TransactionForm
          accountBalance={selectedTransactionAccount?.current_balance ?? 0}
          disabled={createTransactionMutation.isPending}
          error={transactionDrawerError}
          errors={transactionFormErrors}
          sourceTypeOptions={transactionSourceOptions}
          submitLabel={
            createTransactionMutation.isPending
              ? t("profile.saving")
              : t("profile.save")
          }
          value={transactionForm}
          onCancel={closeTransactionDrawer}
          onChange={setTransactionValue}
          onReset={() => {
            if (!selectedTransactionAccount) {
              setTransactionForm(defaultTransactionForm);
              return;
            }
            setTransactionForm({
              ...defaultTransactionForm,
              balance_after: formatDecimalInput(
                selectedTransactionAccount.current_balance,
              ),
              currency_code: selectedTransactionAccount.currency_code ?? "",
              transaction_date: getTodayDateInput(),
            });
            setTransactionFormErrors({});
          }}
          onSubmit={handleTransactionSubmit}
        />
      </Drawer>

      {deactivationAccount && (
        <BankAccountActionModal
          body={t("bankAccounts.deactivateConfirmBody")}
          cancelLabel={t("profile.cancel")}
          confirmLabel={t("refLists.deactivate")}
          disabled={updateMutation.isPending}
          error={updateMutation.error?.message}
          title={t("bankAccounts.deactivateConfirmTitle")}
          value={getAccountLabel(deactivationAccount, branchById, bankById)}
          onCancel={() => setDeactivationAccount(null)}
          onConfirm={() =>
            updateMutation.mutate({
              accountId: deactivationAccount.id,
              payload: { is_active: false },
            })
          }
        />
      )}

      {deletionAccount && (
        <BankAccountActionModal
          body={t("bankAccounts.deleteConfirmBody")}
          cancelLabel={t("profile.cancel")}
          confirmLabel={t("refLists.delete")}
          disabled={deleteMutation.isPending}
          error={deleteMutation.error?.message}
          title={t("bankAccounts.deleteConfirmTitle")}
          value={getAccountLabel(deletionAccount, branchById, bankById)}
          warning={t("bankAccounts.deleteCannotRollback")}
          onCancel={() => setDeletionAccount(null)}
          onConfirm={() => deleteMutation.mutate(deletionAccount.id)}
        />
      )}
    </>
  );
}

function BankAccountForm({
  bankOptions,
  branchCountryOptions,
  branchOptions,
  currencyOptions,
  disabled,
  error,
  errors,
  legalNameOptions,
  mode,
  submitLabel,
  value,
  onCancel,
  onBankChange,
  onBranchChange,
  onBranchCountryChange,
  onChange,
  onReset,
  onSubmit,
}: {
  bankOptions: SearchableSelectOption[];
  branchCountryOptions: SearchableSelectOption[];
  branchOptions: SearchableSelectOption[];
  currencyOptions: SearchableSelectOption[];
  disabled: boolean;
  error?: string;
  errors: BankAccountFormErrors;
  legalNameOptions: SearchableSelectOption[];
  mode: DrawerMode;
  submitLabel: string;
  value: BankAccountFormValue;
  onCancel: () => void;
  onBankChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onBranchCountryChange: (value: string) => void;
  onChange: (value: BankAccountFormValue) => void;
  onReset: () => void;
  onSubmit: () => boolean | void;
}) {
  const { t } = useTranslation();
  const isSearchMode = mode === "search";
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const isFormDisabled = disabled || isSubmitLocked;

  useEffect(() => {
    if (!disabled) {
      setIsSubmitLocked(false);
    }
  }, [disabled]);

  function setField<Field extends keyof BankAccountFormValue>(
    field: Field,
    nextValue: BankAccountFormValue[Field],
  ) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (isFormDisabled) {
          return;
        }

        const didSubmit = onSubmit();
        if (didSubmit !== false && !isSearchMode) {
          setIsSubmitLocked(true);
        }
      }}
    >
      <div className="grid items-start gap-4">
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.accountHolder")}
            {!isSearchMode && <span className="text-red-600"> *</span>}
          </span>
          <SearchableSelect
            disabled={isFormDisabled}
            options={legalNameOptions}
            value={value.legal_name_id}
            onChange={(nextValue) => setField("legal_name_id", nextValue)}
          />
          {errors.legal_name_id && (
            <p className="text-xs font-normal text-red-700">
              {errors.legal_name_id}
            </p>
          )}
        </label>
        <div className="grid items-start gap-3">
          <p className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.bankBranch")}
            {!isSearchMode && <span className="text-red-600"> *</span>}
          </p>
          <label className="grid items-start gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("profile.field.country")}
            </span>
            <SearchableSelect
              disabled={isFormDisabled}
              options={branchCountryOptions}
              value={value.branch_country_id}
              onChange={onBranchCountryChange}
            />
          </label>
          <label className="grid items-start gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("bankAccounts.bank")}
            </span>
            <SearchableSelect
              disabled={isFormDisabled}
              options={bankOptions}
              value={value.financial_institution_id}
              onChange={onBankChange}
            />
          </label>
          <label className="grid items-start gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("bankAccounts.branch")}
            </span>
            <SearchableSelect
              disabled={isFormDisabled}
              options={branchOptions}
              value={value.financial_institution_branch_id}
              onChange={onBranchChange}
            />
            {errors.financial_institution_branch_id && (
              <p className="text-xs font-normal text-red-700">
                {errors.financial_institution_branch_id}
              </p>
            )}
          </label>
        </div>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.accountNumber")}
            {!isSearchMode && <span className="text-red-600"> *</span>}
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            maxLength={100}
            value={value.account_number}
            onChange={(event) => setField("account_number", event.target.value)}
          />
          {errors.account_number && (
            <p className="text-xs font-normal text-red-700">
              {errors.account_number}
            </p>
          )}
        </label>
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.currency")}
            {!isSearchMode && <span className="text-red-600"> *</span>}
          </span>
          <SearchableSelect
            disabled={isFormDisabled}
            options={currencyOptions}
            value={value.currency_code}
            onChange={(nextValue) => setField("currency_code", nextValue)}
          />
          {errors.currency_code && (
            <p className="text-xs font-normal text-red-700">
              {errors.currency_code}
            </p>
          )}
        </label>
      </div>
      <label className="grid items-start gap-1.5">
        <span className="text-sm font-semibold text-slate-700">
          {t("bankAccounts.notes")}
        </span>
        <textarea
          className={`${inputClassName} min-h-24 resize-y py-2`}
          disabled={isFormDisabled}
          maxLength={255}
          value={value.notes}
          onChange={(event) => setField("notes", event.target.value)}
        />
      </label>
      {mode !== "search" && (
        <label className="flex min-h-[42px] w-full items-center gap-2 rounded-lg border border-slate-200 px-3">
          <input
            checked={value.is_active}
            disabled={isFormDisabled}
            type="checkbox"
            onChange={(event) => setField("is_active", event.target.checked)}
          />
          <span className="text-sm font-normal text-slate-700">
            {t("refLists.active")}
          </span>
        </label>
      )}
      {error && <p className="text-sm font-normal text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button disabled={isFormDisabled} type="button" variant="secondary" onClick={onCancel}>
          {t("profile.cancel")}
        </Button>
        <Button disabled={isFormDisabled} type="button" variant="secondary" onClick={onReset}>
          {t("bankAccounts.clear")}
        </Button>
        <Button disabled={isFormDisabled} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function BankAccountActionModal({
  body,
  cancelLabel,
  confirmLabel,
  disabled,
  error,
  title,
  value,
  warning,
  onCancel,
  onConfirm,
}: {
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  disabled: boolean;
  error?: string;
  title: string;
  value: string;
  warning?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title}>
      <div className="mt-4 grid gap-4">
        <p className="text-sm font-normal leading-relaxed text-slate-600">{body}</p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700">
          {value}
        </p>
        {warning && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-normal text-red-700">
            {warning}
          </p>
        )}
        {error && <p className="text-sm font-normal text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button disabled={disabled} type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button disabled={disabled} type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TransactionForm({
  accountBalance,
  disabled,
  error,
  errors,
  sourceTypeOptions,
  submitLabel,
  value,
  onCancel,
  onChange,
  onReset,
  onSubmit,
}: {
  accountBalance: string | number;
  disabled: boolean;
  error?: string;
  errors: TransactionFormErrors;
  sourceTypeOptions: SearchableSelectOption[];
  submitLabel: string;
  value: TransactionFormValue;
  onCancel: () => void;
  onChange: (value: TransactionFormValue) => void;
  onReset: () => void;
  onSubmit: () => boolean | void;
}) {
  const { t } = useTranslation();
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const isFormDisabled = disabled || isSubmitLocked;

  useEffect(() => {
    if (!disabled) {
      setIsSubmitLocked(false);
    }
  }, [disabled]);

  function setField<Field extends keyof TransactionFormValue>(
    field: Field,
    nextValue: TransactionFormValue[Field],
  ) {
    const next = { ...value, [field]: nextValue };
    if (field === "deposit_amount" || field === "withdrawal_amount") {
      next.balance_after = calculateBalanceAfter(
        accountBalance,
        field === "deposit_amount" ? String(nextValue) : next.deposit_amount,
        field === "withdrawal_amount" ? String(nextValue) : next.withdrawal_amount,
      );
    }
    onChange(next);
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (isFormDisabled) {
          return;
        }

        const didSubmit = onSubmit();
        if (didSubmit !== false) {
          setIsSubmitLocked(true);
        }
      }}
    >
      <div className="grid items-start gap-4 md:grid-cols-2">
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.transactionDate")}
            <span className="text-red-600"> *</span>
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            type="date"
            value={value.transaction_date}
            onChange={(event) => setField("transaction_date", event.target.value)}
          />
          {errors.transaction_date && (
            <p className="text-xs font-normal text-red-700">
              {errors.transaction_date}
            </p>
          )}
        </label>
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.sourceType")}
            <span className="text-red-600"> *</span>
          </span>
          <SearchableSelect
            disabled={isFormDisabled}
            options={sourceTypeOptions}
            value={value.source_type}
            onChange={(nextValue) => setField("source_type", nextValue)}
          />
          {errors.source_type && (
            <p className="text-xs font-normal text-red-700">
              {errors.source_type}
            </p>
          )}
        </label>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.deposit")}
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            inputMode="decimal"
            value={value.deposit_amount}
            onChange={(event) => setField("deposit_amount", event.target.value)}
          />
        </label>
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.withdrawal")}
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            inputMode="decimal"
            value={value.withdrawal_amount}
            onChange={(event) => setField("withdrawal_amount", event.target.value)}
          />
        </label>
      </div>
      {errors.amount && (
        <p className="text-xs font-normal text-red-700">{errors.amount}</p>
      )}
      <div className="grid items-start gap-4 md:grid-cols-2">
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.balanceAfter")}
            <span className="text-red-600"> *</span>
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            inputMode="decimal"
            value={value.balance_after}
            onChange={(event) => setField("balance_after", event.target.value)}
          />
          {errors.balance_after && (
            <p className="text-xs font-normal text-red-700">
              {errors.balance_after}
            </p>
          )}
        </label>
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.currency")}
            <span className="text-red-600"> *</span>
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            maxLength={3}
            value={value.currency_code}
            onChange={(event) =>
              setField("currency_code", event.target.value.toUpperCase())
            }
          />
          {errors.currency_code && (
            <p className="text-xs font-normal text-red-700">
              {errors.currency_code}
            </p>
          )}
        </label>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.counterparty")}
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            maxLength={255}
            value={value.counterparty}
            onChange={(event) => setField("counterparty", event.target.value)}
          />
        </label>
        <label className="grid items-start gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {t("bankAccounts.referenceNo")}
          </span>
          <input
            className={inputClassName}
            disabled={isFormDisabled}
            maxLength={100}
            value={value.reference_no}
            onChange={(event) => setField("reference_no", event.target.value)}
          />
        </label>
      </div>
      <label className="grid items-start gap-1.5">
        <span className="text-sm font-semibold text-slate-700">
          {t("bankAccounts.notes")}
        </span>
        <textarea
          className={`${inputClassName} min-h-24 resize-y py-2`}
          disabled={isFormDisabled}
          maxLength={255}
          value={value.notes}
          onChange={(event) => setField("notes", event.target.value)}
        />
      </label>
      {error && <p className="text-sm font-normal text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button disabled={isFormDisabled} type="button" variant="secondary" onClick={onCancel}>
          {t("profile.cancel")}
        </Button>
        <Button disabled={isFormDisabled} type="button" variant="secondary" onClick={onReset}>
          {t("bankAccounts.clear")}
        </Button>
        <Button disabled={isFormDisabled} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function accountToForm(
  account: FinancialAccount,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, ReferenceRecord>,
): BankAccountFormValue {
  return {
    legal_name_id: account.legal_name_id ?? "",
    branch_country_id: getBranchCountryId(
      account.financial_institution_branch_id ?? "",
      branchById,
      bankById,
    ),
    financial_institution_id: getBranchBankId(
      account.financial_institution_branch_id ?? "",
      branchById,
    ),
    financial_institution_branch_id: account.financial_institution_branch_id ?? "",
    account_number: account.account_number ?? "",
    currency_code: account.currency_code ?? "",
    is_active: account.is_active,
    notes: account.notes ?? "",
  };
}

function buildPayload(value: BankAccountFormValue): FinancialAccountPayload {
  return {
    legal_name_id: value.legal_name_id,
    financial_institution_branch_id: value.financial_institution_branch_id,
    account_number: value.account_number.trim(),
    currency_code: value.currency_code.trim().toUpperCase(),
    is_active: value.is_active,
    notes: value.notes.trim() || null,
  };
}

function buildTransactionPayload(
  financialAccountId: string,
  value: TransactionFormValue,
): FinancialTransactionPayload {
  return {
    balance_after: value.balance_after.trim(),
    counterparty: value.counterparty.trim() || null,
    currency_code: value.currency_code.trim().toUpperCase(),
    deposit_amount: value.deposit_amount.trim() || null,
    financial_account_id: financialAccountId,
    notes: value.notes.trim() || null,
    reference_no: value.reference_no.trim() || null,
    source_type: value.source_type,
    transaction_date: value.transaction_date,
    withdrawal_amount: value.withdrawal_amount.trim() || null,
  };
}

function validateForm(value: BankAccountFormValue, requiredMessage: string) {
  const errors: BankAccountFormErrors = {};

  if (!value.legal_name_id) {
    errors.legal_name_id = requiredMessage;
  }
  if (!value.financial_institution_branch_id) {
    errors.financial_institution_branch_id = requiredMessage;
  }
  if (!value.account_number.trim()) {
    errors.account_number = requiredMessage;
  }
  if (!value.currency_code.trim()) {
    errors.currency_code = requiredMessage;
  }

  return errors;
}

function validateTransactionForm(
  value: TransactionFormValue,
  requiredMessage: string,
  amountRequiredMessage: string,
) {
  const errors: TransactionFormErrors = {};

  if (!value.transaction_date) {
    errors.transaction_date = requiredMessage;
  }
  if (!value.source_type) {
    errors.source_type = requiredMessage;
  }
  if (!value.balance_after.trim()) {
    errors.balance_after = requiredMessage;
  }
  if (!value.currency_code.trim()) {
    errors.currency_code = requiredMessage;
  }

  const deposit = parseDecimal(value.deposit_amount);
  const withdrawal = parseDecimal(value.withdrawal_amount);
  const hasDeposit = deposit !== null && deposit > 0;
  const hasWithdrawal = withdrawal !== null && withdrawal > 0;
  if (hasDeposit === hasWithdrawal) {
    errors.amount = amountRequiredMessage;
  }

  return errors;
}

function clearResolvedErrors(
  current: BankAccountFormErrors,
  value: BankAccountFormValue,
) {
  if (Object.keys(current).length === 0) {
    return current;
  }

  const next = { ...current };
  for (const field of Object.keys(next) as (keyof BankAccountFormValue)[]) {
    const fieldValue = value[field];
    if (typeof fieldValue === "string" ? fieldValue.trim() : fieldValue) {
      delete next[field];
    }
  }
  return next;
}

function clearResolvedTransactionErrors(
  current: TransactionFormErrors,
  value: TransactionFormValue,
) {
  if (Object.keys(current).length === 0) {
    return current;
  }

  const next = { ...current };
  if (value.transaction_date) {
    delete next.transaction_date;
  }
  if (value.source_type) {
    delete next.source_type;
  }
  if (value.balance_after.trim()) {
    delete next.balance_after;
  }
  if (value.currency_code.trim()) {
    delete next.currency_code;
  }
  const deposit = parseDecimal(value.deposit_amount);
  const withdrawal = parseDecimal(value.withdrawal_amount);
  if ((deposit !== null && deposit > 0) !== (withdrawal !== null && withdrawal > 0)) {
    delete next.amount;
  }
  return next;
}

function filterAccounts(
  accounts: FinancialAccount[],
  criteria: BankAccountFormValue,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, ReferenceRecord>,
) {
  return accounts.filter((account) => {
    if (
      criteria.legal_name_id &&
      account.legal_name_id !== criteria.legal_name_id
    ) {
      return false;
    }
    if (
      criteria.financial_institution_branch_id &&
      account.financial_institution_branch_id !==
        criteria.financial_institution_branch_id
    ) {
      return false;
    }
    if (
      criteria.financial_institution_id &&
      getBranchBankId(account.financial_institution_branch_id ?? "", branchById) !==
        criteria.financial_institution_id
    ) {
      return false;
    }
    if (
      criteria.branch_country_id &&
      getBranchCountryId(
        account.financial_institution_branch_id ?? "",
        branchById,
        bankById,
      ) !== criteria.branch_country_id
    ) {
      return false;
    }
    if (
      criteria.account_number &&
      !(account.account_number ?? "")
        .toLowerCase()
        .includes(criteria.account_number.toLowerCase())
    ) {
      return false;
    }
    if (
      criteria.currency_code &&
      account.currency_code.toLowerCase() !== criteria.currency_code.toLowerCase()
    ) {
      return false;
    }

    return true;
  });
}

function formatBranch(
  account: FinancialAccount,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, string>,
) {
  if (!account.financial_institution_branch_id) {
    return "--";
  }

  const branch = branchById.get(account.financial_institution_branch_id);
  if (!branch) {
    return "--";
  }

  const branchName = getBranchName(branch);
  const bankName = bankById.get(readRawString(branch, "financial_institution_id"));
  return bankName ? `${bankName} - ${branchName}` : branchName;
}

function getBranchName(branch: ReferenceRecord) {
  return readRawString(branch, "branch_name") || branch.name || "--";
}

function getBranchCountryId(
  branchId: string,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, ReferenceRecord>,
) {
  const branch = branchById.get(branchId);
  if (!branch) {
    return "";
  }

  const bank = bankById.get(readRawString(branch, "financial_institution_id"));
  return bank ? readRawString(bank, "country_id") : "";
}

function getBranchBankId(
  branchId: string,
  branchById: Map<string, ReferenceRecord>,
) {
  const branch = branchById.get(branchId);
  return branch ? readRawString(branch, "financial_institution_id") : "";
}

function readRawString(record: ReferenceRecord | undefined, key: string) {
  if (!record) {
    return "";
  }
  const value = record.raw[key];
  return typeof value === "string" ? value : "";
}

function formatLegalNameById(
  legalNameId: string,
  legalNames: { country_id: string; full_name: string; id: string }[],
  countryById: Map<string, ReferenceRecord>,
) {
  const legalName = legalNames.find((candidate) => candidate.id === legalNameId);
  return legalName ? formatLegalNameOption(legalName, countryById) : "--";
}

function formatLegalNameOption(
  legalName: { country_id: string; full_name: string },
  countryById: Map<string, ReferenceRecord>,
) {
  const countryName = getCountryName(countryById.get(legalName.country_id));
  return countryName
    ? `${legalName.full_name} (${countryName})`
    : legalName.full_name;
}

function getCountryName(country?: ReferenceRecord) {
  return country?.name ?? "";
}

function getCountryLabel(country: ReferenceRecord) {
  const code = readRawString(country, "code");
  return code ? `${country.name} (${code})` : country.name;
}

function buildBranchOptions(
  branches: ReferenceRecord[],
  bankById: Map<string, ReferenceRecord>,
  countryId = "",
  bankId = "",
): SearchableSelectOption[] {
  if (!bankId) {
    return [];
  }

  return branches
    .filter((branch) => {
      const branchBankId = readRawString(branch, "financial_institution_id");
      if (branchBankId !== bankId) {
        return false;
      }

      if (countryId) {
        const bank = bankById.get(branchBankId);
        return bank ? readRawString(bank, "country_id") === countryId : false;
      }

      return true;
    })
    .map((branch) => {
      const branchName = getBranchName(branch);
      const branchCode = readRawString(branch, "branch_code");
      const label = branchCode ? `${branchName} (${branchCode})` : branchName;

      return {
        label,
        searchText: `${branchName} ${branchCode}`,
        value: branch.id,
      };
    });
}

function buildBankOptions(
  banks: ReferenceRecord[],
  branches: ReferenceRecord[],
  countryId = "",
  selectedBankId = "",
): SearchableSelectOption[] {
  const bankIdsWithBranches = new Set(
    branches
      .map((branch) => readRawString(branch, "financial_institution_id"))
      .filter(Boolean),
  );
  if (selectedBankId) {
    bankIdsWithBranches.add(selectedBankId);
  }

  return banks
    .filter((bank) => {
      if (!bankIdsWithBranches.has(bank.id)) {
        return false;
      }
      if (countryId && readRawString(bank, "country_id") !== countryId) {
        return false;
      }
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((bank) => ({
      label: bank.name,
      searchText: `${bank.name} ${readRawString(bank, "swift_code")} ${readRawString(
        bank,
        "website",
      )}`,
      value: bank.id,
    }));
}

function buildBranchCountryOptions(
  branches: ReferenceRecord[],
  bankById: Map<string, ReferenceRecord>,
  countryById: Map<string, ReferenceRecord>,
  selectedCountryId: string,
): SearchableSelectOption[] {
  const countryIds = new Set<string>();
  for (const branch of branches) {
    const bank = bankById.get(readRawString(branch, "financial_institution_id"));
    const countryId = bank ? readRawString(bank, "country_id") : "";
    if (countryId) {
      countryIds.add(countryId);
    }
  }
  if (selectedCountryId) {
    countryIds.add(selectedCountryId);
  }

  return Array.from(countryIds)
    .map((countryId) => countryById.get(countryId))
    .filter((country): country is ReferenceRecord => Boolean(country))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((country) => ({
      label: getCountryLabel(country),
      searchText: `${country.name} ${readRawString(country, "code")} ${readRawString(
        country,
        "alpha2",
      )}`,
      value: country.id,
    }));
}

function getBranchCurrencyCode(
  branchId: string,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, ReferenceRecord>,
  countryById: Map<string, ReferenceRecord>,
) {
  const branch = branchById.get(branchId);
  if (!branch) {
    return "";
  }

  const bank = bankById.get(readRawString(branch, "financial_institution_id"));
  if (!bank) {
    return "";
  }

  const country = countryById.get(readRawString(bank, "country_id"));
  return country ? readRawString(country, "currency_code") : "";
}

function buildCurrencyOptions(
  countries: ReferenceRecord[],
  selectedCurrencyCode: string,
): SearchableSelectOption[] {
  const currencies = new Set<string>();
  for (const country of countries) {
    const currencyCode = readRawString(country, "currency_code");
    if (currencyCode && currencyCode !== "XXX") {
      currencies.add(currencyCode);
    }
  }
  if (selectedCurrencyCode) {
    currencies.add(selectedCurrencyCode.toUpperCase());
  }

  return Array.from(currencies)
    .sort((left, right) => left.localeCompare(right))
    .map((currencyCode) => {
      const countryNames = countries
        .filter((country) => readRawString(country, "currency_code") === currencyCode)
        .slice(0, 3)
        .map((country) => country.name)
        .filter(Boolean);
      const suffix =
        countryNames.length > 0 ? ` (${countryNames.join(", ")})` : "";

      return {
        label: `${currencyCode}${suffix}`,
        searchText: `${currencyCode} ${countryNames.join(" ")}`,
        value: currencyCode,
      };
    });
}

function buildTransactionColumns(
  t: (key: TranslationKey) => string,
  locale: string,
): DataGridColumn<FinancialTransaction>[] {
  return [
    {
      key: "transaction_date",
      header: t("bankAccounts.transactionDate"),
      render: (transaction) => formatDate(transaction.transaction_date, locale),
      sortable: true,
      sortValue: (transaction) => transaction.transaction_date,
    },
    {
      key: "source_type",
      header: t("bankAccounts.sourceType"),
      render: (transaction) => transaction.source_type || "--",
      sortable: true,
      sortValue: (transaction) => transaction.source_type,
    },
    {
      align: "right",
      key: "deposit_amount",
      header: t("bankAccounts.deposit"),
      render: (transaction) =>
        formatOptionalMoney(
          transaction.deposit_amount,
          locale,
          transaction.currency_code,
        ),
      sortable: true,
      sortValue: (transaction) => Number(transaction.deposit_amount ?? 0),
    },
    {
      align: "right",
      key: "withdrawal_amount",
      header: t("bankAccounts.withdrawal"),
      render: (transaction) =>
        formatOptionalMoney(
          transaction.withdrawal_amount,
          locale,
          transaction.currency_code,
        ),
      sortable: true,
      sortValue: (transaction) => Number(transaction.withdrawal_amount ?? 0),
    },
    {
      align: "right",
      key: "balance_after",
      header: t("bankAccounts.balanceAfter"),
      render: (transaction) =>
        formatMoney(transaction.balance_after, locale, transaction.currency_code),
      sortable: true,
      sortValue: (transaction) => Number(transaction.balance_after),
    },
    {
      key: "currency_code",
      header: t("bankAccounts.currency"),
      render: (transaction) => transaction.currency_code,
      sortable: true,
      sortValue: (transaction) => transaction.currency_code,
    },
    {
      key: "counterparty",
      header: t("bankAccounts.counterparty"),
      render: (transaction) => transaction.counterparty || "--",
      sortable: true,
      sortValue: (transaction) => transaction.counterparty ?? "",
    },
    {
      key: "reference_no",
      header: t("bankAccounts.referenceNo"),
      render: (transaction) => transaction.reference_no || "--",
      sortable: true,
      sortValue: (transaction) => transaction.reference_no ?? "",
    },
  ];
}

function getAccountLabel(
  account: FinancialAccount,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, string>,
) {
  const branchLabel = formatBranch(account, branchById, bankById);
  return account.account_number
    ? `${branchLabel} / ${account.account_number}`
    : branchLabel;
}

function getTransactionAccountLabel(
  account: FinancialAccount,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, string>,
) {
  const bankLabel = getAccountBankLabel(account, branchById, bankById);
  return account.account_number
    ? `${bankLabel} / ${account.account_number}`
    : bankLabel;
}

function getAccountBankLabel(
  account: FinancialAccount,
  branchById: Map<string, ReferenceRecord>,
  bankById: Map<string, string>,
) {
  if (!account.financial_institution_branch_id) {
    return "--";
  }

  const branch = branchById.get(account.financial_institution_branch_id);
  if (!branch) {
    return "--";
  }

  return (
    bankById.get(readRawString(branch, "financial_institution_id")) ??
    getBranchName(branch)
  );
}

function formatMoney(value: string | number, locale: string, currencyCode: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "--";
  }
  const fractionDigits = getCurrencyFractionDigits(currencyCode);

  return amount.toLocaleString(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

function getCurrencyFractionDigits(currencyCode: string) {
  if (!currencyCode) {
    return 2;
  }

  try {
    return (
      new Intl.NumberFormat("en", {
      currency: currencyCode,
      style: "currency",
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

function formatOptionalMoney(
  value: string | number | null | undefined,
  locale: string,
  currencyCode: string,
) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return formatMoney(value, locale, currencyCode);
}

function formatDate(value: string, locale: string) {
  if (!value) {
    return "--";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(locale);
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function parseDecimal(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimalInput(value: string | number | null | undefined) {
  const parsed = parseDecimal(value);
  return parsed === null ? "" : String(parsed);
}

function calculateBalanceAfter(
  accountBalance: string | number,
  depositAmount: string,
  withdrawalAmount: string,
) {
  const base = parseDecimal(accountBalance) ?? 0;
  const deposit = parseDecimal(depositAmount) ?? 0;
  const withdrawal = parseDecimal(withdrawalAmount) ?? 0;
  return String(base + deposit - withdrawal);
}

const inputClassName =
  "min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:bg-slate-50";
