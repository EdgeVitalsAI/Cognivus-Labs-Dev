from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"


class TaskCategory(str, Enum):
    PATIENT_CARE = "PATIENT_CARE"
    MEDICATION = "MEDICATION"
    LAB_WORK = "LAB_WORK"
    VITAL_MONITORING = "VITAL_MONITORING"
    DOCUMENTATION = "DOCUMENTATION"
    EQUIPMENT = "EQUIPMENT"
    ADMINISTRATIVE = "ADMINISTRATIVE"
    EMERGENCY = "EMERGENCY"
    OTHER = "OTHER"


class StaffTask(Base):
    """Staff Task model for managing tasks assigned to staff members"""
    __tablename__ = "staff_tasks"

    id = Column(Integer, primary_key=True, index=True)

    # Task Assignment
    assigned_to_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)  # Staff member
    assigned_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Who assigned the task
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True, index=True)  # Related patient (optional)

    # Task Details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(TaskCategory), default=TaskCategory.OTHER)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)

    # Scheduling
    due_date = Column(DateTime, nullable=True, index=True)
    due_time = Column(DateTime, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)  # DAILY, WEEKLY, etc.

    # Completion
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)

    # Related Records
    related_prescription_id = Column(Integer, ForeignKey('prescriptions.id'), nullable=True)
    related_vital_id = Column(Integer, ForeignKey('patient_vitals.id'), nullable=True)
    related_note_id = Column(Integer, ForeignKey('clinical_notes.id'), nullable=True)

    # Alerts and Notifications
    send_reminder = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    is_overdue = Column(Boolean, default=False)

    # Additional Context
    location = Column(String, nullable=True)  # Ward, room number, etc.
    special_instructions = Column(Text, nullable=True)
    requires_equipment = Column(String, nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=True)

    # Delegation and Escalation
    delegated_from_id = Column(Integer, ForeignKey('staff_tasks.id'), nullable=True)  # Parent task if delegated
    escalated = Column(Boolean, default=False)
    escalated_to_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    escalation_reason = Column(Text, nullable=True)

    # Cancellation
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    # Verification (for critical tasks)
    requires_verification = Column(Boolean, default=False)
    verified_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_tasks")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id], backref="tasks_assigned_by_me")
    patient = relationship("Patient", foreign_keys=[patient_id])
    related_prescription = relationship("Prescription", foreign_keys=[related_prescription_id])
    related_vital = relationship("PatientVitals", foreign_keys=[related_vital_id])
    related_note = relationship("ClinicalNote", foreign_keys=[related_note_id])
    escalated_to = relationship("User", foreign_keys=[escalated_to_id], backref="escalated_tasks")
    cancelled_by = relationship("User", foreign_keys=[cancelled_by_id], backref="tasks_cancelled_by_me")
    verified_by = relationship("User", foreign_keys=[verified_by_id], backref="tasks_verified_by_me")
    delegated_from = relationship("StaffTask", remote_side=[id], foreign_keys=[delegated_from_id])
