from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class NoteType(str, Enum):
    PROGRESS_NOTE = "PROGRESS_NOTE"
    ADMISSION_NOTE = "ADMISSION_NOTE"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    CONSULTATION_NOTE = "CONSULTATION_NOTE"
    PROCEDURE_NOTE = "PROCEDURE_NOTE"
    NURSING_NOTE = "NURSING_NOTE"
    FOLLOW_UP = "FOLLOW_UP"
    LAB_RESULTS = "LAB_RESULTS"
    RADIOLOGY_REPORT = "RADIOLOGY_REPORT"
    OTHER = "OTHER"


class ClinicalNote(Base):
    """Clinical Note model for storing patient clinical documentation"""
    __tablename__ = "clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Doctor or staff who created

    # Note Classification
    note_type = Column(SQLEnum(NoteType), nullable=False)
    title = Column(String, nullable=False)
    specialty = Column(String, nullable=True)  # Medical specialty related to this note

    # Note Content (using SOAP format possibility)
    # S - Subjective (patient's complaints)
    subjective = Column(Text, nullable=True)

    # O - Objective (observations, vitals, exam findings)
    objective = Column(Text, nullable=True)

    # A - Assessment (diagnosis, interpretation)
    assessment = Column(Text, nullable=True)

    # P - Plan (treatment plan, next steps)
    plan = Column(Text, nullable=True)

    # Or free-form content if not using SOAP
    content = Column(Text, nullable=True)

    # Additional Fields
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)

    # Attachments (JSON array of file paths/URLs)
    attachments = Column(String, nullable=True)  # JSON array: ["path1.pdf", "path2.jpg"]

    # Visit/Encounter Information
    visit_date = Column(DateTime, nullable=True)
    visit_type = Column(String, nullable=True)  # "Inpatient", "Outpatient", "Emergency", "Telemedicine"

    # Metadata
    is_confidential = Column(Integer, default=0)  # Extra privacy flag
    is_signed = Column(Integer, default=0)  # Digital signature status
    signed_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="clinical_notes")
    created_by = relationship("User", foreign_keys=[created_by_id], backref="clinical_notes_created")
    last_modified_by = relationship("User", foreign_keys=[last_modified_by_id], backref="clinical_notes_modified")
