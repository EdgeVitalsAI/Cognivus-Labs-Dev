from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

from ...core.database import get_db
from ...models.device import Device, DeviceLog, DeviceStatus, AssignmentStatus

router = APIRouter()


class DeviceRegistrationRequest(BaseModel):
    """Device registration payload from ESP32"""
    device_id: str
    device_name: str
    mac_address: str
    ip_address: str
    firmware_version: Optional[str] = None
    device_type: Optional[str] = "ESP32_MEDICAL_PATCH"


@router.get("/devices")
async def get_all_devices(
    db: Session = Depends(get_db)
):
    """
    Get all registered devices
    Used by doctor and staff to view device list
    """
    try:
        devices = db.query(Device).all()
        
        # Convert to dict format
        device_list = []
        for device in devices:
            device_list.append({
                "id": device.id,
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_type": device.device_type,
                "mac_address": device.mac_address,
                "ip_address": device.ip_address,
                "firmware_version": device.firmware_version,
                "status": device.status,
                "assignment_status": device.assignment_status,
                "assigned_patient_id": device.assigned_patient_id,
                "assigned_patient_name": device.assigned_patient_name,
                "assigned_at": device.assigned_at.isoformat() if device.assigned_at else None,
                "last_ping": device.last_ping.isoformat() if device.last_ping else None,
                "activated_at": device.activated_at.isoformat() if device.activated_at else None,
                "created_at": device.created_at.isoformat() if device.created_at else None,
                "updated_at": device.updated_at.isoformat() if device.updated_at else None
            })
        
        print(f"📋 Fetched {len(device_list)} devices")
        return device_list
        
    except Exception as e:
        print(f"❌ Error fetching devices: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch devices: {str(e)}"
        )


@router.post("/devices/register")
async def register_device(
    registration: DeviceRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for device auto-registration
    Called by ESP32 devices when they connect to WiFi
    NO AUTHENTICATION REQUIRED - Devices register themselves
    """

    print(f"\n{'='*60}")
    print(f"📱 Device Registration Request")
    print(f"{'='*60}")
    print(f"Device ID: {registration.device_id}")
    print(f"Device Name: {registration.device_name}")
    print(f"MAC Address: {registration.mac_address}")
    print(f"IP Address: {registration.ip_address}")
    print(f"Firmware: {registration.firmware_version}")
    print(f"Type: {registration.device_type}")
    print(f"{'='*60}\n")

    try:
        # Check if device already exists
        existing_device = db.query(Device).filter(
            Device.device_id == registration.device_id
        ).first()

        # Also check if this MAC address is already registered under a different ID
        mac_conflict = db.query(Device).filter(
            Device.mac_address == registration.mac_address,
            Device.device_id != registration.device_id
        ).first()

        if mac_conflict:
            print(f"⚠️  WARNING: MAC address {registration.mac_address} already registered")
            print(f"   Existing Device ID: {mac_conflict.device_id}")
            print(f"   New Device ID: {registration.device_id}")
            print(f"   This may indicate a device ID generation issue!")

        if existing_device:
            # Update existing device
            print(f"♻️  Updating existing device: {existing_device.device_name}")
            existing_device.device_name = registration.device_name
            existing_device.mac_address = registration.mac_address
            existing_device.ip_address = registration.ip_address
            existing_device.firmware_version = registration.firmware_version
            existing_device.device_type = registration.device_type
            existing_device.status = DeviceStatus.ONLINE
            existing_device.last_ping = datetime.utcnow()
            existing_device.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(existing_device)

            # Log the reconnection
            log = DeviceLog(
                device_id=registration.device_id,
                log_type="info",
                message=f"Device reconnected from IP {registration.ip_address}",
                data={
                    "mac_address": registration.mac_address,
                    "firmware_version": registration.firmware_version
                }
            )
            db.add(log)
            db.commit()

            print(f"✅ Device updated successfully\n")

            return {
                "status": "success",
                "message": "Device updated successfully",
                "device_id": existing_device.device_id,
                "registered": True
            }

        else:
            # Create new device
            print(f"🆕 Registering NEW device: {registration.device_name}")
            new_device = Device(
                device_id=registration.device_id,
                device_name=registration.device_name,
                device_type=registration.device_type,
                mac_address=registration.mac_address,
                ip_address=registration.ip_address,
                firmware_version=registration.firmware_version,
                status=DeviceStatus.ONLINE,
                assignment_status=AssignmentStatus.AVAILABLE,  # New devices are available for assignment
                last_ping=datetime.utcnow(),
                activated_at=datetime.utcnow()
            )

            db.add(new_device)
            db.commit()
            db.refresh(new_device)

            # Log the registration
            log = DeviceLog(
                device_id=registration.device_id,
                log_type="info",
                message=f"New device registered: {registration.device_name}",
                data={
                    "mac_address": registration.mac_address,
                    "ip_address": registration.ip_address,
                    "firmware_version": registration.firmware_version
                }
            )
            db.add(log)
            db.commit()

            print(f"✅ New device registered successfully")
            print(f"   Database ID: {new_device.id}")
            print(f"   Device ID: {new_device.device_id}")
            print(f"   Status: {new_device.status}")
            print(f"   Assignment Status: {new_device.assignment_status}\n")

            return {
                "status": "success",
                "message": "Device registered successfully",
                "device_id": new_device.device_id,
                "registered": True
            }

    except Exception as e:
        print(f"❌ Device registration FAILED: {str(e)}\n")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Device registration failed: {str(e)}"
        )


@router.post("/devices/{device_id}/heartbeat")
async def device_heartbeat(
    device_id: str,
    db: Session = Depends(get_db)
):
    """
    Device heartbeat endpoint - called periodically by ESP32
    Updates last_ping timestamp and status to ONLINE
    """

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        print(f"❌ Heartbeat failed: Device {device_id} not found")
        raise HTTPException(status_code=404, detail="Device not found")

    try:
        device.last_ping = datetime.utcnow()
        device.status = DeviceStatus.ONLINE
        device.updated_at = datetime.utcnow()

        db.commit()

        print(f"💓 Heartbeat received from {device.device_name} ({device_id})")

        return {
            "status": "success",
            "message": "Heartbeat received",
            "device_id": device_id
        }

    except Exception as e:
        print(f"❌ Heartbeat error for {device_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Heartbeat update failed: {str(e)}"
        )


class DeviceAssignmentRequest(BaseModel):
    """Request payload for assigning a device to a patient"""
    patient_id: str
    patient_name: str


@router.post("/devices/{device_id}/assign")
async def assign_device_to_patient(
    device_id: str,
    assignment: DeviceAssignmentRequest,
    db: Session = Depends(get_db)
):
    """
    Assign a device to a patient
    Updates device status from AVAILABLE to ASSIGNED
    """
    
    print(f"\n{'='*60}")
    print(f"📱 Device Assignment Request")
    print(f"{'='*60}")
    print(f"Device ID: {device_id}")
    print(f"Patient ID: {assignment.patient_id}")
    print(f"Patient Name: {assignment.patient_name}")
    print(f"{'='*60}\n")

    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        print(f"❌ Assignment failed: Device {device_id} not found")
        raise HTTPException(status_code=404, detail="Device not found")

    if device.assignment_status != AssignmentStatus.AVAILABLE:
        print(f"❌ Assignment failed: Device {device_id} is not available (status: {device.assignment_status})")
        raise HTTPException(
            status_code=400, 
            detail=f"Device is not available for assignment (current status: {device.assignment_status})"
        )

    try:
        # Update device assignment
        device.assignment_status = AssignmentStatus.ASSIGNED
        device.assigned_patient_id = assignment.patient_id
        device.assigned_patient_name = assignment.patient_name
        device.assigned_at = datetime.utcnow()
        device.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(device)

        # Log the assignment
        log = DeviceLog(
            device_id=device_id,
            log_type="info",
            message=f"Device assigned to patient: {assignment.patient_name}",
            data={
                "patient_id": assignment.patient_id,
                "patient_name": assignment.patient_name,
                "assigned_at": datetime.utcnow().isoformat()
            }
        )
        db.add(log)
        db.commit()

        print(f"✅ Device {device.device_name} successfully assigned to {assignment.patient_name}")
        print(f"   Assignment Status: {device.assignment_status}")
        print(f"   Patient ID: {device.assigned_patient_id}\n")

        return {
            "status": "success",
            "message": "Device assigned successfully",
            "device_id": device.device_id,
            "device_name": device.device_name,
            "assignment_status": device.assignment_status,
            "patient_id": device.assigned_patient_id,
            "patient_name": device.assigned_patient_name
        }

    except Exception as e:
        print(f"❌ Device assignment failed: {str(e)}\n")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Device assignment failed: {str(e)}"
        )


@router.post("/devices/{device_id}/unassign")
async def unassign_device(
    device_id: str,
    db: Session = Depends(get_db)
):
    """
    Unassign a device from a patient
    Updates device status back to AVAILABLE
    """
    
    device = db.query(Device).filter(Device.device_id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    try:
        old_patient_name = device.assigned_patient_name
        
        # Clear assignment
        device.assignment_status = AssignmentStatus.AVAILABLE
        device.assigned_patient_id = None
        device.assigned_patient_name = None
        device.assigned_at = None
        device.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(device)

        # Log the unassignment
        log = DeviceLog(
            device_id=device_id,
            log_type="info",
            message=f"Device unassigned from patient: {old_patient_name}",
            data={
                "previous_patient_name": old_patient_name,
                "unassigned_at": datetime.utcnow().isoformat()
            }
        )
        db.add(log)
        db.commit()

        print(f"✅ Device {device.device_name} unassigned from {old_patient_name}")

        return {
            "status": "success",
            "message": "Device unassigned successfully",
            "device_id": device.device_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Device unassignment failed: {str(e)}"
        )
