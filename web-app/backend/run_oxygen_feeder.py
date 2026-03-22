"""
Standalone oxygen feeder for SpO2 trend testing.
Inserts synthetic SpO2 data into TimescaleDB similar to run_ecg_feeder.py.
"""
import argparse
import os
import signal
import time
from datetime import datetime
from typing import Optional, Tuple, List

import numpy as np
import psycopg2
from psycopg2.extras import execute_values


def run_oxygen_feeder(
    patient_id: int,
    device_id: str,
    sampling_rate: float = 1.0,
    batch_size: int = 20,
    flush_interval: float = 3.0,
    timescale_dsn: Optional[str] = None,
    normal_phase_seconds: float = 60.0,
    declining_phase_seconds: float = 60.0,
    critical_phase_seconds: float = 45.0,
):
    if not timescale_dsn:
        timescale_dsn = os.getenv(
            "TIMESCALE_DSN",
            "postgresql://timescale_user:timescale_secure_password_123@localhost:5433/cognivus_vitals_timeseries",
        )

    conn = psycopg2.connect(timescale_dsn)
    buffer: List[Tuple] = []
    last_flush = time.perf_counter()
    running = True

    run_start = time.perf_counter()

    def handle_sigint(signum, frame):
        nonlocal running
        running = False

    signal.signal(signal.SIGINT, handle_sigint)
    signal.signal(signal.SIGTERM, handle_sigint)

    def current_phase(elapsed: float) -> str:
        cycle = normal_phase_seconds + declining_phase_seconds + critical_phase_seconds
        t = elapsed % max(cycle, 1.0)
        if t < normal_phase_seconds:
            return "normal"
        if t < normal_phase_seconds + declining_phase_seconds:
            return "declining"
        return "critical"

    def next_sample(elapsed: float) -> Tuple[int, bool, bool, int, int, str]:
        phase = current_phase(elapsed)

        if phase == "normal":
            base = 97.8 + np.random.normal(0, 0.5)
        elif phase == "declining":
            local_t = elapsed % max(normal_phase_seconds + declining_phase_seconds + critical_phase_seconds, 1.0)
            decline_t = max(0.0, local_t - normal_phase_seconds)
            ratio = min(1.0, decline_t / max(declining_phase_seconds, 1.0))
            base = 97.0 - 5.5 * ratio + np.random.normal(0, 0.4)
        else:
            base = 89.0 + np.random.normal(0, 1.2)

        spo2 = int(np.clip(round(base), 78, 100))

        finger_detected = np.random.rand() > 0.04
        spo2_valid = finger_detected and (np.random.rand() > 0.06)

        ir_signal = int(np.clip(np.random.normal(52000, 5000), 12000, 120000))
        red_signal = int(np.clip(np.random.normal(47000, 5000), 9000, 110000))

        if not finger_detected:
            spo2 = int(np.clip(spo2 + np.random.randint(-8, 3), 70, 100))
            ir_signal = int(ir_signal * 0.2)
            red_signal = int(red_signal * 0.25)

        return spo2, spo2_valid, finger_detected, ir_signal, red_signal, phase

    def append_row(ts: datetime, spo2: int, valid: bool, finger: bool, ir: int, red: int, phase: str):
        nonlocal buffer, last_flush
        row = (
            ts,
            patient_id,
            device_id,
            spo2,
            valid,
            finger,
            ir,
            red,
            True,
            "spo2",
            "oxygen_feeder",
        )
        buffer.append((row, phase))

        now = time.perf_counter()
        if len(buffer) >= batch_size or (now - last_flush) >= flush_interval:
            flush()

    def flush():
        nonlocal buffer, last_flush
        if not buffer:
            return

        sql = (
            "INSERT INTO vitals_timeseries "
            "(time, patient_id, device_id, spo2_value, spo2_valid, finger_detected, spo2_ir_signal, "
            "spo2_red_signal, spo2_active, data_type, source) VALUES %s"
        )

        try:
            rows = [b[0] for b in buffer]
            phases = [b[1] for b in buffer]
            with conn.cursor() as cur:
                execute_values(cur, sql, rows, page_size=batch_size)
            conn.commit()

            phase_counts = {
                "normal": phases.count("normal"),
                "declining": phases.count("declining"),
                "critical": phases.count("critical"),
            }
            print(
                f"[ok] inserted={len(rows)} | normal={phase_counts['normal']} "
                f"declining={phase_counts['declining']} critical={phase_counts['critical']}"
            )

            buffer.clear()
            last_flush = time.perf_counter()
        except psycopg2.Error as exc:
            print(f"[error] Timescale insert failed: {exc}")
            conn.rollback()

    print(f"[ok] Oxygen feeder started for patient={patient_id} device={device_id}")
    print(f"[ok] DSN target: {timescale_dsn.split('@')[1] if '@' in timescale_dsn else 'database'}")

    dt = 1.0 / max(sampling_rate, 0.2)
    next_tick = time.perf_counter()

    try:
        while running:
            now = time.perf_counter()
            elapsed = now - run_start

            spo2, valid, finger, ir, red, phase = next_sample(elapsed)
            ts = datetime.utcnow()
            append_row(ts, spo2, valid, finger, ir, red, phase)

            next_tick += dt
            sleep_for = next_tick - time.perf_counter()
            if sleep_for > 0:
                time.sleep(sleep_for)
            else:
                next_tick = time.perf_counter()
    finally:
        flush()
        conn.close()
        print("[ok] Oxygen feeder stopped")


def parse_args():
    parser = argparse.ArgumentParser(description="Feed synthetic oxygen saturation data into TimescaleDB")
    parser.add_argument("--patient-id", type=int, required=True)
    parser.add_argument("--device-id", type=str, required=True)
    parser.add_argument("--sampling-rate", type=float, default=1.0)
    parser.add_argument("--batch-size", type=int, default=20)
    parser.add_argument("--flush-interval", type=float, default=3.0)
    parser.add_argument("--timescale-dsn", type=str, default=None)
    parser.add_argument("--normal-phase-seconds", type=float, default=60.0)
    parser.add_argument("--declining-phase-seconds", type=float, default=60.0)
    parser.add_argument("--critical-phase-seconds", type=float, default=45.0)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_oxygen_feeder(
        patient_id=args.patient_id,
        device_id=args.device_id,
        sampling_rate=args.sampling_rate,
        batch_size=args.batch_size,
        flush_interval=args.flush_interval,
        timescale_dsn=args.timescale_dsn,
        normal_phase_seconds=args.normal_phase_seconds,
        declining_phase_seconds=args.declining_phase_seconds,
        critical_phase_seconds=args.critical_phase_seconds,
    )
