import enum


class DocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    FINAL = "final"
    SIGNED = "signed"
