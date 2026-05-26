"""add user email verified timestamp

Revision ID: 20260525_0005
Revises: 20260525_0004
Create Date: 2026-05-25 00:05:00
"""
from alembic import op
import sqlalchemy as sa


revision = "20260525_0005"
down_revision = "20260525_0004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "email_verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Timestamp when the user confirmed ownership of the login email.",
        ),
    )


def downgrade():
    op.drop_column("users", "email_verified_at")
