import { MasterDetailPage } from "../components/data/MasterDetailPage";
import { defaultExpenseCreateValue } from "../features/expenses/expense.form";
import { expensePageConfig } from "../features/expenses/expense.page";

export function ExpensesPage() {
  return (
    <MasterDetailPage
      config={expensePageConfig}
      defaultCreateValue={defaultExpenseCreateValue}
    />
  );
}
