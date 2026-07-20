import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class PropertyBuilding(Base):
    __tablename__ = "property_buildings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Building, estate, condominium, apartment, or house group name.
    #
    # Examples:
    # - The Address Siam-Ratchathewi
    # - Park Court Akasaka
    # - Family house compound
    name = Column(
        String(100),
        nullable=False,
        comment="Building or property-location name shared by one or more properties.",
    )

    # Street address shared by properties in this building.
    address = Column(
        String(255),
        nullable=True,
        comment="Street address for the building or shared property location.",
    )

    # District/ward/area inside the city.
    district = Column(
        String(100),
        nullable=True,
        comment="District, ward, or area for the building.",
    )

    # City where the building is located.
    city = Column(
        String(100),
        nullable=True,
        index=True,
        comment="City where the building is located.",
    )

    # Postal or ZIP code for the building address.
    zipcode = Column(
        String(20),
        nullable=True,
        comment="Postal or ZIP code for the building.",
    )

    # Physical/legal country of the building.
    country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        nullable=False,
        index=True,
        comment="Country where the building is physically located.",
    )

    # Building-level coordinates. Individual units normally share these.
    latitude = Column(
        Numeric(10, 8),
        nullable=True,
        comment="Latitude for the building location.",
    )

    longitude = Column(
        Numeric(11, 8),
        nullable=True,
        comment="Longitude for the building location.",
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        comment="Whether this building can be selected for properties.",
    )

    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    country = relationship("Country", back_populates="property_buildings")
    properties = relationship("Property", back_populates="building")
