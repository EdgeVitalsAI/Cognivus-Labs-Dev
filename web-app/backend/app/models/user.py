from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from datetime import datetime
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    DOCTOR = "doctor"
    STAFF = "staff"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Additional fields for doctors
    specialty = Column(String, nullable=True)
    license_number = Column(String, nullable=True)

    # Additional fields for staff
    department = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
