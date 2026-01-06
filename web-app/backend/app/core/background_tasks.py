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
    print("✓ Heartbeat monitoring task started")

    while True:
        db = None
        try:
            db = SessionLocal()

            # Get all devices that should be online
            devices = db.query(Device).filter(
                Device.status == DeviceStatus.ONLINE
            ).all()

            if devices:
                print(f"[Heartbeat Check] Checking {len(devices)} online devices...")

            # Check each device's last ping time
            offline_threshold = datetime.utcnow() - timedelta(minutes=2)

            for device in devices:
                if device.last_ping:
                    time_since_ping = datetime.utcnow() - device.last_ping
                    print(f"  - {device.device_name} ({device.device_id}): Last ping {time_since_ping.total_seconds():.0f}s ago")

                    if device.last_ping < offline_threshold:
                        # Device hasn't pinged in 2 minutes, mark as offline
                        print(f"  ⚠ Marking {device.device_name} as OFFLINE (no heartbeat for 2+ minutes)")
                        device.status = DeviceStatus.OFFLINE
                        device.updated_at = datetime.utcnow()

                        # Log the offline event
                        log = DeviceLog(
                            device_id=device.device_id,
                            log_type="warning",
                            message=f"Device went offline (no heartbeat for 2 minutes)",
                            data={
                                "last_ping": device.last_ping.isoformat(),
                                "auto_detected": True
                            }
                        )
                        db.add(log)
                else:
                    print(f"  - {device.device_name} ({device.device_id}): No last_ping recorded")

            db.commit()
            db.close()

        except Exception as e:
            print(f"❌ Error in heartbeat check task: {e}")
            import traceback
            traceback.print_exc()
            if db:
                db.close()

        # Run this check every 30 seconds
        await asyncio.sleep(30)


async def start_background_tasks():
    """Start all background tasks"""
    asyncio.create_task(check_device_heartbeats())
