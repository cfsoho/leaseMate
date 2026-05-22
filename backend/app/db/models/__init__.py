from app.db.models.user import User
from app.db.models.user_verification_token import UserVerificationToken
from app.db.models.user_refresh_token import UserRefreshToken
from app.db.models.user_legal_name import UserLegalName
from app.db.models.role import Role
from app.db.models.property import Property
from app.db.models.property_access import PropertyAccess
from app.db.models.property_access_level import PropertyAccessLevel
from app.db.models.contractor import Contractor
from app.db.models.contractor_type import ContractorType
from app.db.models.country import Country
from app.db.models.expense_type import ExpenseType
from app.db.models.expense import Expense
from app.db.models.financial_institution import FinancialInstitution
from app.db.models.financial_institution_branch import FinancialInstitutionBranch
from app.db.models.financial_account import FinancialAccount
from app.db.models.financial_transaction import FinancialTransaction
from app.db.models.utility_type import UtilityType
from app.db.models.locale import Locale
from app.db.models.lease import Lease
from app.db.models.payment import Payment
from app.db.models.payment_coverage import PaymentCoverage
from app.db.models.document import Document
from app.db.models.document_type import DocumentType
from app.db.models.document_link import DocumentLink
from app.db.models.ledger_entry import LedgerEntry
from app.db.models.tax_record import TaxRecord
from app.db.models.utility_bill import UtilityBill


# Optional: so Base.metadata.create_all() knows all tables