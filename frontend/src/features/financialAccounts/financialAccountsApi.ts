import { apiRequest } from "../../lib/api/client";

export type FinancialAccount = {
  id: string;
  user_id: string;
  legal_name_id?: string | null;
  financial_institution_branch_id?: string | null;
  account_number?: string | null;
  currency_code: string;
  current_balance: string | number;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type FinancialAccountPayload = {
  legal_name_id?: string | null;
  financial_institution_branch_id?: string | null;
  account_number?: string | null;
  currency_code: string;
  is_active: boolean;
  notes?: string | null;
};

export function listFinancialAccounts() {
  return apiRequest<FinancialAccount[]>("/financial-accounts?skip=0&limit=1000", {
    auth: true,
  });
}

export function createFinancialAccount(payload: FinancialAccountPayload) {
  return apiRequest<FinancialAccount>("/financial-accounts", {
    auth: true,
    method: "POST",
    body: payload,
  });
}

export function updateFinancialAccount(
  accountId: string,
  payload: Partial<FinancialAccountPayload>,
) {
  return apiRequest<FinancialAccount>(`/financial-accounts/${accountId}`, {
    auth: true,
    method: "PUT",
    body: payload,
  });
}

export function deleteFinancialAccount(accountId: string) {
  return apiRequest<{ message: string }>(`/financial-accounts/${accountId}`, {
    auth: true,
    method: "DELETE",
  });
}
