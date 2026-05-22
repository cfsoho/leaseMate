from enum import Enum


class UserVerificationTokenType(str, Enum):
    EMAIL_CONFIRMATION = "EMAIL_CONFIRMATION"
    PASSWORD_RESET = "PASSWORD_RESET"
    EMAIL_CHANGE = "EMAIL_CHANGE"