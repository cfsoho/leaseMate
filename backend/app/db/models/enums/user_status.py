from enum import Enum


class UserStatus(str, Enum):
    PENDING_EMAIL_VERIFICATION = "PENDING_EMAIL_VERIFICATION"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    LOCKED = "LOCKED"