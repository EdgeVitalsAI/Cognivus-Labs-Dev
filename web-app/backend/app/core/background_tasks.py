"""
Background tasks for device management and monitoring
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..core.database import SessionLocal
from ..models.device import Device, DeviceStatus, DeviceLog


async def check_device_heartbeats():
    """
    Background task to check device heartbeats and mark devices as offline
    if they haven't sent a heartbeat in the last 2 minutes
    """
    while True:
        try:
            db: Session = SessionLocal()

            # Get all devices that should be online
            devices = db.query(Device).filter(
                Device.status.in_([DeviceStatus.ONLINE, DeviceStatus.ACTIVE])
            ).all()

            # Check each device's last ping time
            offline_threshold = datetime.utcnow() - timedelta(minutes=2)

            for device in devices:
                if device.last_ping and device.last_ping < offline_threshold:
                    # Device hasn't pinged in 2 minutes, mark as offline
                    device.status = DeviceStatus.OFFLINE
                    device.updated_at = datetime.utcnow()

                    # Log the offline event
                    log = DeviceLog(
                        device_id=device.device_id,
                        log_type="warning",
                        message=f"Device went offline (no heartbeat for 2 minutes)",
                        data={
                            "last_ping": device.last_ping.isoformat() if device.last_ping else None,
                            "auto_detected": True
                        }
                    )
                    db.add(log)

            db.commit()
            db.close()

        except Exception as e:
            print(f"Error in heartbeat check task: {e}")
            if db:
                db.close()

        # Run this check every 30 seconds
        await asyncio.sleep(30)


async def start_background_tasks():
    """Start all background tasks"""
    asyncio.create_task(check_device_heartbeats())
