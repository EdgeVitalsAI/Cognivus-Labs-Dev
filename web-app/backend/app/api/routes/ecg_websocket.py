"""
ECG Real-Time Monitoring WebSocket
Provides near-real-time ECG waveform updates and ML trend predictions
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import asyncio
import json

from ...core.database import get_db
from ...models.user import User
from ...services.ecg_monitoring_service import get_ecg_monitoring_service


router = APIRouter()


class ECGWebSocketManager:
    """Manages WebSocket connections for ECG monitoring"""
    
    def __init__(self):
        # Store active connections: {patient_id: [websockets]}
        self.active_connections: dict = {}
    
    async def connect(self, patient_id: int, websocket: WebSocket):
        """Add a new WebSocket connection"""
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        
        self.active_connections[patient_id].append(websocket)
        print(f"✓ ECG WebSocket connected for patient {patient_id}")
    
    async def disconnect(self, patient_id: int, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if patient_id in self.active_connections:
            if websocket in self.active_connections[patient_id]:
                self.active_connections[patient_id].remove(websocket)
            
            # If no more connections, clean up
            if len(self.active_connections[patient_id]) == 0:
                del self.active_connections[patient_id]
                print(f"✓ All ECG WebSocket connections closed for patient {patient_id}")
    
    async def broadcast_to_patient(self, patient_id: int, message: dict):
        """Broadcast message to all WebSocket clients for a patient"""
        if patient_id not in self.active_connections:
            return
        
        # Send to all connections
        dead_connections = []
        for websocket in self.active_connections[patient_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"✗ Failed to send to WebSocket: {e}")
                dead_connections.append(websocket)
        
        # Clean up dead connections
        for ws in dead_connections:
            await self.disconnect(patient_id, ws)
    
    def get_connection_count(self, patient_id: int) -> int:
        """Get number of active connections for a patient"""
        return len(self.active_connections.get(patient_id, []))


# Global manager instance
_ecg_ws_manager = ECGWebSocketManager()


def get_ecg_websocket_manager() -> ECGWebSocketManager:
    """Get the global ECG WebSocket manager"""
    return _ecg_ws_manager


@router.websocket("/ws/ecg/{patient_id}")
async def ecg_monitoring_websocket(
    websocket: WebSocket,
    patient_id: int,
    # Note: WebSocket auth is tricky; in production use token in query params or headers
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time ECG monitoring
    
    Publishes every 2 seconds:
    - ECG waveform update (2 seconds of data, 500 samples)
    - ECG trend prediction (normal/abnormal/unstable with confidence)
    
    Message types:
    - ecg_waveform: { type, patient_id, samples[], timestamps[], sample_count, timestamp }
    - ecg_prediction: { type, patient_id, trend, confidence, details, heart_rate, timestamp }
    - ecg_status: { type, patient_id, status, message, timestamp }
    """
    # Accept connection
    await websocket.accept()
    
    print(f"[ECG WebSocket] Connection request for patient {patient_id}")
    
    # Get services
    ecg_service = get_ecg_monitoring_service()
    ws_manager = get_ecg_websocket_manager()
    
    # Inject WebSocket manager into monitoring service (if not already done)
    if ecg_service.websocket_manager is None:
        ecg_service.set_websocket_manager(ws_manager)
    
    # Register connection
    await ws_manager.connect(patient_id, websocket)
    
    # Start monitoring this patient
    ecg_service.start_monitoring(patient_id)
    
    try:
        # Send initial connection success message
        try:
            await websocket.send_json({
                "type": "connection_established",
                "patient_id": patient_id,
                "message": "ECG monitoring started",
                "update_interval_seconds": 2
            })
        except WebSocketDisconnect:
            print(f"[ECG WebSocket] Client disconnected immediately for patient {patient_id}")
            await ws_manager.disconnect(patient_id, websocket)
            return
        except Exception as e:
            print(f"[ECG WebSocket] Error sending connection message: {e}")
            await ws_manager.disconnect(patient_id, websocket)
            return
        
        print(f"[ECG WebSocket] Monitoring started for patient {patient_id}")
        
        # Send latest prediction if available
        latest_prediction = ecg_service.get_latest_prediction(patient_id)
        if latest_prediction:
            try:
                await websocket.send_json({
                    "type": "ecg_prediction",
                    "patient_id": patient_id,
                    **latest_prediction.to_dict()
                })
            except (WebSocketDisconnect, Exception) as e:
                print(f"[ECG WebSocket] Error sending initial prediction: {e}")
                await ws_manager.disconnect(patient_id, websocket)
                return
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive messages from client (if any)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message = json.loads(data)
                
                # Handle client messages (e.g., configuration changes)
                if message.get("type") == "ping":
                    try:
                        await websocket.send_json({"type": "pong"})
                    except (WebSocketDisconnect, Exception):
                        break
                
            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except (WebSocketDisconnect, Exception):
                    break
            
    except WebSocketDisconnect:
        print(f"✓ ECG WebSocket disconnected for patient {patient_id}")
    
    except Exception as e:
        print(f"✗ ECG WebSocket error for patient {patient_id}: {e}")
    
    finally:
        # Clean up
        await ws_manager.disconnect(patient_id, websocket)
        
        # If no more connections, stop monitoring
        if ws_manager.get_connection_count(patient_id) == 0:
            ecg_service.stop_monitoring(patient_id)


@router.get("/ecg/prediction/{patient_id}")
async def get_latest_ecg_prediction(patient_id: int, db: Session = Depends(get_db)):
    """
    HTTP endpoint to get the latest ECG prediction
    Alternative to WebSocket for polling-based clients
    """
    ecg_service = get_ecg_monitoring_service()
    prediction = ecg_service.get_latest_prediction(patient_id)
    
    if prediction:
        return {
            "success": True,
            "patient_id": patient_id,
            **prediction.to_dict()
        }
    else:
        return {
            "success": False,
            "patient_id": patient_id,
            "message": "No recent ECG prediction available"
        }
