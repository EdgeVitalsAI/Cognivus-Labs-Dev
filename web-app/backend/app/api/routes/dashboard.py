from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta

from ...core.database import get_db
from ...models.patient import Patient, PatientStatus
from ...models.patient_vitals import PatientVitals, VitalStatus
from ...models.prescription import Prescription, PrescriptionStatus
from ...models.staff_task import StaffTask, TaskStatus

router = APIRouter()


@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get comprehensive dashboard statistics"""

    # Patient stats
    total_patients = db.query(Patient).count()
    critical_patients = db.query(Patient).filter(Patient.status == PatientStatus.CRITICAL).count()
    warning_patients = db.query(Patient).filter(Patient.status == PatientStatus.WARNING).count()

    # Get patients added this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    patients_this_week = db.query(Patient).filter(Patient.created_at >= week_ago).count()

    # Vitals alerts (abnormal vitals in last 24 hours)
    day_ago = datetime.utcnow() - timedelta(hours=24)
    critical_vitals = db.query(PatientVitals).filter(
        PatientVitals.overall_status == VitalStatus.CRITICAL,
        PatientVitals.measured_at >= day_ago
    ).count()

    # Pending prescriptions
    pending_prescriptions = db.query(Prescription).filter(
        Prescription.status == PrescriptionStatus.ACTIVE
    ).count()

    # Pending tasks
    pending_tasks = db.query(StaffTask).filter(
        StaffTask.status == TaskStatus.PENDING
    ).count()

    return {
        "active_patients": total_patients,
        "patients_this_week": patients_this_week,
        "critical_alerts": critical_patients + warning_patients,
        "critical_vitals": critical_vitals,
        "pending_prescriptions": pending_prescriptions,
        "pending_tasks": pending_tasks,
        "patients_by_status": {
            "critical": critical_patients,
            "warning": warning_patients,
            "stable": db.query(Patient).filter(Patient.status == PatientStatus.STABLE).count()
        }
    }


@router.get("/dashboard/alerts")
async def get_dashboard_alerts(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent patient alerts based on abnormal vitals"""

    # Get recent abnormal vitals
    abnormal_vitals = db.query(PatientVitals).filter(
        PatientVitals.is_abnormal == True
    ).order_by(desc(PatientVitals.measured_at)).limit(limit).all()

    alerts = []
    for vital in abnormal_vitals:
        patient = vital.patient

        # Determine condition based on vitals
        conditions = []
        if vital.oxygen_saturation and vital.oxygen_saturation < 95:
            conditions.append("Low O2")
        if vital.heart_rate and (vital.heart_rate < 60 or vital.heart_rate > 100):
            conditions.append("Abnormal HR")
        if vital.body_temperature and (vital.body_temperature < 36.1 or vital.body_temperature > 37.2):
            conditions.append("Abnormal Temp")
        if vital.blood_pressure_systolic and vital.blood_pressure_systolic > 140:
            conditions.append("High BP")

        condition = " & ".join(conditions) if conditions else "Abnormal Vitals"

        # Calculate time ago
        time_diff = datetime.utcnow() - vital.measured_at
        if time_diff.seconds < 60:
            time_ago = f"{time_diff.seconds} sec ago"
        elif time_diff.seconds < 3600:
            time_ago = f"{time_diff.seconds // 60} mins ago"
        elif time_diff.seconds < 86400:
            time_ago = f"{time_diff.seconds // 3600} hours ago"
        else:
            time_ago = f"{time_diff.days} days ago"

        alerts.append({
            "patient": patient.name,
            "room": patient.room_number or "N/A",
            "condition": condition,
            "severity": vital.overall_status.lower() if vital.overall_status else "normal",
            "time": time_ago,
            "patient_id": patient.id
        })

    return {"alerts": alerts}


@router.get("/dashboard/activity")
async def get_dashboard_activity(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent activity feed"""

    activities = []

    # Recent prescriptions
    recent_prescriptions = db.query(Prescription).order_by(
        desc(Prescription.created_at)
    ).limit(5).all()

    for rx in recent_prescriptions:
        time_diff = datetime.utcnow() - rx.created_at
        if time_diff.seconds < 3600:
            time_ago = f"{time_diff.seconds // 60} mins ago"
        elif time_diff.days < 1:
            time_ago = "Today at " + rx.created_at.strftime("%I:%M %p")
        else:
            time_ago = rx.created_at.strftime("%b %d, %Y - %I:%M %p")

        activities.append({
            "title": f"Prescription created for {rx.patient.name if rx.patient else 'Patient'}",
            "author": rx.prescribed_by.full_name if rx.prescribed_by else "Doctor",
            "time": time_ago,
            "type": "prescription"
        })

    # Recent patients
    recent_patients = db.query(Patient).order_by(
        desc(Patient.admission_date)
    ).limit(5).all()

    for patient in recent_patients:
        if patient.admission_date:
            time_diff = datetime.utcnow() - patient.admission_date
            if time_diff.days < 1:
                time_ago = "Today at " + patient.admission_date.strftime("%I:%M %p")
            else:
                time_ago = patient.admission_date.strftime("%b %d, %Y - %I:%M %p")

            activities.append({
                "title": f"New patient admitted - {patient.room_number or 'Room TBD'}",
                "author": "Admissions",
                "time": time_ago,
                "type": "admission"
            })

    # Recent vital updates
    recent_vitals = db.query(PatientVitals).order_by(
        desc(PatientVitals.measured_at)
    ).limit(5).all()

    for vital in recent_vitals:
        time_diff = datetime.utcnow() - vital.measured_at
        if time_diff.seconds < 3600:
            time_ago = f"{time_diff.seconds // 60} mins ago"
        elif time_diff.days < 1:
            time_ago = "Today at " + vital.measured_at.strftime("%I:%M %p")
        else:
            time_ago = vital.measured_at.strftime("%b %d, %Y - %I:%M %p")

        bp_text = ""
        if vital.blood_pressure_systolic and vital.blood_pressure_diastolic:
            bp_text = f"BP: {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}"

        activities.append({
            "title": f"Vitals updated for {vital.patient.name if vital.patient else 'Patient'}" + (f" - {bp_text}" if bp_text else ""),
            "author": vital.recorded_by.full_name if vital.recorded_by else "Medical Staff",
            "time": time_ago,
            "type": "vitals"
        })

    # Sort all activities by time and limit
    # For now, return mixed activities
    return {"activity": activities[:limit]}


@router.get("/dashboard/tasks")
async def get_dashboard_tasks(limit: int = 10, db: Session = Depends(get_db)):
    """Get pending tasks for dashboard"""

    tasks = db.query(StaffTask).filter(
        StaffTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
    ).order_by(desc(StaffTask.priority), StaffTask.due_date).limit(limit).all()

    result = []
    for task in tasks:
        # Calculate due time
        when_text = ""
        if task.due_date:
            time_diff = task.due_date - datetime.utcnow()
            if time_diff.total_seconds() < 0:
                when_text = "OVERDUE"
            elif time_diff.total_seconds() < 3600:
                when_text = f"Due in {int(time_diff.total_seconds() / 60)} mins"
            elif time_diff.total_seconds() < 86400:
                when_text = f"Due in {int(time_diff.total_seconds() / 3600)} hours"
            else:
                when_text = f"Due in {time_diff.days} days"
        else:
            when_text = "No deadline"

        result.append({
            "id": task.id,
            "title": task.title,
            "when": f"{task.priority} {when_text}",
            "priority": task.priority,
            "status": task.status
        })

    return {"tasks": result}
