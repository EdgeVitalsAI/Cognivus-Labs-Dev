"""
Standalone ECG data feeder for testing.
Inserts synthetic ECG samples into TimescaleDB without requiring full backend config.
"""
import argparse
import json
import math
import os
import signal
import time
from collections import deque
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

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


def generate_tachy_ecg(fs, duration, heart_rate=145):
    """Fast rhythm with compressed morphology and added instability."""
    t = np.linspace(0, duration, int(fs * duration))
    beat_interval = 60 / max(heart_rate, 1e-3)
    signal = np.zeros_like(t)

    for beat_time in np.arange(0, duration, beat_interval):
        qrs_center = beat_time + np.random.uniform(0.08, 0.12)
        qrs_width = np.random.uniform(0.008, 0.012)
        qrs_amp = np.random.uniform(1.1, 1.8)
        signal += qrs_amp * np.exp(-((t - qrs_center) ** 2) / (2 * qrs_width ** 2))

        if np.random.rand() < 0.45:
            ectopic_center = qrs_center + np.random.uniform(0.02, 0.05)
            signal -= np.random.uniform(0.25, 0.55) * np.exp(-((t - ectopic_center) ** 2) / (2 * (qrs_width * 1.2) ** 2))

    signal += 0.18 * np.sin(2 * np.pi * 3.0 * t + np.random.uniform(0, 2 * np.pi))
    signal += np.random.normal(0, 0.1, len(t))
    return signal


def generate_irregular_ecg(fs, duration, hr_min=85, hr_max=165):
    """Irregular rhythm with variable beat intervals and morphology jitter."""
    t = np.linspace(0, duration, int(fs * duration))
    signal = np.zeros_like(t)

    beat_time = 0.0
    while beat_time < duration:
        inst_hr = np.random.uniform(hr_min, hr_max)
        beat_interval = 60.0 / max(inst_hr, 1e-3)
        beat_interval += np.random.normal(0.0, 0.09)
        beat_interval = float(np.clip(beat_interval, 0.28, 1.2))

        p_center = beat_time + np.random.uniform(0.03, 0.09)
        qrs_center = beat_time + np.random.uniform(0.11, 0.19)
        t_center = beat_time + np.random.uniform(0.24, 0.42)

        signal += np.random.uniform(0.03, 0.14) * np.exp(-((t - p_center) ** 2) / (2 * np.random.uniform(0.005, 0.02) ** 2))
        signal += np.random.uniform(0.7, 1.6) * np.exp(-((t - qrs_center) ** 2) / (2 * np.random.uniform(0.008, 0.022) ** 2))
        signal += np.random.uniform(0.12, 0.4) * np.exp(-((t - t_center) ** 2) / (2 * np.random.uniform(0.02, 0.06) ** 2))

        if np.random.rand() < 0.35:
            notch_center = qrs_center + np.random.uniform(0.015, 0.045)
            signal -= np.random.uniform(0.15, 0.4) * np.exp(-((t - notch_center) ** 2) / (2 * np.random.uniform(0.008, 0.018) ** 2))

        beat_time += beat_interval

    signal += 0.15 * np.sin(2 * np.pi * np.random.uniform(0.3, 1.1) * t)
    signal += np.random.normal(0, 0.12, len(t))
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
    prediction_api_base: Optional[str] = None,
    prediction_poll_interval: float = 2.0,
    normal_phase_seconds: float = 30.0,
    abnormal_phase_seconds: float = 30.0,
):
    """Run ECG feeder with periodic abnormal rhythm injection."""
    
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

    run_start = time.perf_counter()
    current_abnormal = "abnormal_tachy"
    last_phase_index = -1

    segment_data = np.array([], dtype=float)
    segment_idx = 0
    pending_insert_timestamps = deque(maxlen=256)
    last_prediction_poll = 0.0
    last_prediction_seen: Optional[datetime] = None

    def regenerate_segment(heart_rate: float, rhythm: str):
        nonlocal segment_data, segment_idx
        if rhythm == "abnormal_chaotic":
            segment_data = generate_abnormal_ecg(sampling_rate, segment_duration)
        elif rhythm == "abnormal_tachy":
            segment_data = generate_tachy_ecg(sampling_rate, segment_duration, heart_rate=max(130.0, heart_rate))
        elif rhythm == "abnormal_irregular":
            segment_data = generate_irregular_ecg(
                sampling_rate,
                segment_duration,
                hr_min=max(70.0, irregular_hr_min),
                hr_max=max(irregular_hr_max, irregular_hr_min + 10.0),
            )
        else:
            segment_data = generate_normal_ecg(sampling_rate, segment_duration, heart_rate=heart_rate)
        segment_idx = 0

    def next_sample(heart_rate: float, freq_hz: float, phase_val: float, rhythm: str) -> float:
        nonlocal segment_idx
        if waveform_mode == "simple":
            sine = math.sin(2 * math.pi * freq_hz * phase_val)
            if rhythm == "abnormal_irregular":
                sine += 0.25 * math.sin(2 * math.pi * (freq_hz * 0.5) * phase_val + np.random.uniform(-1.5, 1.5))
            elif rhythm == "abnormal_chaotic":
                sine += np.random.normal(0.0, 0.45)
            return baseline + amplitude * sine + np.random.normal(0.0, noise_std)
        if segment_idx >= len(segment_data):
            regenerate_segment(heart_rate, rhythm)
        val = baseline + amplitude * segment_data[segment_idx] + np.random.normal(0.0, noise_std)
        segment_idx += 1
        return val
    
    print(f"[ok] ECG Timescale feeder running at {sampling_rate} Hz for patient {patient_id} with device {device_id}")
    print(f"[ok] Connected to TimescaleDB: {timescale_dsn.split('@')[1] if '@' in timescale_dsn else 'database'}")
    print(f"[ok] Phase schedule: {normal_phase_seconds:.1f}s normal, {abnormal_phase_seconds:.1f}s abnormal (repeating)")

    def _parse_prediction_ts(ts: str) -> Optional[datetime]:
        try:
            parsed = datetime.fromisoformat(ts)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except Exception:
            return None

    def _prediction_url() -> Optional[str]:
        if not prediction_api_base:
            return None
        base = prediction_api_base.rstrip("/")
        if base.endswith("/api"):
            return f"{base}/ecg/prediction/{patient_id}"
        return f"{base}/api/ecg/prediction/{patient_id}"

    def maybe_log_prediction_delay(force: bool = False):
        nonlocal last_prediction_poll, last_prediction_seen
        url = _prediction_url()
        if not url:
            return

        now = time.perf_counter()
        if not force and (now - last_prediction_poll) < max(0.2, prediction_poll_interval):
            return
        last_prediction_poll = now

        try:
            req = Request(url, method="GET")
            with urlopen(req, timeout=1.5) as response:
                payload = json.loads(response.read().decode("utf-8"))

            if not payload.get("success"):
                return

            pred_ts_raw = payload.get("timestamp")
            pred_ts = _parse_prediction_ts(pred_ts_raw) if pred_ts_raw else None
            if not pred_ts:
                return

            if last_prediction_seen and pred_ts <= last_prediction_seen:
                return
            last_prediction_seen = pred_ts

            matched_sample_ts = None
            while pending_insert_timestamps and pending_insert_timestamps[0] <= pred_ts:
                matched_sample_ts = pending_insert_timestamps.popleft()

            if matched_sample_ts:
                lag_ms = (pred_ts - matched_sample_ts).total_seconds() * 1000.0
                lag_ms = max(0.0, lag_ms)
                trend = str(payload.get("trend", "unknown"))
                print(f"[lag] prediction={trend} delay_from_fed_sample={lag_ms:.0f} ms (sample={matched_sample_ts.isoformat()}, prediction={pred_ts.isoformat()})")
        except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
            return
    
    def append(ts: datetime, ecg_value: float, heart_rate: float, rhythm: str):
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
            "ecg_feeder",
            rhythm,
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
            insert_rows = [row[:10] for row in buffer]
            normal_count = sum(1 for row in buffer if row[10] == "normal")
            abnormal_count = len(buffer) - normal_count
            max_sample_ts = max(row[0] for row in buffer)
            with conn.cursor() as cur:
                execute_values(cur, sql, insert_rows, page_size=batch_size)
            conn.commit()

            if abnormal_count > 0 and normal_count == 0:
                print(f"[ok] abnormal data are inserting: {abnormal_count} rows")
            elif normal_count > 0 and abnormal_count == 0:
                print(f"[ok] normal data is inserted: {normal_count} rows")
            else:
                print(f"[ok] normal data is inserted: {normal_count} rows | abnormal data are inserting: {abnormal_count} rows")

            if isinstance(max_sample_ts, datetime):
                if max_sample_ts.tzinfo is None:
                    max_sample_ts = max_sample_ts.replace(tzinfo=timezone.utc)
                pending_insert_timestamps.append(max_sample_ts.astimezone(timezone.utc))

            buffer.clear()
            last_flush = time.perf_counter()
            maybe_log_prediction_delay(force=True)
        except psycopg2.Error as exc:
            print(f"[error] Timescale insert failed: {exc}")
            conn.rollback()
    
    def choose_hr(rhythm: str) -> Tuple[float, float]:
        if rhythm == "abnormal_tachy":
            hr = np.random.uniform(tachy_hr_min, tachy_hr_max)
        elif rhythm == "abnormal_irregular":
            base = np.random.uniform(irregular_hr_min, irregular_hr_max)
            hr = base + np.random.normal(0.0, irregular_jitter / 3.0)
        elif rhythm == "abnormal_chaotic":
            hr = np.random.uniform(max(110.0, tachy_hr_min), max(130.0, tachy_hr_max))
        else:
            hr = 72.0 + np.random.normal(0.0, 4.0)

        hr = float(np.clip(hr, 40.0, 220.0))
        freq = max(hr / 60.0, 0.5)
        return hr, freq

    next_tick = time.perf_counter()
    try:
        while running:
            now = time.perf_counter()

            elapsed = now - run_start
            normal_dur = max(0.1, normal_phase_seconds)
            abnormal_dur = max(0.1, abnormal_phase_seconds)
            cycle_dur = normal_dur + abnormal_dur
            cycle_pos = elapsed % cycle_dur

            phase_index = int(elapsed // cycle_dur)
            if phase_index != last_phase_index:
                last_phase_index = phase_index
                print(f"[ok] Starting cycle #{phase_index + 1}")

            if cycle_pos < normal_dur:
                active_rhythm = "normal"
                if segment_idx >= len(segment_data):
                    segment_idx = len(segment_data)
            else:
                # At abnormal phase boundary, pick/rotate abnormal profile
                abnormal_phase_pos = cycle_pos - normal_dur
                if abnormal_phase_pos < dt:
                    current_abnormal = np.random.choice(["abnormal_tachy", "abnormal_irregular", "abnormal_chaotic"])
                    segment_idx = len(segment_data)
                    print(f"[warn] Switching to abnormal phase ({abnormal_dur:.1f}s): {current_abnormal}")
                active_rhythm = current_abnormal
            hr, freq = choose_hr(active_rhythm)

            val = next_sample(hr, freq, phase, active_rhythm)

            append(datetime.now(timezone.utc), val, heart_rate=hr, rhythm=active_rhythm)
            maybe_log_prediction_delay()

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
    parser.add_argument("--prediction-api-base", type=str, default=None, help="Optional backend base URL (e.g. http://localhost:8000) to print feed-to-prediction delay")
    parser.add_argument("--prediction-poll-interval", type=float, default=2.0, help="Seconds between prediction endpoint polls when delay tracking is enabled")
    parser.add_argument("--normal-phase-seconds", type=float, default=30.0, help="Seconds to feed normal ECG in each cycle")
    parser.add_argument("--abnormal-phase-seconds", type=float, default=30.0, help="Seconds to feed abnormal ECG in each cycle")
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
        prediction_api_base=args.prediction_api_base,
        prediction_poll_interval=args.prediction_poll_interval,
        normal_phase_seconds=args.normal_phase_seconds,
        abnormal_phase_seconds=args.abnormal_phase_seconds,
    )


if __name__ == "__main__":
    main()
