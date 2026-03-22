from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class NotificationType(str, Enum):
    SENSOR_DISCONNECTED = "SENSOR_DISCONNECTED"
    LOW_SPO2 = "LOW_SPO2"
    CRITICAL_SPO2 = "CRITICAL_SPO2"
    HIGH_HR = "HIGH_HR"
    LOW_HR = "LOW_HR"
    ABNORMAL_ECG = "ABNORMAL_ECG"
    UNSTABLE_ECG = "UNSTABLE_ECG"
    DEVICE_OFFLINE = "DEVICE_OFFLINE"
    SPO2_SENSOR_NOT_WORN = "SPO2_SENSOR_NOT_WORN"
    ECG_LEADS_DISCONNECTED = "ECG_LEADS_DISCONNECTED"
    SPO2_DECLINING = "SPO2_DECLINING"


class NotificationPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True, index=True)
    recipient_role = Column(String, default="all")  # "doctor", "staff", "all"

    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    priority = Column(SQLEnum(NotificationPriority), nullable=False, index=True)

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)  # sensor values at time of notification

    is_read = Column(Boolean, default=False, index=True)
    read_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    patient = relationship("Patient", backref="notifications")
    read_by = relationship("User", foreign_keys=[read_by_id])
