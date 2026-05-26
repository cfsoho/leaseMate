import type { FormFieldConfig } from "../../components/data/dataTypes";
import type { ExpenseCreatePayload } from "./expense.types";

export const defaultExpenseCreateValue: ExpenseCreatePayload = {
  property_id: "",
  expense_type_id: "",
  contractor_id: "",
  quoted_amount: "",
  actual_amount: "",
  start_date: "",
  end_date: "",
  description: "",
  status_id: "",
};

export const expenseFormFields: FormFieldConfig<ExpenseCreatePayload>[] = [
  {
    name: "property_id",
    label: "Property ID",
    type: "text",
    required: true,
    placeholder: "Property UUID",
  },
  {
    name: "expense_type_id",
    label: "Expense type ID",
    type: "text",
    placeholder: "Expense type UUID",
  },
  {
    name: "contractor_id",
    label: "Contractor ID",
    type: "text",
    placeholder: "Contractor UUID",
  },
  {
    name: "quoted_amount",
    label: "Quoted amount",
    type: "money",
    placeholder: "0.00",
  },
  {
    name: "actual_amount",
    label: "Actual amount",
    type: "money",
    placeholder: "0.00",
  },
  {
    name: "start_date",
    label: "Start date",
    type: "date",
  },
  {
    name: "end_date",
    label: "End date",
    type: "date",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
  },
  {
    name: "status_id",
    label: "Status ID",
    type: "text",
    placeholder: "Status UUID",
    helpText: "This will become a status select after ref data loaders are wired.",
  },
];
