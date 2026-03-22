from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class PrescriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DISCONTINUED = "DISCONTINUED"
    ON_HOLD = "ON_HOLD"


class MedicationFrequency(str, Enum):
    ONCE_DAILY = "ONCE_DAILY"
    TWICE_DAILY = "TWICE_DAILY"
    THREE_TIMES_DAILY = "THREE_TIMES_DAILY"
    FOUR_TIMES_DAILY = "FOUR_TIMES_DAILY"
    EVERY_4_HOURS = "EVERY_4_HOURS"
    EVERY_6_HOURS = "EVERY_6_HOURS"
    EVERY_8_HOURS = "EVERY_8_HOURS"
    EVERY_12_HOURS = "EVERY_12_HOURS"
    AS_NEEDED = "AS_NEEDED"
    WEEKLY = "WEEKLY"
    CUSTOM = "CUSTOM"


class MedicationRoute(str, Enum):
    ORAL = "ORAL"
    INTRAVENOUS = "INTRAVENOUS"
    INTRAMUSCULAR = "INTRAMUSCULAR"
    SUBCUTANEOUS = "SUBCUTANEOUS"
    TOPICAL = "TOPICAL"
    INHALATION = "INHALATION"
    SUBLINGUAL = "SUBLINGUAL"
    RECTAL = "RECTAL"
    OTHER = "OTHER"


class Prescription(Base):
    """Prescription model for managing patient medications"""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    prescribed_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Doctor who prescribed

    # Medication Information
    medication_name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    medication_class = Column(String, nullable=True)  # e.g., "Antibiotic", "Analgesic", "Antihypertensive"

    # Dosage Information
    dosage = Column(String, nullable=False)  # e.g., "500mg", "10ml"
    frequency = Column(SQLEnum(MedicationFrequency), nullable=False)
    custom_frequency = Column(String, nullable=True)  # If frequency is CUSTOM
    route = Column(SQLEnum(MedicationRoute), default=MedicationRoute.ORAL)
    duration = Column(String, nullable=True)  # e.g., "7 days", "2 weeks", "ongoing"

    # Administration Instructions
    instructions = Column(Text, nullable=True)  # e.g., "Take with food", "Avoid alcohol"
    special_instructions = Column(Text, nullable=True)

    # Dates
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime, nullable=True)
    discontinued_date = Column(DateTime, nullable=True)

    # Status and Tracking
    status = Column(SQLEnum(PrescriptionStatus), default=PrescriptionStatus.ACTIVE)
    is_critical = Column(Boolean, default=False)  # Critical medication that shouldn't be missed
    requires_monitoring = Column(Boolean, default=False)  # Requires vitals monitoring

    # Refill Information
    refills_allowed = Column(Integer, default=0)
    refills_remaining = Column(Integer, default=0)

    # Discontinuation Info
    discontinued_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    discontinuation_reason = Column(Text, nullable=True)

    # Additional Notes
    side_effects_warning = Column(Text, nullable=True)
    interaction_warnings = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="prescriptions")
    prescribed_by = relationship("User", foreign_keys=[prescribed_by_id], backref="prescriptions_written")
    discontinued_by = relationship("User", foreign_keys=[discontinued_by_id], backref="prescriptions_discontinued")
