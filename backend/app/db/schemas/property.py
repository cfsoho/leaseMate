from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PropertyCreate(BaseModel):
    name: str

    building_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    zipcode: Optional[str] = None

    country_id: Optional[UUID] = None

    user_id: UUID

    purchase_price: Optional[Decimal] = None
    purchase_currency: Optional[str] = None
    purchase_fx_rate: Optional[Decimal] = None
    purchase_date: Optional[date] = None

    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    status: str = "active"


class PropertyUpdate(BaseModel):
    name: Optional[str] = None

    building_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    zipcode: Optional[str] = None

    country_id: Optional[UUID] = None

    user_id: Optional[UUID] = None

    purchase_price: Optional[Decimal] = None
    purchase_currency: Optional[str] = None
    purchase_fx_rate: Optional[Decimal] = None
    purchase_date: Optional[date] = None

    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    status: Optional[str] = None


class PropertyRead(BaseModel):
    id: UUID

    name: str

    building_name: Optional[str]
    address: Optional[str]
    district: Optional[str]
    city: Optional[str]
    zipcode: Optional[str]

    country_id: Optional[UUID]

    user_id: UUID

    purchase_price: Optional[Decimal]
    purchase_currency: Optional[str]
    purchase_fx_rate: Optional[Decimal]
    purchase_date: Optional[date]

    latitude: Optional[Decimal]
    longitude: Optional[Decimal]

    status: str

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True