"""
ESP32 Continuous Data Stream Simulator
Tests the continuous HTTP POST endpoint that saves data 24/7
This simulates what the ESP32 does - continuously POST data every second
"""
import requests
import time
import json
import random
from datetime import datetime

# Backend configuration
BACKEND_URL = "http://localhost:8000"
STREAM_ENDPOINT = f"{BACKEND_URL}/api/vitals/stream"

# Device configuration
DEVICE_ID = "ESP32-TESTDEVICE001"
PATIENT_ID = 1  # Change this to match your test patient

def generate_ecg_data():
    """Generate realistic ECG data"""
    return {
        "device_id": DEVICE_ID,
        "patient_id": PATIENT_ID,
        "type": "ecg",
        "val": random.randint(400, 600),
        "leadsOff": random.random() > 0.95,  # 5% chance leads off
        "timestamp": datetime.now().isoformat()
    }

def generate_spo2_data():
    """Generate realistic SpO2 data"""
    return {
        "device_id": DEVICE_ID,
        "patient_id": PATIENT_ID,
        "type": "spo2",
        "spo2": random.randint(95, 99),
        "valid": 1,
        "finger": True,
        "ir": random.randint(45000, 55000),
        "red": random.randint(40000, 50000),
        "active": True,
        "timestamp": datetime.now().isoformat()
    }

def generate_heart_rate_data():
    """Generate realistic heart rate data"""
    return {
        "device_id": DEVICE_ID,
        "patient_id": PATIENT_ID,
        "type": "heart_rate",
        "hr": random.randint(65, 85),
        "valid": 1,
        "timestamp": datetime.now().isoformat()
    }

def send_data(data):
    """Send data to backend"""
    try:
        response = requests.post(STREAM_ENDPOINT, json=data, timeout=2)
        if response.status_code == 200:
            print(f"✓ Sent {data['type']}: {response.json()['message']}")
            return True
        else:
            print(f"✗ Failed {data['type']}: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Connection error: {e}")
        return False

def main():
    """Main continuous streaming loop"""
    print(f"🚀 Starting continuous data stream to {BACKEND_URL}")
    print(f"📡 Device: {DEVICE_ID}, Patient: {PATIENT_ID}")
    print(f"⏱️  Sending data every second (ECG, SpO2, HR)")
    print("Press Ctrl+C to stop\n")
    
    counter = 0
    
    try:
        while True:
            counter += 1
            print(f"\n--- Cycle {counter} ---")
            
            # Send ECG data
            ecg_data = generate_ecg_data()
            send_data(ecg_data)
            time.sleep(0.2)  # Small delay between requests
            
            # Send SpO2 data
            spo2_data = generate_spo2_data()
            send_data(spo2_data)
            time.sleep(0.2)
            
            # Send heart rate data
            hr_data = generate_heart_rate_data()
            send_data(hr_data)
            
            # Wait before next cycle (approximately 1 second total)
            time.sleep(0.6)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped continuous streaming")
        print(f"📊 Total cycles completed: {counter}")

if __name__ == "__main__":
    main()
