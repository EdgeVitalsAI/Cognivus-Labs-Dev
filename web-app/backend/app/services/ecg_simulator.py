"""
AD8232 ECG simulator that streams realistic ECG samples into TimescaleDB.
- Generates P-QRS-T morphology at configurable heart rates (default 250 Hz)
- Injects noise and occasional abnormal patterns (tachycardia, irregular rhythm)
- Inserts rows into vitals_timeseries as a drop-in source for the existing pipeline
"""
import argparse
import math
import os
import random
import signal
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import numpy as np
import psycopg2
from psycopg2.extras import execute_values

from ..core.config import settings


@dataclass
class SimulatorConfig:
    patient_id: int
    device_id: str
    sampling_rate: int = 250
    base_hr_bpm: float = 72.0
    min_hr_bpm: float = 60.0
    max_hr_bpm: float = 90.0
    hr_variability: float = 3.0
    amplitude: float = 90.0
    baseline: float = 512.0
    noise_std: float = 4.0
    abnormal_interval_mean: float = 120.0
    abnormal_duration: float = 12.0
    batch_size: int = 250
    flush_interval: float = 1.0
    timescale_dsn: Optional[str] = None


class ECGWaveformGenerator:
    def __init__(self, cfg: SimulatorConfig):
        self.cfg = cfg
        self.dt = 1.0 / cfg.sampling_rate
        self.mode = "normal"
        self.event_ends_at = 0.0
        self.next_event_at = time.perf_counter() + self._next_event_offset()
        self.phase = 0.0
        self.current_rr = 60.0 / cfg.base_hr_bpm
        self.active_hr = cfg.base_hr_bpm

    def sample(self) -> Tuple[float, float]:
        now = time.perf_counter()
        self._maybe_update_mode(now)

        if self.phase >= self.current_rr:
            self._start_next_beat()

        signal_value = self._pqrst(self.phase, self.current_rr)
        noise = np.random.normal(0.0, self.cfg.noise_std)
        baseline_wander = 0.6 * math.sin(2 * math.pi * 0.33 * (self.phase / max(self.current_rr, 1e-3)))
        raw = self.cfg.baseline + self.cfg.amplitude * signal_value + baseline_wander + noise
        self.phase += self.dt
        return float(raw), self.active_hr

    def _maybe_update_mode(self, now: float):
        if self.mode != "normal" and now >= self.event_ends_at:
            self.mode = "normal"
            self.next_event_at = now + self._next_event_offset()

        if self.mode == "normal" and now >= self.next_event_at:
            self._start_event(now)

    def _start_event(self, now: float):
        self.mode = random.choice(["tachycardia", "irregular"])
        self.event_ends_at = now + self.cfg.abnormal_duration
        self.next_event_at = now + self.cfg.abnormal_duration + self._next_event_offset()
        print(f"[warn] Starting abnormal pattern: {self.mode} for {self.cfg.abnormal_duration}s")

    def _next_event_offset(self) -> float:
        return random.expovariate(1.0 / max(self.cfg.abnormal_interval_mean, 1.0))

    def _start_next_beat(self):
        self.phase = 0.0
        self.active_hr = self._choose_hr()
        self.current_rr = max(60.0 / self.active_hr, 0.25)

    def _choose_hr(self) -> float:
        if self.mode == "tachycardia":
            return random.uniform(110.0, 140.0)
        if self.mode == "irregular":
            base = random.uniform(70.0, 120.0)
            delta = np.random.normal(0.0, 10.0)
            return float(np.clip(base + delta, 55.0, 150.0))

        jitter = np.random.normal(0.0, self.cfg.hr_variability)
        hr = self.cfg.base_hr_bpm + jitter
        return float(np.clip(hr, self.cfg.min_hr_bpm, self.cfg.max_hr_bpm))

    def _pqrst(self, t: float, rr: float) -> float:
        p = 0.12 * math.exp(-((t - 0.18 * rr) ** 2) / (2 * (0.025 * rr) ** 2))
        q = -0.05 * math.exp(-((t - 0.36 * rr) ** 2) / (2 * (0.010 * rr) ** 2))
        r = 1.00 * math.exp(-((t - 0.40 * rr) ** 2) / (2 * (0.012 * rr) ** 2))
        s = -0.15 * math.exp(-((t - 0.43 * rr) ** 2) / (2 * (0.015 * rr) ** 2))
        t_w = 0.35 * math.exp(-((t - 0.70 * rr) ** 2) / (2 * (0.040 * rr) ** 2))
        return p + q + r + s + t_w


class TimescaleWriter:
    def __init__(self, cfg: SimulatorConfig):
        self.cfg = cfg
        self.conn = self._connect()
        self.buffer: List[Tuple] = []
        self.last_flush = time.perf_counter()

    def _connect(self):
        dsn = self.cfg.timescale_dsn or settings.timescale_database_url
        return psycopg2.connect(dsn)

    def append(self, ts: datetime, ecg_value: float, heart_rate: float):
        row = (
            ts,
            self.cfg.patient_id,
            self.cfg.device_id,
            int(np.clip(round(ecg_value), 0, 1023)),
            False,
            True,
            int(round(heart_rate)),
            True,
            "ecg",
            "ecg_simulator"
        )
        self.buffer.append(row)
        now = time.perf_counter()
        if len(self.buffer) >= self.cfg.batch_size or (now - self.last_flush) >= self.cfg.flush_interval:
            self.flush()

    def flush(self):
        if not self.buffer:
            return
        sql = (
            "INSERT INTO vitals_timeseries (time, patient_id, device_id, ecg_value, ecg_leads_off, ecg_active, "
            "heart_rate, heart_rate_valid, data_type, source) VALUES %s"
        )
        try:
            with self.conn.cursor() as cur:
                execute_values(cur, sql, self.buffer, page_size=self.cfg.batch_size)
            self.conn.commit()
            self.buffer.clear()
            self.last_flush = time.perf_counter()
        except psycopg2.Error as exc:
            print(f"✗ Timescale insert failed: {exc}")
            self.conn.rollback()
            self._reconnect()

    def _reconnect(self):
        try:
            self.conn.close()
        except Exception:
            pass
        time.sleep(1.0)
        self.conn = self._connect()

    def close(self):
        try:
            self.flush()
        finally:
            try:
                self.conn.close()
            except Exception:
                pass


class ECGSimulator:
    def __init__(self, cfg: SimulatorConfig):
        self.cfg = cfg
        self.generator = ECGWaveformGenerator(cfg)
        self.writer = TimescaleWriter(cfg)
        self.running = True

    def run(self):
        print(
            f"[ok] ECG simulator started at {self.cfg.sampling_rate} Hz for patient {self.cfg.patient_id} "
            f"(HR {self.cfg.min_hr_bpm}-{self.cfg.max_hr_bpm} bpm)"
        )
        next_tick = time.perf_counter()
        try:
            while self.running:
                value, hr = self.generator.sample()
                ts = datetime.now(timezone.utc)
                self.writer.append(ts, value, hr)
                next_tick += 1.0 / self.cfg.sampling_rate
                delay = next_tick - time.perf_counter()
                if delay > 0:
                    time.sleep(delay)
                else:
                    next_tick = time.perf_counter()
        except KeyboardInterrupt:
            print("[warn] Simulator interrupted, flushing pending samples...")
        finally:
            self.shutdown()

    def shutdown(self):
        self.running = False
        self.writer.close()
        print("[ok] ECG simulator stopped")


def parse_args(argv: Optional[List[str]] = None) -> SimulatorConfig:
    parser = argparse.ArgumentParser(description="AD8232 ECG simulator for TimescaleDB")
    parser.add_argument("--patient-id", type=int, default=1, help="Patient identifier")
    parser.add_argument("--device-id", type=str, default="ad8232-sim", help="Device identifier")
    parser.add_argument("--sampling-rate", type=int, default=250, help="Sampling rate in Hz")
    parser.add_argument("--base-hr", type=float, default=72.0, help="Base heart rate (bpm)")
    parser.add_argument("--min-hr", type=float, default=60.0, help="Lower HR clamp (bpm)")
    parser.add_argument("--max-hr", type=float, default=90.0, help="Upper HR clamp (bpm)")
    parser.add_argument("--hr-variability", type=float, default=3.0, help="Normal HR jitter (std bpm)")
    parser.add_argument("--noise-std", type=float, default=4.0, help="Gaussian noise standard deviation")
    parser.add_argument("--amplitude", type=float, default=90.0, help="PQRST amplitude scaling")
    parser.add_argument("--abnormal-interval", type=float, default=120.0, help="Mean seconds between abnormal events")
    parser.add_argument("--abnormal-duration", type=float, default=12.0, help="Seconds each abnormal event lasts")
    parser.add_argument("--batch-size", type=int, default=250, help="Insert batch size")
    parser.add_argument("--flush-interval", type=float, default=1.0, help="Force flush interval in seconds")
    parser.add_argument("--timescale-dsn", type=str, default=None, help="Override Timescale DSN")
    args = parser.parse_args(argv)

    return SimulatorConfig(
        patient_id=args.patient_id,
        device_id=args.device_id,
        sampling_rate=args.sampling_rate,
        base_hr_bpm=args.base_hr,
        min_hr_bpm=args.min_hr,
        max_hr_bpm=args.max_hr,
        hr_variability=args.hr_variability,
        amplitude=args.amplitude,
        noise_std=args.noise_std,
        abnormal_interval_mean=args.abnormal_interval,
        abnormal_duration=args.abnormal_duration,
        batch_size=args.batch_size,
        flush_interval=args.flush_interval,
        timescale_dsn=args.timescale_dsn,
    )


def main(argv: Optional[List[str]] = None):
    cfg = parse_args(argv)
    simulator = ECGSimulator(cfg)

    def handle_signal(signum, frame):
        simulator.shutdown()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    simulator.run()


if __name__ == "__main__":
    main()
