"""normalize country default locales

Revision ID: 20260525_0007
Revises: 20260525_0006
Create Date: 2026-05-25 00:07:00
"""
from alembic import op


revision = "20260525_0007"
down_revision = "20260525_0006"
branch_labels = None
depends_on = None


def upgrade():
    mappings = {
        "HK": "zh-Hant-HK",
        "JP": "ja",
        "TH": "th",
        "TW": "zh-Hant-TW",
        "US": "en",
    }

    for alpha2, locale_code in mappings.items():
        op.execute(
            "UPDATE ref.countries "
            f"SET default_locale_code = '{locale_code}' "
            f"WHERE alpha2 = '{alpha2}'"
        )


def downgrade():
    mappings = {
        "HK": "zh-Hant-HK",
        "JP": "ja-JP",
        "TH": "th-TH",
        "TW": "zh-Hant-TW",
        "US": "en-US",
    }

    for alpha2, locale_code in mappings.items():
        op.execute(
            "UPDATE ref.countries "
            f"SET default_locale_code = '{locale_code}' "
            f"WHERE alpha2 = '{alpha2}'"
        )
