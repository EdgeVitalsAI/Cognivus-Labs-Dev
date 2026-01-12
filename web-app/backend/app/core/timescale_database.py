"""
TimescaleDB Database Configuration
Separate connection for time-series vital signs data
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# TimescaleDB connection settings
TIMESCALE_USER = os.getenv("TIMESCALE_USER", "timescale_user")
TIMESCALE_PASSWORD = os.getenv("TIMESCALE_PASSWORD", "timescale_secure_password_123")
TIMESCALE_HOST = os.getenv("TIMESCALE_HOST", "timescaledb")
TIMESCALE_PORT = os.getenv("TIMESCALE_PORT", "5432")
TIMESCALE_DB = os.getenv("TIMESCALE_DB", "cognivus_vitals_timeseries")

TIMESCALE_DATABASE_URL = f"postgresql://{TIMESCALE_USER}:{TIMESCALE_PASSWORD}@{TIMESCALE_HOST}:{TIMESCALE_PORT}/{TIMESCALE_DB}"

# Create engine for TimescaleDB
timescale_engine = create_engine(
    TIMESCALE_DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    echo=False  # Set to True for SQL debugging
)

# Create session factory
TimescaleSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=timescale_engine)

# Base class for TimescaleDB models
TimescaleBase = declarative_base()

# Dependency for FastAPI routes
def get_timescale_db():
    """Get TimescaleDB session for FastAPI dependency injection"""
    db = TimescaleSessionLocal()
    try:
        yield db
    finally:
        db.close()

print(f"✓ TimescaleDB connection configured: {TIMESCALE_HOST}:{TIMESCALE_PORT}/{TIMESCALE_DB}")
