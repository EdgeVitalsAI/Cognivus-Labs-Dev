"""
SpO2 Buffer Manager Service
Maintains rolling 60-second SpO2 buffers per patient for ML inference.
"""
import asyncio
from collections import deque
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple

import numpy as np
from sqlalchemy import and_

from ..core.timescale_database import TimescaleSessionLocal
from ..models.vital_timeseries import VitalTimeseries


class SpO2Buffer:
    def __init__(self, patient_id: int, window_seconds: int = 60):
        self.patient_id = patient_id
        self.window_seconds = window_seconds
        self.max_samples = window_seconds

        self.values: deque = deque(maxlen=self.max_samples)
        self.timestamps: deque = deque(maxlen=self.max_samples)

        self.last_fetch_time: Optional[datetime] = None
        self.last_update_time: datetime = datetime.utcnow()

        self.is_ready = False
        self.data_quality = "poor"
        self.last_spo2_valid = False
        self.last_finger_detected = False

    def add_samples(
        self,
        spo2_values: List[int],
        timestamps: List[datetime],
        valid_values: Optional[List[bool]] = None,
        finger_values: Optional[List[bool]] = None,
    ):
        if not spo2_values:
            return

        for idx, (value, ts) in enumerate(zip(spo2_values, timestamps)):
            if value is None:
                continue
            self.values.append(float(value))
            self.timestamps.append(ts)

            if valid_values and idx < len(valid_values):
                self.last_spo2_valid = bool(valid_values[idx])
            if finger_values and idx < len(finger_values):
                self.last_finger_detected = bool(finger_values[idx])

        self.last_update_time = datetime.utcnow()

        if len(self.values) >= int(self.max_samples * 0.67):
            self.is_ready = True

        if not self.last_finger_detected:
            self.data_quality = "no_finger"
        elif not self.last_spo2_valid:
            self.data_quality = "invalid"
        elif len(self.values) < int(self.max_samples * 0.5):
            self.data_quality = "poor"
        else:
            self.data_quality = "good"

    def get_window(self) -> Tuple[np.ndarray, List[datetime]]:
        if not self.values:
            return np.array([]), []
        return np.array(list(self.values), dtype=np.float32), list(self.timestamps)

    def is_stale(self, timeout_seconds: int = 120) -> bool:
        return (datetime.utcnow() - self.last_update_time).total_seconds() > timeout_seconds


class SpO2BufferManager:
    def __init__(self, update_interval_seconds: int = 2):
        self.update_interval = update_interval_seconds
        self.buffers: Dict[int, SpO2Buffer] = {}
        self.active_patients: set = set()

        self._task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._update_loop())
        print("✓ SpO2 Buffer Manager started")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        print("✓ SpO2 Buffer Manager stopped")

    def register_patient(self, patient_id: int):
        if patient_id not in self.buffers:
            self.buffers[patient_id] = SpO2Buffer(patient_id)
            print(f"✓ SpO2 buffer created for patient {patient_id}")
        self.active_patients.add(patient_id)

    def unregister_patient(self, patient_id: int):
        if patient_id in self.active_patients:
            self.active_patients.remove(patient_id)

    def get_buffer(self, patient_id: int) -> Optional[SpO2Buffer]:
        return self.buffers.get(patient_id)

    async def _update_loop(self):
        while self._running:
            try:
                await self._update_all_buffers()
                await asyncio.sleep(self.update_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SpO2] Buffer update error: {e}")
                await asyncio.sleep(self.update_interval)

    async def _update_all_buffers(self):
        if not self.active_patients:
            return

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._fetch_spo2_data)

    def _fetch_spo2_data(self):
        db = TimescaleSessionLocal()
        try:
            for patient_id in list(self.active_patients):
                buffer = self.buffers.get(patient_id)
                if not buffer:
                    continue

                if buffer.last_fetch_time:
                    start_time = buffer.last_fetch_time - timedelta(seconds=1)
                else:
                    start_time = datetime.utcnow() - timedelta(seconds=buffer.window_seconds * 2)

                end_time = datetime.utcnow()

                records = (
                    db.query(VitalTimeseries)
                    .filter(
                        and_(
                            VitalTimeseries.patient_id == patient_id,
                            VitalTimeseries.time >= start_time,
                            VitalTimeseries.time <= end_time,
                            VitalTimeseries.spo2_value.isnot(None),
                            VitalTimeseries.spo2_active == True,
                        )
                    )
                    .order_by(VitalTimeseries.time)
                    .all()
                )

                if records:
                    spo2_values = [r.spo2_value for r in records]
                    timestamps = [r.time for r in records]
                    valid = [r.spo2_valid for r in records]
                    finger = [r.finger_detected for r in records]

                    buffer.add_samples(spo2_values, timestamps, valid_values=valid, finger_values=finger)
                    buffer.last_fetch_time = end_time

                if buffer.is_stale(timeout_seconds=300) and patient_id not in self.active_patients:
                    del self.buffers[patient_id]
        finally:
            db.close()


_spo2_buffer_manager: Optional[SpO2BufferManager] = None


def get_spo2_buffer_manager() -> SpO2BufferManager:
    global _spo2_buffer_manager
    if _spo2_buffer_manager is None:
        _spo2_buffer_manager = SpO2BufferManager()
    return _spo2_buffer_manager


def start_spo2_buffer_manager():
    manager = get_spo2_buffer_manager()
    manager.start()


def stop_spo2_buffer_manager():
    manager = get_spo2_buffer_manager()
    manager.stop()
