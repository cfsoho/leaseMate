# app/db/models/enums/ledger_entry_type.py

import enum

class LedgerEntryType(str, enum.Enum):
    RENT_INCOME = "rent_income"
    OTHER_INCOME = "other_income"
    UTILITY_EXPENSE = "utility_expense"
    MAINTENANCE = "maintenance"
    TAX_PAYMENT = "tax_payment"
    BANK_FEE = "bank_fee"
    OTHER_EXPENSE = "other_expense"
