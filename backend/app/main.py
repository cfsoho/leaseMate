from fastapi import FastAPI, Depends
from sqlalchemy import text
from contextlib import asynccontextmanager
from app.db.init_db import init_db
from app.db.database import engine, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Initializing database tables...")
    init_db()
    print("✅ Tables created or verified.")
    yield  # 👈 app runs here
    print("🛑 Shutting down app...")
    engine.dispose()  # closes pooled connections cleanly

app = FastAPI(lifespan=lifespan)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "LeaseMate backend running"}

@app.get("/api/db-check")
def db_check(db=Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Database connected successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Later, when routers are ready:
# from app.routers import tenants
# app.include_router(tenants.router)
