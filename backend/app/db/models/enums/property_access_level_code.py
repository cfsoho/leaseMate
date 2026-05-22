from enum import Enum


class PropertyAccessLevelCode(str, Enum):
    # Legal/actual property owner
    OWNER = "OWNER"

    # User responsible for managing the property
    # on behalf of the owner
    MANAGER = "MANAGER"

    # Real estate agent or broker associated
    # with the property or lease
    REAL_ESTATE_AGENT = "REAL_ESTATE_AGENT"

    # Accountant or tax-related access role
    ACCOUNTANT = "ACCOUNTANT"

    # Read-only access
    VIEWER = "VIEWER"