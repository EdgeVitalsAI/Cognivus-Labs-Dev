from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from .core.config import settings
from .core.database import engine, Base
from .core.background_tasks import start_background_tasks
from .api.routes import (
    auth,
    admin_auth,
    admin_system,
    admin_devices,
    admin_users,
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
    vitals_history  # Historical vitals from TimescaleDB
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)


# Custom CORS middleware that allows all local origins
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
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


# Public authentication routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Public device registration (ESP32 auto-registration, no auth required)
app.include_router(devices.router, prefix="/api", tags=["Device Registration"])

# Admin routes (hidden under /sys prefix)
app.include_router(admin_auth.router, prefix="/api/sys/auth", tags=["Admin Auth"])
app.include_router(admin_system.router, prefix="/api/sys/system", tags=["System Monitoring"])
app.include_router(admin_devices.router, prefix="/api/sys/devices", tags=["Device Management"])
app.include_router(admin_users.router, prefix="/api/sys/users", tags=["User Management"])

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
app.include_router(vitals_websocket.router, tags=["Real-Time Vitals"])


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
