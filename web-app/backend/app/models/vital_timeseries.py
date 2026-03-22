"""
TimescaleDB Models for Vital Signs Time-Series Data
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, TIMESTAMP, Index
from sqlalchemy.sql import func
from datetime import datetime
from ..core.timescale_database import TimescaleBase


class VitalTimeseries(TimescaleBase):
    """
    Time-series model for storing all vital sign measurements
    This is a TimescaleDB hypertable partitioned by time
    """
    __tablename__ = "vitals_timeseries"

    # Primary timestamp column (required for hypertable)
    time = Column(TIMESTAMP(timezone=True), primary_key=True, nullable=False, server_default=func.now())
    
    # Patient and device identification
    patient_id = Column(Integer, nullable=False, index=True)
    device_id = Column(String(50), index=True)
    
    # ECG Data
    ecg_value = Column(Integer)  # Raw ECG value (0-1023)
    ecg_leads_off = Column(Boolean)  # True if leads disconnected
    ecg_active = Column(Boolean)  # True if ECG sensor active
    heart_rate = Column(Integer)  # BPM
    heart_rate_valid = Column(Boolean)  # True if HR reading is valid
    
    # SpO2 Data
    spo2_value = Column(Integer)  # Oxygen saturation percentage (0-100)
    spo2_valid = Column(Boolean)  # True if SpO2 reading is valid
    finger_detected = Column(Boolean)  # True if finger is on sensor
    spo2_ir_signal = Column(Integer)  # IR sensor signal strength
    spo2_red_signal = Column(Integer)  # RED sensor signal strength
    spo2_active = Column(Boolean)  # True if SpO2 sensor active
    
    # Temperature
    temperature = Column(Float)  # Body temperature in Fahrenheit
    
    # Metadata
    data_type = Column(String(20))  # 'ecg', 'spo2', 'heart_rate', 'combined'
    source = Column(String(50), default='esp32_device')  # Data source identifier

    def __repr__(self):
        return f"<VitalTimeseries(time={self.time}, patient_id={self.patient_id}, type={self.data_type})>"

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'time': self.time.isoformat() if self.time else None,
            'patient_id': self.patient_id,
            'device_id': self.device_id,
            'ecg_value': self.ecg_value,
            'ecg_leads_off': self.ecg_leads_off,
            'ecg_active': self.ecg_active,
            'heart_rate': self.heart_rate,
            'heart_rate_valid': self.heart_rate_valid,
            'spo2_value': self.spo2_value,
            'spo2_valid': self.spo2_valid,
            'finger_detected': self.finger_detected,
            'spo2_ir_signal': self.spo2_ir_signal,
            'spo2_red_signal': self.spo2_red_signal,
            'spo2_active': self.spo2_active,
            'temperature': self.temperature,
            'data_type': self.data_type,
            'source': self.source
        }


# Indexes are created in init_timescaledb.sql
# Additional indexes can be defined here if needed
__table_args__ = (
    Index('idx_vitals_patient_time', 'patient_id', 'time'),
    Index('idx_vitals_device_time', 'device_id', 'time'),
)
