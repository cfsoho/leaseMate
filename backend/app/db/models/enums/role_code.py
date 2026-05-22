# backend/app/db/models/enums/role_code.py

from enum import Enum


class RoleCode(str, Enum):
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    USER = "USER"