"""
ECG Buffer Manager Service
Maintains rolling 15-second ECG buffers per patient for ML inference
Automatically fetches data from TimescaleDB every 2 seconds
"""
import asyncio
import numpy as np
from collections import deque
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session
from ..models.vital_timeseries import VitalTimeseries
from ..core.timescale_database import TimescaleSessionLocal


class ECGBuffer:
    """Rolling buffer for a single patient's ECG data"""
    
    def __init__(self, patient_id: int, window_seconds: int = 15, sampling_rate: int = 250):
        self.patient_id = patient_id
        self.window_seconds = window_seconds
        self.sampling_rate = sampling_rate
        self.max_samples = window_seconds * sampling_rate  # 15s * 250Hz = 3750 samples
        
        # Rolling buffer using deque for efficient sliding window
        self.buffer: deque = deque(maxlen=self.max_samples)
        self.timestamps: deque = deque(maxlen=self.max_samples)
        
        # Track last fetch time to avoid duplicate queries
        self.last_fetch_time: Optional[datetime] = None
        self.last_update_time: datetime = datetime.utcnow()
        
        # Buffer health status
        self.is_ready = False  # True when buffer has enough data for inference
        self.leads_off = False
        self.data_quality = "good"  # good, poor, no_signal
    
    def add_samples(self, ecg_values: List[int], timestamps: List[datetime], 
                   leads_off_values: List[bool] = None):
        """Add new ECG samples to the rolling buffer"""
        if not ecg_values:
            return
        
        for i, (value, ts) in enumerate(zip(ecg_values, timestamps)):
            self.buffer.append(value)
            self.timestamps.append(ts)
            
            # Track leads status
            if leads_off_values and i < len(leads_off_values):
                self.leads_off = leads_off_values[i]
        
        self.last_update_time = datetime.utcnow()
        
        # Buffer is ready when it has enough samples
        if len(self.buffer) >= self.max_samples * 0.9:  # 90% full is sufficient
            self.is_ready = True
        
        # Update data quality based on leads status
        if self.leads_off:
            self.data_quality = "no_signal"
        elif len(self.buffer) < self.max_samples * 0.5:
            self.data_quality = "poor"
        else:
            self.data_quality = "good"
    
    def get_window(self) -> Tuple[np.ndarray, List[datetime]]:
        """Get the current 15-second window as numpy array"""
        if not self.is_ready:
            return np.array([]), []
        
        return np.array(list(self.buffer)), list(self.timestamps)
    
    def get_latest_samples(self, n_samples: int = 500) -> Tuple[np.ndarray, List[datetime]]:
        """Get the most recent N samples for waveform display"""
        samples = list(self.buffer)[-n_samples:] if len(self.buffer) >= n_samples else list(self.buffer)
        times = list(self.timestamps)[-n_samples:] if len(self.timestamps) >= n_samples else list(self.timestamps)
        return np.array(samples), times
    
    def is_stale(self, timeout_seconds: int = 10) -> bool:
        """Check if buffer hasn't been updated recently"""
        return (datetime.utcnow() - self.last_update_time).total_seconds() > timeout_seconds
    
    def clear(self):
        """Clear the buffer"""
        self.buffer.clear()
        self.timestamps.clear()
        self.is_ready = False
        self.last_fetch_time = None


class ECGBufferManager:
    """
    Manages ECG buffers for all active patients
    Runs background task to fetch data from TimescaleDB every 2 seconds
    """
    
    def __init__(self, update_interval_seconds: int = 2):
        self.update_interval = update_interval_seconds
        self.buffers: Dict[int, ECGBuffer] = {}
        self.active_patients: set = set()
        
        # Background task handle
        self._task: Optional[asyncio.Task] = None
        self._running = False
    
    def start(self):
        """Start the background buffer update task"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._update_loop())
        print("✓ ECG Buffer Manager started")
    
    def stop(self):
        """Stop the background buffer update task"""
        self._running = False
        if self._task:
            self._task.cancel()
        print("✓ ECG Buffer Manager stopped")
    
    def register_patient(self, patient_id: int):
        """Register a patient for ECG monitoring"""
        if patient_id not in self.buffers:
            self.buffers[patient_id] = ECGBuffer(patient_id)
            print(f"✓ ECG buffer created for patient {patient_id}")
        
        self.active_patients.add(patient_id)
    
    def unregister_patient(self, patient_id: int):
        """Unregister a patient (stop monitoring)"""
        if patient_id in self.active_patients:
            self.active_patients.remove(patient_id)
        
        # Keep buffer for 5 minutes in case of reconnection
        # Actual cleanup happens in the update loop
    
    def get_buffer(self, patient_id: int) -> Optional[ECGBuffer]:
        """Get the ECG buffer for a specific patient"""
        return self.buffers.get(patient_id)
    
    async def _update_loop(self):
        """Background task that updates all active patient buffers every 2 seconds"""
        while self._running:
            try:
                await self._update_all_buffers()
                await asyncio.sleep(self.update_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"✗ ECG buffer update error: {e}")
                await asyncio.sleep(self.update_interval)
    
    async def _update_all_buffers(self):
        """Fetch latest ECG data for all active patients from TimescaleDB"""
        if not self.active_patients:
            return
        
        # Use ThreadPoolExecutor for database operations to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._fetch_ecg_data)
    
    def _fetch_ecg_data(self):
        """Fetch ECG data from TimescaleDB (runs in thread pool)"""
        db = TimescaleSessionLocal()
        try:
            for patient_id in list(self.active_patients):
                buffer = self.buffers.get(patient_id)
                if not buffer:
                    continue
                
                # Determine time range for query
                if buffer.last_fetch_time:
                    # Fetch data since last fetch (with 0.5s overlap for safety)
                    start_time = buffer.last_fetch_time - timedelta(seconds=0.5)
                else:
                    # Initial fetch: get last 15 seconds
                    start_time = datetime.utcnow() - timedelta(seconds=buffer.window_seconds)
                
                end_time = datetime.utcnow()
                
                # Query TimescaleDB for ECG data
                query = db.query(VitalTimeseries).filter(
                    and_(
                        VitalTimeseries.patient_id == patient_id,
                        VitalTimeseries.time >= start_time,
                        VitalTimeseries.time <= end_time,
                        VitalTimeseries.ecg_value.isnot(None),
                        VitalTimeseries.ecg_active == True
                    )
                ).order_by(VitalTimeseries.time)
                
                records = query.all()
                
                if records:
                    ecg_values = [r.ecg_value for r in records]
                    timestamps = [r.time for r in records]
                    leads_off = [r.ecg_leads_off for r in records]
                    
                    buffer.add_samples(ecg_values, timestamps, leads_off)
                    buffer.last_fetch_time = end_time
                    
                    print(f"✓ Fetched {len(records)} ECG samples for patient {patient_id}, "
                          f"buffer size: {len(buffer.buffer)}/{buffer.max_samples}")
                
                # Cleanup stale buffers
                if buffer.is_stale(timeout_seconds=300):  # 5 minutes
                    if patient_id not in self.active_patients:
                        del self.buffers[patient_id]
                        print(f"✓ Cleaned up stale buffer for patient {patient_id}")
        
        finally:
            db.close()


# Global instance
_ecg_buffer_manager: Optional[ECGBufferManager] = None


def get_ecg_buffer_manager() -> ECGBufferManager:
    """Get the global ECG buffer manager instance"""
    global _ecg_buffer_manager
    if _ecg_buffer_manager is None:
        _ecg_buffer_manager = ECGBufferManager()
    return _ecg_buffer_manager


def start_ecg_buffer_manager():
    """Start the ECG buffer manager (called on app startup)"""
    manager = get_ecg_buffer_manager()
    manager.start()


def stop_ecg_buffer_manager():
    """Stop the ECG buffer manager (called on app shutdown)"""
    manager = get_ecg_buffer_manager()
    manager.stop()
