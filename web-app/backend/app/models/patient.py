from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, JSON, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class PatientStatus(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    STABLE = "STABLE"
    DISCHARGED = "DISCHARGED"


class BloodType(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class Patient(Base):
    """Patient model for storing patient information"""
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    # Personal Information
    name = Column(String, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    age = Column(Integer)
    gender = Column(SQLEnum(Gender), nullable=False)
    blood_type = Column(SQLEnum(BloodType))
    photo_url = Column(String, nullable=True)

    # Contact Information
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # Emergency Contact (JSON: {name, relationship, phone, email})
    emergency_contact = Column(JSON, nullable=True)

    # Insurance Information (JSON: {provider, policy_number, group_number})
    insurance_info = Column(JSON, nullable=True)

    # Hospital Information
    room_number = Column(String, nullable=True)
    ward_location = Column(String, nullable=True)
    admission_date = Column(DateTime, default=datetime.utcnow)
    discharge_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(PatientStatus), default=PatientStatus.STABLE)
    department = Column(String, nullable=True)

    # Assigned Staff
    assigned_doctor_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    assigned_nurse_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Medical Information (JSON arrays)
    medical_history = Column(JSON, default=list)  # [{condition, diagnosed_date, status}]
    allergies = Column(JSON, default=list)  # [list of allergies]
    current_medications = Column(JSON, default=list)  # [list of medications]

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_doctor = relationship("User", foreign_keys=[assigned_doctor_id], backref="patients_as_doctor")
    assigned_nurse = relationship("User", foreign_keys=[assigned_nurse_id], backref="patients_as_nurse")
    vitals = relationship("PatientVitals", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    clinical_notes = relationship("ClinicalNote", back_populates="patient", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="patient", cascade="all, delete-orphan")
    telemedicine_consultations = relationship("TelemedicineConsultation", back_populates="patient", cascade="all, delete-orphan")
