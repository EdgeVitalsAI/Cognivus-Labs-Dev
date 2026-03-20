"""
SpO2 Real-Time Monitoring WebSocket
Provides near-real-time SpO2 trend predictions from TimescaleDB-backed inference.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import asyncio
import json

from ...services.spo2_monitoring_service import get_spo2_monitoring_service


router = APIRouter()


class SpO2WebSocketManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, patient_id: int, websocket: WebSocket):
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        self.active_connections[patient_id].append(websocket)
        print(f"✓ SpO2 WebSocket connected for patient {patient_id}")

    async def disconnect(self, patient_id: int, websocket: WebSocket):
        if patient_id in self.active_connections and websocket in self.active_connections[patient_id]:
            self.active_connections[patient_id].remove(websocket)

        if patient_id in self.active_connections and len(self.active_connections[patient_id]) == 0:
            del self.active_connections[patient_id]
            print(f"✓ All SpO2 WebSocket connections closed for patient {patient_id}")

    async def broadcast_to_patient(self, patient_id: int, message: dict):
        if patient_id not in self.active_connections:
            return

        dead_connections = []
        for websocket in self.active_connections[patient_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.append(websocket)

        for ws in dead_connections:
            await self.disconnect(patient_id, ws)

    def get_connection_count(self, patient_id: int) -> int:
        return len(self.active_connections.get(patient_id, []))


_spo2_ws_manager = SpO2WebSocketManager()


def get_spo2_websocket_manager() -> SpO2WebSocketManager:
    return _spo2_ws_manager


@router.websocket("/ws/spo2/{patient_id}")
async def spo2_monitoring_websocket(
    websocket: WebSocket,
    patient_id: int,
    token: Optional[str] = Query(None),
):
    await websocket.accept()

    spo2_service = get_spo2_monitoring_service()
    ws_manager = get_spo2_websocket_manager()

    if spo2_service.websocket_manager is None:
        spo2_service.set_websocket_manager(ws_manager)

    await ws_manager.connect(patient_id, websocket)
    spo2_service.start_monitoring(patient_id)

    try:
        await websocket.send_json(
            {
                "type": "connection_established",
                "patient_id": patient_id,
                "message": "SpO2 monitoring started",
                "update_interval_seconds": 2,
            }
        )

        latest = spo2_service.get_latest_prediction(patient_id)
        if latest:
            await websocket.send_json({"type": "spo2_prediction", "patient_id": patient_id, **latest.to_dict()})

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[SpO2 WebSocket] Error for patient {patient_id}: {e}")
    finally:
        await ws_manager.disconnect(patient_id, websocket)
        if ws_manager.get_connection_count(patient_id) == 0:
            spo2_service.stop_monitoring(patient_id)


@router.get("/spo2/prediction/{patient_id}")
async def get_latest_spo2_prediction(patient_id: int):
    service = get_spo2_monitoring_service()
    prediction = service.get_latest_prediction(patient_id)

    if prediction:
        return {
            "success": True,
            "patient_id": patient_id,
            **prediction.to_dict(),
        }

    return {
        "success": False,
        "patient_id": patient_id,
        "message": "No recent SpO2 prediction available",
    }
