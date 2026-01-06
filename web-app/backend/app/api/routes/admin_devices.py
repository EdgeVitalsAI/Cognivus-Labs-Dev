from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.device import Device, DeviceLog, DeviceStatus, AssignmentStatus, DeviceAssignment

router = APIRouter()


class DeviceResponse(BaseModel):
    id: int
    device_id: str
    device_name: str
    status: str
    assignment_status: str | None
    battery_level: float | None
    firmware_version: str | None
    patient_id: str | None
    patient_name: str | None
    assigned_room: str | None
    assigned_at: datetime | None
    assigned_by: str | None
    last_ping: datetime | None
    spo2: float | None
    heart_rate: int | None
    temperature: float | None

    class Config:
        from_attributes = True


class DeviceDebugCommand(BaseModel):
    device_id: str
    command: str
    parameters: dict | None = None


class DeviceAssignmentRequest(BaseModel):
    patient_id: str
    patient_name: str
    assigned_room: Optional[str] = None
    assigned_by: str  # User ID or email
    assigned_by_name: Optional[str] = None
    assignment_notes: Optional[str] = None


class DeviceUnassignmentRequest(BaseModel):
    unassigned_by: str  # User ID or email
    unassignment_notes: Optional[str] = None


@router.get("/devices", response_model=List[DeviceResponse])
async def get_all_devices(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all devices with optional status filter"""

    query = db.query(Device)

    if status:
        query = query.filter(Device.status == status)

    devices = query.order_by(desc(Device.updated_at)).limit(limit).all()

    return devices


@router.get("/devices/{device_id}")
async def get_device_details(device_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific device"""

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Get recent logs
    logs = db.query(DeviceLog).filter(
        DeviceLog.device_id == device_id
    ).order_by(desc(DeviceLog.timestamp)).limit(50).all()

    return {
        "device": {
            "id": device.id,
            "device_id": device.device_id,
            "device_name": device.device_name,
            "status": device.status,
            "battery_level": device.battery_level,
            "firmware_version": device.firmware_version,
            "patient_id": device.patient_id,
            "patient_name": device.patient_name,
            "assigned_room": device.assigned_room,
            "ip_address": device.ip_address,
            "mac_address": device.mac_address,
            "last_ping": device.last_ping,
            "spo2": device.spo2,
            "heart_rate": device.heart_rate,
            "blood_pressure": f"{device.blood_pressure_sys}/{device.blood_pressure_dia}" if device.blood_pressure_sys else None,
            "temperature": device.temperature,
            "location": device.location,
            "notes": device.notes,
            "config": device.config,
            "created_at": device.created_at,
            "updated_at": device.updated_at
        },
        "recent_logs": [{
            "id": log.id,
            "log_type": log.log_type,
            "message": log.message,
            "data": log.data,
            "timestamp": log.timestamp.isoformat()
        } for log in logs]
    }


@router.post("/devices/{device_id}/debug")
async def send_debug_command(
    device_id: str,
    command: DeviceDebugCommand,
    db: Session = Depends(get_db)
):
    """Send debug command to a specific device"""

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Log the debug command
    log = DeviceLog(
        device_id=device_id,
        log_type="debug",
        message=f"Debug command sent: {command.command}",
        data={
            "command": command.command,
            "parameters": command.parameters,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    db.add(log)
    db.commit()

    # In real implementation, this would send the command to the device via MQTT/WebSocket
    # For now, we'll just return a success response

    return {
        "status": "success",
        "device_id": device_id,
        "command": command.command,
        "message": f"Debug command '{command.command}' sent to device {device_id}",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/devices/{device_id}/restart")
async def restart_device(device_id: str, db: Session = Depends(get_db)):
    """Send restart command to device"""

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Log restart command
    log = DeviceLog(
        device_id=device_id,
        log_type="info",
        message="Device restart initiated",
        data={"action": "restart", "initiated_by": "admin"}
    )
    db.add(log)

    device.status = DeviceStatus.MAINTENANCE
    db.commit()

    return {
        "status": "success",
        "message": f"Restart command sent to device {device_id}"
    }


@router.get("/devices/{device_id}/logs")
async def get_device_logs(
    device_id: str,
    log_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get logs for a specific device"""

    query = db.query(DeviceLog).filter(DeviceLog.device_id == device_id)

    if log_type:
        query = query.filter(DeviceLog.log_type == log_type)

    logs = query.order_by(desc(DeviceLog.timestamp)).limit(limit).all()

    return [{
        "id": log.id,
        "device_id": log.device_id,
        "log_type": log.log_type,
        "message": log.message,
        "data": log.data,
        "timestamp": log.timestamp.isoformat()
    } for log in logs]


@router.patch("/devices/{device_id}")
async def update_device(
    device_id: str,
    device_name: Optional[str] = None,
    notes: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update device information"""

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device_name:
        device.device_name = device_name
    if notes:
        device.notes = notes
    if location:
        device.location = location

    device.updated_at = datetime.utcnow()
    db.commit()

    return {"status": "success", "message": "Device updated successfully"}


# ========================================
# Device Assignment Endpoints
# ========================================

@router.post("/devices/{device_id}/assign")
async def assign_device_to_patient(
    device_id: str,
    assignment: DeviceAssignmentRequest,
    db: Session = Depends(get_db)
):
    """Assign a device to a patient"""

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Check if device is already assigned
    if device.assignment_status in [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_USE]:
        raise HTTPException(
            status_code=400,
            detail=f"Device is already assigned to patient {device.patient_name}"
        )

    # Update device with assignment
    device.patient_id = assignment.patient_id
    device.patient_name = assignment.patient_name
    device.assigned_room = assignment.assigned_room
    device.assigned_at = datetime.utcnow()
    device.assigned_by = assignment.assigned_by
    device.assignment_status = AssignmentStatus.ASSIGNED
    device.updated_at = datetime.utcnow()

    # Create assignment history record
    assignment_record = DeviceAssignment(
        device_id=device_id,
        device_name=device.device_name,
        patient_id=assignment.patient_id,
        patient_name=assignment.patient_name,
        assigned_room=assignment.assigned_room,
        assigned_by=assignment.assigned_by,
        assigned_by_name=assignment.assigned_by_name,
        assigned_at=datetime.utcnow(),
        is_active=True,
        assignment_notes=assignment.assignment_notes
    )

    db.add(assignment_record)

    # Log the assignment
    log = DeviceLog(
        device_id=device_id,
        log_type="info",
        message=f"Device assigned to patient {assignment.patient_name}",
        data={
            "patient_id": assignment.patient_id,
            "patient_name": assignment.patient_name,
            "assigned_by": assignment.assigned_by,
            "assigned_room": assignment.assigned_room
        }
    )
    db.add(log)

    db.commit()

    return {
        "status": "success",
        "message": f"Device {device.device_name} assigned to patient {assignment.patient_name}",
        "device_id": device_id,
        "patient_id": assignment.patient_id
    }


@router.post("/devices/{device_id}/unassign")
async def unassign_device_from_patient(
    device_id: str,
    unassignment: DeviceUnassignmentRequest,
    db: Session = Depends(get_db)
):
    """Unassign a device from a patient"""

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Check if device is actually assigned
    if device.assignment_status == AssignmentStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Device is not assigned to any patient")

    # Store patient info before clearing
    old_patient_name = device.patient_name
    old_patient_id = device.patient_id

    # Update current active assignment record
    active_assignment = db.query(DeviceAssignment).filter(
        DeviceAssignment.device_id == device_id,
        DeviceAssignment.is_active == True
    ).first()

    if active_assignment:
        active_assignment.unassigned_at = datetime.utcnow()
        active_assignment.unassigned_by = unassignment.unassigned_by
        active_assignment.is_active = False
        active_assignment.unassignment_notes = unassignment.unassignment_notes

    # Clear device assignment
    device.patient_id = None
    device.patient_name = None
    device.assigned_room = None
    device.assigned_at = None
    device.assigned_by = None
    device.assignment_status = AssignmentStatus.AVAILABLE
    device.updated_at = datetime.utcnow()

    # Log the unassignment
    log = DeviceLog(
        device_id=device_id,
        log_type="info",
        message=f"Device unassigned from patient {old_patient_name}",
        data={
            "patient_id": old_patient_id,
            "patient_name": old_patient_name,
            "unassigned_by": unassignment.unassigned_by
        }
    )
    db.add(log)

    db.commit()

    return {
        "status": "success",
        "message": f"Device {device.device_name} unassigned from patient {old_patient_name}",
        "device_id": device_id
    }


@router.get("/devices/available")
async def get_available_devices(db: Session = Depends(get_db)):
    """Get all devices that are available for assignment"""

    devices = db.query(Device).filter(
        Device.assignment_status == AssignmentStatus.AVAILABLE
    ).order_by(Device.device_name).all()

    return [{
        "id": d.id,
        "device_id": d.device_id,
        "device_name": d.device_name,
        "status": d.status.value,
        "battery_level": d.battery_level,
        "firmware_version": d.firmware_version,
        "last_ping": d.last_ping
    } for d in devices]


@router.get("/devices/{device_id}/assignment-history")
async def get_device_assignment_history(
    device_id: str,
    db: Session = Depends(get_db)
):
    """Get assignment history for a specific device"""

    assignments = db.query(DeviceAssignment).filter(
        DeviceAssignment.device_id == device_id
    ).order_by(desc(DeviceAssignment.assigned_at)).all()

    return [{
        "id": a.id,
        "patient_id": a.patient_id,
        "patient_name": a.patient_name,
        "assigned_room": a.assigned_room,
        "assigned_by": a.assigned_by,
        "assigned_by_name": a.assigned_by_name,
        "assigned_at": a.assigned_at,
        "unassigned_at": a.unassigned_at,
        "unassigned_by": a.unassigned_by,
        "is_active": a.is_active,
        "assignment_notes": a.assignment_notes,
        "unassignment_notes": a.unassignment_notes
    } for a in assignments]
