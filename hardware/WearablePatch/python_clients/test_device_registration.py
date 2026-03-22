"""
Device Registration Test Script
Tests multiple device registrations to verify unique device handling

Usage:
    python test_device_registration.py
"""
import requests
import random


def generate_mac_address():
    """Generate a random MAC address"""
    mac = [
        0xA4,  # Common ESP32 OUI prefix
        random.randint(0x00, 0xff),
        random.randint(0x00, 0xff),
        random.randint(0x00, 0xff),
        random.randint(0x00, 0xff),
        random.randint(0x00, 0xff)
    ]
    return ':'.join(f'{b:02X}' for b in mac)


def generate_device_id(mac_address):
    """Generate device ID from MAC address (same as ESP32)"""
    mac_clean = mac_address.replace(':', '').upper()
    return f"ESP32-{mac_clean}"


def generate_device_name(mac_address):
    """Generate device name from last 4 chars of MAC"""
    mac_clean = mac_address.replace(':', '').upper()
    last_four = mac_clean[-4:]
    return f"Medical-Patch-{last_four}"


def register_device(backend_url, mac_address, ip_address):
    """Register a device with the backend"""
    device_id = generate_device_id(mac_address)
    device_name = generate_device_name(mac_address)
    
    payload = {
        "device_id": device_id,
        "device_name": device_name,
        "mac_address": mac_address,
        "ip_address": ip_address,
        "firmware_version": "3.0.0",
        "device_type": "ESP32_MEDICAL_PATCH"
    }
    
    print(f"\n{'='*70}")
    print(f"🔄 Registering Device")
    print(f"{'='*70}")
    print(f"Device ID:   {device_id}")
    print(f"Device Name: {device_name}")
    print(f"MAC Address: {mac_address}")
    print(f"IP Address:  {ip_address}")
    
    try:
        response = requests.post(
            f"{backend_url}/api/devices/register",
            json=payload,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ Status: {result.get('status', 'unknown')}")
            print(f"📝 Message: {result.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def get_all_devices(backend_url):
    """Get all registered devices"""
    try:
        # Using admin endpoint
        response = requests.get(
            f"{backend_url}/api/sys/devices/devices",
            timeout=10
        )
        
        if response.status_code == 200:
            devices = response.json()
            print(f"\n{'='*70}")
            print(f"📋 Registered Devices ({len(devices)} total)")
            print(f"{'='*70}")
            
            for device in devices:
                print(f"\n  Device ID:   {device['device_id']}")
                print(f"  Name:        {device['device_name']}")
                print(f"  MAC:         {device.get('mac_address', 'N/A')}")
                print(f"  Status:      {device['status']}")
                print(f"  Assignment:  {device.get('assignment_status', 'N/A')}")
            
            return devices
        else:
            print(f"❌ Failed to get devices: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return []


def main():
    """Main test function"""
    # Backend configuration
    BACKEND_URL = "http://localhost:8001"
    
    print("\n" + "="*70)
    print("ESP32 Multi-Device Registration Test")
    print("="*70)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing device registration with unique MAC addresses")
    
    # Test data - simulating 3 different ESP32 devices
    test_devices = [
        {
            "mac": "A4:CF:12:E4:F8:C0",
            "ip": "192.168.1.100"
        },
        {
            "mac": "B8:D6:1A:7B:3C:4D", 
            "ip": "192.168.1.101"
        },
        {
            "mac": "24:D7:EB:0A:5F:2C",
            "ip": "192.168.1.102"
        }
    ]
    
    # Register each device
    success_count = 0
    for device in test_devices:
        if register_device(BACKEND_URL, device["mac"], device["ip"]):
            success_count += 1
    
    print(f"\n{'='*70}")
    print(f"Registration Summary: {success_count}/{len(test_devices)} successful")
    print(f"{'='*70}")
    
    # Fetch and display all devices
    get_all_devices(BACKEND_URL)
    
    print("\n" + "="*70)
    print("Test Complete!")
    print("="*70)
    print("\n💡 Next Steps:")
    print("   1. Check admin panel at http://localhost:5174")
    print("   2. Navigate to Devices tab")
    print("   3. Verify all devices are listed")
    print("\n")


if __name__ == "__main__":
    main()
