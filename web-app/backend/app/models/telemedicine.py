from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class ConsultationStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"
    RESCHEDULED = "RESCHEDULED"


class ConsultationType(str, Enum):
    VIDEO_CALL = "VIDEO_CALL"
    AUDIO_CALL = "AUDIO_CALL"
    CHAT = "CHAT"
    FOLLOW_UP = "FOLLOW_UP"
    EMERGENCY = "EMERGENCY"


class TelemedicineConsultation(Base):
    """Telemedicine Consultation model for managing virtual appointments"""
    __tablename__ = "telemedicine_consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)

    # Consultation Details
    consultation_type = Column(SQLEnum(ConsultationType), default=ConsultationType.VIDEO_CALL)
    status = Column(SQLEnum(ConsultationStatus), default=ConsultationStatus.SCHEDULED)

    # Scheduling
    scheduled_start_time = Column(DateTime, nullable=False, index=True)
    scheduled_end_time = Column(DateTime, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Calculated duration

    # Purpose and Reason
    chief_complaint = Column(Text, nullable=True)
    consultation_reason = Column(Text, nullable=False)
    urgency_level = Column(String, default="ROUTINE")  # ROUTINE, URGENT, EMERGENCY

    # Meeting Information
    meeting_link = Column(String, nullable=True)
    meeting_id = Column(String, nullable=True)
    meeting_password = Column(String, nullable=True)
    platform = Column(String, default="INTERNAL")  # INTERNAL, ZOOM, TEAMS, GOOGLE_MEET, etc.

    # Clinical Documentation
    subjective_notes = Column(Text, nullable=True)  # Patient's symptoms/complaints
    objective_findings = Column(Text, nullable=True)  # Doctor's observations
    assessment = Column(Text, nullable=True)  # Diagnosis/assessment
    plan = Column(Text, nullable=True)  # Treatment plan
    clinical_note_id = Column(Integer, ForeignKey('clinical_notes.id'), nullable=True)  # Link to full clinical note

    # Prescriptions and Orders
    prescriptions_issued = Column(Boolean, default=False)
    lab_tests_ordered = Column(Boolean, default=False)
    imaging_ordered = Column(Boolean, default=False)
    referral_made = Column(Boolean, default=False)

    # Follow-up
    requires_follow_up = Column(Boolean, default=False)
    follow_up_date = Column(DateTime, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)

    # Cancellation/Rescheduling
    cancelled_by = Column(String, nullable=True)  # "PATIENT", "DOCTOR", "SYSTEM"
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    rescheduled_to_id = Column(Integer, ForeignKey('telemedicine_consultations.id'), nullable=True)

    # Patient Experience
    patient_rating = Column(Integer, nullable=True)  # 1-5 stars
    patient_feedback = Column(Text, nullable=True)

    # Technical Details
    connection_quality = Column(String, nullable=True)  # EXCELLENT, GOOD, FAIR, POOR
    technical_issues = Column(Text, nullable=True)

    # Billing (if needed later)
    is_billable = Column(Boolean, default=True)
    billing_code = Column(String, nullable=True)
    billing_amount = Column(Integer, nullable=True)
    billing_status = Column(String, nullable=True)

    # Recording (if allowed)
    is_recorded = Column(Boolean, default=False)
    recording_url = Column(String, nullable=True)
    recording_consent = Column(Boolean, default=False)

    # Notifications
    reminder_sent_patient = Column(Boolean, default=False)
    reminder_sent_doctor = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Who scheduled it

    # Relationships
    patient = relationship("Patient", back_populates="telemedicine_consultations")
    doctor = relationship("User", foreign_keys=[doctor_id], backref="telemedicine_consultations")
    clinical_note = relationship("ClinicalNote", foreign_keys=[clinical_note_id])
    created_by = relationship("User", foreign_keys=[created_by_id], backref="consultations_scheduled")
    rescheduled_to = relationship("TelemedicineConsultation", remote_side=[id], foreign_keys=[rescheduled_to_id])
