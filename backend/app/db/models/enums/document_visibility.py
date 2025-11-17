import enum


class DocumentVisibility(int, enum.Enum):
    OWNER_ONLY = 0
    OWNER_AGENT = 1
    TENANT_ALL = 2
    INHERIT = 3
