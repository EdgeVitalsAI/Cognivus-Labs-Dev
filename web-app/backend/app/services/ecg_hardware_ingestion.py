"""
ECG Hardware Ingestion Service
Connects to real ESP32 wearable devices via WebSocket (port 81),
receives live ECG data, and batch-inserts into TimescaleDB.

This replaces the simulator/feeder for production use.
The downstream pipeline (buffer manager -> ML inference -> WebSocket)
reads from TimescaleDB and works identically regardless of data source.
"""
import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple

import numpy as np
import psycopg2
from psycopg2.extras import execute_values

from ..core.config import settings
from ..core.database import SessionLocal
from ..models.device import Device, DeviceStatus


class ECGTimescaleWriter:
    """
    Efficient batch writer for ECG samples into TimescaleDB.
    Buffers rows and flushes via execute_values when batch_size or
    flush_interval is reached.
    """

    def __init__(
        self,
        dsn: Optional[str] = None,
        batch_size: int = 250,
        flush_interval: float = 1.0,
    ):
        self.dsn = dsn or settings.timescale_database_url
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.conn: Optional[psycopg2.extensions.connection] = None
        self.buffer: List[Tuple] = []
        self.last_flush = time.perf_counter()
        self._connect()

    def _connect(self):
        try:
            self.conn = psycopg2.connect(self.dsn)
            print("[ecg-hw] Connected to TimescaleDB")
        except psycopg2.Error as exc:
            print(f"[ecg-hw] TimescaleDB connection failed: {exc}")
            self.conn = None

    def append(
        self,
        ts: datetime,
        patient_id: int,
        device_id: str,
        ecg_value: int,
        ecg_leads_off: bool,
        heart_rate: Optional[int],
        heart_rate_valid: bool,
    ):
        row = (
            ts,
            patient_id,
            device_id,
            int(np.clip(ecg_value, 0, 1023)),
            ecg_leads_off,
            True,  # ecg_active
            heart_rate,
            heart_rate_valid,
            "ecg",
            "esp32_device",
        )
        self.buffer.append(row)
        now = time.perf_counter()
        if len(self.buffer) >= self.batch_size or (now - self.last_flush) >= self.flush_interval:
            self.flush()

    def flush(self):
        if not self.buffer:
            return
        if not self.conn:
            self._reconnect()
            if not self.conn:
                return

        sql = (
            "INSERT INTO vitals_timeseries "
            "(time, patient_id, device_id, ecg_value, ecg_leads_off, ecg_active, "
            "heart_rate, heart_rate_valid, data_type, source) VALUES %s"
        )
        try:
            with self.conn.cursor() as cur:
                execute_values(cur, sql, self.buffer, page_size=self.batch_size)
            self.conn.commit()
            count = len(self.buffer)
            self.buffer.clear()
            self.last_flush = time.perf_counter()
            print(f"[ecg-hw] Flushed {count} ECG samples to TimescaleDB")
        except psycopg2.Error as exc:
            print(f"[ecg-hw] TimescaleDB insert failed: {exc}")
            try:
                self.conn.rollback()
            except Exception:
                pass
            self._reconnect()

    def _reconnect(self):
        try:
            if self.conn:
                self.conn.close()
        except Exception:
            pass
        self.conn = None
        time.sleep(1.0)
        self._connect()

    def close(self):
        try:
            self.flush()
        finally:
            try:
                if self.conn:
                    self.conn.close()
            except Exception:
                pass


class DeviceConnection:
    """Tracks state for a single ESP32 device WebSocket connection."""

    def __init__(self, device_id: str, ip_address: str, patient_id: int):
        self.device_id = device_id
        self.ip_address = ip_address
        self.patient_id = patient_id
        self.task: Optional[asyncio.Task] = None
        self.connected = False
        self.last_sample_time: Optional[datetime] = None
        self.sample_count = 0


class ECGHardwareIngestionService:
    """
    Background service that:
    1. Discovers online ESP32 devices assigned to patients
    2. Connects to each device's WebSocket (port 81)
    3. Receives real-time ECG data
    4. Batch-inserts into TimescaleDB
    5. Auto-reconnects on failure
    6. Periodically polls for new device assignments
    """

    def __init__(
        self,
        device_poll_interval: int = 30,
        reconnect_delay: int = 5,
        ws_port: int = 81,
    ):
        self.device_poll_interval = device_poll_interval
        self.reconnect_delay = reconnect_delay
        self.ws_port = ws_port

        self.connections: Dict[str, DeviceConnection] = {}
        self.writer: Optional[ECGTimescaleWriter] = None

        self._poll_task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if self._running:
            return

        self._running = True
        self.writer = ECGTimescaleWriter()
        self._poll_task = asyncio.create_task(self._device_poll_loop())
        print("[ecg-hw] ECG Hardware Ingestion Service started")

    def stop(self):
        self._running = False

        if self._poll_task:
            self._poll_task.cancel()

        for conn in self.connections.values():
            if conn.task:
                conn.task.cancel()
        self.connections.clear()

        if self.writer:
            self.writer.close()
            self.writer = None

        print("[ecg-hw] ECG Hardware Ingestion Service stopped")

    async def _device_poll_loop(self):
        """Periodically discover devices and manage connections."""
        while self._running:
            try:
                await self._discover_and_sync_devices()
                await asyncio.sleep(self.device_poll_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[ecg-hw] Device poll error: {e}")
                await asyncio.sleep(self.device_poll_interval)

    async def _discover_and_sync_devices(self):
        """Query DB for online assigned devices, start/stop connections as needed."""
        loop = asyncio.get_event_loop()
        devices = await loop.run_in_executor(None, self._query_assigned_devices)

        active_device_ids: Set[str] = set()

        for dev_info in devices:
            device_id = dev_info["device_id"]
            ip_address = dev_info["ip_address"]
            patient_id = dev_info["patient_id"]
            active_device_ids.add(device_id)

            if device_id in self.connections:
                conn = self.connections[device_id]
                if conn.ip_address != ip_address or conn.patient_id != patient_id:
                    print(f"[ecg-hw] Device {device_id} config changed, reconnecting")
                    if conn.task:
                        conn.task.cancel()
                    conn.ip_address = ip_address
                    conn.patient_id = patient_id
                    conn.connected = False
                    conn.task = asyncio.create_task(
                        self._device_stream_loop(conn)
                    )
                elif not conn.connected and (conn.task is None or conn.task.done()):
                    conn.task = asyncio.create_task(
                        self._device_stream_loop(conn)
                    )
            else:
                conn = DeviceConnection(device_id, ip_address, patient_id)
                self.connections[device_id] = conn
                conn.task = asyncio.create_task(
                    self._device_stream_loop(conn)
                )
                print(
                    f"[ecg-hw] Discovered device {device_id} "
                    f"(ip={ip_address}, patient={patient_id})"
                )

        stale = [did for did in self.connections if did not in active_device_ids]
        for did in stale:
            conn = self.connections.pop(did)
            if conn.task:
                conn.task.cancel()
            print(f"[ecg-hw] Device {did} no longer assigned/online, disconnecting")

    def _query_assigned_devices(self) -> List[Dict]:
        """Query the devices table for online devices assigned to patients."""
        db = SessionLocal()
        try:
            devices = (
                db.query(Device)
                .filter(
                    Device.status == DeviceStatus.ONLINE,
                    Device.patient_id.isnot(None),
                    Device.ip_address.isnot(None),
                )
                .all()
            )
            result = []
            for d in devices:
                try:
                    pid = int(d.patient_id)
                except (ValueError, TypeError):
                    continue
                result.append(
                    {
                        "device_id": d.device_id,
                        "ip_address": d.ip_address,
                        "patient_id": pid,
                    }
                )
            return result
        finally:
            db.close()

    async def _device_stream_loop(self, conn: DeviceConnection):
        """Connect to a single ESP32 device and stream ECG data with auto-reconnect."""
        while self._running:
            try:
                await self._stream_from_device(conn)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(
                    f"[ecg-hw] Device {conn.device_id} stream error: {e}, "
                    f"retrying in {self.reconnect_delay}s"
                )
                conn.connected = False

            if not self._running:
                break
            await asyncio.sleep(self.reconnect_delay)

    async def _stream_from_device(self, conn: DeviceConnection):
        """Connect to ESP32 WebSocket and process incoming ECG messages."""
        import websockets

        ws_url = f"ws://{conn.ip_address}:{self.ws_port}"
        print(f"[ecg-hw] Connecting to {conn.device_id} at {ws_url}")

        async with websockets.connect(
            ws_url,
            ping_interval=20,
            ping_timeout=10,
            close_timeout=5,
        ) as ws:
            conn.connected = True
            print(
                f"[ecg-hw] Connected to {conn.device_id} "
                f"(patient {conn.patient_id})"
            )

            async for raw_msg in ws:
                if not self._running:
                    break

                try:
                    data = json.loads(raw_msg)
                except (json.JSONDecodeError, TypeError):
                    continue

                msg_type = data.get("type", "")

                if msg_type == "ecg":
                    self._handle_ecg_sample(conn, data)
                elif msg_type == "heart_rate":
                    self._handle_heart_rate(conn, data)

        conn.connected = False
        print(f"[ecg-hw] Disconnected from {conn.device_id}")

    def _handle_ecg_sample(self, conn: DeviceConnection, data: dict):
        """Parse an ECG message from ESP32 and buffer it for TimescaleDB."""
        ecg_value = data.get("val", data.get("value"))
        if ecg_value is None:
            return

        leads_off_raw = data.get("leadsOff", data.get("leads"))
        if isinstance(leads_off_raw, str):
            ecg_leads_off = leads_off_raw.lower() in ("off", "true", "1")
        elif isinstance(leads_off_raw, bool):
            ecg_leads_off = leads_off_raw
        else:
            ecg_leads_off = False

        hr = data.get("hr", data.get("heart_rate"))
        heart_rate = int(round(hr)) if hr is not None else None
        heart_rate_valid = hr is not None

        ts = datetime.now(timezone.utc)

        if self.writer:
            self.writer.append(
                ts=ts,
                patient_id=conn.patient_id,
                device_id=conn.device_id,
                ecg_value=int(round(ecg_value)),
                ecg_leads_off=ecg_leads_off,
                heart_rate=heart_rate,
                heart_rate_valid=heart_rate_valid,
            )

        conn.sample_count += 1
        conn.last_sample_time = ts

    def _handle_heart_rate(self, conn: DeviceConnection, data: dict):
        """Handle standalone heart_rate messages from ESP32.

        These are NOT ECG samples - they must NOT be written via the ECG writer
        because the buffer manager would pick up ecg_value=0 as a real sample
        and corrupt the signal fed to the ML model.

        Heart rate from ECG messages (type=ecg with hr field) is already
        captured by _handle_ecg_sample. Standalone heart_rate messages are
        handled by the vitals_websocket service which stores them correctly
        with data_type='heart_rate' and no ecg_value.
        """
        # Intentionally not writing to TimescaleDB here.
        # The heart rate value is already captured in two ways:
        # 1. ECG messages include hr field -> stored by _handle_ecg_sample
        # 2. Standalone HR messages -> stored by vitals_websocket._store_to_timescale
        pass


# ---------------------------------------------------------------------------
# Global singleton
# ---------------------------------------------------------------------------
_ecg_hw_ingestion: Optional[ECGHardwareIngestionService] = None


def get_ecg_hardware_ingestion() -> ECGHardwareIngestionService:
    global _ecg_hw_ingestion
    if _ecg_hw_ingestion is None:
        _ecg_hw_ingestion = ECGHardwareIngestionService()
    return _ecg_hw_ingestion


def start_ecg_hardware_ingestion():
    service = get_ecg_hardware_ingestion()
    service.start()


def stop_ecg_hardware_ingestion():
    service = get_ecg_hardware_ingestion()
    service.stop()
