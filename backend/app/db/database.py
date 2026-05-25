# backend/app/db/database.py
from sqlalchemy import Boolean, Column, DateTime, create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session as SQLAlchemySession, sessionmaker, with_loader_criteria
from sqlalchemy.dialects.postgresql import UUID
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Example: postgresql+psycopg2://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@db:5432/leasemate"
)

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class SoftDeleteMixin:
    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True, index=True)


# Base class for all models
Base = declarative_base(cls=SoftDeleteMixin)


@event.listens_for(SQLAlchemySession, "do_orm_execute")
def _exclude_soft_deleted_rows(execute_state):
    if (
        execute_state.is_select
        and not execute_state.execution_options.get("include_deleted", False)
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                SoftDeleteMixin,
                lambda cls: cls.is_deleted.is_(False),
                include_aliases=True,
            )
        )


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
