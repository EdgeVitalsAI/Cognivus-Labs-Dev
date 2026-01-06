from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..core.database import Base


class InsightType(str, Enum):
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    DIAGNOSIS_SUGGESTION = "DIAGNOSIS_SUGGESTION"
    TREATMENT_RECOMMENDATION = "TREATMENT_RECOMMENDATION"
    DRUG_INTERACTION = "DRUG_INTERACTION"
    VITAL_ANOMALY = "VITAL_ANOMALY"
    PATTERN_DETECTION = "PATTERN_DETECTION"
    PREDICTIVE_ALERT = "PREDICTIVE_ALERT"
    CLINICAL_DECISION_SUPPORT = "CLINICAL_DECISION_SUPPORT"
    OTHER = "OTHER"


class InsightSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InsightStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ACTED_UPON = "ACTED_UPON"
    DISMISSED = "DISMISSED"
    ARCHIVED = "ARCHIVED"


class AIInsight(Base):
    """AI Insight model for storing AI-generated clinical insights and recommendations"""
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)

    # Insight Classification
    insight_type = Column(SQLEnum(InsightType), nullable=False)
    severity = Column(SQLEnum(InsightSeverity), default=InsightSeverity.INFO)
    category = Column(String, nullable=True)  # Additional categorization

    # Insight Content
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)

    # Risk Assessment
    risk_score = Column(Float, nullable=True)  # 0.0 to 1.0 or 0 to 100
    confidence_score = Column(Float, nullable=True)  # AI model confidence (0.0 to 1.0)

    # Source Data
    source_data = Column(JSON, nullable=True)  # What data was analyzed (vitals, labs, etc.)
    data_source_ids = Column(JSON, nullable=True)  # IDs of related records {"vitals": [1,2,3], "prescriptions": [4,5]}

    # AI Model Information
    model_name = Column(String, nullable=True)  # Which AI model generated this
    model_version = Column(String, nullable=True)
    analysis_timestamp = Column(DateTime, default=datetime.utcnow)

    # Clinical Relevance
    relevant_conditions = Column(JSON, nullable=True)  # Array of related conditions/diagnoses
    suggested_actions = Column(JSON, nullable=True)  # Array of suggested actions
    affected_medications = Column(JSON, nullable=True)  # Array of medication IDs if relevant

    # Review and Action
    status = Column(SQLEnum(InsightStatus), default=InsightStatus.PENDING_REVIEW)
    is_actionable = Column(Boolean, default=True)
    requires_immediate_attention = Column(Boolean, default=False)

    reviewed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)

    # Action Taken
    action_taken = Column(Text, nullable=True)
    action_taken_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action_taken_at = Column(DateTime, nullable=True)

    # Dismissal
    dismissed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    dismissed_at = Column(DateTime, nullable=True)
    dismissal_reason = Column(Text, nullable=True)

    # Alerts
    alert_sent = Column(Boolean, default=False)
    alert_sent_at = Column(DateTime, nullable=True)
    alert_recipients = Column(JSON, nullable=True)  # User IDs who were notified

    # Validity Period
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    is_expired = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="ai_insights")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id], backref="ai_insights_reviewed")
    action_taken_by = relationship("User", foreign_keys=[action_taken_by_id], backref="ai_insights_acted_upon")
    dismissed_by = relationship("User", foreign_keys=[dismissed_by_id], backref="ai_insights_dismissed")
