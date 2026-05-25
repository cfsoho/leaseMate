import os

from fastapi import FastAPI

from app.api import all_routers
from app.db.init_db import init_db

app = FastAPI()

if os.getenv("AUTO_CREATE_TABLES", "false").lower() == "true":
    init_db()

for router in all_routers:
    app.include_router(router)
