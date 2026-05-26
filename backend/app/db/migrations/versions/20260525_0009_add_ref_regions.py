"""add ref regions

Revision ID: 20260525_0009
Revises: 20260525_0008
Create Date: 2026-05-25 00:09:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260525_0009"
down_revision = "20260525_0008"
branch_labels = None
depends_on = None


uuid = postgresql.UUID(as_uuid=True)

REGIONS = (
    ("11111111-2222-4000-8000-000000000001", "AFRICA", "Africa", 10),
    ("11111111-2222-4000-8000-000000000002", "AMERICAS", "Americas", 20),
    ("11111111-2222-4000-8000-000000000003", "ANTARCTICA", "Antarctica", 30),
    ("11111111-2222-4000-8000-000000000004", "ASIA", "Asia", 40),
    ("11111111-2222-4000-8000-000000000005", "EUROPE", "Europe", 50),
    ("11111111-2222-4000-8000-000000000006", "OCEANIA", "Oceania", 60),
)


def upgrade():
    op.create_table(
        "regions",
        sa.Column("id", uuid, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False, comment="Stable region code used by the application."),
        sa.Column("name", sa.String(length=100), nullable=False, comment="Human-readable region name."),
        sa.Column("description", sa.String(length=255), nullable=True, comment="Optional description of what this region contains."),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true(), comment="Whether this region can be selected in forms."),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0", comment="Display order for region selectors."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="ref",
    )
    op.create_index("ix_ref_regions_code", "regions", ["code"], unique=True, schema="ref")
    op.create_index("ix_ref_regions_is_deleted", "regions", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_regions_deleted_by", "regions", ["deleted_by"], unique=False, schema="ref")

    for region_id, code, name, sort_order in REGIONS:
        op.execute(
            sa.text(
                """
                INSERT INTO ref.regions
                    (id, code, name, description, is_active, sort_order, is_deleted)
                VALUES
                    (:id, :code, :name, :description, true, :sort_order, false)
                """
            ).bindparams(
                id=region_id,
                code=code,
                name=name,
                description=f"Countries and territories in {name}.",
                sort_order=sort_order,
            )
        )

    op.add_column(
        "countries",
        sa.Column(
            "region_id",
            uuid,
            nullable=True,
            comment="Reference region ID for geographical grouping",
        ),
        schema="ref",
    )
    op.create_index("ix_ref_countries_region_id", "countries", ["region_id"], unique=False, schema="ref")

    for region_id, _, name, _ in REGIONS:
        op.execute(
            sa.text(
                "UPDATE ref.countries SET region_id = :region_id WHERE region = :region"
            ).bindparams(region_id=region_id, region=name)
        )

    op.create_foreign_key(
        "fk_ref_countries_region_id_ref_regions",
        "countries",
        "regions",
        ["region_id"],
        ["id"],
        source_schema="ref",
        referent_schema="ref",
    )
    op.drop_column("countries", "region", schema="ref")


def downgrade():
    op.add_column(
        "countries",
        sa.Column("region", sa.String(length=50), nullable=True, comment="Geographical region or continent"),
        schema="ref",
    )

    for region_id, _, name, _ in REGIONS:
        op.execute(
            sa.text(
                "UPDATE ref.countries SET region = :region WHERE region_id = :region_id"
            ).bindparams(region=name, region_id=region_id)
        )

    op.drop_constraint(
        "fk_ref_countries_region_id_ref_regions",
        "countries",
        schema="ref",
        type_="foreignkey",
    )
    op.drop_index("ix_ref_countries_region_id", table_name="countries", schema="ref")
    op.drop_column("countries", "region_id", schema="ref")

    op.drop_index("ix_ref_regions_deleted_by", table_name="regions", schema="ref")
    op.drop_index("ix_ref_regions_is_deleted", table_name="regions", schema="ref")
    op.drop_index("ix_ref_regions_code", table_name="regions", schema="ref")
    op.drop_table("regions", schema="ref")
