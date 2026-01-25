"""
Simple ECG value feeder for wiring tests.
- Inserts synthetic ECG-like values into TimescaleDB at a fixed rate.
- Uses vitals_timeseries so the existing buffer+ML+WebSocket flow can run end-to-end.
- Use when hardware is unavailable and full morphology realism is not required.
"""
import argparse
import math
import signal
import time
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from .ecg_simulator import SimulatorConfig, TimescaleWriter


def run_feeder(cfg: SimulatorConfig, frequency_hz: float = 1.2):
    writer = TimescaleWriter(cfg)
    running = True
    phase = 0.0
    dt = 1.0 / cfg.sampling_rate
    print(
        f"[ok] ECG Timescale feeder running at {cfg.sampling_rate} Hz for patient {cfg.patient_id} "
        f"with device {cfg.device_id}"
    )
    next_tick = time.perf_counter()
    try:
        while running:
            # Simple sine-based waveform with small jitter
            jitter = np.random.normal(0.0, 0.05)
            val = cfg.baseline + cfg.amplitude * math.sin(2 * math.pi * frequency_hz * phase) + np.random.normal(0.0, cfg.noise_std)
            writer.append(datetime.now(timezone.utc), val, heart_rate=72 + jitter * 5)
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
        writer.close()
        print("[ok] Feeder stopped")


def parse_args(argv=None) -> SimulatorConfig:
    parser = argparse.ArgumentParser(description="Simple ECG feeder into TimescaleDB")
    parser.add_argument("--patient-id", type=int, default=1, help="Patient identifier")
    parser.add_argument("--device-id", type=str, default="ecg-feeder", help="Device identifier")
    parser.add_argument("--sampling-rate", type=int, default=50, help="Sampling rate (Hz)")
    parser.add_argument("--amplitude", type=float, default=120.0, help="Wave amplitude")
    parser.add_argument("--baseline", type=float, default=512.0, help="Baseline offset")
    parser.add_argument("--noise-std", type=float, default=6.0, help="Gaussian noise std dev")
    parser.add_argument("--batch-size", type=int, default=200, help="Batch size for inserts")
    parser.add_argument("--flush-interval", type=float, default=1.0, help="Flush interval seconds")
    parser.add_argument("--timescale-dsn", type=str, default=None, help="Override Timescale DSN")
    parser.add_argument("--frequency", type=float, default=1.2, help="Sine frequency in Hz (heart-rate proxy)")
    args = parser.parse_args(argv)

    return SimulatorConfig(
        patient_id=args.patient_id,
        device_id=args.device_id,
        sampling_rate=args.sampling_rate,
        amplitude=args.amplitude,
        baseline=args.baseline,
        noise_std=args.noise_std,
        batch_size=args.batch_size,
        flush_interval=args.flush_interval,
        timescale_dsn=args.timescale_dsn,
    ), args.frequency


def main(argv=None):
    cfg, freq = parse_args(argv)

    def handle_signal(signum, frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    run_feeder(cfg, frequency_hz=freq)


if __name__ == "__main__":
    main()
