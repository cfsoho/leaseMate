# app/db/init_db.py
from sqlalchemy import text
from app.db.database import engine, Base
import pkgutil, importlib, app.db.models

def import_all_models():
    """Auto-import every Python module inside app/db/models"""
    for _, module_name, _ in pkgutil.iter_modules(app.db.models.__path__):
        importlib.import_module(f"app.db.models.{module_name}")

def init_db():
    # 👇 dynamically load all model classes
    import_all_models()

    # Ensure a schema exists (optional)
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS ref"))
        conn.commit()

    # Create tables for every model that inherits from Base
    Base.metadata.create_all(bind=engine)
