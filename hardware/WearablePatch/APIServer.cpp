#include "APIServer.h"
#include "ECGSensor.h"
#include "SpO2Sensor.h"
#include "SystemMonitor.h"

// Global instance pointer for callbacks
APIServer* g_apiServer = nullptr;

// C-style callback wrappers
void apiHandleStatus() { if (g_apiServer) g_apiServer->handleStatus(); }
void apiHandleHealth() { if (g_apiServer) g_apiServer->handleHealth(); }
void apiHandleECGRaw() { if (g_apiServer) g_apiServer->handleECGRaw(); }
void apiHandleSpO2Raw() { if (g_apiServer) g_apiServer->handleSpO2Raw(); }
void apiHandleSensors() { if (g_apiServer) g_apiServer->handleSensors(); }
void apiHandleMemory() { if (g_apiServer) g_apiServer->handleMemory(); }
void apiHandleNetwork() { if (g_apiServer) g_apiServer->handleNetwork(); }
void apiHandleSystemInfo() { if (g_apiServer) g_apiServer->handleSystemInfo(); }
void apiHandleUptime() { if (g_apiServer) g_apiServer->handleUptime(); }
void apiHandleNotFound() { if (g_apiServer) g_apiServer->handleNotFound(); }

APIServer::APIServer()
  : server(WEB_SERVER_PORT),
    ecgSensor(nullptr),
    spo2Sensor(nullptr),
    systemMonitor(nullptr) {
  g_apiServer = this;
}

void APIServer::setSensorReferences(ECGSensor* ecg, SpO2Sensor* spo2, SystemMonitor* monitor) {
  ecgSensor = ecg;
  spo2Sensor = spo2;
  systemMonitor = monitor;
}

bool APIServer::begin() {
  // Setup lightweight API routes (JSON only, no HTML)
  server.on("/status", HTTP_GET, apiHandleStatus);
  server.on("/health", HTTP_GET, apiHandleHealth);
  server.on("/ecg-raw", HTTP_GET, apiHandleECGRaw);
  server.on("/spo2-raw", HTTP_GET, apiHandleSpO2Raw);
  server.on("/sensors", HTTP_GET, apiHandleSensors);
  server.on("/memory", HTTP_GET, apiHandleMemory);
  server.on("/network", HTTP_GET, apiHandleNetwork);
  server.on("/system-info", HTTP_GET, apiHandleSystemInfo);
  server.on("/uptime", HTTP_GET, apiHandleUptime);

  // 404 handler
  server.onNotFound(apiHandleNotFound);

  server.begin();
  Serial.println("✓ API Server: Started on port " + String(WEB_SERVER_PORT));
  Serial.println("  Lightweight JSON API (no HTML dashboards)");
  return true;
}

void APIServer::loop() {
  server.handleClient();
}

// ========================================
// API Route Handlers
// ========================================

void APIServer::handleStatus() {
  enableCORS();

  if (!systemMonitor) {
    sendErrorResponse(503, "System monitor not initialized");
    return;
  }

  String json = systemMonitor->getStatusJSON();
  sendJSONResponse(200, json);
}

void APIServer::handleHealth() {
  enableCORS();

  if (!systemMonitor) {
    sendErrorResponse(503, "System monitor not initialized");
    return;
  }

  String json = systemMonitor->getHealthJSON();
  sendJSONResponse(200, json);
}

void APIServer::handleECGRaw() {
  enableCORS();

  if (!ecgSensor || !ecgSensor->isActive()) {
    sendErrorResponse(503, "ECG sensor not active");
    return;
  }

  String json = "{";
  json += "\"timestamp\":" + String(ecgSensor->getLastSampleTime()) + ",";
  json += "\"value\":" + String(ecgSensor->getLastValue()) + ",";
  json += "\"leadsOff\":" + String(ecgSensor->areLeadsOff() ? "true" : "false") + ",";
  json += "\"active\":" + String(ecgSensor->isActive() ? "true" : "false");
  json += "}";

  sendJSONResponse(200, json);
}

void APIServer::handleSpO2Raw() {
  enableCORS();

  if (!spo2Sensor || !spo2Sensor->isActive()) {
    sendErrorResponse(503, "SpO2 sensor not active");
    return;
  }

  String json = "{";
  json += "\"spo2\":" + String(spo2Sensor->getSpo2Value()) + ",";
  json += "\"valid\":" + String(spo2Sensor->isSpo2Valid()) + ",";
  json += "\"fingerDetected\":" + String(spo2Sensor->isFingerDetected() ? "true" : "false") + ",";
  json += "\"ir\":" + String(spo2Sensor->getIRValue()) + ",";
  json += "\"red\":" + String(spo2Sensor->getRedValue()) + ",";
  json += "\"active\":" + String(spo2Sensor->isActive() ? "true" : "false");
  json += "}";

  sendJSONResponse(200, json);
}

void APIServer::handleSensors() {
  enableCORS();

  bool ecgActive = (ecgSensor != nullptr) && ecgSensor->isActive();
  bool spo2Active = (spo2Sensor != nullptr) && spo2Sensor->isActive();
  bool ecgLeadsOff = ecgActive && ecgSensor->areLeadsOff();
  bool fingerDetected = spo2Active && spo2Sensor->isFingerDetected();

  String json = "{";
  json += "\"ecg\":{";
  json += "\"active\":" + String(ecgActive ? "true" : "false") + ",";
  json += "\"leadsOff\":" + String(ecgLeadsOff ? "true" : "false");
  if (ecgActive) {
    json += ",\"lastValue\":" + String(ecgSensor->getLastValue());
  }
  json += "},";
  json += "\"spo2\":{";
  json += "\"active\":" + String(spo2Active ? "true" : "false") + ",";
  json += "\"fingerDetected\":" + String(fingerDetected ? "true" : "false");
  if (spo2Active) {
    json += ",\"spo2\":" + String(spo2Sensor->getSpo2Value()) + ",";
    json += "\"valid\":" + String(spo2Sensor->isSpo2Valid()) + ",";
    json += "\"ir\":" + String(spo2Sensor->getIRValue()) + ",";
    json += "\"red\":" + String(spo2Sensor->getRedValue());
  }
  json += "}";
  json += "}";

  sendJSONResponse(200, json);
}

void APIServer::handleMemory() {
  enableCORS();

  if (!systemMonitor) {
    sendErrorResponse(503, "System monitor not initialized");
    return;
  }

  String json = systemMonitor->getMemoryJSON();
  sendJSONResponse(200, json);
}

void APIServer::handleNetwork() {
  enableCORS();

  if (!systemMonitor) {
    sendErrorResponse(503, "System monitor not initialized");
    return;
  }

  String json = systemMonitor->getNetworkJSON();
  sendJSONResponse(200, json);
}

void APIServer::handleSystemInfo() {
  enableCORS();

  if (!systemMonitor) {
    sendErrorResponse(503, "System monitor not initialized");
    return;
  }

  String json = systemMonitor->getSystemInfoJSON();
  sendJSONResponse(200, json);
}

void APIServer::handleUptime() {
  enableCORS();

  if (!systemMonitor) {
    sendErrorResponse(503, "System monitor not initialized");
    return;
  }

  uint32_t uptime = systemMonitor->getUptime();

  String json = "{";
  json += "\"uptimeMs\":" + String(uptime) + ",";
  json += "\"uptimeSec\":" + String(uptime / 1000) + ",";
  json += "\"uptimeMin\":" + String(uptime / 60000) + ",";
  json += "\"uptimeHours\":" + String(uptime / 3600000);
  json += "}";

  sendJSONResponse(200, json);
}

void APIServer::handleNotFound() {
  enableCORS();

  // Convert HTTP method to string
  String methodStr = "";
  switch(server.method()) {
    case HTTP_GET: methodStr = "GET"; break;
    case HTTP_POST: methodStr = "POST"; break;
    case HTTP_PUT: methodStr = "PUT"; break;
    case HTTP_DELETE: methodStr = "DELETE"; break;
    default: methodStr = "UNKNOWN"; break;
  }

  String json = "{";
  json += "\"error\":\"Endpoint not found\",";
  json += "\"method\":\"" + methodStr + "\",";
  json += "\"uri\":\"" + server.uri() + "\",";
  json += "\"availableEndpoints\":[";
  json += "\"/status\",\"/health\",\"/ecg-raw\",\"/spo2-raw\",";
  json += "\"/sensors\",\"/memory\",\"/network\",\"/system-info\",\"/uptime\"";
  json += "]";
  json += "}";

  sendJSONResponse(404, json);
}

// ========================================
// Helper Methods
// ========================================

void APIServer::sendJSONResponse(int code, const String& json) {
  server.send(code, "application/json", json);
}

void APIServer::sendErrorResponse(int code, const String& message) {
  String json = "{\"error\":\"" + message + "\",\"code\":" + String(code) + "}";
  server.send(code, "application/json", json);
}

void APIServer::enableCORS() {
  // Enable CORS for cross-origin requests (useful for web-based clients)
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}
