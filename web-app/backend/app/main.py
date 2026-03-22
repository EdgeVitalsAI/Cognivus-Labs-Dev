from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from pathlib import Path
from .core.config import settings
from .core.database import engine, Base
from .core.background_tasks import start_background_tasks
from .services.ecg_buffer_manager import start_ecg_buffer_manager, stop_ecg_buffer_manager
from .services.ecg_monitoring_service import start_ecg_monitoring_service, stop_ecg_monitoring_service
from .services.ecg_ml_inference import initialize_ecg_ml_service
from .services.spo2_buffer_manager import start_spo2_buffer_manager, stop_spo2_buffer_manager
from .services.spo2_monitoring_service import start_spo2_monitoring_service, stop_spo2_monitoring_service
from .services.spo2_ml_inference import initialize_spo2_ml_service
from .api.routes import (
    auth,
    admin_auth,
    admin_system,
    admin_devices,
    admin_users,
    admin_model_inference,
    patients,
    patient_vitals,
    prescriptions,
    profile,
    dashboard,
    telemedicine,
    clinical_notes,
    ai_insights,
    staff_tasks,
    devices,  # Device auto-registration (public endpoint)
    vitals_websocket,  # Real-time vitals WebSocket streaming
    live_vitals,  # Live vitals from ESP32 HTTP endpoints
    vitals_history,  # Historical vitals from TimescaleDB
    ecg_websocket,  # ECG monitoring with ML inference
    spo2_websocket  # SpO2 monitoring with ML inference
)
import os 

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)


# Custom CORS middleware that allows all local origins
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip CORS for WebSocket connections (they handle their own connection)
        if "/ws/" in request.url.path:
            return await call_next(request)
        
        origin = request.headers.get("origin")

        # Allow all localhost and 127.0.0.1 origins
        if origin and ("localhost" in origin or "127.0.0.1" in origin):
            if request.method == "OPTIONS":
                # Handle preflight
                response = Response(status_code=200)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Access-Control-Max-Age"] = "3600"
                return response
            else:
                # Handle actual request
                response = await call_next(request)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                return response

        return await call_next(request)


# Add custom CORS middleware
app.add_middleware(CustomCORSMiddleware)


# Startup event - start background tasks
@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup"""
    await start_background_tasks()
    print("✓ Background tasks started (device heartbeat monitoring)")
    # Resolve ECG model location:
    # 1) Respect explicit env override ECG_MODEL_PATH
    # 2) Search common repo/container locations
    env_model = Path(str(os.getenv("ECG_MODEL_PATH", ""))).expanduser()
    candidates = []
    if env_model.name:
        candidates.append(env_model)
    
    # __file__ is /app/app/main.py
    # .parent gives /app/app
    # .parent.parent gives /app (the container root where ml-models is mounted)
    app_dir = Path(__file__).resolve().parent  # /app/app
    repo_root = app_dir.parent  # /app
    
    candidates.extend([
        repo_root / "ml-models" / "ecg-analysis" / "models" / "ecg_lstm_model_savedmodel",
        repo_root / "ml-models" / "ecg-analysis" / "models" / "ecg_lstm_model.keras",
        repo_root / "ml-models" / "ecg-analysis" / "models" / "best_ecg_model.h5",
        repo_root / "ml-models" / "ecg-analysis" / "models" / "ecg_lstm_model.h5",
    ])
    
    print(f"[debug] Looking for ECG model in the following locations:")
    for idx, candidate in enumerate(candidates):
        exists = Path(candidate).exists() if candidate else False
        print(f"  {idx+1}. {candidate} - {'EXISTS' if exists else 'NOT FOUND'}")
    
    model_path = next((p for p in candidates if p and Path(p).exists()), None)
    if model_path is None:
        raise FileNotFoundError(
            f"No ECG model found. Searched locations:\n" + 
            "\n".join(f"  - {c}" for c in candidates) +
            "\n\nSet ECG_MODEL_PATH or mount ml-models/ecg-analysis/models with ecg_lstm_model_savedmodel (directory) or best_ecg_model.h5/ecg_lstm_model.h5"
        )
    
    # Try to load the model, but allow fallback to mock predictions if there's a version mismatch
    try:
        initialize_ecg_ml_service(str(model_path), allow_mock=False)
        print(f"✓ ECG ML model initialized from {model_path}")
    except RuntimeError as e:
        print(f"⚠️ Could not load ECG model due to TensorFlow version incompatibility")
        print(f"⚠️ Initializing with mock predictions for testing")
        initialize_ecg_ml_service(str(model_path), allow_mock=True)
        print(f"✓ ECG ML service initialized with mock predictions (model needs retraining)")
    
    # Start ECG monitoring services
    start_ecg_buffer_manager()
    start_ecg_monitoring_service()
    print("✓ ECG monitoring and ML inference services started")

    # Resolve SpO2 MEDIUM model location with graceful fallback
    env_spo2_model = Path(str(os.getenv("SPO2_MODEL_PATH", ""))).expanduser()
    spo2_candidates = []
    if env_spo2_model.name:
        spo2_candidates.append(env_spo2_model)

    workspace_root = repo_root.parent.parent
    spo2_candidates.extend([
        repo_root / "ml-models" / "spo2-prediction" / "model" / "model_medium.keras",
        workspace_root / "ml-models" / "spo2-prediction" / "model" / "model_medium.keras",
    ])

    spo2_model_path = next((p for p in spo2_candidates if p and Path(p).exists()), None)

    if spo2_model_path:
        try:
            initialize_spo2_ml_service(str(spo2_model_path), allow_mock=False)
            print(f"✓ SpO2 MEDIUM model initialized from {spo2_model_path}")
        except RuntimeError:
            initialize_spo2_ml_service(str(spo2_model_path), allow_mock=True)
            print("⚠️ SpO2 model load failed; initialized with mock predictions")
    else:
        initialize_spo2_ml_service(None, allow_mock=True)
        print("⚠️ SpO2 MEDIUM model not found; initialized with mock predictions")

    start_spo2_buffer_manager()
    start_spo2_monitoring_service()
    print("✓ SpO2 monitoring and ML inference services started")


# Shutdown event - cleanup
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    stop_spo2_monitoring_service()
    stop_spo2_buffer_manager()
    print("✓ SpO2 monitoring services stopped")

    stop_ecg_monitoring_service()
    stop_ecg_buffer_manager()
    print("✓ ECG monitoring services stopped")


# Public authentication routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Public device registration (ESP32 auto-registration, no auth required)
app.include_router(devices.router, prefix="/api", tags=["Device Registration"])

# Admin routes (hidden under /sys prefix)
app.include_router(admin_auth.router, prefix="/api/sys/auth", tags=["Admin Auth"])
app.include_router(admin_system.router, prefix="/api/sys/system", tags=["System Monitoring"])
app.include_router(admin_devices.router, prefix="/api/sys/devices", tags=["Device Management"])
app.include_router(admin_users.router, prefix="/api/sys/users", tags=["User Management"])
app.include_router(admin_model_inference.router, prefix="/api/admin", tags=["Model Inference"])

# Clinical data routes (for doctors and staff)
app.include_router(patients.router, prefix="/api", tags=["Patients"])
app.include_router(patient_vitals.router, prefix="/api", tags=["Patient Vitals"])
app.include_router(prescriptions.router, prefix="/api", tags=["Prescriptions"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(telemedicine.router, prefix="/api", tags=["Telemedicine"])
app.include_router(clinical_notes.router, prefix="/api", tags=["Clinical Notes"])
app.include_router(ai_insights.router, prefix="/api", tags=["AI Insights"])
app.include_router(staff_tasks.router, prefix="/api", tags=["Staff Tasks"])
app.include_router(live_vitals.router, prefix="/api", tags=["Live Vitals"])
app.include_router(vitals_history.router, prefix="/api", tags=["Vitals History"])

# Real-time WebSocket for live vital signs monitoring
app.include_router(vitals_websocket.router, prefix="/api", tags=["Real-Time Vitals"])

# ECG monitoring with ML inference
app.include_router(ecg_websocket.router, prefix="/api", tags=["ECG Monitoring"])

# SpO2 monitoring with ML inference
app.include_router(spo2_websocket.router, prefix="/api", tags=["SpO2 Monitoring"])


@app.get("/")
async def root():
    return {
        "message": "Cognivus Health Monitoring System API",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
