# app/models/enums/document_object_type.py
import enum

class DocumentObjectType(str, enum.Enum):
    PROPERTY = "property"
    LEASE = "lease"
    PAYMENT = "payment"
    EXPENSE = "expense"
    UTILITY = "utility"
    TAX_RECORD = "tax_record"
    LEDGER = "ledger"
    CONTRACTOR = "contractor"
    TENANT = "tenant"
