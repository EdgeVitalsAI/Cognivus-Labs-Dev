"""
Real-Time Vital Signs WebSocket Streaming
Connects frontend to ESP32 devices for live patient monitoring
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict
import asyncio
import aiohttp
import json
from datetime import datetime

from ...core.database import get_db
from ...models.device import Device, DeviceStatus
from ...models.patient import Patient

router = APIRouter()


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
        """Accept new WebSocket connection from frontend"""
        await websocket.accept()
        
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
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        await websocket.close(code=1008, reason=f"Patient {patient_id} not found")
        return
    
    # Find patient's assigned device
    device = db.query(Device).filter(
        Device.patient_id == patient_id,
        Device.status == DeviceStatus.ONLINE
    ).first()
    
    if not device or not device.ip_address:
        await websocket.accept()
        await websocket.send_json({
            "type": "error",
            "message": "No active monitoring device assigned to this patient"
        })
        await websocket.close()
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
