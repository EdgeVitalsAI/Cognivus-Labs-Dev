"""
SpO2 Monitoring Service
Orchestrates SpO2 buffering, inference, and publishing.
"""
import asyncio
from datetime import datetime
from typing import Dict, Optional, Set

from .spo2_buffer_manager import get_spo2_buffer_manager
from .spo2_ml_inference import get_spo2_ml_service, SpO2Prediction, SpO2Trend


class SpO2MonitoringService:
    def __init__(self, inference_interval_seconds: int = 2):
        self.inference_interval = inference_interval_seconds
        self.buffer_manager = get_spo2_buffer_manager()
        self.ml_service = get_spo2_ml_service()

        self.active_patients: Set[int] = set()
        self.latest_predictions: Dict[int, SpO2Prediction] = {}

        self.websocket_manager = None

        self._task: Optional[asyncio.Task] = None
        self._running = False

    def set_websocket_manager(self, manager):
        self.websocket_manager = manager

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        print("✓ SpO2 Monitoring Service started")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        print("✓ SpO2 Monitoring Service stopped")

    def start_monitoring(self, patient_id: int):
        self.active_patients.add(patient_id)
        self.buffer_manager.register_patient(patient_id)

    def stop_monitoring(self, patient_id: int):
        if patient_id in self.active_patients:
            self.active_patients.remove(patient_id)
        self.buffer_manager.unregister_patient(patient_id)

    def get_latest_prediction(self, patient_id: int) -> Optional[SpO2Prediction]:
        return self.latest_predictions.get(patient_id)

    async def get_or_create_prediction(self, patient_id: int, wait_seconds: float = 2.5) -> Optional[SpO2Prediction]:
        """
        Ensure monitoring is active and try to produce a prediction immediately.
        This allows HTTP polling clients (like AI Insights) to bootstrap predictions
        even when no WebSocket client has connected yet.
        """
        self.start_monitoring(patient_id)

        # Return cached prediction if available.
        existing = self.latest_predictions.get(patient_id)
        if existing is not None:
            return existing

        # Force a fresh Timescale pull and one processing pass.
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.buffer_manager._fetch_spo2_data)
        await self._process_patient(patient_id)

        created = self.latest_predictions.get(patient_id)
        if created is not None:
            return created

        # Give the background loop a brief chance to complete another cycle.
        await asyncio.sleep(max(0.1, wait_seconds))
        return self.latest_predictions.get(patient_id)

    async def _monitoring_loop(self):
        while self._running:
            try:
                await self._process_all_patients()
                await asyncio.sleep(self.inference_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SpO2] Monitoring error: {e}")
                await asyncio.sleep(self.inference_interval)

    async def _process_all_patients(self):
        if not self.active_patients:
            return

        tasks = [asyncio.create_task(self._process_patient(pid)) for pid in list(self.active_patients)]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _process_patient(self, patient_id: int):
        try:
            buffer = self.buffer_manager.get_buffer(patient_id)
            if not buffer or not buffer.is_ready:
                return

            values, timestamps = buffer.get_window()
            prediction = await self.ml_service.predict(values, patient_id)
            self.latest_predictions[patient_id] = prediction

            await self._publish_results(patient_id, prediction, values, timestamps, buffer.data_quality)
        except Exception as e:
            print(f"[SpO2] Error processing patient {patient_id}: {e}")

    async def _publish_results(
        self,
        patient_id: int,
        prediction: SpO2Prediction,
        values,
        timestamps,
        data_quality: str,
    ):
        if not self.websocket_manager:
            return

        recent = list(values[-30:]) if len(values) else []
        recent_times = [t.isoformat() if hasattr(t, "isoformat") else str(t) for t in list(timestamps[-30:])]

        prediction_payload = {
            "type": "spo2_prediction",
            "patient_id": patient_id,
            "data_quality": data_quality,
            "recent_values": [round(float(v), 1) for v in recent],
            "recent_timestamps": recent_times,
            **prediction.to_dict(),
        }

        await self.websocket_manager.broadcast_to_patient(patient_id, prediction_payload)

        if prediction.trend in (SpO2Trend.CRITICAL, SpO2Trend.DECLINING):
            status_payload = {
                "type": "spo2_status",
                "patient_id": patient_id,
                "status": prediction.trend.value,
                "message": prediction.details,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await self.websocket_manager.broadcast_to_patient(patient_id, status_payload)


_spo2_monitoring_service: Optional[SpO2MonitoringService] = None


def get_spo2_monitoring_service() -> SpO2MonitoringService:
    global _spo2_monitoring_service
    if _spo2_monitoring_service is None:
        _spo2_monitoring_service = SpO2MonitoringService()
    return _spo2_monitoring_service


def start_spo2_monitoring_service():
    service = get_spo2_monitoring_service()
    service.start()


def stop_spo2_monitoring_service():
    service = get_spo2_monitoring_service()
    service.stop()
