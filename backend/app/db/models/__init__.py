from app.db.models.tenant import Tenant
from app.db.models.lease import Lease
from app.db.models.expense import Expense

# Optional: so Base.metadata.create_all() knows all tables
MODELS = [Tenant, Lease, Expense]
