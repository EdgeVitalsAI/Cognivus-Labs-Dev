from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .api.routes import auth, admin_auth, admin_system, admin_devices, admin_users

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS - Explicit origins (can't use * with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Public authentication routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Admin routes (hidden under /sys prefix)
app.include_router(admin_auth.router, prefix="/api/sys/auth", tags=["Admin Auth"])
app.include_router(admin_system.router, prefix="/api/sys/system", tags=["System Monitoring"])
app.include_router(admin_devices.router, prefix="/api/sys/devices", tags=["Device Management"])
app.include_router(admin_users.router, prefix="/api/sys/users", tags=["User Management"])


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
