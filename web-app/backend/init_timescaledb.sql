-- TimescaleDB Initialization Script for Cognivus Labs Vital Signs Storage
-- This script sets up hypertables and retention policies for time-series vital data

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create vitals_timeseries table for storing all vital sign measurements
CREATE TABLE IF NOT EXISTS vitals_timeseries (
    time TIMESTAMPTZ NOT NULL,
    patient_id INTEGER NOT NULL,
    device_id VARCHAR(50),
    
    -- ECG Data
    ecg_value INTEGER,
    ecg_leads_off BOOLEAN,
    ecg_active BOOLEAN,
    heart_rate INTEGER,
    heart_rate_valid BOOLEAN,
    
    -- SpO2 Data
    spo2_value INTEGER,
    spo2_valid BOOLEAN,
    finger_detected BOOLEAN,
    spo2_ir_signal INTEGER,
    spo2_red_signal INTEGER,
    spo2_active BOOLEAN,
    
    -- Temperature (from database, not real-time)
    temperature FLOAT,
    
    -- Metadata
    data_type VARCHAR(20),  -- 'ecg', 'spo2', 'heart_rate', 'combined'
    source VARCHAR(50) DEFAULT 'esp32_device'
);

-- Convert to hypertable (partitioned by time)
-- Chunk interval: 1 day (data is partitioned into 24-hour chunks)
SELECT create_hypertable('vitals_timeseries', 'time', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vitals_patient_time ON vitals_timeseries (patient_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_device_time ON vitals_timeseries (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_type_time ON vitals_timeseries (data_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_abnormal_hr ON vitals_timeseries (time DESC) WHERE heart_rate IS NOT NULL AND (heart_rate < 60 OR heart_rate > 100);
CREATE INDEX IF NOT EXISTS idx_vitals_abnormal_spo2 ON vitals_timeseries (time DESC) WHERE spo2_value IS NOT NULL AND spo2_value < 95;

-- Enable compression on hypertable (required before adding compression policy)
ALTER TABLE vitals_timeseries SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'patient_id, device_id'
);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('vitals_timeseries', INTERVAL '7 days', if_not_exists => TRUE);

-- Add data retention policy (drop data older than 90 days)
SELECT add_retention_policy('vitals_timeseries', INTERVAL '90 days', if_not_exists => TRUE);

-- Create continuous aggregates for faster queries
-- 1-minute averages
CREATE MATERIALIZED VIEW IF NOT EXISTS vitals_1min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', time) AS bucket,
    patient_id,
    AVG(ecg_value) AS avg_ecg,
    AVG(heart_rate) AS avg_heart_rate,
    AVG(spo2_value) AS avg_spo2,
    AVG(temperature) AS avg_temperature,
    COUNT(*) AS data_points,
    -- Track abnormalities
    SUM(CASE WHEN heart_rate < 60 OR heart_rate > 100 THEN 1 ELSE 0 END) AS abnormal_hr_count,
    SUM(CASE WHEN spo2_value < 95 THEN 1 ELSE 0 END) AS low_spo2_count,
    SUM(CASE WHEN ecg_leads_off = TRUE THEN 1 ELSE 0 END) AS leads_off_count,
    SUM(CASE WHEN finger_detected = FALSE THEN 1 ELSE 0 END) AS no_finger_count
FROM vitals_timeseries
GROUP BY bucket, patient_id;

-- Refresh policy for continuous aggregate (refresh every 1 minute)
SELECT add_continuous_aggregate_policy('vitals_1min',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

-- 1-hour averages for longer-term trends
CREATE MATERIALIZED VIEW IF NOT EXISTS vitals_1hour
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    patient_id,
    AVG(ecg_value) AS avg_ecg,
    AVG(heart_rate) AS avg_heart_rate,
    MIN(heart_rate) AS min_heart_rate,
    MAX(heart_rate) AS max_heart_rate,
    AVG(spo2_value) AS avg_spo2,
    MIN(spo2_value) AS min_spo2,
    MAX(spo2_value) AS max_spo2,
    AVG(temperature) AS avg_temperature,
    COUNT(*) AS data_points
FROM vitals_timeseries
GROUP BY bucket, patient_id;

SELECT add_continuous_aggregate_policy('vitals_1hour',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Grant permissions (adjust if needed)
GRANT ALL PRIVILEGES ON vitals_timeseries TO timescale_user;
GRANT ALL PRIVILEGES ON vitals_1min TO timescale_user;
GRANT ALL PRIVILEGES ON vitals_1hour TO timescale_user;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✓ TimescaleDB initialized successfully';
    RAISE NOTICE '✓ Hypertable created: vitals_timeseries';
    RAISE NOTICE '✓ Compression policy: 7 days';
    RAISE NOTICE '✓ Retention policy: 90 days';
    RAISE NOTICE '✓ Continuous aggregates: vitals_1min, vitals_1hour';
END $$;
