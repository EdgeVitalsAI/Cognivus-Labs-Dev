from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from datetime import datetime
from ..core.database import Base


class SystemLog(Base):
    """System-wide logs for monitoring"""
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, index=True, nullable=False)  # backend, database, redis, etc.
    level = Column(String, nullable=False)  # info, warning, error, critical
    message = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class SystemHealth(Base):
    """System health metrics snapshots"""
    __tablename__ = "system_health"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # healthy, degraded, down
    response_time = Column(Integer, nullable=True)  # ms
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
