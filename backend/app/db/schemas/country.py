from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


class CountryBase(BaseModel):
    code: str = Field(..., max_length=3)
    alpha2: str = Field(..., max_length=2)

    name: str = Field(..., max_length=100)
    native_name: Optional[str] = Field(None, max_length=100)

    phone_prefix: Optional[str] = Field(None, max_length=6)
    region: Optional[str] = Field(None, max_length=50)

    currency_code: str = Field(..., max_length=3)

    default_locale_code: Optional[str] = Field(None, max_length=10)


class CountryCreate(CountryBase):
    pass


class CountryUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=3)
    alpha2: Optional[str] = Field(None, max_length=2)

    name: Optional[str] = Field(None, max_length=100)
    native_name: Optional[str] = Field(None, max_length=100)

    phone_prefix: Optional[str] = Field(None, max_length=6)
    region: Optional[str] = Field(None, max_length=50)

    currency_code: Optional[str] = Field(None, max_length=3)

    default_locale_code: Optional[str] = Field(None, max_length=10)


class CountryRead(CountryBase):
    id: UUID

    class Config:
        from_attributes = True