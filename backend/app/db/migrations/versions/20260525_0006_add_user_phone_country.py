"""add user phone country

Revision ID: 20260525_0006
Revises: 20260525_0005
Create Date: 2026-05-25 00:06:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260525_0006"
down_revision = "20260525_0005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "phone_country_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
            comment="Country whose dialing prefix and phone mask apply to this phone number.",
        ),
    )
    op.create_index("ix_users_phone_country_id", "users", ["phone_country_id"])
    op.create_foreign_key(
        "fk_users_phone_country_id_ref_countries",
        "users",
        "countries",
        ["phone_country_id"],
        ["id"],
        referent_schema="ref",
    )


def downgrade():
    op.drop_constraint(
        "fk_users_phone_country_id_ref_countries",
        "users",
        type_="foreignkey",
    )
    op.drop_index("ix_users_phone_country_id", table_name="users")
    op.drop_column("users", "phone_country_id")
