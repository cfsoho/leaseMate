from app.api.contractor import router as contractor_router
from app.api.contractor_type import router as contractor_type_router
from app.api.document_type import router as document_type_router
from app.api.expense_type import router as expense_type_router
from app.api.expense import router as expense_router
from app.api.lease import router as lease_router
from app.api.ledger_entry import router as ledger_entry_router
from app.api.locale import router as locale_router
from app.api.payment import router as payment_router
from app.api.payment_coverage import router as payment_coverage_router

all_routers = [
    contractor_type_router,
    contractor_router,
    document_type_router,
    expense_type_router,
    expense_router,
    lease_router,
    ledger_entry_router,
    locale_router,
    payment_router,
    payment_coverage_router,
]