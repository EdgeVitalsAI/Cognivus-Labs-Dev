from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.telemedicine import TelemedicineConsultation, ConsultationStatus, ConsultationType
from ...models.patient import Patient
from ...models.user import User

router = APIRouter()


class ConsultationCreateRequest(BaseModel):
    patient_id: int
    doctor_id: int
    consultation_type: ConsultationType
    scheduled_start_time: datetime
    scheduled_end_time: Optional[datetime] = None
    consultation_reason: str
    chief_complaint: Optional[str] = None
    urgency_level: Optional[str] = "ROUTINE"
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    platform: Optional[str] = "INTERNAL"


class ConsultationUpdateRequest(BaseModel):
    status: Optional[ConsultationStatus] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    subjective_notes: Optional[str] = None
    objective_findings: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    requires_follow_up: Optional[bool] = None
    follow_up_date: Optional[datetime] = None


@router.get("/telemedicine")
async def get_all_consultations(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all telemedicine consultations"""

    query = db.query(TelemedicineConsultation)

    if patient_id:
        query = query.filter(TelemedicineConsultation.patient_id == patient_id)
    if doctor_id:
        query = query.filter(TelemedicineConsultation.doctor_id == doctor_id)
    if status:
        query = query.filter(TelemedicineConsultation.status == status)

    total = query.count()
    consultations = query.order_by(desc(TelemedicineConsultation.scheduled_start_time)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "consultations": [{
            "id": c.id,
            "patient_id": c.patient_id,
            "patient_name": c.patient.name if c.patient else "Unknown",
            "doctor_id": c.doctor_id,
            "doctor_name": c.doctor.full_name if c.doctor else "Unknown",
            "consultation_type": c.consultation_type,
            "status": c.status,
            "scheduled_start_time": c.scheduled_start_time.isoformat(),
            "scheduled_end_time": c.scheduled_end_time.isoformat() if c.scheduled_end_time else None,
            "consultation_reason": c.consultation_reason,
            "chief_complaint": c.chief_complaint,
            "urgency_level": c.urgency_level,
            "meeting_link": c.meeting_link,
            "platform": c.platform,
            "created_at": c.created_at.isoformat()
        } for c in consultations]
    }


@router.post("/telemedicine")
async def create_consultation(consultation_data: ConsultationCreateRequest, db: Session = Depends(get_db)):
    """Create new telemedicine consultation"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == consultation_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify doctor exists
    doctor = db.query(User).filter(User.id == consultation_data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        consultation = TelemedicineConsultation(
            patient_id=consultation_data.patient_id,
            doctor_id=consultation_data.doctor_id,
            consultation_type=consultation_data.consultation_type,
            scheduled_start_time=consultation_data.scheduled_start_time,
            scheduled_end_time=consultation_data.scheduled_end_time,
            consultation_reason=consultation_data.consultation_reason,
            chief_complaint=consultation_data.chief_complaint,
            urgency_level=consultation_data.urgency_level,
            meeting_link=consultation_data.meeting_link,
            meeting_id=consultation_data.meeting_id,
            platform=consultation_data.platform,
            status=ConsultationStatus.SCHEDULED
        )

        db.add(consultation)
        db.commit()
        db.refresh(consultation)

        return {
            "status": "success",
            "message": "Consultation scheduled successfully",
            "consultation": {
                "id": consultation.id,
                "patient_id": consultation.patient_id,
                "scheduled_start_time": consultation.scheduled_start_time.isoformat()
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create consultation: {str(e)}"
        )


@router.patch("/telemedicine/{consultation_id}")
async def update_consultation(
    consultation_id: int,
    consultation_data: ConsultationUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update consultation details"""

    consultation = db.query(TelemedicineConsultation).filter(TelemedicineConsultation.id == consultation_id).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    try:
        if consultation_data.status is not None:
            consultation.status = consultation_data.status
        if consultation_data.actual_start_time is not None:
            consultation.actual_start_time = consultation_data.actual_start_time
        if consultation_data.actual_end_time is not None:
            consultation.actual_end_time = consultation_data.actual_end_time
        if consultation_data.subjective_notes is not None:
            consultation.subjective_notes = consultation_data.subjective_notes
        if consultation_data.objective_findings is not None:
            consultation.objective_findings = consultation_data.objective_findings
        if consultation_data.assessment is not None:
            consultation.assessment = consultation_data.assessment
        if consultation_data.plan is not None:
            consultation.plan = consultation_data.plan
        if consultation_data.requires_follow_up is not None:
            consultation.requires_follow_up = consultation_data.requires_follow_up
        if consultation_data.follow_up_date is not None:
            consultation.follow_up_date = consultation_data.follow_up_date

        consultation.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "Consultation updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update consultation: {str(e)}"
        )


@router.get("/telemedicine/statistics/summary")
async def get_telemedicine_stats(db: Session = Depends(get_db)):
    """Get telemedicine statistics"""

    total = db.query(TelemedicineConsultation).count()
    scheduled = db.query(TelemedicineConsultation).filter(
        TelemedicineConsultation.status == ConsultationStatus.SCHEDULED
    ).count()
    completed = db.query(TelemedicineConsultation).filter(
        TelemedicineConsultation.status == ConsultationStatus.COMPLETED
    ).count()
    in_progress = db.query(TelemedicineConsultation).filter(
        TelemedicineConsultation.status == ConsultationStatus.IN_PROGRESS
    ).count()

    return {
        "total_consultations": total,
        "scheduled": scheduled,
        "completed": completed,
        "in_progress": in_progress
    }
