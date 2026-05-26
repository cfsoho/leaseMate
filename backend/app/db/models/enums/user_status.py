from enum import Enum


class UserStatus(str, Enum):
    NEEDS_EMAIL_VERIFICATION = "NEEDS_EMAIL_VERIFICATION"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    LOCKED = "LOCKED"
