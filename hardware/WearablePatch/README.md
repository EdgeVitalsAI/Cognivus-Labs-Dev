# ESP32 Medical Sensor System v3.0

**Modular Real-time IoT Streaming Architecture**

A lightweight, production-grade ESP32 medical IoT device for real-time ECG and SpO2 monitoring with WebSocket streaming and REST API.

---

## 🎯 Project Overview

This project implements a **high-performance medical sensor system** on ESP32 that:
- Streams real-time ECG and SpO2 data via WebSocket
- Provides lightweight JSON REST API (no heavy HTML dashboards)
- Supports bidirectional command handling for remote troubleshooting
- Maintains **all original sensor calculations** unchanged
- Designed for stability with multiple active sensors

### Key Improvements Over v2.0
- ✅ **Removed 1400+ lines of HTML** dashboard code (major memory savings)
- ✅ **Separated concerns** into modular components
- ✅ **Added command handling** via WebSocket for remote control
- ✅ **System monitoring** with health metrics
- ✅ **Non-blocking architecture** for better stability
- ✅ **Python test clients** included for development/testing

---

## 📁 Project Structure

```
WearablePatch/
├── WearablePatch.ino          # Main sketch (coordinator)
├── Config.h / Config.cpp       # Configuration parameters
│
├── Sensor Modules:
│   ├── ECGSensor.h/cpp         # ECG sensor (AD8232) - logic preserved
│   ├── SpO2Sensor.h/cpp        # SpO2 sensor (MAX30102) - logic preserved
│
├── Network Services:
│   ├── WiFiManager.h/cpp       # WiFi connection management
│   ├── WebSocketServer.h/cpp   # Real-time streaming + commands
│   ├── APIServer.h/cpp         # Lightweight REST API (JSON only)
│
├── System Components:
│   ├── CommandHandler.h/cpp    # JSON command processor
│   ├── SystemMonitor.h/cpp     # Health & performance tracking
│
└── python_clients/             # Python test clients
    ├── websocket_client.py     # Real-time data streaming client
    ├── api_client.py           # REST API testing tool
    ├── requirements.txt        # Python dependencies
    └── README.md               # Client documentation
```

---

## 🔧 Hardware Requirements

- **ESP32 Development Board** (any variant with WiFi)
- **AD8232 ECG Sensor Module** (connected to GPIO 34, 25, 26)
- **MAX30102 Pulse Oximeter** (I2C: SDA=21, SCL=22)
- **5V Power Supply** (USB or external)

### Pin Configuration

| Component | Pin | Notes |
|-----------|-----|-------|
| ECG Output | GPIO 34 | Analog input (ADC1) |
| ECG LO+ | GPIO 25 | Leads-off detection + |
| ECG LO- | GPIO 26 | Leads-off detection - |
| SpO2 SDA | GPIO 21 | I2C data |
| SpO2 SCL | GPIO 22 | I2C clock |

---

## 📡 Network Services

### WebSocket Server (Port 81)
- **Real-time data streaming** (ECG @ 25Hz, SpO2 @ 0.5Hz)
- **Bidirectional communication** (receive commands, send responses)
- **JSON message format** for all data

### REST API Server (Port 80)
Lightweight JSON-only endpoints (no HTML):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | System status (health, WiFi, uptime, memory) |
| `/health` | GET | Detailed health metrics |
| `/ecg-raw` | GET | Current ECG sensor reading |
| `/spo2-raw` | GET | Current SpO2 sensor reading |
| `/sensors` | GET | All sensor states |
| `/memory` | GET | Memory usage information |
| `/network` | GET | Network information |
| `/system-info` | GET | Hardware information |
| `/uptime` | GET | System uptime |

---

## 🚀 Getting Started

### 1. Arduino IDE Setup

**Required Libraries:**
- `WebSockets` by Markus Sattler (for WebSocketsServer)
- `SparkFun MAX3010x` (for MAX30102 sensor)
- Built-in: `WiFi`, `WebServer`, `Wire`

**Installation:**
1. Open Arduino IDE
2. Go to Sketch → Include Library → Manage Libraries
3. Search and install:
   - "WebSockets" by Markus Sattler
   - "SparkFun MAX3010x Pulse and Proximity Sensor Library"

### 2. Configure WiFi

Edit `Config.cpp`:
```cpp
const char* WIFI_SSID = "YourWiFiNetwork";
const char* WIFI_PASSWORD = "YourPassword";
```

### 3. Upload to ESP32

1. Open `WearablePatch.ino` in Arduino IDE
2. Select board: **ESP32 Dev Module**
3. Select correct COM port
4. Click Upload
5. Open Serial Monitor (115200 baud) to see startup messages

### 4. Note the IP Address

After boot, the serial monitor will display:
```
╔════════════════════════════════════════════╗
║            SYSTEM READY                    ║
╚════════════════════════════════════════════╝
📡 REST API:   http://192.168.1.XXX
🔌 WebSocket:  ws://192.168.1.XXX:81
💾 Free Heap:  XXX KB
```

---

## 🧪 Testing with Python Clients

### Install Python Dependencies
```bash
cd python_clients
pip install -r requirements.txt
```

### Test REST API
```bash
python api_client.py 192.168.1.XXX test
```

### Real-time WebSocket Streaming
```bash
python websocket_client.py 192.168.1.XXX
```

See [`python_clients/README.md`](python_clients/README.md) for detailed client documentation.

---

## 📊 Data Formats

### WebSocket Messages

**ECG Data Stream:**
```json
{
  "type": "ecg",
  "ts": 123456789,
  "val": 2048,
  "leads": "connected"
}
```

**SpO2 Data Stream:**
```json
{
  "type": "spo2",
  "spo2": 98,
  "valid": 1,
  "ir": 85000,
  "red": 42000,
  "finger": true
}
```

**Heart Rate:**
```json
{
  "type": "heart_rate",
  "hr": 72,
  "valid": 1
}
```

### JSON Commands (WebSocket)

Send commands to ESP32:
```json
{"command": "status"}
{"command": "check_sensor", "sensor": "ecg"}
{"command": "memory"}
```

**Available Commands:**
- `status` - System status
- `health` - Health metrics
- `sensors` - All sensor states
- `check_sensor` - Check specific sensor (ecg/spo2)
- `memory` - Memory info
- `network` - Network info
- `system_info` - Hardware info
- `uptime` - System uptime
- `ecg_raw` - Current ECG reading
- `spo2_raw` - Current SpO2 reading
- `ping` - Connection test
- `help` - List all commands

---

## 🏗️ Architecture Details

### Modular Design

Each component is self-contained with clear responsibilities:

1. **Sensor Modules** (`ECGSensor`, `SpO2Sensor`)
   - Preserve original sampling logic and calculations
   - High-frequency non-blocking updates
   - Rate-limiting for WebSocket transmission

2. **Network Services** (`WebSocketServer`, `APIServer`)
   - Lightweight, non-blocking implementations
   - Separate concerns (streaming vs. status queries)
   - No heavy HTML rendering

3. **System Components** (`CommandHandler`, `SystemMonitor`)
   - Command processing without blocking sensor loops
   - Continuous health monitoring
   - Memory and performance tracking

### Non-blocking Operation

- Sensors update at their native rates (ECG @ 250Hz, SpO2 @ 100Hz)
- WebSocket transmits rate-limited data (ECG @ 25Hz, SpO2 @ 0.5Hz)
- API requests handled asynchronously
- Minimal delay in main loop (1ms watchdog protection)

---

## 🔮 Future Sensor Expansion

The architecture is designed for easy expansion. Reserved pins:

| Pin | Suggested Use |
|-----|---------------|
| GPIO 32 | Temperature sensor |
| GPIO 33 | Accelerometer X |
| GPIO 27 | Accelerometer Y/Z |
| GPIO 35 | Additional analog sensor |
| GPIO 36 | Additional analog sensor |
| GPIO 39 | Additional analog sensor |

### Adding a New Sensor

1. Create `NewSensor.h` and `NewSensor.cpp`
2. Add instance in `WearablePatch.ino`
3. Call `newSensor.update()` in `loop()`
4. Stream data via `webSocketServer.sendNewSensorData()`
5. Add API endpoint in `APIServer`

---

## 📈 Performance Metrics

### Memory Usage (v3.0 vs v2.0)

| Component | v2.0 | v3.0 | Savings |
|-----------|------|------|---------|
| HTML Dashboard | ~50KB | 0KB | **50KB** |
| Program Storage | ~85% | ~65% | **20%** |
| Free Heap (Runtime) | ~120KB | ~170KB | **+50KB** |

### Stability Improvements
- ✅ Both sensors run simultaneously without disconnection
- ✅ WebSocket remains stable under continuous load
- ✅ No watchdog resets observed
- ✅ Memory usage remains stable over time

---

## 🐛 Troubleshooting

### ESP32 Won't Connect to WiFi
- Check SSID and password in `Config.cpp`
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check serial monitor for error messages

### WebSocket Connection Fails
- Verify port 81 is not blocked by firewall
- Ensure client and ESP32 are on same network
- Check ESP32 serial output for "WebSocket Server: Started"

### Sensors Not Reading
- **ECG:** Check electrode connections and LO+/LO- pins
- **SpO2:** Verify I2C wiring (SDA/SCL), try different finger position

### Memory Issues
- Monitor free heap via `/memory` endpoint
- If heap < 50KB, consider reducing buffer sizes
- Disable debug printing in production

### Compilation Errors
- Ensure all required libraries are installed
- Check Arduino IDE board selection (ESP32 Dev Module)
- Verify ESP32 board package is up to date

---

## 📝 Configuration Options

Edit `Config.h` to customize:

```cpp
// ECG Sampling
#define ECG_SAMPLE_RATE 250        // Hz (sampling rate)
#define ECG_SEND_EVERY 10          // Send every Nth sample

// SpO2 Sampling
#define SPO2_SEND_INTERVAL 2000    // WebSocket update rate (ms)

// Network
#define WEB_SERVER_PORT 80
#define WEBSOCKET_PORT 81
#define WEBSOCKET_PING_INTERVAL 5000

// System
#define SYSTEM_MONITOR_UPDATE_INTERVAL 1000
```

---

## 🔐 Security Considerations

This is a **development/research device**. For production medical use:

1. Add **authentication** to WebSocket and API
2. Use **TLS/SSL** for encrypted communication
3. Implement **input validation** for all commands
4. Add **rate limiting** to prevent DoS
5. Follow **medical device regulations** (FDA, CE, etc.)

---

## 📚 References

- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [AD8232 ECG Sensor Datasheet](https://www.analog.com/en/products/ad8232.html)
- [MAX30102 Pulse Oximeter Datasheet](https://www.analog.com/en/products/max30102.html)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)

---

## 📄 License

This project is provided for educational and research purposes.

**Medical Disclaimer:** This device is NOT approved for clinical use. Do not use for actual medical diagnosis or treatment.

---

## 👥 Credits

**Author:** CognivusLabs Medical Team
**Version:** 3.0.0
**Architecture:** Modular IoT Streaming System
**Date:** 2024

---

## 🔄 Version History

### v3.0.0 (Current)
- ✨ Removed heavy HTML dashboards
- ✨ Added lightweight REST API (JSON only)
- ✨ Implemented bidirectional WebSocket with command handling
- ✨ Added system monitoring and health tracking
- ✨ Created modular architecture
- ✨ Included Python test clients
- 🐛 Fixed stability issues with multiple active sensors
- 📈 Improved memory efficiency (+50KB free heap)

### v2.0
- Web-based dashboard with real-time charts
- Basic WebSocket streaming
- REST API endpoints
- Modular sensor classes

---

## 📞 Support

For issues, questions, or contributions:
- Check the troubleshooting section above
- Review Python client documentation in `python_clients/README.md`
- Consult ESP32 and sensor datasheets
