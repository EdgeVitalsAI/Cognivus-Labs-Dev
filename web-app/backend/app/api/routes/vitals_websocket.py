"""
Real-Time Vital Signs WebSocket Streaming
Connects frontend to ESP32 devices for live patient monitoring
Stores all data points to TimescaleDB for historical analysis
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional
from pydantic import BaseModel
import asyncio
import aiohttp
import json
from datetime import datetime

from ...core.database import get_db
from ...core.timescale_database import get_timescale_db, TimescaleSessionLocal
from ...models.device import Device, DeviceStatus
from ...models.patient import Patient
from ...models.vital_timeseries import VitalTimeseries

router = APIRouter()


# Pydantic models for HTTP POST data
class VitalDataPayload(BaseModel):
    device_id: str
    patient_id: Optional[int] = None
    type: str  # "ecg", "spo2", "heart_rate"
    timestamp: Optional[str] = None
    
    # ECG fields
    val: Optional[float] = None
    value: Optional[float] = None
    leadsOff: Optional[bool] = None
    leads: Optional[str] = None
    
    # SpO2 fields
    spo2: Optional[float] = None
    valid: Optional[int] = None
    finger: Optional[bool] = None
    ir: Optional[int] = None
    red: Optional[int] = None
    active: Optional[bool] = None
    
    # Heart rate fields
    hr: Optional[float] = None
    heart_rate: Optional[float] = None
    
    # Temperature
    temperature: Optional[float] = None


class VitalsWebSocketManager:
    """Manages WebSocket connections for real-time vital signs streaming"""
    
    def __init__(self):
        # Store active connections: {patient_id: [websocket_connections]}
        self.active_connections: Dict[str, list] = {}
        # Store ESP32 WebSocket sessions: {patient_id: aiohttp_session}
        self.esp32_connections: Dict[str, aiohttp.ClientWebSocketResponse] = {}
        # Store streaming tasks: {patient_id: asyncio.Task}
        self.streaming_tasks: Dict[str, asyncio.Task] = {}
    
    async def connect(self, patient_id: str, websocket: WebSocket):
        """Track new WebSocket connection from frontend (already accepted)"""
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        
        self.active_connections[patient_id].append(websocket)
        print(f"✓ WebSocket connected for patient {patient_id}, total: {len(self.active_connections[patient_id])}")
    
    async def disconnect(self, patient_id: str, websocket: WebSocket):
        """Handle frontend WebSocket disconnection"""
        if patient_id in self.active_connections:
            self.active_connections[patient_id].remove(websocket)
            
            # If no more connections for this patient, stop ESP32 streaming
            if len(self.active_connections[patient_id]) == 0:
                await self.stop_esp32_streaming(patient_id)
                del self.active_connections[patient_id]
                print(f"✓ All WebSocket connections closed for patient {patient_id}, stopped ESP32 streaming")
    
    async def start_esp32_streaming(self, patient_id: str, device_ip: str, db: Session):
        """Start streaming from ESP32 device WebSocket"""
        if patient_id in self.streaming_tasks:
            return  # Already streaming
        
        # Create streaming task
        task = asyncio.create_task(self._stream_from_esp32(patient_id, device_ip, db))
        self.streaming_tasks[patient_id] = task
        print(f"✓ Started ESP32 streaming for patient {patient_id} from device {device_ip}")
    
    async def stop_esp32_streaming(self, patient_id: str):
        """Stop streaming from ESP32 device"""
        # Cancel streaming task
        if patient_id in self.streaming_tasks:
            self.streaming_tasks[patient_id].cancel()
            del self.streaming_tasks[patient_id]
        
        # Close ESP32 WebSocket connection
        if patient_id in self.esp32_connections:
            await self.esp32_connections[patient_id].close()
            del self.esp32_connections[patient_id]
    
    async def _stream_from_esp32(self, patient_id: str, device_ip: str, db: Session):
        """Internal method to stream data from ESP32 WebSocket to frontend clients"""
        esp32_ws_url = f"ws://{device_ip}:81"  # ESP32 WebSocket port 81
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(esp32_ws_url, timeout=aiohttp.ClientTimeout(total=3600)) as ws:
                    self.esp32_connections[patient_id] = ws
                    print(f"✓ Connected to ESP32 WebSocket: {esp32_ws_url}")
                    
                    # Send initial message to ESP32
                    await ws.send_json({"type": "start_monitoring"})
                    
                    # Stream data from ESP32 to all connected frontend clients
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            
                            # Add patient_id and timestamp
                            data["patient_id"] = patient_id
                            data["server_timestamp"] = datetime.now().isoformat()
                            
                            # Store data to TimescaleDB in background
                            asyncio.create_task(self._store_to_timescale(patient_id, data, device_ip))
                            
                            # Broadcast to all connected frontend WebSockets
                            await self._broadcast_to_patient(patient_id, data)
                        
                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            print(f"✗ ESP32 WebSocket error for patient {patient_id}")
                            break
        
        except asyncio.CancelledError:
            print(f"✓ ESP32 streaming cancelled for patient {patient_id}")
        except Exception as e:
            print(f"✗ ESP32 streaming error for patient {patient_id}: {e}")
            # Notify frontend clients about connection error
            error_msg = {
                "type": "error",
                "message": f"Lost connection to patient monitoring device: {str(e)}",
                "patient_id": patient_id
            }
            await self._broadcast_to_patient(patient_id, error_msg)
    
    async def _store_to_timescale(self, patient_id: str, data: dict, device_ip: str):
        """Store vital signs data to TimescaleDB for historical analysis.

        Note: ECG data is handled by the dedicated ECGHardwareIngestionService
        which batch-inserts directly from the ESP32 WebSocket for efficiency.
        This method handles SpO2, heart_rate, and other non-ECG vitals.
        """
        try:
            data_type = data.get("type", "unknown")

            # ECG data is ingested by ecg_hardware_ingestion service (batch inserts).
            # Skip here to avoid duplicate rows in TimescaleDB.
            if data_type == "ecg":
                return

            # Create new TimescaleDB session
            ts_db = TimescaleSessionLocal()

            try:
                # Prepare vital record
                vital_record = VitalTimeseries(
                    time=datetime.now(),
                    patient_id=int(patient_id),
                    device_id=data.get("device_id", f"esp32_{device_ip}"),
                    data_type=data_type,
                    source="esp32_device"
                )

                # Parse SpO2 data
                if data_type == "spo2":
                    vital_record.spo2_value = data.get("spo2")
                    vital_record.spo2_valid = data.get("valid") == 1 or data.get("valid") == True
                    vital_record.finger_detected = data.get("finger", False)
                    vital_record.spo2_ir_signal = data.get("ir")
                    vital_record.spo2_red_signal = data.get("red")
                    vital_record.spo2_active = data.get("active", True)
                
                # Parse heart rate data
                elif data_type == "heart_rate":
                    vital_record.heart_rate = data.get("hr", data.get("heart_rate"))
                    vital_record.heart_rate_valid = data.get("valid") == 1 or data.get("valid") == True
                
                # Add to session and commit
                ts_db.add(vital_record)
                ts_db.commit()
                
            finally:
                ts_db.close()
                
        except Exception as e:
            print(f"⚠️ Failed to store vital data to TimescaleDB: {e}")
    
    async def _broadcast_to_patient(self, patient_id: str, data: dict):
        """Broadcast data to all frontend WebSocket connections for a patient"""
        if patient_id not in self.active_connections:
            return
        
        disconnected = []
        for websocket in self.active_connections[patient_id]:
            try:
                await websocket.send_json(data)
            except Exception as e:
                print(f"✗ Failed to send to WebSocket: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected WebSockets
        for ws in disconnected:
            await self.disconnect(patient_id, ws)


# Global WebSocket manager instance
vitals_ws_manager = VitalsWebSocketManager()


@router.websocket("/ws/vitals/{patient_id}")
async def vitals_websocket_endpoint(
    websocket: WebSocket,
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time patient vital signs streaming
    
    Flow:
    1. Frontend connects to this WebSocket when viewing patient profile
    2. Backend finds patient's assigned device
    3. Backend connects to ESP32 device WebSocket
    4. Backend streams ESP32 data to frontend in real-time
    5. On disconnect, backend closes ESP32 connection (if no other clients)
    
    Data format from ESP32:
    - {"type": "ecg", "ts": 123456, "val": 512, "leads": "connected"}
    - {"type": "spo2", "spo2": 98, "valid": 1, "ir": 50000, "red": 45000, "finger": true}
    - {"type": "heart_rate", "hr": 72, "valid": 1}
    """
    
    # Accept connection first
    await websocket.accept()
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Patient {patient_id} not found"
            })
            await websocket.close(code=1008)
        except Exception as e:
            print(f"✗ Error sending patient not found message: {e}")
        return
    
    # Find patient's assigned device
    device = db.query(Device).filter(
        Device.patient_id == patient_id,
        Device.status == DeviceStatus.ONLINE
    ).first()
    
    if not device or not device.ip_address:
        try:
            await websocket.send_json({
                "type": "error",
                "message": "No active monitoring device assigned to this patient"
            })
            await websocket.close()
        except Exception as e:
            print(f"✗ Error sending device not found message: {e}")
        return
    
    # Connect to frontend WebSocket
    await vitals_ws_manager.connect(patient_id, websocket)
    
    # Start ESP32 streaming (if not already started)
    await vitals_ws_manager.start_esp32_streaming(patient_id, device.ip_address, db)
    
    try:
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive messages from frontend (if any)
                data = await websocket.receive_text()
                # Could handle commands like pause/resume monitoring
                print(f"Received from frontend for patient {patient_id}: {data}")
            except WebSocketDisconnect:
                break
    
    except Exception as e:
        print(f"✗ WebSocket error for patient {patient_id}: {e}")
    
    finally:
        # Disconnect and cleanup
        await vitals_ws_manager.disconnect(patient_id, websocket)


@router.post("/vitals/stream")
async def receive_vitals_stream(
    payload: VitalDataPayload,
    db: Session = Depends(get_db)
):
    """
    HTTP POST endpoint for ESP32 devices to continuously send vital signs data
    This runs 24/7 regardless of WebSocket connections
    
    ESP32 should POST to this endpoint every second with vital data
    Data is always saved to TimescaleDB and broadcast to active WebSocket viewers
    
    Usage from ESP32:
    POST http://backend:8000/api/vitals/stream
    {
        "device_id": "ESP32_001",
        "patient_id": 1,
        "type": "ecg",
        "val": 512,
        "leadsOff": false,
        "timestamp": "2026-01-12T12:00:00"
    }
    """
    
    try:
        # Find device to get patient assignment
        device = db.query(Device).filter(Device.device_id == payload.device_id).first()
        
        if not device:
            raise HTTPException(status_code=404, detail=f"Device {payload.device_id} not registered")
        
        # Use patient_id from device assignment, fallback to payload
        patient_id = device.patient_id if device.patient_id else payload.patient_id
        
        if not patient_id:
            raise HTTPException(status_code=400, detail="No patient assigned to this device")
        
        # Convert payload to dict
        data = payload.dict()
        data["patient_id"] = patient_id
        data["server_timestamp"] = datetime.now().isoformat()
        
        # Store to TimescaleDB (always, regardless of WebSocket connections)
        asyncio.create_task(vitals_ws_manager._store_to_timescale(str(patient_id), data, device.ip_address or "unknown"))
        
        # Broadcast to active WebSocket viewers (if any)
        asyncio.create_task(vitals_ws_manager._broadcast_to_patient(str(patient_id), data))
        
        return {
            "success": True,
            "message": "Vital data received and stored",
            "patient_id": patient_id,
            "type": payload.type
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Error receiving vital data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
