import { apiRequest } from "../../lib/api/client";

export type FinancialTransaction = {
  id: string;
  financial_account_id: string;
  source_type: string;
  source_id?: string | null;
  transaction_date: string;
  deposit_amount?: string | number | null;
  withdrawal_amount?: string | number | null;
  balance_after: string | number;
  currency_code: string;
  counterparty?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type FinancialTransactionPayload = {
  financial_account_id: string;
  source_type: string;
  source_id?: string | null;
  transaction_date: string;
  deposit_amount?: string | number | null;
  withdrawal_amount?: string | number | null;
  balance_after: string | number;
  currency_code: string;
  counterparty?: string | null;
  reference_no?: string | null;
  notes?: string | null;
};

export type FinancialTransactionSourceType = {
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean | null;
};

export function listFinancialTransactions(financialAccountId?: string) {
  const params = new URLSearchParams({
    limit: "1000",
    skip: "0",
  });

  if (financialAccountId) {
    params.set("financial_account_id", financialAccountId);
  }

  return apiRequest<FinancialTransaction[]>(
    `/financial-transactions?${params.toString()}`,
    { auth: true },
  );
}

export function createFinancialTransaction(payload: FinancialTransactionPayload) {
  return apiRequest<FinancialTransaction>("/financial-transactions", {
    auth: true,
    body: payload,
    method: "POST",
  });
}

export function listFinancialTransactionSourceTypes() {
  return apiRequest<FinancialTransactionSourceType[]>(
    "/ref-codes/financial-transaction-source-types?limit=1000",
    { auth: true },
  );
}
