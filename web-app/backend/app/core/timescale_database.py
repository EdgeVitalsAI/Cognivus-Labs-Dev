"""
TimescaleDB Database Configuration
Separate connection for time-series vital signs data
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# TimescaleDB connection URL from settings
TIMESCALE_DATABASE_URL = settings.timescale_database_url

# Create engine for TimescaleDB with error handling
try:
    timescale_engine = create_engine(
        TIMESCALE_DATABASE_URL,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,
        echo=False,  # Set to True for SQL debugging
        connect_args={"connect_timeout": 10}
    )
    
    # Test connection
    with timescale_engine.connect() as conn:
        conn.execute("SELECT 1")
    
    print(f"✓ TimescaleDB connection successful: {settings.TIMESCALE_HOST}:{settings.TIMESCALE_PORT}/{settings.TIMESCALE_DB}")
except Exception as e:
    print(f"⚠️ Warning: Could not connect to TimescaleDB: {e}")
    print(f"   TimescaleDB features will be unavailable until connection is established")
    # Create engine anyway for lazy connection
    timescale_engine = create_engine(
        TIMESCALE_DATABASE_URL,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,
        echo=False,
        connect_args={"connect_timeout": 10}
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
    except Exception as e:
        print(f"⚠️ TimescaleDB session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

print(f"✓ TimescaleDB connection configured: {TIMESCALE_HOST}:{TIMESCALE_PORT}/{TIMESCALE_DB}")
