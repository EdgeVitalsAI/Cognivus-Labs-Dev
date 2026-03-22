from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.prescription import Prescription, PrescriptionStatus, MedicationFrequency, MedicationRoute
from ...models.patient import Patient
from ...models.user import User

router = APIRouter()


class PrescriptionCreateRequest(BaseModel):
    patient_id: int
    prescribed_by_id: int
    medication_name: str
    generic_name: Optional[str] = None
    medication_class: Optional[str] = None
    dosage: str
    frequency: MedicationFrequency
    custom_frequency: Optional[str] = None
    route: Optional[MedicationRoute] = MedicationRoute.ORAL
    duration: Optional[str] = None
    instructions: Optional[str] = None
    special_instructions: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_critical: Optional[bool] = False
    requires_monitoring: Optional[bool] = False
    refills_allowed: Optional[int] = 0
    side_effects_warning: Optional[str] = None
    interaction_warnings: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionUpdateRequest(BaseModel):
    medication_name: Optional[str] = None
    generic_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[MedicationFrequency] = None
    custom_frequency: Optional[str] = None
    route: Optional[MedicationRoute] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    special_instructions: Optional[str] = None
    status: Optional[PrescriptionStatus] = None
    end_date: Optional[datetime] = None
    is_critical: Optional[bool] = None
    requires_monitoring: Optional[bool] = None
    refills_allowed: Optional[int] = None
    refills_remaining: Optional[int] = None
    notes: Optional[str] = None


class PrescriptionDiscontinueRequest(BaseModel):
    discontinued_by_id: int
    discontinuation_reason: str


@router.get("/prescriptions")
async def get_all_prescriptions(
    patient_id: Optional[int] = None,
    prescribed_by_id: Optional[int] = None,
    status: Optional[str] = None,
    is_critical: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all prescriptions with optional filtering"""

    query = db.query(Prescription)

    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    if prescribed_by_id:
        query = query.filter(Prescription.prescribed_by_id == prescribed_by_id)
    if status:
        query = query.filter(Prescription.status == status)
    if is_critical is not None:
        query = query.filter(Prescription.is_critical == is_critical)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Prescription.medication_name.ilike(search_pattern),
                Prescription.generic_name.ilike(search_pattern)
            )
        )

    total = query.count()
    prescriptions = query.order_by(desc(Prescription.created_at)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "prescriptions": [{
            "id": p.id,
            "patient_id": p.patient_id,
            "prescribed_by_id": p.prescribed_by_id,
            "medication_name": p.medication_name,
            "generic_name": p.generic_name,
            "medication_class": p.medication_class,
            "dosage": p.dosage,
            "frequency": p.frequency,
            "custom_frequency": p.custom_frequency,
            "route": p.route,
            "duration": p.duration,
            "instructions": p.instructions,
            "special_instructions": p.special_instructions,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "status": p.status,
            "is_critical": p.is_critical,
            "requires_monitoring": p.requires_monitoring,
            "refills_allowed": p.refills_allowed,
            "refills_remaining": p.refills_remaining,
            "side_effects_warning": p.side_effects_warning,
            "interaction_warnings": p.interaction_warnings,
            "notes": p.notes,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat()
        } for p in prescriptions]
    }


@router.get("/prescriptions/{prescription_id}")
async def get_prescription(prescription_id: int, db: Session = Depends(get_db)):
    """Get specific prescription details"""

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    return {
        "id": prescription.id,
        "patient_id": prescription.patient_id,
        "prescribed_by_id": prescription.prescribed_by_id,
        "medication_name": prescription.medication_name,
        "generic_name": prescription.generic_name,
        "medication_class": prescription.medication_class,
        "dosage": prescription.dosage,
        "frequency": prescription.frequency,
        "custom_frequency": prescription.custom_frequency,
        "route": prescription.route,
        "duration": prescription.duration,
        "instructions": prescription.instructions,
        "special_instructions": prescription.special_instructions,
        "start_date": prescription.start_date.isoformat() if prescription.start_date else None,
        "end_date": prescription.end_date.isoformat() if prescription.end_date else None,
        "discontinued_date": prescription.discontinued_date.isoformat() if prescription.discontinued_date else None,
        "status": prescription.status,
        "is_critical": prescription.is_critical,
        "requires_monitoring": prescription.requires_monitoring,
        "refills_allowed": prescription.refills_allowed,
        "refills_remaining": prescription.refills_remaining,
        "discontinued_by_id": prescription.discontinued_by_id,
        "discontinuation_reason": prescription.discontinuation_reason,
        "side_effects_warning": prescription.side_effects_warning,
        "interaction_warnings": prescription.interaction_warnings,
        "notes": prescription.notes,
        "created_at": prescription.created_at.isoformat(),
        "updated_at": prescription.updated_at.isoformat()
    }


@router.post("/prescriptions")
async def create_prescription(prescription_data: PrescriptionCreateRequest, db: Session = Depends(get_db)):
    """Create new prescription"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == prescription_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify doctor exists
    doctor = db.query(User).filter(User.id == prescription_data.prescribed_by_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        prescription = Prescription(
            patient_id=prescription_data.patient_id,
            prescribed_by_id=prescription_data.prescribed_by_id,
            medication_name=prescription_data.medication_name,
            generic_name=prescription_data.generic_name,
            medication_class=prescription_data.medication_class,
            dosage=prescription_data.dosage,
            frequency=prescription_data.frequency,
            custom_frequency=prescription_data.custom_frequency,
            route=prescription_data.route,
            duration=prescription_data.duration,
            instructions=prescription_data.instructions,
            special_instructions=prescription_data.special_instructions,
            start_date=prescription_data.start_date or datetime.utcnow(),
            end_date=prescription_data.end_date,
            status=PrescriptionStatus.ACTIVE,
            is_critical=prescription_data.is_critical,
            requires_monitoring=prescription_data.requires_monitoring,
            refills_allowed=prescription_data.refills_allowed,
            refills_remaining=prescription_data.refills_allowed,
            side_effects_warning=prescription_data.side_effects_warning,
            interaction_warnings=prescription_data.interaction_warnings,
            notes=prescription_data.notes
        )

        db.add(prescription)
        db.commit()
        db.refresh(prescription)

        return {
            "status": "success",
            "message": "Prescription created successfully",
            "prescription": {
                "id": prescription.id,
                "patient_id": prescription.patient_id,
                "medication_name": prescription.medication_name,
                "dosage": prescription.dosage,
                "status": prescription.status
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create prescription: {str(e)}"
        )


@router.patch("/prescriptions/{prescription_id}")
async def update_prescription(
    prescription_id: int,
    prescription_data: PrescriptionUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update prescription details"""

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    try:
        if prescription_data.medication_name is not None:
            prescription.medication_name = prescription_data.medication_name
        if prescription_data.generic_name is not None:
            prescription.generic_name = prescription_data.generic_name
        if prescription_data.dosage is not None:
            prescription.dosage = prescription_data.dosage
        if prescription_data.frequency is not None:
            prescription.frequency = prescription_data.frequency
        if prescription_data.custom_frequency is not None:
            prescription.custom_frequency = prescription_data.custom_frequency
        if prescription_data.route is not None:
            prescription.route = prescription_data.route
        if prescription_data.duration is not None:
            prescription.duration = prescription_data.duration
        if prescription_data.instructions is not None:
            prescription.instructions = prescription_data.instructions
        if prescription_data.special_instructions is not None:
            prescription.special_instructions = prescription_data.special_instructions
        if prescription_data.status is not None:
            prescription.status = prescription_data.status
        if prescription_data.end_date is not None:
            prescription.end_date = prescription_data.end_date
        if prescription_data.is_critical is not None:
            prescription.is_critical = prescription_data.is_critical
        if prescription_data.requires_monitoring is not None:
            prescription.requires_monitoring = prescription_data.requires_monitoring
        if prescription_data.refills_allowed is not None:
            prescription.refills_allowed = prescription_data.refills_allowed
        if prescription_data.refills_remaining is not None:
            prescription.refills_remaining = prescription_data.refills_remaining
        if prescription_data.notes is not None:
            prescription.notes = prescription_data.notes

        prescription.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "Prescription updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update prescription: {str(e)}"
        )


@router.post("/prescriptions/{prescription_id}/discontinue")
async def discontinue_prescription(
    prescription_id: int,
    discontinue_data: PrescriptionDiscontinueRequest,
    db: Session = Depends(get_db)
):
    """Discontinue a prescription"""

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription.status == PrescriptionStatus.DISCONTINUED:
        raise HTTPException(status_code=400, detail="Prescription already discontinued")

    try:
        prescription.status = PrescriptionStatus.DISCONTINUED
        prescription.discontinued_date = datetime.utcnow()
        prescription.discontinued_by_id = discontinue_data.discontinued_by_id
        prescription.discontinuation_reason = discontinue_data.discontinuation_reason
        prescription.updated_at = datetime.utcnow()

        db.commit()

        return {
            "status": "success",
            "message": f"Prescription {prescription.medication_name} discontinued successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to discontinue prescription: {str(e)}"
        )


@router.delete("/prescriptions/{prescription_id}")
async def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    """Delete prescription (use discontinue instead when possible)"""

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    try:
        medication_name = prescription.medication_name
        db.delete(prescription)
        db.commit()

        return {
            "status": "success",
            "message": f"Prescription {medication_name} deleted successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete prescription: {str(e)}"
        )


@router.get("/prescriptions/patient/{patient_id}/active")
async def get_active_prescriptions(patient_id: int, db: Session = Depends(get_db)):
    """Get all active prescriptions for a patient"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id,
        Prescription.status == PrescriptionStatus.ACTIVE
    ).order_by(desc(Prescription.created_at)).all()

    return {
        "patient_id": patient_id,
        "patient_name": patient.name,
        "active_prescriptions": [{
            "id": p.id,
            "medication_name": p.medication_name,
            "dosage": p.dosage,
            "frequency": p.frequency,
            "route": p.route,
            "is_critical": p.is_critical,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None
        } for p in prescriptions]
    }
