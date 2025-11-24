# ESP32 Wearable Medical Sensor - Architecture Documentation

## Overview

This project has been modularized into clean, maintainable components while maintaining full Arduino IDE compatibility. All files remain at the same level (flat structure) as required by the Arduino IDE.

## Project Structure

```
WearablePatch/
├── WearablePatch.ino        # Main sketch - coordinates all modules
├── Config.h                  # All configuration constants and pin definitions
├── ECGSensor.h               # ECG sensor interface
├── ECGSensor.cpp             # ECG sensor implementation
├── SpO2Sensor.h              # SpO2 sensor interface
├── SpO2Sensor.cpp            # SpO2 sensor implementation
├── WiFiManager.h             # WiFi connection manager interface
├── WiFiManager.cpp           # WiFi connection manager implementation
├── WebSocketHandler.h        # WebSocket server interface
├── WebSocketHandler.cpp      # WebSocket server implementation
├── WebServerHandler.h        # HTTP server & dashboard interface
├── WebServerHandler.cpp      # HTTP server & dashboard implementation
└── ARCHITECTURE.md           # This file
```

## Module Descriptions

### 1. Config.h
**Purpose:** Centralized configuration management

**Contents:**
- WiFi credentials and settings
- ECG sensor pin definitions and timing constants
- SpO2 sensor configuration parameters
- Server port configurations
- System-wide constants

**Benefits:**
- Single location for all configuration changes
- Easy to customize for different hardware setups
- No need to search through code for magic numbers

### 2. ECGSensor Module
**Files:** `ECGSensor.h`, `ECGSensor.cpp`

**Responsibilities:**
- Initialize ECG sensor pins (analog input, leads-off detection)
- High-frequency sampling (250 Hz)
- Leads-off detection for proper electrode connection
- Rate-limited data output for WebSocket transmission
- Preserve all original ECG reading logic

**Key Methods:**
- `begin()` - Initialize sensor
- `update()` - Call every loop iteration for sampling
- `shouldSendSample()` - Rate limiter for WebSocket
- `getLastValue()` - Retrieve latest ECG reading

### 3. SpO2Sensor Module
**Files:** `SpO2Sensor.h`, `SpO2Sensor.cpp`

**Responsibilities:**
- Initialize MAX30102 sensor with I2C communication
- Manage data buffers (100 samples for IR and Red channels)
- Finger detection using IR threshold
- Calculate SpO2 using Maxim algorithm (preserved exactly)
- Heart rate calculation
- Rate-limited WebSocket updates

**Key Methods:**
- `begin()` - Initialize MAX30102
- `update()` - Call every loop iteration
- `isFingerDetected()` - Check if finger is on sensor
- `getSpo2Value()` - Get calculated SpO2 percentage
- `shouldSendUpdate()` - Rate limiter for WebSocket

**IMPORTANT:** The SpO2 calculation algorithm uses validated biomedical formulas and must not be modified.

### 4. WiFiManager Module
**Files:** `WiFiManager.h`, `WiFiManager.cpp`

**Responsibilities:**
- Connect to WiFi network
- Handle connection timeouts
- Provide connection status
- Report IP address

**Key Methods:**
- `connect()` - Initiate WiFi connection
- `isConnected()` - Check current WiFi status
- `getIPAddress()` - Get assigned IP address

### 5. WebSocketHandler Module
**Files:** `WebSocketHandler.h`, `WebSocketHandler.cpp`

**Responsibilities:**
- Manage WebSocket server on port 81
- Handle client connections/disconnections
- Stream real-time sensor data
- Send periodic ping messages
- Format JSON messages for client

**Key Methods:**
- `begin()` - Start WebSocket server
- `loop()` - Process WebSocket events
- `sendECGData()` - Stream ECG readings
- `sendSpO2Data()` - Stream SpO2 readings
- `isClientConnected()` - Check if client is connected

**Data Format:**
```json
// ECG message
{"type":"ecg","ts":123456,"val":2048,"leads":"connected"}

// SpO2 message
{"type":"spo2","spo2":98,"valid":1,"ir":125000,"red":85000,"finger":true}
```

### 6. WebServerHandler Module
**Files:** `WebServerHandler.h`, `WebServerHandler.cpp`

**Responsibilities:**
- Serve web dashboard (HTML/CSS/JavaScript)
- Provide REST API endpoints
- Handle HTTP requests
- Display real-time sensor visualization

**API Endpoints:**
- `GET /` - Web dashboard
- `GET /api/v1/status` - System status JSON
- `GET /api/v1/ecg-raw` - Current ECG reading
- `GET /api/v1/spo2-raw` - Current SpO2 data

**Key Methods:**
- `begin()` - Start web server
- `loop()` - Handle HTTP requests
- `setSensorReferences()` - Link to sensor instances
- `handleRoot()` - Serve dashboard
- `handleStatus()` - Return system status

### 7. WearablePatch.ino (Main Sketch)
**Responsibilities:**
- Create module instances
- Initialize all modules in `setup()`
- Coordinate module updates in `loop()`
- Handle data flow between modules

**Flow:**
```
setup() {
  1. Initialize Serial
  2. Initialize sensors
  3. Connect WiFi
  4. Start WebSocket server
  5. Start Web server
}

loop() {
  1. Handle web server requests
  2. Process WebSocket events
  3. Update ECG sensor (high-frequency)
  4. Update SpO2 sensor
  5. Stream data via WebSocket (rate-limited)
  6. Small delay for watchdog
}
```

## Adding New Sensors (Future Expansion)

The modular design makes it easy to add new sensors. Follow this pattern:

### Step 1: Create Sensor Module
```cpp
// NewSensor.h
#ifndef NEW_SENSOR_H
#define NEW_SENSOR_H

#include <Arduino.h>
#include "Config.h"

class NewSensor {
public:
  NewSensor();
  bool begin();
  void update();
  bool isActive() const { return sensorActive; }
  // Add getters for sensor data

private:
  bool sensorActive;
  // Add sensor-specific variables
};

#endif
```

### Step 2: Add Configuration to Config.h
```cpp
// New Sensor Configuration
const int NEW_SENSOR_PIN = 35;
const int NEW_SENSOR_SAMPLE_RATE = 100;
// Add other constants
```

### Step 3: Integrate in Main Sketch
```cpp
// In WearablePatch.ino
#include "NewSensor.h"

NewSensor newSensor;

void setup() {
  // ...
  newSensor.begin();
  // ...
}

void loop() {
  // ...
  newSensor.update();

  // Stream new sensor data if needed
  if (newSensor.isActive()) {
    // Handle data transmission
  }
  // ...
}
```

### Step 4: Add API Endpoint (Optional)
```cpp
// In WebServerHandler.cpp
void WebServerHandler::handleNewSensorRaw() {
  if (newSensor == nullptr || !newSensor->isActive()) {
    server.send(503, "application/json", "{\"error\":\"Sensor not active\"}");
    return;
  }

  String json = "{\"value\":" + String(newSensor->getValue()) + "}";
  server.send(200, "application/json", json);
}
```

## Compilation Instructions

### Arduino IDE
1. Open `WearablePatch.ino` in Arduino IDE
2. Ensure all files are in the same folder
3. Install required libraries:
   - WiFi (built-in)
   - WebServer (built-in)
   - WebSocketsServer
   - Wire (built-in)
   - MAX30105 (SparkFun)
   - spo2_algorithm (Maxim)
4. Select board: ESP32 Dev Module
5. Click "Verify" or "Upload"

### Required Libraries
```
- WebSocketsServer by Markus Sattler
- SparkFun MAX3010x Pulse and Proximity Sensor Library
- Maxim Integrated spo2_algorithm
```

## Design Benefits

1. **Maintainability**: Each module has a single responsibility
2. **Readability**: Clean separation of concerns
3. **Testability**: Modules can be tested independently
4. **Extensibility**: Easy to add new sensors without touching existing code
5. **Arduino IDE Compatible**: Flat structure, no subfolders
6. **Preserved Logic**: All original sensor calculations unchanged
7. **Global Variable Management**: Properly encapsulated in classes
8. **Documentation**: Clear interfaces and comments

## Key Design Decisions

### Why Flat Structure?
Arduino IDE requires all files at the same level. No `/src` or `/lib` folders allowed for direct compilation.

### Why Use Classes?
- Encapsulation of sensor state
- Prevention of global variable conflicts
- Clear interfaces between modules
- Easier to add multiple instances if needed

### Why Separate WebSocket and WebServer?
- Different protocols and concerns
- WebSocket handles real-time streaming
- WebServer handles HTTP requests and dashboard
- Can be maintained independently

### Why Keep Config.h Separate?
- Single source of truth for configuration
- Easy hardware customization
- No need to search through code for constants
- Facilitates different deployment environments

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         WearablePatch.ino                    │
│                         (Main Coordinator)                   │
└─────────┬──────────────┬──────────────┬─────────────────────┘
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐    ┌──────────┐   ┌─────────┐
    │ECGSensor│    │SpO2Sensor│   │WiFiMgr  │
    └────┬────┘    └─────┬────┘   └─────────┘
         │               │
         │  Sensor Data  │
         └───────┬───────┘
                 ▼
      ┌────────────────────┐
      │ WebSocketHandler   │
      │  (Real-time Stream)│
      └────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   Clients    │
         │ (Dashboard)  │
         └──────────────┘
                 ▲
                 │
      ┌──────────────────┐
      │ WebServerHandler │
      │  (HTTP/Dashboard)│
      └──────────────────┘
```

## Version History

- **v1.0**: Single-file implementation (ecg_spo2_code.txt)
- **v2.0**: Modularized architecture with separate sensor classes

## Notes

- All sensor calculation formulas preserved exactly as original
- High-frequency ECG sampling (250Hz) maintained
- Rate limiting applied for WebSocket transmission
- Dashboard HTML embedded in WebServerHandler
- Ready for future sensor additions

---

**Prepared for easy expansion and long-term maintenance.**
