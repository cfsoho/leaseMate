from app.db.models.user import User
from app.db.models.user_verification_token import UserVerificationToken
from app.db.models.user_refresh_token import UserRefreshToken
from app.db.models.user_passkey import UserPasskey
from app.db.models.user_webauthn_challenge import UserWebAuthnChallenge
from app.db.models.user_legal_name import UserLegalName
from app.db.models.user_delegation import UserDelegation
from app.db.models.system_setting import SystemSetting
from app.db.models.ref.role import Role
from app.db.models.ref.region import Region
from app.db.models.ref.status_code import StatusCode
from app.db.models.property_building import PropertyBuilding
from app.db.models.property import Property
from app.db.models.property_access import PropertyAccess
from app.db.models.ref.property_access_level import PropertyAccessLevel
from app.db.models.contractor import Contractor
from app.db.models.ref.contractor_type import ContractorType
from app.db.models.ref.country import Country
from app.db.models.ref.expense_type import ExpenseType
from app.db.models.expense import Expense
from app.db.models.ref.financial_institution import FinancialInstitution
from app.db.models.ref.financial_institution_branch import FinancialInstitutionBranch
from app.db.models.financial_account import FinancialAccount
from app.db.models.financial_transaction import FinancialTransaction
from app.db.models.ref.utility_type import UtilityType
from app.db.models.ref.locale import Locale
from app.db.models.lease import Lease
from app.db.models.payment import Payment
from app.db.models.payment_coverage import PaymentCoverage
from app.db.models.document import Document
from app.db.models.ref.document_type import DocumentType
from app.db.models.document_link import DocumentLink
from app.db.models.ledger_entry import LedgerEntry
from app.db.models.tax_record import TaxRecord
from app.db.models.utility_bill import UtilityBill
from app.db.models.lease_rent_period import LeaseRentPeriod
from app.db.models.lease_deposit import LeaseDeposit
from app.db.models.recurring_expense_schedule import RecurringExpenseSchedule
from app.db.models.reminder import Reminder
from app.db.models.ref.ref_code import (
    RoleCodeRef,
    UserStatusRef,
    UserVerificationTokenTypeRef,
    PropertyAccessLevelCodeRef,
    DocumentStatusRef,
    DocumentVisibilityRef,
    DocumentObjectTypeRef,
    FinancialTransactionSourceTypeRef,
    LedgerEntryTypeRef,
)


# Optional: so Base.metadata.create_all() knows all tables
