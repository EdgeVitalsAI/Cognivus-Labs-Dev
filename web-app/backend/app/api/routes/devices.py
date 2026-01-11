from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

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
