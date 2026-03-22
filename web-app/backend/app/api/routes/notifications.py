"""
Notification API routes and WebSocket endpoint.
Provides CRUD for notifications and real-time push via WebSocket.
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional

from ...core.database import get_db
from ...models.notification import Notification, NotificationType, NotificationPriority
from ...services.notification_service import get_notification_service

router = APIRouter()


@router.get("/notifications")
async def get_notifications(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    priority: Optional[str] = None,
    is_read: Optional[bool] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List notifications with optional filters."""
    query = db.query(Notification)

    if priority:
        try:
            priority_enum = NotificationPriority(priority.upper())
            query = query.filter(Notification.priority == priority_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}")

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    if patient_id is not None:
        query = query.filter(Notification.patient_id == patient_id)

    total = query.count()
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "notifications": [
            {
                "id": n.id,
                "patient_id": n.patient_id,
                "recipient_role": n.recipient_role,
                "type": n.type.value if n.type else None,
                "priority": n.priority.value if n.priority else None,
                "title": n.title,
                "message": n.message,
                "data": n.data,
                "is_read": n.is_read,
                "read_by_id": n.read_by_id,
                "read_at": n.read_at.isoformat() if n.read_at else None,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "patient_name": n.patient.name if n.patient else None,
                "patient_room": n.patient.room_number if n.patient else None,
            }
            for n in notifications
        ],
    }


@router.get("/notifications/unread-count")
async def get_unread_count(db: Session = Depends(get_db)):
    """Get count of unread notifications."""
    count = db.query(Notification).filter(Notification.is_read == False).count()
    critical = db.query(Notification).filter(
        Notification.is_read == False,
        Notification.priority == NotificationPriority.CRITICAL,
    ).count()
    high = db.query(Notification).filter(
        Notification.is_read == False,
        Notification.priority == NotificationPriority.HIGH,
    ).count()

    return {
        "unread_count": count,
        "critical_count": critical,
        "high_count": high,
    }


@router.put("/notifications/{notification_id}/read")
async def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a single notification as read."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"status": "ok", "id": notification_id}


@router.put("/notifications/read-all")
async def mark_all_read(db: Session = Depends(get_db)):
    """Mark all unread notifications as read."""
    count = db.query(Notification).filter(Notification.is_read == False).update(
        {"is_read": True, "read_at": datetime.utcnow()}
    )
    db.commit()

    return {"status": "ok", "marked_read": count}


@router.websocket("/ws/notifications")
async def notifications_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time notification push."""
    await websocket.accept()

    service = get_notification_service()
    service.add_ws_connection(websocket)

    try:
        while True:
            # Keep connection alive, handle pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        service.remove_ws_connection(websocket)
