"""
Notification Service
Monitors ML predictions from ECG/SpO2 monitoring services and creates
notifications for doctors/staff when anomalies are detected.

Runs as a background asyncio task, checking every 5 seconds.
Includes deduplication (5-minute window per patient+type).
"""
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, Set, List
from sqlalchemy.orm import Session

from ..core.database import SessionLocal
from ..models.notification import Notification, NotificationType, NotificationPriority
from .ecg_monitoring_service import get_ecg_monitoring_service
from .spo2_monitoring_service import get_spo2_monitoring_service
from .ecg_buffer_manager import get_ecg_buffer_manager
from .spo2_buffer_manager import get_spo2_buffer_manager
from .ecg_ml_inference import ECGTrend
from .spo2_ml_inference import SpO2Trend


class NotificationService:
    def __init__(self, check_interval: int = 5, dedup_window_minutes: int = 5):
        self.check_interval = check_interval
        self.dedup_window = timedelta(minutes=dedup_window_minutes)

        # Track recent notifications for deduplication: {(patient_id, type): last_created_at}
        self._recent_notifications: Dict[tuple, datetime] = {}

        # Track sensor-off durations: {(patient_id, sensor_type): first_seen_at}
        self._sensor_off_tracker: Dict[tuple, datetime] = {}

        # WebSocket connections for real-time push
        self._ws_connections: Set = set()

        self._task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        print("✓ Notification service started (checking every 5s)")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None
        print("✓ Notification service stopped")

    def add_ws_connection(self, ws):
        self._ws_connections.add(ws)

    def remove_ws_connection(self, ws):
        self._ws_connections.discard(ws)

    async def _monitoring_loop(self):
        while self._running:
            try:
                await self._check_all_patients()
                self._cleanup_dedup_cache()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"✗ Notification service error: {e}")

            await asyncio.sleep(self.check_interval)

    async def _check_all_patients(self):
        ecg_service = get_ecg_monitoring_service()
        spo2_service = get_spo2_monitoring_service()
        ecg_buffer_mgr = get_ecg_buffer_manager()
        spo2_buffer_mgr = get_spo2_buffer_manager()

        if not ecg_service and not spo2_service:
            return

        # Collect all active patient IDs from both buffer managers
        active_patients: Set[int] = set()
        if ecg_buffer_mgr:
            active_patients.update(ecg_buffer_mgr.active_patients)
        if spo2_buffer_mgr:
            active_patients.update(spo2_buffer_mgr.active_patients)

        if not active_patients:
            return

        notifications_to_create = []
        now = datetime.utcnow()

        for patient_id in active_patients:
            # --- ECG Checks ---
            if ecg_service and ecg_buffer_mgr:
                ecg_buffer = ecg_buffer_mgr.get_buffer(patient_id)
                ecg_prediction = ecg_service.get_latest_prediction(patient_id)

                if ecg_buffer and ecg_prediction:
                    leads_off = ecg_buffer.leads_off

                    if leads_off:
                        # Track how long leads have been off
                        key = (patient_id, "ecg_leads_off")
                        if key not in self._sensor_off_tracker:
                            self._sensor_off_tracker[key] = now
                        elif (now - self._sensor_off_tracker[key]).total_seconds() > 30:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.ECG_LEADS_DISCONNECTED,
                                priority=NotificationPriority.MEDIUM,
                                title="ECG Leads Disconnected",
                                message=f"Patient #{patient_id}: ECG leads have been disconnected for over 30 seconds. Please check electrode placement.",
                                data={"leads_off": True, "duration_seconds": (now - self._sensor_off_tracker[key]).total_seconds()}
                            ))
                    else:
                        # Leads are on — clear tracker
                        self._sensor_off_tracker.pop((patient_id, "ecg_leads_off"), None)

                        # Check ML prediction trends
                        if ecg_prediction.trend == ECGTrend.UNSTABLE:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.UNSTABLE_ECG,
                                priority=NotificationPriority.CRITICAL,
                                title="Unstable ECG Detected",
                                message=f"Patient #{patient_id}: ECG pattern is UNSTABLE (confidence: {ecg_prediction.confidence:.0%}). Immediate attention may be required.",
                                data={
                                    "trend": ecg_prediction.trend.value,
                                    "confidence": ecg_prediction.confidence,
                                    "heart_rate": ecg_prediction.heart_rate,
                                    "details": ecg_prediction.details,
                                }
                            ))
                        elif ecg_prediction.trend == ECGTrend.ABNORMAL:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.ABNORMAL_ECG,
                                priority=NotificationPriority.HIGH,
                                title="Abnormal ECG Pattern",
                                message=f"Patient #{patient_id}: ECG pattern is ABNORMAL (confidence: {ecg_prediction.confidence:.0%}). Review recommended.",
                                data={
                                    "trend": ecg_prediction.trend.value,
                                    "confidence": ecg_prediction.confidence,
                                    "heart_rate": ecg_prediction.heart_rate,
                                    "details": ecg_prediction.details,
                                }
                            ))

                        # Heart rate checks
                        if ecg_prediction.heart_rate:
                            if ecg_prediction.heart_rate > 120:
                                notifications_to_create.append(self._build_notification(
                                    patient_id=patient_id,
                                    notif_type=NotificationType.HIGH_HR,
                                    priority=NotificationPriority.HIGH,
                                    title="High Heart Rate",
                                    message=f"Patient #{patient_id}: Heart rate is {ecg_prediction.heart_rate} BPM (threshold: 120 BPM).",
                                    data={"heart_rate": ecg_prediction.heart_rate}
                                ))
                            elif ecg_prediction.heart_rate < 50:
                                notifications_to_create.append(self._build_notification(
                                    patient_id=patient_id,
                                    notif_type=NotificationType.LOW_HR,
                                    priority=NotificationPriority.HIGH,
                                    title="Low Heart Rate",
                                    message=f"Patient #{patient_id}: Heart rate is {ecg_prediction.heart_rate} BPM (threshold: 50 BPM).",
                                    data={"heart_rate": ecg_prediction.heart_rate}
                                ))

            # --- SpO2 Checks ---
            if spo2_service and spo2_buffer_mgr:
                spo2_buffer = spo2_buffer_mgr.get_buffer(patient_id)
                spo2_prediction = spo2_service.get_latest_prediction(patient_id)

                if spo2_buffer and spo2_prediction:
                    finger_detected = spo2_buffer.last_finger_detected

                    if not finger_detected:
                        # Track how long finger has been off
                        key = (patient_id, "spo2_no_finger")
                        if key not in self._sensor_off_tracker:
                            self._sensor_off_tracker[key] = now
                        elif (now - self._sensor_off_tracker[key]).total_seconds() > 30:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.SPO2_SENSOR_NOT_WORN,
                                priority=NotificationPriority.MEDIUM,
                                title="SpO2 Sensor Not Worn",
                                message=f"Patient #{patient_id}: SpO2 sensor has not detected a finger for over 30 seconds. Please verify sensor placement.",
                                data={"finger_detected": False, "duration_seconds": (now - self._sensor_off_tracker[key]).total_seconds()}
                            ))
                    else:
                        # Finger is on — clear tracker
                        self._sensor_off_tracker.pop((patient_id, "spo2_no_finger"), None)

                        # Check ML prediction trends
                        if spo2_prediction.trend == SpO2Trend.CRITICAL:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.CRITICAL_SPO2,
                                priority=NotificationPriority.CRITICAL,
                                title="Critical SpO2 Level",
                                message=f"Patient #{patient_id}: SpO2 is at CRITICAL level ({spo2_prediction.current_value}%). Immediate intervention required.",
                                data={
                                    "trend": spo2_prediction.trend.value,
                                    "confidence": spo2_prediction.confidence,
                                    "current_value": spo2_prediction.current_value,
                                    "average_value": spo2_prediction.average_value,
                                    "details": spo2_prediction.details,
                                }
                            ))
                        elif spo2_prediction.trend == SpO2Trend.DECLINING:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.SPO2_DECLINING,
                                priority=NotificationPriority.HIGH,
                                title="SpO2 Declining",
                                message=f"Patient #{patient_id}: SpO2 is DECLINING (current: {spo2_prediction.current_value}%, avg: {spo2_prediction.average_value}%). Monitor closely.",
                                data={
                                    "trend": spo2_prediction.trend.value,
                                    "confidence": spo2_prediction.confidence,
                                    "current_value": spo2_prediction.current_value,
                                    "average_value": spo2_prediction.average_value,
                                    "details": spo2_prediction.details,
                                }
                            ))

                        # Direct SpO2 value check
                        if spo2_prediction.current_value and spo2_prediction.current_value < 90:
                            notifications_to_create.append(self._build_notification(
                                patient_id=patient_id,
                                notif_type=NotificationType.LOW_SPO2,
                                priority=NotificationPriority.HIGH,
                                title="Low SpO2",
                                message=f"Patient #{patient_id}: SpO2 is {spo2_prediction.current_value}% (threshold: 90%).",
                                data={"spo2_value": spo2_prediction.current_value}
                            ))

        # Persist notifications that pass deduplication
        if notifications_to_create:
            await self._persist_and_broadcast(notifications_to_create)

    def _build_notification(self, patient_id: int, notif_type: NotificationType,
                            priority: NotificationPriority, title: str,
                            message: str, data: dict = None) -> Optional[dict]:
        """Build a notification dict if it passes deduplication."""
        dedup_key = (patient_id, notif_type)
        now = datetime.utcnow()

        if dedup_key in self._recent_notifications:
            last_created = self._recent_notifications[dedup_key]
            if (now - last_created) < self.dedup_window:
                return None  # Duplicate within window

        return {
            "patient_id": patient_id,
            "type": notif_type,
            "priority": priority,
            "title": title,
            "message": message,
            "data": data,
        }

    async def _persist_and_broadcast(self, notifications: List[Optional[dict]]):
        """Save notifications to DB and broadcast via WebSocket."""
        # Filter out None (deduplicated)
        valid = [n for n in notifications if n is not None]
        if not valid:
            return

        db: Session = SessionLocal()
        created_notifications = []
        try:
            for notif_data in valid:
                notification = Notification(
                    patient_id=notif_data["patient_id"],
                    recipient_role="all",
                    type=notif_data["type"],
                    priority=notif_data["priority"],
                    title=notif_data["title"],
                    message=notif_data["message"],
                    data=notif_data["data"],
                )
                db.add(notification)
                db.flush()  # Get the ID

                # Update dedup cache
                self._recent_notifications[(notif_data["patient_id"], notif_data["type"])] = datetime.utcnow()

                created_notifications.append({
                    "id": notification.id,
                    "patient_id": notification.patient_id,
                    "type": notification.type.value,
                    "priority": notification.priority.value,
                    "title": notification.title,
                    "message": notification.message,
                    "data": notification.data,
                    "is_read": False,
                    "created_at": notification.created_at.isoformat() if notification.created_at else datetime.utcnow().isoformat(),
                })

                print(f"🔔 [{notification.priority.value}] {notification.title} — Patient #{notification.patient_id}")

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"✗ Failed to persist notifications: {e}")
            return
        finally:
            db.close()

        # Broadcast to WebSocket connections
        if created_notifications:
            await self._broadcast_notifications(created_notifications)

    async def _broadcast_notifications(self, notifications: List[dict]):
        """Send new notifications to all connected WebSocket clients."""
        if not self._ws_connections:
            return

        message = json.dumps({
            "type": "new_notifications",
            "notifications": notifications,
            "count": len(notifications),
        })

        dead_connections = set()
        for ws in self._ws_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.add(ws)

        # Clean up dead connections
        for ws in dead_connections:
            self._ws_connections.discard(ws)

    def _cleanup_dedup_cache(self):
        """Remove expired entries from deduplication cache."""
        now = datetime.utcnow()
        expired = [key for key, ts in self._recent_notifications.items()
                    if (now - ts) > self.dedup_window]
        for key in expired:
            del self._recent_notifications[key]


# ============================================
# Singleton pattern
# ============================================
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service


def start_notification_service():
    service = get_notification_service()
    service.start()


def stop_notification_service():
    global _notification_service
    if _notification_service:
        _notification_service.stop()
