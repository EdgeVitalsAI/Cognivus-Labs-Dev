#!/usr/bin/env python3
"""
ESP32 Medical Sensor - REST API Client
Lightweight API testing and debugging tool

This client tests all REST API endpoints on the ESP32:
- /status - System status
- /health - Health metrics
- /ecg-raw - ECG sensor data
- /spo2-raw - SpO2 sensor data
- /sensors - All sensor states
- /memory - Memory information
- /network - Network information
- /system-info - Hardware information
- /uptime - System uptime

Requirements:
    pip install requests

Usage:
    python api_client.py <ESP32_IP>
    Example: python api_client.py 192.168.1.100
"""

import requests
import json
import sys
import time
from datetime import datetime

class ESP32APIClient:
    def __init__(self, esp32_ip, port=80):
        self.base_url = f"http://{esp32_ip}:{port}"
        self.esp32_ip = esp32_ip
        self.port = port

    def _request(self, endpoint):
        """Make GET request to API endpoint"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed to {url}")
            return None
        except requests.exceptions.Timeout:
            print(f"❌ Request timeout for {endpoint}")
            return None
        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP Error: {e}")
            return None
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response from {endpoint}")
            return None

    def get_status(self):
        """Get system status"""
        return self._request("/status")

    def get_health(self):
        """Get health metrics"""
        return self._request("/health")

    def get_ecg_raw(self):
        """Get ECG raw data"""
        return self._request("/ecg-raw")

    def get_spo2_raw(self):
        """Get SpO2 raw data"""
        return self._request("/spo2-raw")

    def get_sensors(self):
        """Get all sensor states"""
        return self._request("/sensors")

    def get_memory(self):
        """Get memory information"""
        return self._request("/memory")

    def get_network(self):
        """Get network information"""
        return self._request("/network")

    def get_system_info(self):
        """Get system information"""
        return self._request("/system-info")

    def get_uptime(self):
        """Get system uptime"""
        return self._request("/uptime")

    def print_json(self, data, title=""):
        """Pretty print JSON data"""
        if data is None:
            return

        print(f"\n{'='*60}")
        if title:
            print(f"  {title}")
            print('='*60)
        print(json.dumps(data, indent=2))
        print('='*60)

    def test_all_endpoints(self):
        """Test all API endpoints"""
        print("\n╔════════════════════════════════════════════╗")
        print("║    Testing All API Endpoints              ║")
        print("╚════════════════════════════════════════════╝\n")

        endpoints = [
            ("System Status", "/status", self.get_status),
            ("Health Metrics", "/health", self.get_health),
            ("ECG Raw Data", "/ecg-raw", self.get_ecg_raw),
            ("SpO2 Raw Data", "/spo2-raw", self.get_spo2_raw),
            ("All Sensors", "/sensors", self.get_sensors),
            ("Memory Info", "/memory", self.get_memory),
            ("Network Info", "/network", self.get_network),
            ("System Info", "/system-info", self.get_system_info),
            ("Uptime", "/uptime", self.get_uptime),
        ]

        results = {}

        for name, endpoint, func in endpoints:
            print(f"Testing {endpoint}...", end=" ")
            data = func()

            if data:
                print("✅")
                results[endpoint] = {"status": "success", "data": data}
                self.print_json(data, f"{name} ({endpoint})")
            else:
                print("❌")
                results[endpoint] = {"status": "failed"}

            time.sleep(0.5)  # Small delay between requests

        # Summary
        print("\n╔════════════════════════════════════════════╗")
        print("║           Test Summary                     ║")
        print("╚════════════════════════════════════════════╝")

        success_count = sum(1 for r in results.values() if r["status"] == "success")
        total_count = len(results)

        print(f"\nTotal Endpoints: {total_count}")
        print(f"Successful: {success_count}")
        print(f"Failed: {total_count - success_count}")

        for endpoint, result in results.items():
            status_icon = "✅" if result["status"] == "success" else "❌"
            print(f"  {status_icon} {endpoint}")

    def monitor_sensors(self, interval=2):
        """Continuously monitor sensor data"""
        print("\n╔════════════════════════════════════════════╗")
        print("║      Real-time Sensor Monitoring          ║")
        print("╚════════════════════════════════════════════╝")
        print("\nPress Ctrl+C to stop...\n")

        try:
            while True:
                timestamp = datetime.now().strftime("%H:%M:%S")

                # Get sensor data
                sensors = self.get_sensors()

                if sensors:
                    print(f"\n[{timestamp}] Sensor Status:")

                    # ECG
                    ecg = sensors.get("ecg", {})
                    if ecg.get("active"):
                        leads = "ON" if not ecg.get("leadsOff") else "OFF"
                        value = ecg.get("lastValue", 0)
                        print(f"  ECG:  Active=Yes, Leads={leads}, Value={value}")
                    else:
                        print(f"  ECG:  Active=No")

                    # SpO2
                    spo2 = sensors.get("spo2", {})
                    if spo2.get("active"):
                        finger = "Yes" if spo2.get("fingerDetected") else "No"
                        spo2_val = spo2.get("spo2", 0)
                        valid = spo2.get("valid", 0)
                        ir = spo2.get("ir", 0)
                        print(f"  SpO2: Active=Yes, Finger={finger}, SpO2={spo2_val}%, Valid={valid}, IR={ir}")
                    else:
                        print(f"  SpO2: Active=No")

                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")

    def interactive_mode(self):
        """Interactive API testing mode"""
        print("\n╔════════════════════════════════════════════╗")
        print("║       Interactive API Testing              ║")
        print("╚════════════════════════════════════════════╝\n")

        commands = {
            "1": ("System Status", self.get_status),
            "2": ("Health Metrics", self.get_health),
            "3": ("ECG Raw Data", self.get_ecg_raw),
            "4": ("SpO2 Raw Data", self.get_spo2_raw),
            "5": ("All Sensors", self.get_sensors),
            "6": ("Memory Info", self.get_memory),
            "7": ("Network Info", self.get_network),
            "8": ("System Info", self.get_system_info),
            "9": ("Uptime", self.get_uptime),
            "a": ("Test All Endpoints", self.test_all_endpoints),
            "m": ("Monitor Sensors", lambda: self.monitor_sensors(2)),
        }

        while True:
            print("\nAvailable commands:")
            for key, (name, _) in commands.items():
                print(f"  {key}. {name}")
            print("  q. Quit")

            choice = input("\nSelect command> ").strip().lower()

            if choice == "q":
                print("Exiting...")
                break
            elif choice in commands:
                name, func = commands[choice]
                print(f"\nExecuting: {name}...")

                if choice == "a":
                    func()
                elif choice == "m":
                    func()
                else:
                    data = func()
                    self.print_json(data, name)
            else:
                print("Invalid choice. Try again.")


def main():
    if len(sys.argv) < 2:
        print("Usage: python api_client.py <ESP32_IP> [command]")
        print("\nCommands:")
        print("  test    - Test all endpoints")
        print("  monitor - Monitor sensors continuously")
        print("  (none)  - Interactive mode")
        print("\nExample:")
        print("  python api_client.py 192.168.1.100")
        print("  python api_client.py 192.168.1.100 test")
        sys.exit(1)

    esp32_ip = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else None

    print("╔════════════════════════════════════════════╗")
    print("║   ESP32 Medical Sensor - API Client       ║")
    print("╚════════════════════════════════════════════╝")
    print(f"\nTarget: http://{esp32_ip}\n")

    client = ESP32APIClient(esp32_ip)

    # Test connection
    print("Testing connection...", end=" ")
    status = client.get_status()
    if status:
        print("✅ Connected")
    else:
        print("❌ Connection failed")
        sys.exit(1)

    # Execute command
    if command == "test":
        client.test_all_endpoints()
    elif command == "monitor":
        client.monitor_sensors()
    else:
        client.interactive_mode()


if __name__ == "__main__":
    main()
