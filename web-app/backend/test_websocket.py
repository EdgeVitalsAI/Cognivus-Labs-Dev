#!/usr/bin/env python3
"""
Quick Test Script for Phase 3 Live Monitoring System
Tests WebSocket connection to backend without ESP32 hardware
"""
import asyncio
import websockets
import json
import random
import time

async def simulate_esp32_vitals(websocket_url, patient_id):
    """
    Simulates ESP32 vital signs data streaming
    Use this to test frontend without actual hardware
    """
    uri = websocket_url.replace("http://", "ws://").replace("https://", "wss://")
    if not uri.endswith(f"/{patient_id}"):
        uri = f"{uri}/ws/vitals/{patient_id}"
    
    print(f"🔌 Connecting to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ Connected to backend WebSocket!")
            
            # Send test messages
            sample_count = 0
            
            while sample_count < 1000:  # Send 1000 samples
                # Simulate ECG data (25 Hz)
                ecg_value = 512 + int(100 * random.random() * (1 if sample_count % 50 < 25 else -1))
                ecg_message = {
                    "type": "ecg",
                    "ts": int(time.time() * 1000),
                    "val": ecg_value,
                    "leads": "connected"
                }
                await websocket.send(json.dumps(ecg_message))
                
                # Every 25 samples (~1 second), send heart rate and SpO2
                if sample_count % 25 == 0:
                    hr_message = {
                        "type": "heart_rate",
                        "hr": random.randint(60, 100),
                        "valid": 1
                    }
                    await websocket.send(json.dumps(hr_message))
                    
                    spo2_message = {
                        "type": "spo2",
                        "spo2": random.randint(95, 100),
                        "valid": 1,
                        "ir": random.randint(40000, 60000),
                        "red": random.randint(35000, 55000),
                        "finger": True
                    }
                    await websocket.send(json.dumps(spo2_message))
                    
                    print(f"📊 Sent sample {sample_count}: ECG={ecg_value}, HR={hr_message['hr']}, SpO2={spo2_message['spo2']}%")
                
                sample_count += 1
                await asyncio.sleep(0.04)  # 25 Hz = 40ms delay
            
            print("✓ Test complete! Sent 1000 samples.")
    
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    # Configuration
    BACKEND_URL = "ws://localhost:8000"
    PATIENT_ID = "PAT001"  # Change this to your test patient ID
    
    print("=" * 60)
    print("Phase 3 Live Monitoring - WebSocket Test")
    print("=" * 60)
    print(f"Backend: {BACKEND_URL}")
    print(f"Patient: {PATIENT_ID}")
    print()
    print("This script simulates ESP32 vital signs streaming.")
    print("Open patient profile in browser to see live updates!")
    print()
    
    asyncio.run(simulate_esp32_vitals(BACKEND_URL, PATIENT_ID))
