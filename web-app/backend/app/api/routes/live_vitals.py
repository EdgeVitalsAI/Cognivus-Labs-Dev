from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import aiohttp
import asyncio
from typing import Optional

from ...core.database import get_db
from ...models.patient import Patient
from ...models.device import Device, DeviceStatus

router = APIRouter()


@router.get("/patients/{patient_id}/live-vitals")
async def get_patient_live_vitals(patient_id: int, db: Session = Depends(get_db)):
    """
    Fetch live vitals directly from ESP32 device endpoints
    GET requests to device_ip/ecg-raw and device_ip/spo2-raw
    """
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get assigned device
    device = db.query(Device).filter(
        Device.patient_id == patient.patient_id,
        Device.status == DeviceStatus.ONLINE
    ).first()
    
    if not device or not device.ip_address:
        return {
            "success": False,
            "message": "No online device assigned to this patient",
            "heart_rate": 0,
            "spo2": 0
        }
    
    device_ip = device.ip_address
    
    # Fetch data from ESP32 endpoints
    async with aiohttp.ClientSession() as session:
        heart_rate = 0
        spo2 = 0
        
        try:
            # Fetch ECG data for heart rate
            async with session.get(f"http://{device_ip}/ecg-raw", timeout=aiohttp.ClientTimeout(total=3)) as response:
                if response.status == 200:
                    ecg_data = await response.json()
                    heart_rate = ecg_data.get("heart_rate", 0) or ecg_data.get("hr", 0)
        except Exception as e:
            print(f"⚠️ Failed to fetch ECG data from {device_ip}: {e}")
        
        try:
            # Fetch SpO2 data
            async with session.get(f"http://{device_ip}/spo2-raw", timeout=aiohttp.ClientTimeout(total=3)) as response:
                if response.status == 200:
                    spo2_data = await response.json()
                    spo2 = spo2_data.get("spo2", 0)
        except Exception as e:
            print(f"⚠️ Failed to fetch SpO2 data from {device_ip}: {e}")
    
    return {
        "success": True,
        "patient_id": patient_id,
        "device_ip": device_ip,
        "heart_rate": heart_rate,
        "spo2": spo2
    }


@router.get("/patients/live-vitals/bulk")
async def get_all_patients_live_vitals(db: Session = Depends(get_db)):
    """
    Fetch live vitals for all patients with assigned devices
    Used for periodic refresh of patient list cards
    """
    
    # Get all patients with assigned online devices
    patients = db.query(Patient).join(
        Device, Device.patient_id == Patient.patient_id
    ).filter(
        Device.status == DeviceStatus.ONLINE,
        Device.ip_address.isnot(None)
    ).all()
    
    vitals_data = []
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        
        for patient in patients:
            device = db.query(Device).filter(
                Device.patient_id == patient.patient_id,
                Device.status == DeviceStatus.ONLINE
            ).first()
            
            if device and device.ip_address:
                tasks.append(fetch_patient_vitals(session, patient.id, device.ip_address))
        
        if tasks:
            vitals_data = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter out exceptions
    valid_vitals = [v for v in vitals_data if isinstance(v, dict)]
    
    return {
        "success": True,
        "count": len(valid_vitals),
        "vitals": valid_vitals
    }


async def fetch_patient_vitals(session: aiohttp.ClientSession, patient_id: int, device_ip: str):
    """
    Helper function to fetch vitals for a single patient
    """
    heart_rate = 0
    spo2 = 0
    
    try:
        # Fetch ECG data
        async with session.get(f"http://{device_ip}/ecg-raw", timeout=aiohttp.ClientTimeout(total=2)) as response:
            if response.status == 200:
                ecg_data = await response.json()
                heart_rate = ecg_data.get("heart_rate", 0) or ecg_data.get("hr", 0)
    except Exception as e:
        print(f"⚠️ ECG fetch failed for patient {patient_id}: {e}")
    
    try:
        # Fetch SpO2 data
        async with session.get(f"http://{device_ip}/spo2-raw", timeout=aiohttp.ClientTimeout(total=2)) as response:
            if response.status == 200:
                spo2_data = await response.json()
                spo2 = spo2_data.get("spo2", 0)
    except Exception as e:
        print(f"⚠️ SpO2 fetch failed for patient {patient_id}: {e}")
    
    return {
        "patient_id": patient_id,
        "heart_rate": heart_rate,
        "spo2": spo2,
        "device_ip": device_ip
    }
