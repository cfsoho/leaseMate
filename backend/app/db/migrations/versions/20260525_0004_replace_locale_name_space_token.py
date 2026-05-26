"""replace locale name space token

Revision ID: 20260525_0004
Revises: 20260525_0003
Create Date: 2026-05-25 00:04:00
"""
from alembic import op
import sqlalchemy as sa


revision = "20260525_0004"
down_revision = "20260525_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        sa.text(
            """
            update ref.locales
            set name_format_mask = replace(name_format_mask, '{space}', ' ')
            where name_format_mask like '%{space}%'
            """
        )
    )


def downgrade():
    op.execute(
        sa.text(
            """
            update ref.locales
            set name_format_mask = replace(
                name_format_mask,
                '{given_name} {family_name}',
                '{given_name}{space}{family_name}'
            )
            where name_format_mask = '{given_name} {family_name}'
            """
        )
    )
