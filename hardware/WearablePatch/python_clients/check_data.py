"""
Quick diagnostic tool to check if vitals data is being saved to TimescaleDB
"""
import requests

BACKEND_URL = "http://localhost:8000"
PATIENT_ID = 1  # Change this to your test patient ID

def check_vitals_data():
    """Check if any vitals data exists for the patient"""
    print(f"\n🔍 Checking vitals data for Patient {PATIENT_ID}...")
    print("=" * 60)
    
    try:
        # Call diagnostic endpoint
        response = requests.get(f"{BACKEND_URL}/api/patients/{PATIENT_ID}/vitals/diagnostic")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print(f"\n✅ Data Found!")
                print(f"   Total Records: {data['total_records']}")
                print(f"\n📊 Records by Type:")
                for dtype, count in data['records_by_type'].items():
                    print(f"   - {dtype}: {count} records")
                
                time_range = data.get('time_range', {})
                if time_range.get('oldest'):
                    print(f"\n📅 Time Range:")
                    print(f"   Oldest: {time_range['oldest']}")
                    print(f"   Newest: {time_range['newest']}")
                
                recent = data.get('recent_samples', [])
                if recent:
                    print(f"\n🔬 Recent Samples ({len(recent)} shown):")
                    for sample in recent:
                        print(f"   [{sample['time']}] {sample['type']}: ", end="")
                        if sample['type'] == 'ecg':
                            print(f"ECG={sample['ecg']}")
                        elif sample['type'] == 'spo2':
                            print(f"SpO2={sample['spo2']}%, Finger={sample['finger']}, Valid={sample['valid']}")
                        elif sample['type'] == 'heart_rate':
                            print(f"HR={sample['hr']} BPM")
                
                if data['total_records'] == 0:
                    print("\n⚠️  No data found!")
                    print("   - Make sure ESP32 is sending data to /api/vitals/stream")
                    print("   - Or run: python continuous_stream_test.py")
                else:
                    print(f"\n✨ Everything looks good! {data['total_records']} records stored.")
            else:
                print(f"\n❌ Error: {data.get('message', 'Unknown error')}")
                print(f"   Details: {data.get('error', 'N/A')}")
        else:
            print(f"\n❌ HTTP Error: {response.status_code}")
            print(f"   Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Cannot connect to backend at {BACKEND_URL}")
        print("   Make sure Docker containers are running:")
        print("   sudo docker-compose up")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    check_vitals_data()
    
    print("\n" + "=" * 60)
    print("💡 Tips:")
    print("   - Test data streaming: python continuous_stream_test.py")
    print("   - View in browser: http://localhost:5173")
    print("   - Check backend logs: sudo docker logs cognivus_backend")
    print("=" * 60 + "\n")
