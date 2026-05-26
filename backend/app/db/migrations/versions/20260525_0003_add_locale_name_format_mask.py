"""add locale name format mask

Revision ID: 20260525_0003
Revises: 20260525_0002
Create Date: 2026-05-25 00:03:00
"""
from alembic import op
import sqlalchemy as sa


revision = "20260525_0003"
down_revision = "20260525_0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "locales",
        sa.Column(
            "name_format_mask",
            sa.String(length=100),
            nullable=False,
            server_default="{given_name} {family_name}",
        ),
        schema="ref",
    )
    op.execute(
        sa.text(
            """
            update ref.locales
            set name_format_mask = '{family_name}{given_name}'
            where name_order = 'FAMILY_GIVEN'
            """
        )
    )
    op.alter_column(
        "locales",
        "name_format_mask",
        server_default=None,
        schema="ref",
    )


def downgrade():
    op.drop_column("locales", "name_format_mask", schema="ref")
