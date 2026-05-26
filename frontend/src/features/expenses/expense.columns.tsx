import type { DataGridColumn } from "../../components/data/dataTypes";
import type { Expense } from "./expense.types";

export const expenseColumns: DataGridColumn<Expense>[] = [
  {
    key: "description",
    header: "Description",
    render: (expense) => expense.description || "Untitled expense",
  },
  {
    key: "actual_amount",
    header: "Actual",
    align: "right",
    width: "140px",
    render: (expense) => formatMoney(expense.actual_amount),
  },
  {
    key: "quoted_amount",
    header: "Quoted",
    align: "right",
    width: "140px",
    render: (expense) => formatMoney(expense.quoted_amount),
  },
  {
    key: "start_date",
    header: "Start",
    width: "130px",
    render: (expense) => expense.start_date || "-",
  },
  {
    key: "end_date",
    header: "End",
    width: "130px",
    render: (expense) => expense.end_date || "-",
  },
];

function formatMoney(value: string | null) {
  if (!value) {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
