#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <WebServer.h>
#include "Config.h"

// Forward declarations
class ECGSensor;
class SpO2Sensor;
class SystemMonitor;

/**
 * APIServer Class
 *
 * Lightweight REST API server for debugging and status queries.
 * All endpoints return JSON only - NO HTML DASHBOARDS.
 *
 * This minimalist approach reduces memory usage and prevents
 * ESP32 instability when multiple sensors are active.
 *
 * API Endpoints:
 * - GET /status          - Overall system status
 * - GET /health          - System health metrics
 * - GET /ecg-raw         - Current ECG sensor reading
 * - GET /spo2-raw        - Current SpO2 sensor reading
 * - GET /sensors         - All sensor states
 * - GET /memory          - Memory usage information
 * - GET /network         - Network information
 * - GET /system-info     - Hardware information
 * - GET /uptime          - System uptime
 */
class APIServer {
public:
  APIServer();

  // Initialization
  bool begin();
  void loop();

  // Set sensor and monitor references
  void setSensorReferences(ECGSensor* ecg, SpO2Sensor* spo2, SystemMonitor* monitor);

  // Route handlers (public for server callback binding)
  void handleStatus();
  void handleHealth();
  void handleECGRaw();
  void handleSpO2Raw();
  void handleSensors();
  void handleMemory();
  void handleNetwork();
  void handleSystemInfo();
  void handleUptime();
  void handleNotFound();

private:
  WebServer server;

  // Sensor and monitor references
  ECGSensor* ecgSensor;
  SpO2Sensor* spo2Sensor;
  SystemMonitor* systemMonitor;

  // Helper methods
  void sendJSONResponse(int code, const String& json);
  void sendErrorResponse(int code, const String& message);
  void enableCORS();
};

// Global instance for callback binding
extern APIServer* g_apiServer;

// C-style callback wrappers
void apiHandleStatus();
void apiHandleHealth();
void apiHandleECGRaw();
void apiHandleSpO2Raw();
void apiHandleSensors();
void apiHandleMemory();
void apiHandleNetwork();
void apiHandleSystemInfo();
void apiHandleUptime();
void apiHandleNotFound();

#endif // API_SERVER_H
