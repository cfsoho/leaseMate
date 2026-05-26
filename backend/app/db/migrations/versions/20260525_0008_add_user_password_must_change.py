"""add user password must change

Revision ID: 20260525_0008
Revises: 20260525_0007
Create Date: 2026-05-25 00:08:00
"""
from alembic import op
import sqlalchemy as sa


revision = "20260525_0008"
down_revision = "20260525_0007"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "password_must_change",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment="Whether the user must change the temporary password before normal use.",
        ),
    )


def downgrade():
    op.drop_column("users", "password_must_change")
