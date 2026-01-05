from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, JSON, Enum
from datetime import datetime
import enum
from ..core.database import Base


class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"


class Device(Base):
    """Smart wearable patient tracking devices"""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)  # Hardware device ID
    device_name = Column(String, nullable=False)
    device_type = Column(String, default="wearable_tracker")

    # Device status
    status = Column(Enum(DeviceStatus), default=DeviceStatus.OFFLINE)
    battery_level = Column(Float, nullable=True)  # 0-100
    firmware_version = Column(String, nullable=True)
    last_ping = Column(DateTime, nullable=True)

    # Patient assignment
    patient_id = Column(String, nullable=True)
    patient_name = Column(String, nullable=True)
    assigned_room = Column(String, nullable=True)

    # Network info
    ip_address = Column(String, nullable=True)
    mac_address = Column(String, nullable=True)

    # Sensor data (latest readings)
    spo2 = Column(Float, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    blood_pressure_sys = Column(Integer, nullable=True)
    blood_pressure_dia = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)

    # Metadata
    location = Column(String, nullable=True)  # Hospital wing/floor
    notes = Column(String, nullable=True)
    config = Column(JSON, nullable=True)  # Device configuration

    # Timestamps
    activated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DeviceLog(Base):
    """Device activity and debug logs"""
    __tablename__ = "device_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    log_type = Column(String, nullable=False)  # info, warning, error, debug
    message = Column(String, nullable=False)
    data = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
