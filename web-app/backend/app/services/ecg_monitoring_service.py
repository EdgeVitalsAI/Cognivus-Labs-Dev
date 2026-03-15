"""
ECG Monitoring Service
Orchestrates ECG data flow: buffering → ML inference → WebSocket publishing
Runs analysis every 1 second on 15-second sliding windows
"""
import asyncio
from typing import Dict, Optional, Set
from datetime import datetime

from .ecg_buffer_manager import get_ecg_buffer_manager, ECGBuffer
from .ecg_ml_inference import get_ecg_ml_service, ECGPrediction


class ECGMonitoringService:
    """
    Coordinates ECG monitoring workflow:
    1. Maintains buffers via ECGBufferManager
    2. Runs ML inference every 1 second
    3. Publishes results to WebSocket connections
    """
    
    def __init__(self, inference_interval_seconds: int = 1):
        self.inference_interval = inference_interval_seconds
        self.buffer_manager = get_ecg_buffer_manager()
        self.ml_service = get_ecg_ml_service()
        
        # Track active monitoring sessions
        self.active_patients: Set[int] = set()
        
        # Store latest predictions for each patient
        self.latest_predictions: Dict[int, ECGPrediction] = {}
        self.fast_alert_streaks: Dict[int, int] = {}
        
        # WebSocket connection manager (injected later)
        self.websocket_manager = None
        
        # Background task
        self._task: Optional[asyncio.Task] = None
        self._running = False
    
    def set_websocket_manager(self, manager):
        """Inject WebSocket manager for publishing results"""
        self.websocket_manager = manager
    
    def start(self):
        """Start the ECG monitoring service"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        print("✓ ECG Monitoring Service started")
    
    def stop(self):
        """Stop the ECG monitoring service"""
        self._running = False
        if self._task:
            self._task.cancel()
        print("✓ ECG Monitoring Service stopped")
    
    def start_monitoring(self, patient_id: int):
        """Start monitoring a patient"""
        self.active_patients.add(patient_id)
        self.buffer_manager.register_patient(patient_id)
        print(f"✓ Started ECG monitoring for patient {patient_id}")
    
    def stop_monitoring(self, patient_id: int):
        """Stop monitoring a patient"""
        if patient_id in self.active_patients:
            self.active_patients.remove(patient_id)
        self.buffer_manager.unregister_patient(patient_id)
        print(f"✓ Stopped ECG monitoring for patient {patient_id}")
    
    def get_latest_prediction(self, patient_id: int) -> Optional[ECGPrediction]:
        """Get the most recent prediction for a patient"""
        return self.latest_predictions.get(patient_id)
    
    async def _monitoring_loop(self):
        """
        Main monitoring loop:
        - Runs every 1 second
        - Performs ML inference on each active patient's buffer
        - Publishes results via WebSocket
        """
        while self._running:
            try:
                await self._process_all_patients()
                await asyncio.sleep(self.inference_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"✗ ECG monitoring error: {e}")
                await asyncio.sleep(self.inference_interval)
    
    async def _process_all_patients(self):
        """Process ECG data for all active patients"""
        if not self.active_patients:
            return
        
        # Process each patient
        tasks = []
        for patient_id in list(self.active_patients):
            task = asyncio.create_task(self._process_patient(patient_id))
            tasks.append(task)
        
        # Wait for all tasks to complete
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _process_patient(self, patient_id: int):
        """Process ECG data for a single patient"""
        try:
            # Get patient's buffer
            buffer = self.buffer_manager.get_buffer(patient_id)
            if not buffer or not buffer.is_ready:
                # Not enough data yet
                return
            
            # Check data quality
            if buffer.data_quality == "no_signal":
                # Leads disconnected - publish error status
                await self._publish_status(patient_id, {
                    "type": "ecg_status",
                    "patient_id": patient_id,
                    "status": "no_signal",
                    "message": "ECG leads disconnected",
                    "timestamp": datetime.utcnow().isoformat()
                })
                return
            
            # Get the 15-second window
            ecg_window, timestamps = buffer.get_window()
            
            # Run ML inference
            prediction = await self.ml_service.predict(ecg_window, patient_id)

            # Fast detector fusion on most recent short window for faster transitions
            quick_samples, _ = buffer.get_latest_samples(n_samples=750)  # ~3s at 250Hz
            prediction = self._apply_fast_detector(patient_id, prediction, quick_samples)
            
            # Store prediction
            self.latest_predictions[patient_id] = prediction
            
            # Get latest samples for waveform display (2 seconds = 500 samples at 250Hz)
            latest_samples, latest_times = buffer.get_latest_samples(n_samples=500)
            
            # Publish results via WebSocket
            await self._publish_results(patient_id, prediction, latest_samples, latest_times)
            
        except Exception as e:
            print(f"✗ Error processing patient {patient_id}: {e}")

    def _apply_fast_detector(self, patient_id: int, base_prediction: ECGPrediction, recent_samples) -> ECGPrediction:
        """Apply fast risk trigger with streak gating to speed up abrupt abnormal detection."""
        try:
            quick_score, reasons, quick_hr = self.ml_service.quick_risk_score(recent_samples)
        except Exception:
            return base_prediction

        streak = self.fast_alert_streaks.get(patient_id, 0)
        if quick_score >= 0.78:
            streak += 1
        elif quick_score < 0.55:
            streak = 0
        else:
            streak = max(0, streak - 1)
        self.fast_alert_streaks[patient_id] = streak

        if streak < 2:
            return base_prediction

        escalated_trend = base_prediction.trend
        # Do not force UNSTABLE from fast trigger alone when base model says NORMAL.
        if quick_score >= 0.90 and base_prediction.trend in (base_prediction.trend.ABNORMAL, base_prediction.trend.UNSTABLE):
            escalated_trend = base_prediction.trend.UNSTABLE
        elif quick_score >= 0.82 and base_prediction.trend == base_prediction.trend.NORMAL:
            escalated_trend = base_prediction.trend.ABNORMAL

        if escalated_trend == base_prediction.trend:
            return base_prediction

        details = base_prediction.details + f" Fast trigger(score={quick_score:.2f}, streak={streak}"
        if reasons:
            details += f", reasons={'; '.join(reasons)}"
        if quick_hr is not None:
            details += f", quick_hr={quick_hr}"
        details += ")."

        confidence = max(base_prediction.confidence, quick_score * 100.0)
        if base_prediction.trend == base_prediction.trend.NORMAL and escalated_trend == base_prediction.trend.ABNORMAL:
            confidence = min(confidence, 88.0)
        heart_rate = base_prediction.heart_rate if base_prediction.heart_rate is not None else quick_hr
        return ECGPrediction(
            trend=escalated_trend,
            confidence=confidence,
            timestamp=base_prediction.timestamp,
            details=details,
            heart_rate=heart_rate,
        )
    
    async def _publish_results(self, patient_id: int, prediction: ECGPrediction, 
                               waveform_samples: list, waveform_times: list):
        """Publish ECG waveform and prediction to WebSocket"""
        if not self.websocket_manager:
            return
        
        # Prepare waveform data (2-second chunk for display)
        waveform_data = {
            "type": "ecg_waveform",
            "patient_id": patient_id,
            "samples": waveform_samples.tolist() if hasattr(waveform_samples, 'tolist') else list(waveform_samples),
            "timestamps": [t.isoformat() if hasattr(t, 'isoformat') else str(t) for t in waveform_times],
            "sample_count": len(waveform_samples),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Prepare prediction data
        prediction_data = {
            "type": "ecg_prediction",
            "patient_id": patient_id,
            **prediction.to_dict()
        }
        
        # Publish both messages
        await self.websocket_manager.broadcast_to_patient(patient_id, waveform_data)
        await self.websocket_manager.broadcast_to_patient(patient_id, prediction_data)
    
    async def _publish_status(self, patient_id: int, status_data: dict):
        """Publish status message to WebSocket"""
        if not self.websocket_manager:
            return
        
        await self.websocket_manager.broadcast_to_patient(patient_id, status_data)


# Global instance
_ecg_monitoring_service: Optional[ECGMonitoringService] = None


def get_ecg_monitoring_service() -> ECGMonitoringService:
    """Get the global ECG monitoring service instance"""
    global _ecg_monitoring_service
    if _ecg_monitoring_service is None:
        _ecg_monitoring_service = ECGMonitoringService()
    return _ecg_monitoring_service


def start_ecg_monitoring_service():
    """Start the ECG monitoring service (called on app startup)"""
    service = get_ecg_monitoring_service()
    service.start()


def stop_ecg_monitoring_service():
    """Stop the ECG monitoring service (called on app shutdown)"""
    service = get_ecg_monitoring_service()
    service.stop()
