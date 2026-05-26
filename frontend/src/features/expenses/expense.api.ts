import { apiRequest } from "../../lib/api/client";
import type {
  Expense,
  ExpenseCreatePayload,
  ExpenseUpdatePayload,
} from "./expense.types";

export const expenseApi = {
  list: () => apiRequest<Expense[]>("/expenses", { auth: true }),
  get: (id: string) => apiRequest<Expense>(`/expenses/${id}`, { auth: true }),
  create: (payload: ExpenseCreatePayload) =>
    apiRequest<Expense>("/expenses", {
      auth: true,
      method: "POST",
      body: normalizeExpensePayload(payload),
    }),
  update: (id: string, payload: ExpenseUpdatePayload) =>
    apiRequest<Expense>(`/expenses/${id}`, {
      auth: true,
      method: "PUT",
      body: normalizeExpensePayload(payload),
    }),
  remove: async (id: string) => {
    await apiRequest<{ message: string }>(`/expenses/${id}`, {
      auth: true,
      method: "DELETE",
    });
  },
};

function normalizeExpensePayload(
  payload: ExpenseCreatePayload | ExpenseUpdatePayload,
) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ]),
  );
}
