import type { MasterDetailPageConfig } from "../../components/data/dataTypes";
import { expenseApi } from "./expense.api";
import { expenseColumns } from "./expense.columns";
import { expenseFormFields } from "./expense.form";
import type {
  Expense,
  ExpenseCreatePayload,
  ExpenseUpdatePayload,
} from "./expense.types";

export const expensePageConfig: MasterDetailPageConfig<
  Expense,
  ExpenseCreatePayload,
  ExpenseUpdatePayload
> = {
  title: "Expenses",
  eyebrow: "Operations",
  queryKey: ["expenses"],
  api: expenseApi,
  columns: expenseColumns,
  formFields: expenseFormFields,
  getRecordLabel: (expense) => expense.description || expense.id,
};
