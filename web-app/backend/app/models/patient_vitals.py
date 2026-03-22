from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class VitalStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class PatientVitals(Base):
    """Patient Vitals model for storing real-time and historical vital signs"""
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)

    # Vital Signs Measurements
    heart_rate = Column(Integer, nullable=True)  # BPM
    blood_pressure_systolic = Column(Integer, nullable=True)  # mmHg
    blood_pressure_diastolic = Column(Integer, nullable=True)  # mmHg
    oxygen_saturation = Column(Float, nullable=True)  # SpO2 percentage
    respiratory_rate = Column(Integer, nullable=True)  # breaths per minute
    body_temperature = Column(Float, nullable=True)  # Celsius
    blood_glucose = Column(Float, nullable=True)  # mg/dL
    weight = Column(Float, nullable=True)  # kg
    height = Column(Float, nullable=True)  # cm
    bmi = Column(Float, nullable=True)  # calculated BMI

    # ECG Data (JSON for waveform data if needed)
    ecg_data = Column(JSON, nullable=True)  # {waveform: [...], analysis: {...}}

    # Overall Status Assessment
    overall_status = Column(SQLEnum(VitalStatus), default=VitalStatus.NORMAL)

    # Alerts and Flags
    is_abnormal = Column(Boolean, default=False)
    alert_triggered = Column(Boolean, default=False)
    alert_message = Column(String, nullable=True)

    # Device and Source Information
    device_id = Column(String, nullable=True, index=True)  # Which wearable device recorded this
    device_type = Column(String, nullable=True)  # e.g., "Smart Wearable", "Manual Entry", "Hospital Monitor"
    measurement_source = Column(String, default="WEARABLE")  # WEARABLE, MANUAL, MONITOR

    # Notes and Context
    notes = Column(String, nullable=True)
    recorded_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # If manually recorded by staff

    # Timestamps
    measured_at = Column(DateTime, default=datetime.utcnow, index=True)  # When the vital was measured
    created_at = Column(DateTime, default=datetime.utcnow)  # When record was created in DB
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="vitals")
    recorded_by = relationship("User", foreign_keys=[recorded_by_user_id])
