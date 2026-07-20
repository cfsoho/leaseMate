from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PropertyBuildingCreate(BaseModel):
    name: str = Field(..., max_length=100)
    address: Optional[str] = Field(default=None, max_length=255)
    district: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    zipcode: Optional[str] = Field(default=None, max_length=20)
    country_id: UUID
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    is_active: bool = True


class PropertyBuildingUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=255)
    district: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    zipcode: Optional[str] = Field(default=None, max_length=20)
    country_id: Optional[UUID] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    is_active: Optional[bool] = None


class PropertyBuildingRead(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    district: Optional[str]
    city: Optional[str]
    zipcode: Optional[str]
    country_id: UUID
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
