# app/db/models/enums/storage_type.py
import enum

class StorageType(str, enum.Enum):
    NAS = "nas"
    S3 = "s3"
    # 未來你也可以加：
    # GCS = "gcs"
    # LOCAL = "local"
