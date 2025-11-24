#!/usr/bin/env python3
"""
ESP32 Medical Sensor - WebSocket Client
Real-time data streaming and command testing

This client connects to the ESP32 WebSocket server to:
- Receive real-time ECG and SpO2 sensor data
- Send JSON commands for troubleshooting
- Display live sensor readings

Requirements:
    pip install websocket-client

Usage:
    python websocket_client.py <ESP32_IP>
    Example: python websocket_client.py 192.168.1.100
"""

import websocket
import json
import sys
import time
import threading
from datetime import datetime

class ESP32WebSocketClient:
    def __init__(self, esp32_ip, port=81):
        self.esp32_ip = esp32_ip
        self.port = port
        self.ws_url = f"ws://{esp32_ip}:{port}"
        self.ws = None
        self.connected = False
        self.ecg_count = 0
        self.spo2_count = 0

    def on_message(self, ws, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get("type", "unknown")

            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]

            if msg_type == "ecg":
                self.ecg_count += 1
                if self.ecg_count % 25 == 0:  # Display every 25 samples (1 second at 25Hz)
                    print(f"[{timestamp}] ECG: Value={data.get('val'):4d}, "
                          f"Leads={data.get('leads')}, Samples={self.ecg_count}")

            elif msg_type == "spo2":
                self.spo2_count += 1
                finger = data.get('finger', False)
                if finger:
                    print(f"[{timestamp}] SpO2: {data.get('spo2')}%, "
                          f"Valid={data.get('valid')}, IR={data.get('ir')}, "
                          f"Red={data.get('red')}, Updates={self.spo2_count}")
                else:
                    print(f"[{timestamp}] SpO2: No finger detected")

            elif msg_type == "heart_rate":
                print(f"[{timestamp}] Heart Rate: {data.get('hr')} BPM, "
                      f"Valid={data.get('valid')}")

            elif msg_type == "ping":
                pass

            elif msg_type == "system":
                print(f"[{timestamp}] SYSTEM: {data.get('message')}")

            elif msg_type == "system_event":
                print(f"[{timestamp}] EVENT: {data.get('event')} - {data.get('message')}")

            elif msg_type == "command_response":
                print(f"\n{'='*60}")
                print(f"Command Response: {data.get('command')}")
                print(f"Success: {data.get('success')}")
                print(f"Data: {json.dumps(data.get('data'), indent=2)}")
                print(f"{'='*60}\n")

            elif msg_type == "error":
                print(f"[{timestamp}] ERROR: {data.get('error')}")

            else:
                pass

        except json.JSONDecodeError:
            print(f"Failed to parse JSON: {message}")
        except Exception as e:
            print(f"Error processing message: {e}")

    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"WebSocket Error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket connection close"""
        self.connected = False
        print("\n=== WebSocket Connection Closed ===")
        print(f"Status Code: {close_status_code}")
        print(f"Message: {close_msg}")

    def on_open(self, ws):
        """Handle WebSocket connection open"""
        self.connected = True
        print("\n╔════════════════════════════════════════════╗")
        print("║   Connected to ESP32 Medical Sensor       ║")
        print("╚════════════════════════════════════════════╝")
        print(f"WebSocket URL: {self.ws_url}")
        print("\nReceiving real-time data stream...")
        print("Commands available: Type them in the terminal")
        print("- status, health, sensors, memory, network")
        print("- check_sensor, ecg_raw, spo2_raw, ping")
        print("- Type 'quit' to exit\n")

    def send_command(self, command_name, params=None):
        """Send JSON command to ESP32"""
        if not self.connected:
            print("Not connected to ESP32")
            return

        cmd = {"command": command_name}
        if params:
            cmd.update(params)

        try:
            self.ws.send(json.dumps(cmd))
            print(f"Sent command: {command_name}")
        except Exception as e:
            print(f"Error sending command: {e}")

    def connect(self):
        """Connect to ESP32 WebSocket server"""
        print(f"Connecting to {self.ws_url}...")

        try:
            self.ws = websocket.WebSocketApp(
                self.ws_url,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close,
                on_open=self.on_open
            )

            # Run WebSocket in separate thread
            ws_thread = threading.Thread(target=self.ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()

            # Wait for connection
            timeout = 5
            start = time.time()
            while not self.connected and (time.time() - start) < timeout:
                time.sleep(0.1)

            if not self.connected:
                print("Connection timeout")
                return False

            return True

        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def interactive_mode(self):
        """Interactive command mode"""
        print("\nEntering interactive mode...")
        print("Available commands:")
        print("  status      - Get system status")
        print("  health      - Get health metrics")
        print("  sensors     - Get all sensor states")
        print("  memory      - Get memory info")
        print("  network     - Get network info")
        print("  ping        - Test connection")
        print("  ecg_raw     - Get current ECG reading")
        print("  spo2_raw    - Get current SpO2 reading")
        print("  help        - List all commands")
        print("  quit        - Exit\n")

        while self.connected:
            try:
                user_input = input("Command> ").strip().lower()

                if user_input == "quit":
                    print("Closing connection...")
                    self.ws.close()
                    break
                elif user_input == "":
                    continue
                elif user_input.startswith("check_sensor"):
                    parts = user_input.split()
                    if len(parts) > 1:
                        self.send_command("check_sensor", {"sensor": parts[1]})
                    else:
                        print("Usage: check_sensor <ecg|spo2>")
                else:
                    self.send_command(user_input)

            except KeyboardInterrupt:
                print("\nInterrupted. Closing connection...")
                self.ws.close()
                break
            except Exception as e:
                print(f"Error: {e}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python websocket_client.py <ESP32_IP>")
        print("Example: python websocket_client.py 192.168.1.100")
        sys.exit(1)

    esp32_ip = sys.argv[1]

    print("╔════════════════════════════════════════════╗")
    print("║  ESP32 Medical Sensor - WebSocket Client   ║")
    print("╚════════════════════════════════════════════╝\n")

    client = ESP32WebSocketClient(esp32_ip)

    if client.connect():
        try:
            client.interactive_mode()
        except KeyboardInterrupt:
            print("\nExiting...")
    else:
        print("Failed to connect to ESP32")
        sys.exit(1)


if __name__ == "__main__":
    main()
