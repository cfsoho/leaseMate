"""add locale name order

Revision ID: 20260525_0002
Revises: 20260525_0001
Create Date: 2026-05-25 00:02:00
"""
from alembic import op
import sqlalchemy as sa


revision = "20260525_0002"
down_revision = "20260525_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "locales",
        sa.Column(
            "name_order",
            sa.String(length=20),
            nullable=False,
            server_default="GIVEN_FAMILY",
        ),
        schema="ref",
    )
    op.execute(
        sa.text(
            """
            update ref.locales
            set name_order = 'FAMILY_GIVEN'
            where split_part(code, '-', 1) in ('ja', 'ko', 'zh')
            """
        )
    )
    op.alter_column("locales", "name_order", server_default=None, schema="ref")


def downgrade():
    op.drop_column("locales", "name_order", schema="ref")
