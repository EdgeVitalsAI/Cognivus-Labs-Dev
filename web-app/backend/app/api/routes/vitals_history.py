"""
Historical Vitals API - Query time-series data from TimescaleDB
Provides endpoints for charts, trends, and abnormality detection
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from ...core.timescale_database import get_timescale_db
from ...models.vital_timeseries import VitalTimeseries
from ...models.patient import Patient
from ...core.database import get_db

router = APIRouter()


class TimeRange(str):
    """Predefined time ranges"""
    HOUR_1 = "1h"
    HOURS_6 = "6h"
    HOURS_12 = "12h"
    HOURS_24 = "24h"
    DAYS_3 = "3d"
    DAYS_7 = "7d"
    DAYS_30 = "30d"


def get_time_delta(time_range: str) -> timedelta:
    """Convert time range string to timedelta"""
    mapping = {
        "15m": timedelta(minutes=15),
        "30m": timedelta(minutes=30),
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "12h": timedelta(hours=12),
        "24h": timedelta(hours=24),
        "3d": timedelta(days=3),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    return mapping.get(time_range, timedelta(hours=24))


@router.get("/patients/{patient_id}/vitals/history")
async def get_vitals_history(
    patient_id: int,
    time_range: str = Query(default="24h", description="Time range: 15m, 30m, 1h, 6h, 12h, 24h, 3d, 7d, 30d"),
    data_type: Optional[str] = Query(default=None, description="Filter by type: ecg, spo2, heart_rate"),
    limit: int = Query(default=1000, le=10000, description="Maximum number of records"),
    db: Session = Depends(get_db),
    ts_db: Session = Depends(get_timescale_db)
):
    """
    Get historical vitals data for a patient
    Returns time-series data for charts and analysis
    """
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - get_time_delta(time_range)
    
    # Build query
    query = ts_db.query(VitalTimeseries).filter(
        and_(
            VitalTimeseries.patient_id == patient_id,
            VitalTimeseries.time >= start_time,
            VitalTimeseries.time <= end_time
        )
    )
    
    # Apply data type filter
    if data_type:
        query = query.filter(VitalTimeseries.data_type == data_type)
    
    # Order by time and limit
    vitals = query.order_by(VitalTimeseries.time.desc()).limit(limit).all()
    
    # Convert to dict and reverse (oldest first for charts)
    vitals_data = [v.to_dict() for v in reversed(vitals)]
    
    return {
        "success": True,
        "patient_id": patient_id,
        "time_range": time_range,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "count": len(vitals_data),
        "data": vitals_data
    }


@router.get("/patients/{patient_id}/vitals/summary")
async def get_vitals_summary(
    patient_id: int,
    time_range: str = Query(default="24h"),
    db: Session = Depends(get_db),
    ts_db: Session = Depends(get_timescale_db)
):
    """
    Get summary statistics for patient vitals
    Includes averages, min/max, and abnormality counts
    """
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - get_time_delta(time_range)
    
    # Query for statistics
    stats = ts_db.query(
        func.count(VitalTimeseries.time).label('total_readings'),
        func.avg(VitalTimeseries.heart_rate).label('avg_heart_rate'),
        func.min(VitalTimeseries.heart_rate).label('min_heart_rate'),
        func.max(VitalTimeseries.heart_rate).label('max_heart_rate'),
        func.avg(VitalTimeseries.spo2_value).label('avg_spo2'),
        func.min(VitalTimeseries.spo2_value).label('min_spo2'),
        func.max(VitalTimeseries.spo2_value).label('max_spo2'),
        func.avg(VitalTimeseries.temperature).label('avg_temperature'),
        func.sum(func.cast(VitalTimeseries.ecg_leads_off, func.Integer())).label('leads_off_count'),
        func.sum(func.cast(VitalTimeseries.finger_detected == False, func.Integer())).label('no_finger_count'),
    ).filter(
        and_(
            VitalTimeseries.patient_id == patient_id,
            VitalTimeseries.time >= start_time,
            VitalTimeseries.time <= end_time
        )
    ).first()
    
    # Count abnormalities
    abnormal_hr = ts_db.query(func.count(VitalTimeseries.time)).filter(
        and_(
            VitalTimeseries.patient_id == patient_id,
            VitalTimeseries.time >= start_time,
            VitalTimeseries.heart_rate.isnot(None),
            or_(
                VitalTimeseries.heart_rate < 60,
                VitalTimeseries.heart_rate > 100
            )
        )
    ).scalar()
    
    low_spo2 = ts_db.query(func.count(VitalTimeseries.time)).filter(
        and_(
            VitalTimeseries.patient_id == patient_id,
            VitalTimeseries.time >= start_time,
            VitalTimeseries.spo2_value.isnot(None),
            VitalTimeseries.spo2_value < 95
        )
    ).scalar()
    
    return {
        "success": True,
        "patient_id": patient_id,
        "time_range": time_range,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "statistics": {
            "total_readings": stats.total_readings or 0,
            "heart_rate": {
                "average": round(stats.avg_heart_rate, 1) if stats.avg_heart_rate else None,
                "min": stats.min_heart_rate,
                "max": stats.max_heart_rate,
                "abnormal_count": abnormal_hr or 0
            },
            "spo2": {
                "average": round(stats.avg_spo2, 1) if stats.avg_spo2 else None,
                "min": stats.min_spo2,
                "max": stats.max_spo2,
                "low_count": low_spo2 or 0
            },
            "temperature": {
                "average": round(stats.avg_temperature, 1) if stats.avg_temperature else None
            },
            "sensor_issues": {
                "leads_off_count": stats.leads_off_count or 0,
                "no_finger_count": stats.no_finger_count or 0
            }
        }
    }


@router.get("/patients/{patient_id}/vitals/aggregated")
async def get_aggregated_vitals(
    patient_id: int,
    time_range: str = Query(default="24h"),
    interval: str = Query(default="1min", description="Aggregation interval: 1min, 5min, 15min, 1hour"),
    db: Session = Depends(get_db),
    ts_db: Session = Depends(get_timescale_db)
):
    """
    Get aggregated vitals data (averages over time intervals)
    Perfect for charts with many data points
    """
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - get_time_delta(time_range)
    
    # Map interval to SQL interval
    interval_map = {
        "1min": "1 minute",
        "5min": "5 minutes",
        "15min": "15 minutes",
        "1hour": "1 hour"
    }
    sql_interval = interval_map.get(interval, "1 minute")
    
    # Use TimescaleDB's time_bucket function for efficient aggregation
    query = f"""
        SELECT 
            time_bucket('{sql_interval}', time) AS bucket,
            AVG(heart_rate) AS avg_heart_rate,
            AVG(spo2_value) AS avg_spo2,
            AVG(temperature) AS avg_temperature,
            COUNT(*) AS data_points,
            SUM(CASE WHEN heart_rate < 60 OR heart_rate > 100 THEN 1 ELSE 0 END) AS abnormal_hr,
            SUM(CASE WHEN spo2_value < 95 THEN 1 ELSE 0 END) AS low_spo2
        FROM vitals_timeseries
        WHERE patient_id = :patient_id
            AND time >= :start_time
            AND time <= :end_time
        GROUP BY bucket
        ORDER BY bucket ASC
    """
    
    result = ts_db.execute(
        query,
        {"patient_id": patient_id, "start_time": start_time, "end_time": end_time}
    )
    
    aggregated_data = []
    for row in result:
        aggregated_data.append({
            "time": row[0].isoformat(),
            "avg_heart_rate": round(row[1], 1) if row[1] else None,
            "avg_spo2": round(row[2], 1) if row[2] else None,
            "avg_temperature": round(row[3], 1) if row[3] else None,
            "data_points": row[4],
            "abnormal_hr_count": row[5] or 0,
            "low_spo2_count": row[6] or 0
        })
    
    return {
        "success": True,
        "patient_id": patient_id,
        "time_range": time_range,
        "interval": interval,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "count": len(aggregated_data),
        "data": aggregated_data
    }


@router.get("/patients/{patient_id}/vitals/abnormalities")
async def get_abnormalities(
    patient_id: int,
    time_range: str = Query(default="24h"),
    db: Session = Depends(get_db),
    ts_db: Session = Depends(get_timescale_db)
):
    """
    Get list of abnormal vital readings
    Useful for alerts and health warnings
    """
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - get_time_delta(time_range)
    
    # Find abnormal readings
    abnormalities = []
    
    # Abnormal heart rate (< 60 or > 100)
    abnormal_hr = ts_db.query(VitalTimeseries).filter(
        and_(
            VitalTimeseries.patient_id == patient_id,
            VitalTimeseries.time >= start_time,
            VitalTimeseries.heart_rate.isnot(None),
            or_(
                VitalTimeseries.heart_rate < 60,
                VitalTimeseries.heart_rate > 100
            )
        )
    ).order_by(VitalTimeseries.time.desc()).limit(100).all()
    
    for reading in abnormal_hr:
        abnormalities.append({
            "time": reading.time.isoformat(),
            "type": "heart_rate",
            "value": reading.heart_rate,
            "severity": "high" if reading.heart_rate > 100 else "low",
            "message": f"Heart rate {reading.heart_rate} BPM ({'too high' if reading.heart_rate > 100 else 'too low'})"
        })
    
    # Low SpO2 (< 95%)
    low_spo2 = ts_db.query(VitalTimeseries).filter(
        and_(
            VitalTimeseries.patient_id == patient_id,
            VitalTimeseries.time >= start_time,
            VitalTimeseries.spo2_value.isnot(None),
            VitalTimeseries.spo2_value < 95
        )
    ).order_by(VitalTimeseries.time.desc()).limit(100).all()
    
    for reading in low_spo2:
        severity = "critical" if reading.spo2_value < 90 else "warning"
        abnormalities.append({
            "time": reading.time.isoformat(),
            "type": "spo2",
            "value": reading.spo2_value,
            "severity": severity,
            "message": f"Low oxygen saturation {reading.spo2_value}%"
        })
    
    # Sort by time (most recent first)
    abnormalities.sort(key=lambda x: x["time"], reverse=True)
    
    return {
        "success": True,
        "patient_id": patient_id,
        "time_range": time_range,
        "count": len(abnormalities),
        "abnormalities": abnormalities[:100]  # Limit to 100 most recent
    }
