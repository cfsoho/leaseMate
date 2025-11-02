from pydantic import BaseModel, Field
from uuid import UUID

class CountryBase(BaseModel):
    code: str = Field(..., max_length=3)
    name: str
    phone_prefix: str | None = None
    region: str | None = None

class CountryCreate(CountryBase):
    pass

class CountryRead(CountryBase):
    id: UUID

    class Config:
        orm_mode = True  # ✅ enables auto conversion from SQLAlchemy model
