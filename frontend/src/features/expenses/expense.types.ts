export type Expense = {
  id: string;
  property_id: string;
  expense_type_id: string | null;
  contractor_id: string | null;
  quoted_amount: string | null;
  actual_amount: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  status_id: string;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type ExpenseCreatePayload = {
  property_id: string;
  expense_type_id: string;
  contractor_id: string;
  quoted_amount: string;
  actual_amount: string;
  start_date: string;
  end_date: string;
  description: string;
  status_id: string;
};

export type ExpenseUpdatePayload = Partial<ExpenseCreatePayload>;
