from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.device import Device, DeviceLog, DeviceStatus

router = APIRouter()


class DeviceResponse(BaseModel):
    id: int
    device_id: str
    device_name: str
    status: str
    battery_level: float | None
    firmware_version: str | None
    patient_name: str | None
    assigned_room: str | None
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
