from app.api.contractor import router as contractor_router
from app.api.contractor_type import router as contractor_type_router

all_routers = [
    contractor_type_router,
    contractor_router,
]