"""create initial schema

Revision ID: 20260525_0001
Revises:
Create Date: 2026-05-25 00:01:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260525_0001"
down_revision = None
branch_labels = None
depends_on = None


uuid = postgresql.UUID(as_uuid=True)

REF_CODE_TABLES = (
    "role_codes",
    "user_statuses",
    "user_verification_token_types",
    "property_access_level_codes",
    "document_statuses",
    "document_visibilities",
    "document_object_types",
    "financial_transaction_source_types",
)


def create_ref_code_table(table_name):
    op.create_table(
        table_name,
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("code"),
        schema="ref",
    )
    op.create_index(f"ix_ref_{table_name}_is_deleted", table_name, ["is_deleted"], unique=False, schema="ref")
    op.create_index(f"ix_ref_{table_name}_deleted_by", table_name, ["deleted_by"], unique=False, schema="ref")


def upgrade():
    op.execute(sa.text("CREATE SCHEMA IF NOT EXISTS ref"))

    op.create_table(
        "locales",
        sa.Column("code", sa.String(length=35), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("native_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("code"),
        schema="ref",
    )
    op.create_index("ix_ref_locales_is_deleted", "locales", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_locales_deleted_by", "locales", ["deleted_by"], unique=False, schema="ref")

    op.create_table(
        "countries",
        sa.Column("id", uuid, nullable=False),
        sa.Column("code", sa.String(length=3), nullable=False, comment="ISO 3166-1 alpha-3 country code"),
        sa.Column("alpha2", sa.String(length=2), nullable=False, comment="ISO 3166-1 alpha-2 country code"),
        sa.Column("name", sa.String(length=255), nullable=False, comment="Official country display name"),
        sa.Column("native_name", sa.String(length=255), nullable=True, comment="Country name in its native/local language"),
        sa.Column("phone_prefix", sa.String(length=6), nullable=True, comment="International dialing prefix"),
        sa.Column("mobile_phone_format", sa.String(length=50), nullable=True, comment="National mobile phone display format using X placeholders"),
        sa.Column("landline_phone_format", sa.String(length=50), nullable=True, comment="National landline phone display format using X placeholders"),
        sa.Column("region", sa.String(length=50), nullable=True, comment="Geographical region or continent"),
        sa.Column("currency_code", sa.String(length=3), nullable=False, comment="ISO 4217 currency code"),
        sa.Column("default_locale_code", sa.String(length=35), nullable=True, comment="Default locale code for this country"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["default_locale_code"], ["ref.locales.code"]),
        sa.PrimaryKeyConstraint("id"),
        schema="ref",
    )
    op.create_index("ix_ref_countries_is_deleted", "countries", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_countries_deleted_by", "countries", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_countries_alpha2", "countries", ["alpha2"], unique=True, schema="ref")
    op.create_index("ix_ref_countries_code", "countries", ["code"], unique=True, schema="ref")
    op.create_index("ix_ref_countries_default_locale_code", "countries", ["default_locale_code"], unique=False, schema="ref")

    for table_name in REF_CODE_TABLES:
        create_ref_code_table(table_name)

    op.create_table(
        "ledger_entry_types",
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_income", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("code"),
        schema="ref",
    )
    op.create_index("ix_ref_ledger_entry_types_is_deleted", "ledger_entry_types", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_ledger_entry_types_deleted_by", "ledger_entry_types", ["deleted_by"], unique=False, schema="ref")

    op.create_table(
        "roles",
        sa.Column("id", uuid, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["code"], ["ref.role_codes.code"]),
        sa.PrimaryKeyConstraint("id"),
        schema="ref",
    )
    op.create_index("ix_ref_roles_is_deleted", "roles", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_roles_deleted_by", "roles", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_roles_code", "roles", ["code"], unique=True, schema="ref")

    op.create_table(
        "status_codes",
        sa.Column("id", uuid, nullable=False, comment="Shared multilingual status UUID stored by business tables as status_id."),
        sa.Column("locale", sa.String(length=35), nullable=False, comment="Locale code for this translated status row."),
        sa.Column("group_code", sa.String(length=50), nullable=False, comment="Business area this status belongs to, such as PROPERTY, LEASE, or EXPENSE."),
        sa.Column("code", sa.String(length=50), nullable=False, comment="Stable internal status code used by backend logic and seed upserts."),
        sa.Column("name", sa.String(length=100), nullable=False, comment="Localized display name for this status."),
        sa.Column("description", sa.String(length=255), nullable=True, comment="Optional localized help text for this status."),
        sa.Column("is_terminal", sa.Boolean(), nullable=False, comment="Whether this status normally ends the workflow."),
        sa.Column("is_success", sa.Boolean(), nullable=False, comment="Whether this status represents a successful or desired completion state."),
        sa.Column("is_active", sa.Boolean(), nullable=False, comment="Whether this status can be selected for new records."),
        sa.Column("sort_order", sa.Integer(), nullable=False, comment="Display order within the same status group."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True, comment="Timestamp when the status code row was created."),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True, comment="Timestamp when the status code row was last updated."),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id", "locale"),
        sa.UniqueConstraint("group_code", "code", "locale", name="uq_status_code_group_code_locale"),
        schema="ref",
    )
    op.create_index("ix_ref_status_codes_code", "status_codes", ["code"], unique=False, schema="ref")
    op.create_index("ix_ref_status_codes_deleted_by", "status_codes", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_status_codes_group_code", "status_codes", ["group_code"], unique=False, schema="ref")
    op.create_index("ix_ref_status_codes_is_deleted", "status_codes", ["is_deleted"], unique=False, schema="ref")

    op.create_table(
        "contractor_types",
        sa.Column("id", uuid, nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id", "locale"),
        sa.UniqueConstraint("code", "locale", name="uq_contractor_type_code_locale"),
        schema="ref",
    )
    op.create_index("ix_ref_contractor_types_is_deleted", "contractor_types", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_contractor_types_deleted_by", "contractor_types", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_contractor_types_code", "contractor_types", ["code"], unique=False, schema="ref")

    op.create_table(
        "contractors",
        sa.Column("id", uuid, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("contact_person", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=100), nullable=True),
        sa.Column("contractor_type_id", uuid, nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contractors_is_deleted", "contractors", ["is_deleted"], unique=False)
    op.create_index("ix_contractors_deleted_by", "contractors", ["deleted_by"], unique=False)
    op.create_index("ix_contractors_contractor_type_id", "contractors", ["contractor_type_id"], unique=False)
    op.create_index("ix_contractors_email", "contractors", ["email"], unique=False)
    op.create_index("ix_contractors_name", "contractors", ["name"], unique=False)
    op.create_index("ix_contractors_phone", "contractors", ["phone"], unique=False)

    op.create_table(
        "document_types",
        sa.Column("id", uuid, nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id", "locale"),
        sa.UniqueConstraint("code", "locale", name="uq_document_type_code_locale"),
        schema="ref",
    )
    op.create_index("ix_ref_document_types_is_deleted", "document_types", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_document_types_deleted_by", "document_types", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_document_types_code", "document_types", ["code"], unique=False, schema="ref")

    op.create_table(
        "expense_types",
        sa.Column("id", uuid, nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id", "locale"),
        sa.UniqueConstraint("code", "locale", name="uq_expense_type_code_locale"),
        schema="ref",
    )
    op.create_index("ix_ref_expense_types_is_deleted", "expense_types", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_expense_types_deleted_by", "expense_types", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_expense_types_code", "expense_types", ["code"], unique=False, schema="ref")

    op.create_table(
        "property_access_levels",
        sa.Column("id", uuid, nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["code"], ["ref.property_access_level_codes.code"]),
        sa.PrimaryKeyConstraint("id", "locale"),
        sa.UniqueConstraint("code", "locale", name="uq_property_access_level_code_locale"),
        schema="ref",
    )
    op.create_index("ix_ref_property_access_levels_is_deleted", "property_access_levels", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_property_access_levels_deleted_by", "property_access_levels", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_property_access_levels_code", "property_access_levels", ["code"], unique=False, schema="ref")

    op.create_table(
        "utility_types",
        sa.Column("id", uuid, nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.PrimaryKeyConstraint("id", "locale"),
        sa.UniqueConstraint("code", "locale", name="uq_utility_type_code_locale"),
        schema="ref",
    )
    op.create_index("ix_ref_utility_types_is_deleted", "utility_types", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_utility_types_deleted_by", "utility_types", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_utility_types_code", "utility_types", ["code"], unique=False, schema="ref")

    op.create_table(
        "users",
        sa.Column("id", uuid, nullable=False),
        sa.Column("family_name", sa.String(length=50), nullable=False),
        sa.Column("given_name", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("role_id", uuid, nullable=True),
        sa.Column("preferred_locale_code", sa.String(length=35), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["preferred_locale_code"], ["ref.locales.code"]),
        sa.ForeignKeyConstraint(["role_id"], ["ref.roles.id"]),
        sa.ForeignKeyConstraint(["status"], ["ref.user_statuses.code"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_is_deleted", "users", ["is_deleted"], unique=False)
    op.create_index("ix_users_deleted_by", "users", ["deleted_by"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_preferred_locale_code", "users", ["preferred_locale_code"], unique=False)
    op.create_index("ix_users_role_id", "users", ["role_id"], unique=False)
    op.create_index("ix_users_status", "users", ["status"], unique=False)

    op.create_table(
        "user_legal_names",
        sa.Column("id", uuid, nullable=False),
        sa.Column("user_id", uuid, nullable=False),
        sa.Column("country_id", uuid, nullable=False),
        sa.Column("locale_code", sa.String(length=35), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["country_id"], ["ref.countries.id"]),
        sa.ForeignKeyConstraint(["locale_code"], ["ref.locales.code"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "country_id", "locale_code", name="uq_user_legal_name_user_country_locale"),
    )
    op.create_index("ix_user_legal_names_is_deleted", "user_legal_names", ["is_deleted"], unique=False)
    op.create_index("ix_user_legal_names_deleted_by", "user_legal_names", ["deleted_by"], unique=False)
    op.create_index("ix_user_legal_names_country_id", "user_legal_names", ["country_id"], unique=False)
    op.create_index("ix_user_legal_names_locale_code", "user_legal_names", ["locale_code"], unique=False)
    op.create_index("ix_user_legal_names_user_id", "user_legal_names", ["user_id"], unique=False)

    op.create_table(
        "properties",
        sa.Column("id", uuid, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("building_name", sa.String(length=100), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("district", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("zipcode", sa.String(length=20), nullable=True),
        sa.Column("country_id", uuid, nullable=True),
        sa.Column("user_id", uuid, nullable=False),
        sa.Column("legal_name_id", uuid, nullable=True),
        sa.Column("purchase_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("purchase_currency", sa.String(length=3), nullable=True),
        sa.Column("purchase_fx_rate", sa.Numeric(12, 6), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 8), nullable=True),
        sa.Column("longitude", sa.Numeric(11, 8), nullable=True),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["country_id"], ["ref.countries.id"]),
        sa.ForeignKeyConstraint(["legal_name_id"], ["user_legal_names.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_is_deleted", "properties", ["is_deleted"], unique=False)
    op.create_index("ix_properties_deleted_by", "properties", ["deleted_by"], unique=False)
    op.create_index("ix_properties_city", "properties", ["city"], unique=False)
    op.create_index("ix_properties_country_id", "properties", ["country_id"], unique=False)
    op.create_index("ix_properties_legal_name_id", "properties", ["legal_name_id"], unique=False)
    op.create_index("ix_properties_status_id", "properties", ["status_id"], unique=False)
    op.create_index("ix_properties_user_id", "properties", ["user_id"], unique=False)

    op.create_table(
        "reminders",
        sa.Column("id", uuid, nullable=False),
        sa.Column("user_id", uuid, nullable=True),
        sa.Column("property_id", uuid, nullable=True),
        sa.Column("reminder_type", sa.String(length=50), nullable=False),
        sa.Column("target_type", sa.String(length=50), nullable=True),
        sa.Column("target_id", uuid, nullable=True),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_type"], ["ref.document_object_types.code"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reminders_is_deleted", "reminders", ["is_deleted"], unique=False)
    op.create_index("ix_reminders_deleted_by", "reminders", ["deleted_by"], unique=False)
    op.create_index("ix_reminders_due_at", "reminders", ["due_at"], unique=False)
    op.create_index("ix_reminders_property_id", "reminders", ["property_id"], unique=False)
    op.create_index("ix_reminders_reminder_type", "reminders", ["reminder_type"], unique=False)
    op.create_index("ix_reminders_status_id", "reminders", ["status_id"], unique=False)
    op.create_index("ix_reminders_target_id", "reminders", ["target_id"], unique=False)
    op.create_index("ix_reminders_target_type", "reminders", ["target_type"], unique=False)
    op.create_index("ix_reminders_user_id", "reminders", ["user_id"], unique=False)

    op.create_table(
        "financial_institutions",
        sa.Column("id", uuid, nullable=False),
        sa.Column("country_id", uuid, nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("swift_code", sa.String(length=20), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["country_id"], ["ref.countries.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("country_id", "name", name="uq_financial_institution_country_name"),
        schema="ref",
    )
    op.create_index("ix_ref_financial_institutions_is_deleted", "financial_institutions", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institutions_deleted_by", "financial_institutions", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institutions_country_id", "financial_institutions", ["country_id"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institutions_is_active", "financial_institutions", ["is_active"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institutions_name", "financial_institutions", ["name"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institutions_swift_code", "financial_institutions", ["swift_code"], unique=False, schema="ref")

    op.create_table(
        "financial_institution_branches",
        sa.Column("id", uuid, nullable=False),
        sa.Column("financial_institution_id", uuid, nullable=False),
        sa.Column("branch_name", sa.String(length=100), nullable=False),
        sa.Column("branch_code", sa.String(length=50), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["financial_institution_id"], ["ref.financial_institutions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("financial_institution_id", "branch_name", name="uq_financial_institution_branch_name"),
        schema="ref",
    )
    op.create_index("ix_ref_financial_institution_branches_is_deleted", "financial_institution_branches", ["is_deleted"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institution_branches_deleted_by", "financial_institution_branches", ["deleted_by"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institution_branches_branch_code", "financial_institution_branches", ["branch_code"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institution_branches_branch_name", "financial_institution_branches", ["branch_name"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institution_branches_financial_institution_id", "financial_institution_branches", ["financial_institution_id"], unique=False, schema="ref")
    op.create_index("ix_ref_financial_institution_branches_is_active", "financial_institution_branches", ["is_active"], unique=False, schema="ref")

    op.create_table(
        "financial_accounts",
        sa.Column("id", uuid, nullable=False),
        sa.Column("user_id", uuid, nullable=False),
        sa.Column("legal_name_id", uuid, nullable=True),
        sa.Column("financial_institution_branch_id", uuid, nullable=True),
        sa.Column("account_number", sa.String(length=100), nullable=True),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("current_balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["financial_institution_branch_id"], ["ref.financial_institution_branches.id"]),
        sa.ForeignKeyConstraint(["legal_name_id"], ["user_legal_names.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_financial_accounts_is_deleted", "financial_accounts", ["is_deleted"], unique=False)
    op.create_index("ix_financial_accounts_deleted_by", "financial_accounts", ["deleted_by"], unique=False)
    op.create_index("ix_financial_accounts_financial_institution_branch_id", "financial_accounts", ["financial_institution_branch_id"], unique=False)
    op.create_index("ix_financial_accounts_is_active", "financial_accounts", ["is_active"], unique=False)
    op.create_index("ix_financial_accounts_legal_name_id", "financial_accounts", ["legal_name_id"], unique=False)
    op.create_index("ix_financial_accounts_user_id", "financial_accounts", ["user_id"], unique=False)

    op.create_table(
        "leases",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("landlord_id", uuid, nullable=False),
        sa.Column("tenant_id", uuid, nullable=True),
        sa.Column("agent_id", uuid, nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("rent_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("rent_currency", sa.String(length=3), nullable=False),
        sa.Column("deposit_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("deposit_currency", sa.String(length=3), nullable=True),
        sa.Column("due_day", sa.Integer(), nullable=False),
        sa.Column("payment_cycle", sa.Integer(), nullable=False),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["agent_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["landlord_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leases_is_deleted", "leases", ["is_deleted"], unique=False)
    op.create_index("ix_leases_deleted_by", "leases", ["deleted_by"], unique=False)
    op.create_index("ix_leases_agent_id", "leases", ["agent_id"], unique=False)
    op.create_index("ix_leases_landlord_id", "leases", ["landlord_id"], unique=False)
    op.create_index("ix_leases_property_id", "leases", ["property_id"], unique=False)
    op.create_index("ix_leases_status_id", "leases", ["status_id"], unique=False)
    op.create_index("ix_leases_tenant_id", "leases", ["tenant_id"], unique=False)

    op.create_table(
        "lease_rent_periods",
        sa.Column("id", uuid, nullable=False),
        sa.Column("lease_id", uuid, nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("rent_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["lease_id"], ["leases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lease_id", "period_start", "period_end", name="uq_lease_rent_period_lease_period"),
    )
    op.create_index("ix_lease_rent_periods_is_deleted", "lease_rent_periods", ["is_deleted"], unique=False)
    op.create_index("ix_lease_rent_periods_deleted_by", "lease_rent_periods", ["deleted_by"], unique=False)
    op.create_index("ix_lease_rent_periods_due_date", "lease_rent_periods", ["due_date"], unique=False)
    op.create_index("ix_lease_rent_periods_lease_id", "lease_rent_periods", ["lease_id"], unique=False)
    op.create_index("ix_lease_rent_periods_status_id", "lease_rent_periods", ["status_id"], unique=False)

    op.create_table(
        "lease_deposits",
        sa.Column("id", uuid, nullable=False),
        sa.Column("lease_id", uuid, nullable=False),
        sa.Column("deposit_type", sa.String(length=50), nullable=False),
        sa.Column("amount_due", sa.Numeric(10, 2), nullable=False),
        sa.Column("amount_received", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("received_date", sa.Date(), nullable=True),
        sa.Column("deduction_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("refund_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("refund_date", sa.Date(), nullable=True),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["lease_id"], ["leases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lease_deposits_is_deleted", "lease_deposits", ["is_deleted"], unique=False)
    op.create_index("ix_lease_deposits_deleted_by", "lease_deposits", ["deleted_by"], unique=False)
    op.create_index("ix_lease_deposits_lease_id", "lease_deposits", ["lease_id"], unique=False)
    op.create_index("ix_lease_deposits_status_id", "lease_deposits", ["status_id"], unique=False)

    op.create_table(
        "expenses",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("expense_type_id", uuid, nullable=True),
        sa.Column("contractor_id", uuid, nullable=True),
        sa.Column("quoted_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("actual_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["contractor_id"], ["contractors.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_expenses_is_deleted", "expenses", ["is_deleted"], unique=False)
    op.create_index("ix_expenses_deleted_by", "expenses", ["deleted_by"], unique=False)
    op.create_index("ix_expenses_contractor_id", "expenses", ["contractor_id"], unique=False)
    op.create_index("ix_expenses_expense_type_id", "expenses", ["expense_type_id"], unique=False)
    op.create_index("ix_expenses_property_id", "expenses", ["property_id"], unique=False)
    op.create_index("ix_expenses_status_id", "expenses", ["status_id"], unique=False)

    op.create_table(
        "recurring_expense_schedules",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("expense_type_id", uuid, nullable=True),
        sa.Column("contractor_id", uuid, nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("frequency", sa.String(length=20), nullable=False),
        sa.Column("interval_count", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("next_due_date", sa.Date(), nullable=False),
        sa.Column("auto_create_expense", sa.Boolean(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["contractor_id"], ["contractors.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recurring_expense_schedules_is_deleted", "recurring_expense_schedules", ["is_deleted"], unique=False)
    op.create_index("ix_recurring_expense_schedules_deleted_by", "recurring_expense_schedules", ["deleted_by"], unique=False)
    op.create_index("ix_recurring_expense_schedules_contractor_id", "recurring_expense_schedules", ["contractor_id"], unique=False)
    op.create_index("ix_recurring_expense_schedules_expense_type_id", "recurring_expense_schedules", ["expense_type_id"], unique=False)
    op.create_index("ix_recurring_expense_schedules_next_due_date", "recurring_expense_schedules", ["next_due_date"], unique=False)
    op.create_index("ix_recurring_expense_schedules_property_id", "recurring_expense_schedules", ["property_id"], unique=False)
    op.create_index("ix_recurring_expense_schedules_status_id", "recurring_expense_schedules", ["status_id"], unique=False)

    op.create_table(
        "utility_bills",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("utility_type_id", uuid, nullable=False),
        sa.Column("billing_year", sa.Integer(), nullable=False),
        sa.Column("billing_month", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("paid_date", sa.Date(), nullable=True),
        sa.Column("meter_start", sa.Numeric(10, 2), nullable=True),
        sa.Column("meter_end", sa.Numeric(10, 2), nullable=True),
        sa.Column("status_id", uuid, nullable=False, comment="Current status UUID resolved through ref.status_codes."),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_utility_bills_is_deleted", "utility_bills", ["is_deleted"], unique=False)
    op.create_index("ix_utility_bills_deleted_by", "utility_bills", ["deleted_by"], unique=False)
    op.create_index("ix_utility_bills_billing_month", "utility_bills", ["billing_month"], unique=False)
    op.create_index("ix_utility_bills_billing_year", "utility_bills", ["billing_year"], unique=False)
    op.create_index("ix_utility_bills_property_id", "utility_bills", ["property_id"], unique=False)
    op.create_index("ix_utility_bills_status_id", "utility_bills", ["status_id"], unique=False)
    op.create_index("ix_utility_bills_utility_type_id", "utility_bills", ["utility_type_id"], unique=False)

    op.create_table(
        "tax_records",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("country_id", uuid, nullable=False),
        sa.Column("tax_year", sa.Integer(), nullable=False),
        sa.Column("tax_type_code", sa.String(length=50), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("declared_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("paid_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("paid_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["country_id"], ["ref.countries.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tax_records_is_deleted", "tax_records", ["is_deleted"], unique=False)
    op.create_index("ix_tax_records_deleted_by", "tax_records", ["deleted_by"], unique=False)
    op.create_index("ix_tax_records_country_id", "tax_records", ["country_id"], unique=False)
    op.create_index("ix_tax_records_property_id", "tax_records", ["property_id"], unique=False)
    op.create_index("ix_tax_records_tax_type_code", "tax_records", ["tax_type_code"], unique=False)
    op.create_index("ix_tax_records_tax_year", "tax_records", ["tax_year"], unique=False)

    op.create_table(
        "ledger_entries",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("entry_type", sa.String(length=50), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("is_income", sa.Boolean(), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=True),
        sa.Column("source_id", uuid, nullable=True),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["entry_type"], ["ref.ledger_entry_types.code"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["source_type"], ["ref.document_object_types.code"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ledger_entries_is_deleted", "ledger_entries", ["is_deleted"], unique=False)
    op.create_index("ix_ledger_entries_deleted_by", "ledger_entries", ["deleted_by"], unique=False)
    op.create_index("ix_ledger_entries_entry_date", "ledger_entries", ["entry_date"], unique=False)
    op.create_index("ix_ledger_entries_entry_type", "ledger_entries", ["entry_type"], unique=False)
    op.create_index("ix_ledger_entries_is_income", "ledger_entries", ["is_income"], unique=False)
    op.create_index("ix_ledger_entries_property_id", "ledger_entries", ["property_id"], unique=False)
    op.create_index("ix_ledger_entries_source_id", "ledger_entries", ["source_id"], unique=False)
    op.create_index("ix_ledger_entries_source_type", "ledger_entries", ["source_type"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", uuid, nullable=False),
        sa.Column("lease_id", uuid, nullable=False),
        sa.Column("amount_paid", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("method", sa.String(length=50), nullable=True),
        sa.Column("reference_no", sa.String(length=100), nullable=True),
        sa.Column("received_by", uuid, nullable=True),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["lease_id"], ["leases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["received_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payments_is_deleted", "payments", ["is_deleted"], unique=False)
    op.create_index("ix_payments_deleted_by", "payments", ["deleted_by"], unique=False)
    op.create_index("ix_payments_lease_id", "payments", ["lease_id"], unique=False)
    op.create_index("ix_payments_received_by", "payments", ["received_by"], unique=False)
    op.create_index("ix_payments_reference_no", "payments", ["reference_no"], unique=False)

    op.create_table(
        "payment_coverage",
        sa.Column("id", uuid, nullable=False),
        sa.Column("payment_id", uuid, nullable=False),
        sa.Column("lease_id", uuid, nullable=False),
        sa.Column("period_year", sa.Integer(), nullable=False),
        sa.Column("period_month", sa.Integer(), nullable=False),
        sa.Column("amount_applied", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["lease_id"], ["leases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("payment_id", "lease_id", "period_year", "period_month", name="uq_payment_coverage_payment_lease_period"),
    )
    op.create_index("ix_payment_coverage_is_deleted", "payment_coverage", ["is_deleted"], unique=False)
    op.create_index("ix_payment_coverage_deleted_by", "payment_coverage", ["deleted_by"], unique=False)
    op.create_index("ix_payment_coverage_lease_id", "payment_coverage", ["lease_id"], unique=False)
    op.create_index("ix_payment_coverage_payment_id", "payment_coverage", ["payment_id"], unique=False)

    op.create_table(
        "property_access",
        sa.Column("id", uuid, nullable=False),
        sa.Column("property_id", uuid, nullable=False),
        sa.Column("user_id", uuid, nullable=False),
        sa.Column("access_level_id", uuid, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id", "user_id", name="uq_property_user_access"),
    )
    op.create_index("ix_property_access_is_deleted", "property_access", ["is_deleted"], unique=False)
    op.create_index("ix_property_access_deleted_by", "property_access", ["deleted_by"], unique=False)
    op.create_index("ix_property_access_access_level_id", "property_access", ["access_level_id"], unique=False)
    op.create_index("ix_property_access_property_id", "property_access", ["property_id"], unique=False)
    op.create_index("ix_property_access_user_id", "property_access", ["user_id"], unique=False)

    op.create_table(
        "documents",
        sa.Column("id", uuid, nullable=False),
        sa.Column("document_type_id", uuid, nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("visibility", sa.String(length=50), nullable=False),
        sa.Column("uploaded_by", uuid, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["status"], ["ref.document_statuses.code"]),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["visibility"], ["ref.document_visibilities.code"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_documents_deleted_by", "documents", ["deleted_by"], unique=False)
    op.create_index("ix_documents_document_type_id", "documents", ["document_type_id"], unique=False)
    op.create_index("ix_documents_is_deleted", "documents", ["is_deleted"], unique=False)
    op.create_index("ix_documents_uploaded_by", "documents", ["uploaded_by"], unique=False)

    op.create_table(
        "document_links",
        sa.Column("id", uuid, nullable=False),
        sa.Column("document_id", uuid, nullable=False),
        sa.Column("object_type", sa.String(length=50), nullable=False),
        sa.Column("object_id", uuid, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["object_type"], ["ref.document_object_types.code"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "object_type", "object_id", name="uq_document_link_document_object"),
    )
    op.create_index("ix_document_links_is_deleted", "document_links", ["is_deleted"], unique=False)
    op.create_index("ix_document_links_deleted_by", "document_links", ["deleted_by"], unique=False)
    op.create_index("ix_document_links_document_id", "document_links", ["document_id"], unique=False)
    op.create_index("ix_document_links_object_id", "document_links", ["object_id"], unique=False)
    op.create_index("ix_document_links_object_type", "document_links", ["object_type"], unique=False)
    op.create_index("idx_documentlink_object", "document_links", ["object_type", "object_id"], unique=False)

    op.create_table(
        "user_refresh_tokens",
        sa.Column("id", uuid, nullable=False),
        sa.Column("user_id", uuid, nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("device_info", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_refresh_tokens_is_deleted", "user_refresh_tokens", ["is_deleted"], unique=False)
    op.create_index("ix_user_refresh_tokens_deleted_by", "user_refresh_tokens", ["deleted_by"], unique=False)
    op.create_index("ix_user_refresh_tokens_expires_at", "user_refresh_tokens", ["expires_at"], unique=False)
    op.create_index("ix_user_refresh_tokens_token_hash", "user_refresh_tokens", ["token_hash"], unique=True)
    op.create_index("ix_user_refresh_tokens_user_id", "user_refresh_tokens", ["user_id"], unique=False)

    op.create_table(
        "user_verification_tokens",
        sa.Column("id", uuid, nullable=False),
        sa.Column("user_id", uuid, nullable=False),
        sa.Column("token_type", sa.String(length=50), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["token_type"], ["ref.user_verification_token_types.code"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_verification_tokens_is_deleted", "user_verification_tokens", ["is_deleted"], unique=False)
    op.create_index("ix_user_verification_tokens_deleted_by", "user_verification_tokens", ["deleted_by"], unique=False)
    op.create_index("ix_user_verification_tokens_expires_at", "user_verification_tokens", ["expires_at"], unique=False)
    op.create_index("ix_user_verification_tokens_token", "user_verification_tokens", ["token"], unique=True)
    op.create_index("ix_user_verification_tokens_token_type", "user_verification_tokens", ["token_type"], unique=False)
    op.create_index("ix_user_verification_tokens_user_id", "user_verification_tokens", ["user_id"], unique=False)

    op.create_table(
        "financial_transactions",
        sa.Column("id", uuid, nullable=False),
        sa.Column("financial_account_id", uuid, nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_id", uuid, nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("deposit_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("withdrawal_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("balance_after", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("counterparty", sa.String(length=100), nullable=True),
        sa.Column("reference_no", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", uuid, nullable=True),
        sa.ForeignKeyConstraint(["financial_account_id"], ["financial_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_type"], ["ref.financial_transaction_source_types.code"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_financial_transactions_is_deleted", "financial_transactions", ["is_deleted"], unique=False)
    op.create_index("ix_financial_transactions_deleted_by", "financial_transactions", ["deleted_by"], unique=False)
    op.create_index("ix_financial_transactions_financial_account_id", "financial_transactions", ["financial_account_id"], unique=False)
    op.create_index("ix_financial_transactions_reference_no", "financial_transactions", ["reference_no"], unique=False)
    op.create_index("ix_financial_transactions_source_id", "financial_transactions", ["source_id"], unique=False)
    op.create_index("ix_financial_transactions_source_type", "financial_transactions", ["source_type"], unique=False)
    op.create_index("ix_financial_transactions_transaction_date", "financial_transactions", ["transaction_date"], unique=False)


def downgrade():
    op.drop_table("financial_transactions")
    op.drop_table("user_verification_tokens")
    op.drop_table("user_refresh_tokens")
    op.drop_table("document_links")
    op.drop_table("documents")
    op.drop_table("property_access")
    op.drop_table("payment_coverage")
    op.drop_table("payments")
    op.drop_table("ledger_entries")
    op.drop_table("tax_records")
    op.drop_table("utility_bills")
    op.drop_table("recurring_expense_schedules")
    op.drop_table("expenses")
    op.drop_table("lease_deposits")
    op.drop_table("lease_rent_periods")
    op.drop_table("leases")
    op.drop_table("financial_accounts")
    op.drop_table("financial_institution_branches", schema="ref")
    op.drop_table("financial_institutions", schema="ref")
    op.drop_table("reminders")
    op.drop_table("properties")
    op.drop_table("user_legal_names")
    op.drop_table("users")
    op.drop_table("utility_types", schema="ref")
    op.drop_table("property_access_levels", schema="ref")
    op.drop_table("expense_types", schema="ref")
    op.drop_table("document_types", schema="ref")
    op.drop_table("contractors")
    op.drop_table("contractor_types", schema="ref")
    op.drop_table("status_codes", schema="ref")
    op.drop_table("roles", schema="ref")
    op.drop_table("ledger_entry_types", schema="ref")
    for table_name in reversed(REF_CODE_TABLES):
        op.drop_table(table_name, schema="ref")
    op.drop_table("countries", schema="ref")
    op.drop_table("locales", schema="ref")
