from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, JSON, Enum
from datetime import datetime
import enum
from ..core.database import Base


class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"


class AssignmentStatus(str, enum.Enum):
    AVAILABLE = "available"      # Device registered but not assigned to any patient
    ASSIGNED = "assigned"         # Device assigned to a patient but not in active use
    IN_USE = "in_use"            # Device actively monitoring patient (patient wearing it)
    MAINTENANCE = "maintenance"   # Device under maintenance/repair
    DECOMMISSIONED = "decommissioned"  # Device retired/removed from service


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

    # Assignment status
    assignment_status = Column(Enum(AssignmentStatus), default=AssignmentStatus.AVAILABLE)

    # Patient assignment (current assignment)
    patient_id = Column(String, nullable=True, index=True)
    patient_name = Column(String, nullable=True)
    assigned_room = Column(String, nullable=True)
    assigned_at = Column(DateTime, nullable=True)  # When device was assigned to current patient
    assigned_by = Column(String, nullable=True)  # Doctor/Admin who made the assignment

    # Network info
    ip_address = Column(String, nullable=True)
    mac_address = Column(String, unique=True, index=True, nullable=True)  # Each ESP32 has unique MAC

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


class DeviceAssignment(Base):
    """Device assignment history - tracks all patient-device assignments over time"""
    __tablename__ = "device_assignments"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    device_name = Column(String, nullable=False)

    # Assignment details
    patient_id = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    assigned_room = Column(String, nullable=True)

    # Who made the assignment
    assigned_by = Column(String, nullable=False)  # User ID or email
    assigned_by_name = Column(String, nullable=True)  # User's full name

    # Assignment period
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    unassigned_at = Column(DateTime, nullable=True)  # When device was unassigned
    unassigned_by = Column(String, nullable=True)  # Who unassigned it

    # Status
    is_active = Column(Boolean, default=True, index=True)  # False when device is unassigned

    # Notes
    assignment_notes = Column(String, nullable=True)
    unassignment_notes = Column(String, nullable=True)
