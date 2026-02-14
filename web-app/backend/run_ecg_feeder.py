"""
Standalone ECG data feeder for testing.
Inserts synthetic ECG samples into TimescaleDB without requiring full backend config.
"""
import argparse
import math
import os
import signal
import time
from datetime import datetime, timezone
from typing import Optional, Tuple, List

import numpy as np
import psycopg2
from psycopg2.extras import execute_values
from scipy.signal import resample_poly, iirnotch, butter, filtfilt


# ---------- Waveform helpers (adapted from ml-models test generator) ----------
def notch_filter(signal, fs, f0=50.0, Q=30):
    b, a = iirnotch(f0/(fs/2), Q)
    return filtfilt(b, a, signal)


def bandpass_filter(signal, fs, low=0.5, high=45.0, order=4):
    b, a = butter(order, [low/(fs/2), high/(fs/2)], btype='band')
    return filtfilt(b, a, signal)


def resample_to_target(sig, fs_src, fs_tgt):
    if fs_src == fs_tgt:
        return sig
    gcd = np.gcd(int(fs_tgt), int(fs_src))
    up = int(fs_tgt // gcd)
    down = int(fs_src // gcd)
    return resample_poly(sig, up, down)


def preprocess_signal(raw_signal, fs_raw, fs_target):
    s = raw_signal.astype(np.float32)
    s = resample_to_target(s, fs_raw, fs_target)
    try:
        s = notch_filter(s, fs_target, f0=50.0)
    except Exception:
        pass
    s = bandpass_filter(s, fs_target, low=0.5, high=45.0)
    s = (s - np.mean(s)) / (np.std(s) + 1e-8)
    return s


def generate_normal_ecg(fs, duration, heart_rate=75):
    """Normal sinus rhythm - adjustable heart rate"""
    t = np.linspace(0, duration, int(fs * duration))
    beat_interval = 60 / max(heart_rate, 1e-3)
    signal = np.zeros_like(t)
    for beat_time in np.arange(0, duration, beat_interval):
        p_center = beat_time + 0.08
        signal += 0.15 * np.exp(-((t - p_center) ** 2) / (2 * 0.01 ** 2))
        qrs_center = beat_time + 0.2
        signal += 1.2 * np.exp(-((t - qrs_center) ** 2) / (2 * 0.015 ** 2))
        t_center = beat_time + 0.38
        signal += 0.3 * np.exp(-((t - t_center) ** 2) / (2 * 0.04 ** 2))
    signal += np.random.normal(0, 0.05, len(t))
    return signal


def generate_abnormal_ecg(fs, duration):
    """Arrhythmic/chaotic pattern"""
    t = np.linspace(0, duration, int(fs * duration)) 
    signal = np.zeros_like(t)
    num_spikes = np.random.randint(8, 15)
    spike_times = np.sort(np.random.uniform(0, duration, num_spikes))
    for spike_time in spike_times:
        amplitude = np.random.uniform(0.5, 2.0)
        width = np.random.uniform(0.01, 0.05)
        signal += amplitude * np.exp(-((t - spike_time) ** 2) / (2 * width ** 2))
        if np.random.rand() > 0.5:
            signal -= amplitude * 0.5 * np.exp(-((t - (spike_time + 0.03)) ** 2) / (2 * width ** 2))
    signal += 0.3 * np.sin(2 * np.pi * 0.8 * t)
    signal += 0.2 * np.sin(2 * np.pi * 1.7 * t)
    signal += np.random.normal(0, 0.2, len(t))
    return signal


def run_feeder(
    patient_id: int,
    device_id: str,
    sampling_rate: int = 250,
    amplitude: float = 120.0,
    baseline: float = 512.0,
    noise_std: float = 6.0,
    batch_size: int = 250,
    flush_interval: float = 1.0,
    timescale_dsn: Optional[str] = None,
    abnormal_interval_mean: float = 90.0,
    abnormal_duration: float = 10.0,
    tachy_hr_min: float = 120.0,
    tachy_hr_max: float = 170.0,
    irregular_hr_min: float = 90.0,
    irregular_hr_max: float = 160.0,
    irregular_jitter: float = 30.0,
    waveform_mode: str = "synthetic",
    segment_duration: float = 2.0,
):
    """Run the ECG feeder using only normal sinus rhythm"""
    
    # Default TimescaleDB connection
    if not timescale_dsn:
        timescale_dsn = os.getenv(
            "TIMESCALE_DSN",
            "postgresql://timescale_user:timescale_secure_password_123@localhost:5433/cognivus_vitals_timeseries"
        )
    
    conn = psycopg2.connect(timescale_dsn)
    buffer: List[Tuple] = []
    last_flush = time.perf_counter()
    running = True
    phase = 0.0
    dt = 1.0 / sampling_rate

    segment_data = np.array([], dtype=float)
    segment_idx = 0

    def regenerate_segment(heart_rate: float):
        nonlocal segment_data, segment_idx
        segment_data = generate_normal_ecg(sampling_rate, segment_duration, heart_rate=heart_rate)
        segment_idx = 0

    def next_sample(heart_rate: float, freq_hz: float, phase_val: float) -> float:
        nonlocal segment_idx
        if waveform_mode == "simple":
            return baseline + amplitude * math.sin(2 * math.pi * freq_hz * phase_val) + np.random.normal(0.0, noise_std)
        if segment_idx >= len(segment_data):
            regenerate_segment(heart_rate)
        val = baseline + amplitude * segment_data[segment_idx] + np.random.normal(0.0, noise_std)
        segment_idx += 1
        return val
    
    print(f"[ok] ECG Timescale feeder running at {sampling_rate} Hz for patient {patient_id} with device {device_id}")
    print(f"[ok] Connected to TimescaleDB: {timescale_dsn.split('@')[1] if '@' in timescale_dsn else 'database'}")
    
    def append(ts: datetime, ecg_value: float, heart_rate: float):
        nonlocal buffer, last_flush
        row = (
            ts,
            patient_id,
            device_id,
            int(np.clip(round(ecg_value), 0, 1023)),
            False,  # ecg_leads_off
            True,   # ecg_active
            int(round(heart_rate)),
            True,   # heart_rate_valid
            "ecg",
            "ecg_feeder"
        )
        buffer.append(row)
        now = time.perf_counter()
        if len(buffer) >= batch_size or (now - last_flush) >= flush_interval:
            flush()
    
    def flush():
        nonlocal buffer, last_flush
        if not buffer:
            return
        sql = (
            "INSERT INTO vitals_timeseries (time, patient_id, device_id, ecg_value, ecg_leads_off, ecg_active, "
            "heart_rate, heart_rate_valid, data_type, source) VALUES %s"
        )
        try:
            with conn.cursor() as cur:
                execute_values(cur, sql, buffer, page_size=batch_size)
            conn.commit()
            print(f"[ok] Inserted {len(buffer)} normal samples into TimescaleDB")
            buffer.clear()
            last_flush = time.perf_counter()
        except psycopg2.Error as exc:
            print(f"[error] Timescale insert failed: {exc}")
            conn.rollback()
    
    def choose_hr(now: float) -> Tuple[float, float]:
        hr = 72.0 + np.random.normal(0.0, 4.0)

        freq = max(hr / 60.0, 0.5)  # Hz
        return hr, freq

    next_tick = time.perf_counter()
    try:
        while running:
            now = time.perf_counter()
            hr, freq = choose_hr(now)

            val = next_sample(hr, freq, phase)

            append(datetime.now(timezone.utc), val, heart_rate=hr)

            phase += dt
            next_tick += dt
            delay = next_tick - time.perf_counter()
            if delay > 0:
                time.sleep(delay)
            else:
                next_tick = time.perf_counter()
    except KeyboardInterrupt:
        print("[warn] Feeder interrupted, flushing...")
    finally:
        flush()
        conn.close()
        print("[ok] Feeder stopped")


def main():
    parser = argparse.ArgumentParser(description="Simple ECG feeder into TimescaleDB")
    parser.add_argument("--patient-id", type=int, default=1, help="Patient identifier")
    parser.add_argument("--device-id", type=str, default="ecg-feeder", help="Device identifier")
    parser.add_argument("--sampling-rate", type=int, default=250, help="Sampling rate (Hz)")
    parser.add_argument("--amplitude", type=float, default=120.0, help="Wave amplitude")
    parser.add_argument("--baseline", type=float, default=512.0, help="Baseline offset")
    parser.add_argument("--noise-std", type=float, default=6.0, help="Gaussian noise std dev")
    parser.add_argument("--batch-size", type=int, default=250, help="Batch size for inserts")
    parser.add_argument("--flush-interval", type=float, default=1.0, help="Flush interval seconds")
    parser.add_argument("--timescale-dsn", type=str, default=None, help="TimescaleDB connection string")
    parser.add_argument("--abnormal-interval", type=float, default=90.0, help="Mean seconds between abnormal events")
    parser.add_argument("--abnormal-duration", type=float, default=10.0, help="Seconds each abnormal event lasts")
    parser.add_argument("--tachy-hr-min", type=float, default=120.0, help="Min tachycardia HR")
    parser.add_argument("--tachy-hr-max", type=float, default=170.0, help="Max tachycardia HR")
    parser.add_argument("--irregular-hr-min", type=float, default=90.0, help="Min irregular HR")
    parser.add_argument("--irregular-hr-max", type=float, default=160.0, help="Max irregular HR")
    parser.add_argument("--irregular-jitter", type=float, default=30.0, help="HR jitter for irregular rhythm")
    parser.add_argument("--waveform-mode", type=str, default="synthetic", choices=["synthetic", "simple"], help="Use realistic synthetic beats or legacy sine wave")
    parser.add_argument("--segment-duration", type=float, default=2.0, help="Seconds per generated ECG segment when using synthetic mode")
    args = parser.parse_args()
    
    def handle_signal(signum, frame):
        raise KeyboardInterrupt
    
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    
    run_feeder(
        patient_id=args.patient_id,
        device_id=args.device_id,
        sampling_rate=args.sampling_rate,
        amplitude=args.amplitude,
        baseline=args.baseline,
        noise_std=args.noise_std,
        batch_size=args.batch_size,
        flush_interval=args.flush_interval,
        timescale_dsn=args.timescale_dsn,
        abnormal_interval_mean=args.abnormal_interval,
        abnormal_duration=args.abnormal_duration,
        tachy_hr_min=args.tachy_hr_min,
        tachy_hr_max=args.tachy_hr_max,
        irregular_hr_min=args.irregular_hr_min,
        irregular_hr_max=args.irregular_hr_max,
        irregular_jitter=args.irregular_jitter,
        waveform_mode=args.waveform_mode,
        segment_duration=args.segment_duration,
    )


if __name__ == "__main__":
    main()
