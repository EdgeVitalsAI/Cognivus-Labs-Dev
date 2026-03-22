from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.patient_vitals import PatientVitals, VitalStatus
from ...models.patient import Patient

router = APIRouter()


class VitalsCreateRequest(BaseModel):
    patient_id: int
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    respiratory_rate: Optional[int] = None
    body_temperature: Optional[float] = None
    blood_glucose: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    ecg_data: Optional[dict] = None
    overall_status: Optional[VitalStatus] = VitalStatus.NORMAL
    is_abnormal: Optional[bool] = False
    alert_triggered: Optional[bool] = False
    alert_message: Optional[str] = None
    device_id: Optional[str] = None
    device_type: Optional[str] = None
    measurement_source: Optional[str] = "WEARABLE"
    notes: Optional[str] = None
    recorded_by_user_id: Optional[int] = None
    measured_at: Optional[datetime] = None


class VitalsUpdateRequest(BaseModel):
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    respiratory_rate: Optional[int] = None
    body_temperature: Optional[float] = None
    blood_glucose: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    overall_status: Optional[VitalStatus] = None
    is_abnormal: Optional[bool] = None
    notes: Optional[str] = None


@router.get("/vitals")
async def get_all_vitals(
    patient_id: Optional[int] = None,
    device_id: Optional[str] = None,
    is_abnormal: Optional[bool] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all vital signs with optional filtering"""

    query = db.query(PatientVitals)

    if patient_id:
        query = query.filter(PatientVitals.patient_id == patient_id)
    if device_id:
        query = query.filter(PatientVitals.device_id == device_id)
    if is_abnormal is not None:
        query = query.filter(PatientVitals.is_abnormal == is_abnormal)

    total = query.count()
    vitals = query.order_by(desc(PatientVitals.measured_at)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "vitals": [{
            "id": v.id,
            "patient_id": v.patient_id,
            "heart_rate": v.heart_rate,
            "blood_pressure_systolic": v.blood_pressure_systolic,
            "blood_pressure_diastolic": v.blood_pressure_diastolic,
            "oxygen_saturation": v.oxygen_saturation,
            "respiratory_rate": v.respiratory_rate,
            "body_temperature": v.body_temperature,
            "blood_glucose": v.blood_glucose,
            "weight": v.weight,
            "height": v.height,
            "bmi": v.bmi,
            "overall_status": v.overall_status,
            "is_abnormal": v.is_abnormal,
            "alert_triggered": v.alert_triggered,
            "alert_message": v.alert_message,
            "device_id": v.device_id,
            "device_type": v.device_type,
            "measurement_source": v.measurement_source,
            "notes": v.notes,
            "measured_at": v.measured_at.isoformat(),
            "created_at": v.created_at.isoformat()
        } for v in vitals]
    }


@router.get("/vitals/{vital_id}")
async def get_vital(vital_id: int, db: Session = Depends(get_db)):
    """Get specific vital signs record"""

    vital = db.query(PatientVitals).filter(PatientVitals.id == vital_id).first()

    if not vital:
        raise HTTPException(status_code=404, detail="Vital signs record not found")

    return {
        "id": vital.id,
        "patient_id": vital.patient_id,
        "heart_rate": vital.heart_rate,
        "blood_pressure_systolic": vital.blood_pressure_systolic,
        "blood_pressure_diastolic": vital.blood_pressure_diastolic,
        "oxygen_saturation": vital.oxygen_saturation,
        "respiratory_rate": vital.respiratory_rate,
        "body_temperature": vital.body_temperature,
        "blood_glucose": vital.blood_glucose,
        "weight": vital.weight,
        "height": vital.height,
        "bmi": vital.bmi,
        "ecg_data": vital.ecg_data,
        "overall_status": vital.overall_status,
        "is_abnormal": vital.is_abnormal,
        "alert_triggered": vital.alert_triggered,
        "alert_message": vital.alert_message,
        "device_id": vital.device_id,
        "device_type": vital.device_type,
        "measurement_source": vital.measurement_source,
        "notes": vital.notes,
        "recorded_by_user_id": vital.recorded_by_user_id,
        "measured_at": vital.measured_at.isoformat(),
        "created_at": vital.created_at.isoformat(),
        "updated_at": vital.updated_at.isoformat()
    }


@router.post("/vitals")
async def create_vitals(vitals_data: VitalsCreateRequest, db: Session = Depends(get_db)):
    """Create new vital signs record"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == vitals_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        # Calculate BMI if height and weight provided
        bmi = None
        if vitals_data.height and vitals_data.weight:
            height_m = vitals_data.height / 100  # Convert cm to m
            bmi = vitals_data.weight / (height_m ** 2)

        # Auto-detect abnormal vitals
        is_abnormal = vitals_data.is_abnormal
        overall_status = vitals_data.overall_status

        # Simple threshold checks (can be made more sophisticated)
        if vitals_data.heart_rate:
            if vitals_data.heart_rate < 60 or vitals_data.heart_rate > 100:
                is_abnormal = True
                if vitals_data.heart_rate < 40 or vitals_data.heart_rate > 120:
                    overall_status = VitalStatus.CRITICAL
                else:
                    overall_status = VitalStatus.WARNING

        if vitals_data.oxygen_saturation:
            if vitals_data.oxygen_saturation < 95:
                is_abnormal = True
                if vitals_data.oxygen_saturation < 90:
                    overall_status = VitalStatus.CRITICAL
                else:
                    overall_status = VitalStatus.WARNING

        if vitals_data.body_temperature:
            if vitals_data.body_temperature < 36.1 or vitals_data.body_temperature > 37.2:
                is_abnormal = True
                if vitals_data.body_temperature < 35 or vitals_data.body_temperature > 39:
                    overall_status = VitalStatus.CRITICAL
                else:
                    overall_status = VitalStatus.WARNING

        vitals = PatientVitals(
            patient_id=vitals_data.patient_id,
            heart_rate=vitals_data.heart_rate,
            blood_pressure_systolic=vitals_data.blood_pressure_systolic,
            blood_pressure_diastolic=vitals_data.blood_pressure_diastolic,
            oxygen_saturation=vitals_data.oxygen_saturation,
            respiratory_rate=vitals_data.respiratory_rate,
            body_temperature=vitals_data.body_temperature,
            blood_glucose=vitals_data.blood_glucose,
            weight=vitals_data.weight,
            height=vitals_data.height,
            bmi=bmi,
            ecg_data=vitals_data.ecg_data,
            overall_status=overall_status,
            is_abnormal=is_abnormal,
            alert_triggered=vitals_data.alert_triggered,
            alert_message=vitals_data.alert_message,
            device_id=vitals_data.device_id,
            device_type=vitals_data.device_type,
            measurement_source=vitals_data.measurement_source,
            notes=vitals_data.notes,
            recorded_by_user_id=vitals_data.recorded_by_user_id,
            measured_at=vitals_data.measured_at or datetime.utcnow()
        )

        db.add(vitals)
        db.commit()
        db.refresh(vitals)

        return {
            "status": "success",
            "message": "Vital signs recorded successfully",
            "vitals": {
                "id": vitals.id,
                "patient_id": vitals.patient_id,
                "overall_status": vitals.overall_status,
                "is_abnormal": vitals.is_abnormal
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record vitals: {str(e)}"
        )


@router.patch("/vitals/{vital_id}")
async def update_vitals(
    vital_id: int,
    vitals_data: VitalsUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update vital signs record"""

    vitals = db.query(PatientVitals).filter(PatientVitals.id == vital_id).first()

    if not vitals:
        raise HTTPException(status_code=404, detail="Vital signs record not found")

    try:
        if vitals_data.heart_rate is not None:
            vitals.heart_rate = vitals_data.heart_rate
        if vitals_data.blood_pressure_systolic is not None:
            vitals.blood_pressure_systolic = vitals_data.blood_pressure_systolic
        if vitals_data.blood_pressure_diastolic is not None:
            vitals.blood_pressure_diastolic = vitals_data.blood_pressure_diastolic
        if vitals_data.oxygen_saturation is not None:
            vitals.oxygen_saturation = vitals_data.oxygen_saturation
        if vitals_data.respiratory_rate is not None:
            vitals.respiratory_rate = vitals_data.respiratory_rate
        if vitals_data.body_temperature is not None:
            vitals.body_temperature = vitals_data.body_temperature
        if vitals_data.blood_glucose is not None:
            vitals.blood_glucose = vitals_data.blood_glucose
        if vitals_data.weight is not None:
            vitals.weight = vitals_data.weight
        if vitals_data.height is not None:
            vitals.height = vitals_data.height
        if vitals_data.overall_status is not None:
            vitals.overall_status = vitals_data.overall_status
        if vitals_data.is_abnormal is not None:
            vitals.is_abnormal = vitals_data.is_abnormal
        if vitals_data.notes is not None:
            vitals.notes = vitals_data.notes

        # Recalculate BMI if height or weight changed
        if vitals.height and vitals.weight:
            height_m = vitals.height / 100
            vitals.bmi = vitals.weight / (height_m ** 2)

        vitals.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "Vital signs updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update vitals: {str(e)}"
        )


@router.delete("/vitals/{vital_id}")
async def delete_vitals(vital_id: int, db: Session = Depends(get_db)):
    """Delete vital signs record"""

    vitals = db.query(PatientVitals).filter(PatientVitals.id == vital_id).first()

    if not vitals:
        raise HTTPException(status_code=404, detail="Vital signs record not found")

    try:
        db.delete(vitals)
        db.commit()

        return {
            "status": "success",
            "message": "Vital signs record deleted successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete vitals: {str(e)}"
        )


@router.get("/vitals/patient/{patient_id}/latest")
async def get_latest_vitals(patient_id: int, db: Session = Depends(get_db)):
    """Get the latest vital signs for a patient"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    vital = db.query(PatientVitals).filter(
        PatientVitals.patient_id == patient_id
    ).order_by(desc(PatientVitals.measured_at)).first()

    if not vital:
        return {
            "patient_id": patient_id,
            "patient_name": patient.name,
            "latest_vitals": None,
            "message": "No vital signs recorded yet"
        }

    return {
        "patient_id": patient_id,
        "patient_name": patient.name,
        "latest_vitals": {
            "id": vital.id,
            "heart_rate": vital.heart_rate,
            "blood_pressure_systolic": vital.blood_pressure_systolic,
            "blood_pressure_diastolic": vital.blood_pressure_diastolic,
            "oxygen_saturation": vital.oxygen_saturation,
            "respiratory_rate": vital.respiratory_rate,
            "body_temperature": vital.body_temperature,
            "blood_glucose": vital.blood_glucose,
            "overall_status": vital.overall_status,
            "is_abnormal": vital.is_abnormal,
            "measured_at": vital.measured_at.isoformat()
        }
    }
