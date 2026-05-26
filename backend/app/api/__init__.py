from app.api.contractor import router as contractor_router
from app.api.ref.contractor_type import router as contractor_type_router
from app.api.ref.country import router as country_router
from app.api.document import router as document_router
from app.api.document_link import router as document_link_router
from app.api.ref.document_type import router as document_type_router
from app.api.ref.expense_type import router as expense_type_router
from app.api.expense import router as expense_router
from app.api.ref.financial_institution import router as financial_institution_router
from app.api.ref.financial_institution_branch import router as financial_institution_branch_router
from app.api.financial_account import router as financial_account_router
from app.api.financial_transaction import router as financial_transaction_router
from app.api.lease import router as lease_router
from app.api.lease_deposit import router as lease_deposit_router
from app.api.lease_rent_period import router as lease_rent_period_router
from app.api.ledger_entry import router as ledger_entry_router
from app.api.ref.locale import router as locale_router
from app.api.payment import router as payment_router
from app.api.payment_coverage import router as payment_coverage_router
from app.api.property import router as property_router
from app.api.property_access import router as property_access_router
from app.api.recurring_expense_schedule import router as recurring_expense_schedule_router
from app.api.ref.property_access_level import router as property_access_level_router
from app.api.ref.role import router as role_router
from app.api.ref.ref_code import router as ref_code_router
from app.api.ref.region import router as region_router
from app.api.reminder import router as reminder_router
from app.api.ref.status_code import router as status_code_router
from app.api.tax_record import router as tax_record_router
from app.api.user_legal_name import router as user_legal_name_router
from app.api.ref.utility_type import router as utility_type_router
from app.api.utility_bill import router as utility_bill_router
from app.api.user import router as user_router
from app.api.user_auth import router as user_auth_router


all_routers = [
    contractor_type_router,
    contractor_router,
    country_router,
    document_router,
    document_link_router,
    document_type_router,
    expense_type_router,
    expense_router,
    financial_institution_router,
    financial_institution_branch_router,
    financial_account_router,
    financial_transaction_router,
    lease_router,
    lease_deposit_router,
    lease_rent_period_router,
    ledger_entry_router,
    locale_router,
    payment_router,
    payment_coverage_router,
    property_router,
    property_access_router,
    recurring_expense_schedule_router,
    property_access_level_router,
    ref_code_router,
    region_router,
    reminder_router,
    role_router,
    status_code_router,
    tax_record_router,
    user_legal_name_router,
    utility_type_router,
    utility_bill_router,
    user_router,
    user_auth_router,
]
