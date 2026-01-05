from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from datetime import datetime, timedelta
from typing import List
import psutil
import requests
from pydantic import BaseModel

from ...core.database import get_db
from ...models.system_log import SystemLog, SystemHealth
from ...models.device import Device, DeviceLog, DeviceStatus
from ...models.user import User

router = APIRouter()


class SystemHealthResponse(BaseModel):
    service_name: str
    status: str
    response_time: int | None = None
    uptime: str | None = None
    details: dict | None = None


class AnalyticsResponse(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    total_patients: int
    total_doctors: int
    total_staff: int
    alerts_today: int
    devices_by_status: dict
    hourly_activity: List[dict]


@router.get("/health", response_model=List[SystemHealthResponse])
async def get_system_health(db: Session = Depends(get_db)):
    """Get health status of all system components"""

    health_checks = []

    # Check Backend (self)
    health_checks.append({
        "service_name": "Backend API",
        "status": "healthy",
        "response_time": 5,
        "uptime": "99.9%",
        "details": {
            "version": "1.0.0",
            "cpu_usage": f"{psutil.cpu_percent()}%",
            "memory_usage": f"{psutil.virtual_memory().percent}%"
        }
    })

    # Check Database
    try:
        # Simple query to check database connectivity
        result = db.execute(text("SELECT 1 as test"))
        result.fetchone()
        db_status = "healthy"
        db_response_time = 2
    except Exception as e:
        print(f"Database health check failed: {e}")
        db_status = "down"
        db_response_time = None

    health_checks.append({
        "service_name": "PostgreSQL Database",
        "status": db_status,
        "response_time": db_response_time,
        "uptime": "99.8%" if db_status == "healthy" else "0%",
        "details": {
            "connection_pool": "8/20 active" if db_status == "healthy" else "disconnected"
        }
    })

    # Check Device Service (mock for now)
    health_checks.append({
        "service_name": "Device Service",
        "status": "healthy",
        "response_time": 15,
        "uptime": "99.5%",
        "details": {
            "active_connections": 42,
            "data_throughput": "1.2 MB/s"
        }
    })

    # Check MQTT Broker (mock for now)
    health_checks.append({
        "service_name": "MQTT Broker",
        "status": "healthy",
        "response_time": 8,
        "uptime": "99.9%",
        "details": {
            "connected_devices": 42,
            "messages_per_sec": 145
        }
    })

    # Check Redis Cache (mock for now)
    health_checks.append({
        "service_name": "Redis Cache",
        "status": "healthy",
        "response_time": 1,
        "uptime": "100%",
        "details": {
            "memory_usage": "245 MB",
            "hit_rate": "94.2%"
        }
    })

    return health_checks


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(db: Session = Depends(get_db)):
    """Get system analytics and statistics"""

    # Device statistics
    total_devices = db.query(func.count(Device.id)).scalar() or 0
    online_devices = db.query(func.count(Device.id)).filter(
        Device.status == DeviceStatus.ONLINE
    ).scalar() or 0
    offline_devices = db.query(func.count(Device.id)).filter(
        Device.status == DeviceStatus.OFFLINE
    ).scalar() or 0

    # User statistics
    total_doctors = db.query(func.count(User.id)).filter(
        User.role == "doctor"
    ).scalar() or 0
    total_staff = db.query(func.count(User.id)).filter(
        User.role == "staff"
    ).scalar() or 0

    # Devices by status
    devices_by_status = {
        "online": online_devices,
        "offline": offline_devices,
        "maintenance": db.query(func.count(Device.id)).filter(
            Device.status == DeviceStatus.MAINTENANCE
        ).scalar() or 0,
        "error": db.query(func.count(Device.id)).filter(
            Device.status == DeviceStatus.ERROR
        ).scalar() or 0
    }

    # Mock hourly activity (in real implementation, query from logs)
    hourly_activity = [
        {"hour": f"{i}:00", "connections": 30 + (i * 2), "alerts": 2 + (i % 3)}
        for i in range(24)
    ]

    return {
        "total_devices": total_devices,
        "online_devices": online_devices,
        "offline_devices": offline_devices,
        "total_patients": total_devices,  # Assuming 1:1 mapping
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "alerts_today": 15,  # Mock data
        "devices_by_status": devices_by_status,
        "hourly_activity": hourly_activity
    }


@router.get("/logs")
async def get_system_logs(
    limit: int = 100,
    level: str | None = None,
    service: str | None = None,
    db: Session = Depends(get_db)
):
    """Get system logs with optional filtering"""

    query = db.query(SystemLog)

    if level:
        query = query.filter(SystemLog.level == level)
    if service:
        query = query.filter(SystemLog.service == service)

    logs = query.order_by(desc(SystemLog.timestamp)).limit(limit).all()

    return [{
        "id": log.id,
        "service": log.service,
        "level": log.level,
        "message": log.message,
        "details": log.details,
        "timestamp": log.timestamp.isoformat()
    } for log in logs]


@router.post("/logs")
async def create_system_log(
    service: str,
    level: str,
    message: str,
    details: dict | None = None,
    db: Session = Depends(get_db)
):
    """Create a new system log entry"""

    log = SystemLog(
        service=service,
        level=level,
        message=message,
        details=details
    )
    db.add(log)
    db.commit()

    return {"status": "success", "log_id": log.id}


@router.get("/metrics")
async def get_system_metrics():
    """Get current system metrics"""

    return {
        "cpu": {
            "usage": psutil.cpu_percent(interval=1),
            "cores": psutil.cpu_count(),
            "frequency": psutil.cpu_freq().current if psutil.cpu_freq() else None
        },
        "memory": {
            "total": psutil.virtual_memory().total,
            "available": psutil.virtual_memory().available,
            "used": psutil.virtual_memory().used,
            "percent": psutil.virtual_memory().percent
        },
        "disk": {
            "total": psutil.disk_usage('/').total,
            "used": psutil.disk_usage('/').used,
            "free": psutil.disk_usage('/').free,
            "percent": psutil.disk_usage('/').percent
        }
    }
