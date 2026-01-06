from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from ...core.database import get_db
from ...models.patient import Patient, PatientStatus, BloodType, Gender

router = APIRouter()


class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None


class InsuranceInfoSchema(BaseModel):
    provider: str
    policy_number: str
    group_number: Optional[str] = None


class MedicalHistoryItemSchema(BaseModel):
    condition: str
    diagnosed_date: Optional[str] = None
    status: str  # "ACTIVE", "RESOLVED", "CHRONIC"


class PatientCreateRequest(BaseModel):
    name: str
    date_of_birth: date
    gender: Gender
    blood_type: Optional[BloodType] = None
    photo_url: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[dict] = None
    insurance_info: Optional[dict] = None
    room_number: Optional[str] = None
    ward_location: Optional[str] = None
    status: Optional[PatientStatus] = PatientStatus.STABLE
    department: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    medical_history: Optional[list] = []
    allergies: Optional[list] = []
    current_medications: Optional[list] = []


class PatientUpdateRequest(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[BloodType] = None
    photo_url: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[dict] = None
    insurance_info: Optional[dict] = None
    room_number: Optional[str] = None
    ward_location: Optional[str] = None
    status: Optional[PatientStatus] = None
    department: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    medical_history: Optional[list] = None
    allergies: Optional[list] = None
    current_medications: Optional[list] = None
    discharge_date: Optional[datetime] = None


@router.get("/patients")
async def get_all_patients(
    status: Optional[str] = None,
    department: Optional[str] = None,
    assigned_doctor_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all patients with optional filtering"""

    query = db.query(Patient)

    # Filters
    if status:
        query = query.filter(Patient.status == status)
    if department:
        query = query.filter(Patient.department == department)
    if assigned_doctor_id:
        query = query.filter(Patient.assigned_doctor_id == assigned_doctor_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Patient.name.ilike(search_pattern),
                Patient.email.ilike(search_pattern),
                Patient.phone.ilike(search_pattern),
                Patient.room_number.ilike(search_pattern)
            )
        )

    total = query.count()
    patients = query.order_by(desc(Patient.admission_date)).offset(offset).limit(limit).all()

    # Calculate age for each patient
    today = date.today()
    patient_list = []
    for patient in patients:
        age = today.year - patient.date_of_birth.year - (
            (today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day)
        )

        patient_data = {
            "id": patient.id,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth.isoformat(),
            "age": age,
            "gender": patient.gender,
            "blood_type": patient.blood_type,
            "photo_url": patient.photo_url,
            "email": patient.email,
            "phone": patient.phone,
            "address": patient.address,
            "room_number": patient.room_number,
            "ward_location": patient.ward_location,
            "admission_date": patient.admission_date.isoformat() if patient.admission_date else None,
            "discharge_date": patient.discharge_date.isoformat() if patient.discharge_date else None,
            "status": patient.status,
            "department": patient.department,
            "assigned_doctor_id": patient.assigned_doctor_id,
            "assigned_nurse_id": patient.assigned_nurse_id,
            "emergency_contact": patient.emergency_contact,
            "insurance_info": patient.insurance_info,
            "medical_history": patient.medical_history or [],
            "allergies": patient.allergies or [],
            "current_medications": patient.current_medications or [],
            "created_at": patient.created_at.isoformat(),
            "updated_at": patient.updated_at.isoformat()
        }
        patient_list.append(patient_data)

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "patients": patient_list
    }


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get specific patient details"""

    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Calculate age
    today = date.today()
    age = today.year - patient.date_of_birth.year - (
        (today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day)
    )

    return {
        "id": patient.id,
        "name": patient.name,
        "date_of_birth": patient.date_of_birth.isoformat(),
        "age": age,
        "gender": patient.gender,
        "blood_type": patient.blood_type,
        "photo_url": patient.photo_url,
        "email": patient.email,
        "phone": patient.phone,
        "address": patient.address,
        "room_number": patient.room_number,
        "ward_location": patient.ward_location,
        "admission_date": patient.admission_date.isoformat() if patient.admission_date else None,
        "discharge_date": patient.discharge_date.isoformat() if patient.discharge_date else None,
        "status": patient.status,
        "department": patient.department,
        "assigned_doctor_id": patient.assigned_doctor_id,
        "assigned_nurse_id": patient.assigned_nurse_id,
        "emergency_contact": patient.emergency_contact,
        "insurance_info": patient.insurance_info,
        "medical_history": patient.medical_history or [],
        "allergies": patient.allergies or [],
        "current_medications": patient.current_medications or [],
        "created_at": patient.created_at.isoformat(),
        "updated_at": patient.updated_at.isoformat()
    }


@router.post("/patients")
async def create_patient(patient_data: PatientCreateRequest, db: Session = Depends(get_db)):
    """Create new patient"""

    # Check if email already exists (if provided)
    if patient_data.email:
        existing_patient = db.query(Patient).filter(Patient.email == patient_data.email).first()
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient with this email already exists"
            )

    try:
        # Calculate age
        today = date.today()
        age = today.year - patient_data.date_of_birth.year - (
            (today.month, today.day) < (patient_data.date_of_birth.month, patient_data.date_of_birth.day)
        )

        patient = Patient(
            name=patient_data.name,
            date_of_birth=patient_data.date_of_birth,
            age=age,
            gender=patient_data.gender,
            blood_type=patient_data.blood_type,
            photo_url=patient_data.photo_url,
            email=patient_data.email,
            phone=patient_data.phone,
            address=patient_data.address,
            emergency_contact=patient_data.emergency_contact,
            insurance_info=patient_data.insurance_info,
            room_number=patient_data.room_number,
            ward_location=patient_data.ward_location,
            status=patient_data.status,
            department=patient_data.department,
            assigned_doctor_id=patient_data.assigned_doctor_id,
            assigned_nurse_id=patient_data.assigned_nurse_id,
            medical_history=patient_data.medical_history,
            allergies=patient_data.allergies,
            current_medications=patient_data.current_medications
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

        return {
            "status": "success",
            "message": "Patient created successfully",
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "age": age,
                "status": patient.status
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create patient: {str(e)}"
        )


@router.patch("/patients/{patient_id}")
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update patient details"""

    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        # Update fields if provided
        if patient_data.name is not None:
            patient.name = patient_data.name
        if patient_data.date_of_birth is not None:
            patient.date_of_birth = patient_data.date_of_birth
            # Recalculate age
            today = date.today()
            patient.age = today.year - patient_data.date_of_birth.year - (
                (today.month, today.day) < (patient_data.date_of_birth.month, patient_data.date_of_birth.day)
            )
        if patient_data.gender is not None:
            patient.gender = patient_data.gender
        if patient_data.blood_type is not None:
            patient.blood_type = patient_data.blood_type
        if patient_data.photo_url is not None:
            patient.photo_url = patient_data.photo_url
        if patient_data.email is not None:
            patient.email = patient_data.email
        if patient_data.phone is not None:
            patient.phone = patient_data.phone
        if patient_data.address is not None:
            patient.address = patient_data.address
        if patient_data.emergency_contact is not None:
            patient.emergency_contact = patient_data.emergency_contact
        if patient_data.insurance_info is not None:
            patient.insurance_info = patient_data.insurance_info
        if patient_data.room_number is not None:
            patient.room_number = patient_data.room_number
        if patient_data.ward_location is not None:
            patient.ward_location = patient_data.ward_location
        if patient_data.status is not None:
            patient.status = patient_data.status
        if patient_data.department is not None:
            patient.department = patient_data.department
        if patient_data.assigned_doctor_id is not None:
            patient.assigned_doctor_id = patient_data.assigned_doctor_id
        if patient_data.assigned_nurse_id is not None:
            patient.assigned_nurse_id = patient_data.assigned_nurse_id
        if patient_data.medical_history is not None:
            patient.medical_history = patient_data.medical_history
        if patient_data.allergies is not None:
            patient.allergies = patient_data.allergies
        if patient_data.current_medications is not None:
            patient.current_medications = patient_data.current_medications
        if patient_data.discharge_date is not None:
            patient.discharge_date = patient_data.discharge_date

        patient.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "Patient updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update patient: {str(e)}"
        )


@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete patient (hard delete - use with caution)"""

    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        patient_name = patient.name
        db.delete(patient)
        db.commit()

        return {
            "status": "success",
            "message": f"Patient {patient_name} deleted successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete patient: {str(e)}"
        )


@router.get("/patients/{patient_id}/vitals")
async def get_patient_vitals(
    patient_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get patient's vital signs history"""
    from ...models.patient_vitals import PatientVitals

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    vitals = db.query(PatientVitals).filter(
        PatientVitals.patient_id == patient_id
    ).order_by(desc(PatientVitals.measured_at)).limit(limit).all()

    return {
        "patient_id": patient_id,
        "patient_name": patient.name,
        "vitals": [{
            "id": v.id,
            "heart_rate": v.heart_rate,
            "blood_pressure_systolic": v.blood_pressure_systolic,
            "blood_pressure_diastolic": v.blood_pressure_diastolic,
            "oxygen_saturation": v.oxygen_saturation,
            "respiratory_rate": v.respiratory_rate,
            "body_temperature": v.body_temperature,
            "blood_glucose": v.blood_glucose,
            "overall_status": v.overall_status,
            "is_abnormal": v.is_abnormal,
            "device_id": v.device_id,
            "measured_at": v.measured_at.isoformat(),
            "created_at": v.created_at.isoformat()
        } for v in vitals]
    }


@router.get("/patients/statistics/summary")
async def get_patients_statistics(db: Session = Depends(get_db)):
    """Get patient statistics summary"""

    total_patients = db.query(Patient).count()

    critical = db.query(Patient).filter(Patient.status == PatientStatus.CRITICAL).count()
    warning = db.query(Patient).filter(Patient.status == PatientStatus.WARNING).count()
    stable = db.query(Patient).filter(Patient.status == PatientStatus.STABLE).count()
    discharged = db.query(Patient).filter(Patient.status == PatientStatus.DISCHARGED).count()

    return {
        "total_patients": total_patients,
        "by_status": {
            "critical": critical,
            "warning": warning,
            "stable": stable,
            "discharged": discharged
        },
        "active_patients": total_patients - discharged
    }
