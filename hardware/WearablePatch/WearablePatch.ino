/**
 * ESP32 Wearable Medical Sensor System - Version 3.0
 *
 * REFACTORED ARCHITECTURE:
 * This system is designed for lightweight, real-time data streaming
 * without heavy HTML dashboards. All sensor logic and calculations
 * are preserved exactly as-is.
 *
 * Key Features:
 * - Real-time WebSocket data streaming (bidirectional)
 * - JSON command handling for remote troubleshooting
 * - Lightweight REST API (JSON only, no HTML)
 * - System health monitoring
 * - Modular architecture for easy sensor expansion
 *
 * Active Sensors:
 * - ECG (AD8232) - Electrocardiogram sensor
 * - SpO2 (MAX30102) - Blood oxygen saturation sensor
 *
 * Network Services:
 * - WebSocket Server (port 81) - Real-time data + commands
 * - REST API (port 80) - Status and debugging endpoints
 *
 * Hardware:
 * - ESP32 Development Board
 * - AD8232 ECG Sensor Module
 * - MAX30102 Pulse Oximeter Sensor
 *
 * Author: CognivusLabs Medical Team
 * Version: 3.0.0
 * Architecture: Modular IoT Streaming System
 */

#include "Config.h"
#include "ECGSensor.h"
#include "SpO2Sensor.h"
#include "WiFiManager.h"
#include "WebSocketServer.h"
#include "APIServer.h"
#include "CommandHandler.h"
#include "SystemMonitor.h"

// ========================================
// Module Instances
// ========================================
ECGSensor ecgSensor;
SpO2Sensor spo2Sensor;
WiFiManager wifiManager;
WebSocketServer webSocketServer;
APIServer apiServer;
CommandHandler commandHandler;
SystemMonitor systemMonitor;

// System monitoring
unsigned long lastSystemUpdate = 0;
unsigned long lastHeartbeat = 0;

// ========================================
// Setup - Initialize all modules
// ========================================
void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.println("\n\n╔════════════════════════════════════════════╗");
  Serial.println("║  ESP32 Medical Sensor System v3.0         ║");
  Serial.println("║  Lightweight Real-time Streaming          ║");
  Serial.println("╚════════════════════════════════════════════╝\n");

  // Initialize system monitor first
  systemMonitor.begin();

  // Initialize sensors (sensor logic preserved exactly)
  ecgSensor.begin();
  spo2Sensor.begin();

  // Connect to WiFi
  wifiManager.connect();

  // Initialize command handler with sensor references
  commandHandler.setSensorReferences(&ecgSensor, &spo2Sensor, &systemMonitor);

  // Initialize WebSocket server with command handler
  webSocketServer.setCommandHandler(&commandHandler);
  webSocketServer.begin();

  // Initialize lightweight API server (JSON only, no HTML)
  apiServer.setSensorReferences(&ecgSensor, &spo2Sensor, &systemMonitor);
  apiServer.begin();

  // System ready
  Serial.println("\n╔════════════════════════════════════════════╗");
  Serial.println("║            SYSTEM READY                    ║");
  Serial.println("╚════════════════════════════════════════════╝");
  Serial.println("📡 REST API:   http://" + wifiManager.getIPAddress());
  Serial.println("   Available endpoints:");
  Serial.println("   - /status      - System status");
  Serial.println("   - /health      - Health metrics");
  Serial.println("   - /ecg-raw     - ECG sensor data");
  Serial.println("   - /spo2-raw    - SpO2 sensor data");
  Serial.println("   - /sensors     - All sensors");
  Serial.println("   - /memory      - Memory info");
  Serial.println("   - /network     - Network info");
  Serial.println("");
  Serial.println("🔌 WebSocket:  ws://" + wifiManager.getIPAddress() + ":81");
  Serial.println("   - Real-time sensor streaming");
  Serial.println("   - JSON command processing");
  Serial.println("");
  Serial.println("💾 Free Heap:  " + String(ESP.getFreeHeap() / 1024) + " KB");
  Serial.println("════════════════════════════════════════════════\n");
}

// ========================================
// Main Loop - Lightweight and Non-blocking
// ========================================
void loop() {
  // Handle network services (non-blocking)
  apiServer.loop();
  webSocketServer.loop();

  // Update sensors (preserve original timing and logic)
  ecgSensor.update();
  spo2Sensor.update();

  // Stream ECG data via WebSocket AND HTTP POST (continuous recording)
  if (ecgSensor.isActive() && ecgSensor.shouldSendSample()) {
    // Send via WebSocket for real-time viewing
    webSocketServer.sendECGData(
      ecgSensor.getLastSampleTime(),
      ecgSensor.getLastValue(),
      !ecgSensor.areLeadsOff()
    );
    
    // ALSO send via HTTP POST to ensure data is always saved to TimescaleDB
    if (wifiManager.isConnected()) {
      String ecgJson = "{";
      ecgJson += "\"device_id\":\"" + wifiManager.getDeviceID() + "\",";
      ecgJson += "\"type\":\"ecg\",";
      ecgJson += "\"val\":" + String(ecgSensor.getLastValue()) + ",";
      ecgJson += "\"leadsOff\":" + String(ecgSensor.areLeadsOff() ? "true" : "false") + ",";
      ecgJson += "\"timestamp\":\"" + String(millis()) + "\"";
      ecgJson += "}";
      wifiManager.sendVitalData("ecg", ecgJson);
    }
    
    ecgSensor.clearNewSampleFlag();
  }

  // Handle SpO2 data transmission
  if (spo2Sensor.isActive()) {
    // Send finger removed event
    static bool lastFingerState = false;
    if (lastFingerState && !spo2Sensor.isFingerDetected()) {
      webSocketServer.sendFingerRemoved();
    }
    lastFingerState = spo2Sensor.isFingerDetected();

    // Send SpO2 updates (rate-limited)
    if (spo2Sensor.shouldSendUpdate()) {
      // Send via WebSocket for real-time viewing
      webSocketServer.sendSpO2Data(
        spo2Sensor.getSpo2Value(),
        spo2Sensor.isSpo2Valid(),
        spo2Sensor.getIRValue(),
        spo2Sensor.getRedValue(),
        spo2Sensor.isFingerDetected()
      );

      // ALSO send via HTTP POST to ensure data is always saved
      if (wifiManager.isConnected()) {
        String spo2Json = "{";
        spo2Json += "\"device_id\":\"" + wifiManager.getDeviceID() + "\",";
        spo2Json += "\"type\":\"spo2\",";
        spo2Json += "\"spo2\":" + String(spo2Sensor.getSpo2Value()) + ",";
        spo2Json += "\"valid\":" + String(spo2Sensor.isSpo2Valid() ? 1 : 0) + ",";
        spo2Json += "\"finger\":" + String(spo2Sensor.isFingerDetected() ? "true" : "false") + ",";
        spo2Json += "\"ir\":" + String(spo2Sensor.getIRValue()) + ",";
        spo2Json += "\"red\":" + String(spo2Sensor.getRedValue()) + ",";
        spo2Json += "\"active\":true,";
        spo2Json += "\"timestamp\":\"" + String(millis()) + "\"";
        spo2Json += "}";
        wifiManager.sendVitalData("spo2", spo2Json);
      }

      // Also send heart rate if available
      if (spo2Sensor.isHeartRateValid()) {
        webSocketServer.sendHeartRateData(
          spo2Sensor.getHeartRate(),
          spo2Sensor.isHeartRateValid()
        );
        
        // HTTP POST for heart rate
        if (wifiManager.isConnected()) {
          String hrJson = "{";
          hrJson += "\"device_id\":\"" + wifiManager.getDeviceID() + "\",";
          hrJson += "\"type\":\"heart_rate\",";
          hrJson += "\"hr\":" + String(spo2Sensor.getHeartRate()) + ",";
          hrJson += "\"valid\":" + String(spo2Sensor.isHeartRateValid() ? 1 : 0) + ",";
          hrJson += "\"timestamp\":\"" + String(millis()) + "\"";
          hrJson += "}";
          wifiManager.sendVitalData("heart_rate", hrJson);
        }
      }
    }
  }

  // Update system monitor periodically
  if (millis() - lastSystemUpdate > SYSTEM_MONITOR_UPDATE_INTERVAL) {
    systemMonitor.update();
    lastSystemUpdate = millis();
  }

  // Send heartbeat to backend server periodically
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    if (wifiManager.isConnected()) {
      if (wifiManager.sendHeartbeat()) {
        Serial.println("✓ Heartbeat sent to backend");
      } else {
        Serial.println("✗ Heartbeat failed");
      }
    }
    lastHeartbeat = millis();
  }

  // Small delay to prevent watchdog issues
  delay(LOOP_DELAY);
}
