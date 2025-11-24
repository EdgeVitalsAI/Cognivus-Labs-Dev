#include "CommandHandler.h"
#include "ECGSensor.h"
#include "SpO2Sensor.h"
#include "SystemMonitor.h"

CommandHandler::CommandHandler()
  : ecgSensor(nullptr),
    spo2Sensor(nullptr),
    systemMonitor(nullptr) {
}

void CommandHandler::setSensorReferences(ECGSensor* ecg, SpO2Sensor* spo2, SystemMonitor* monitor) {
  ecgSensor = ecg;
  spo2Sensor = spo2;
  systemMonitor = monitor;
  Serial.println("✓ Command Handler: Initialized");
}

String CommandHandler::processCommand(const String& jsonCommand) {
  // Extract command from JSON
  String command = extractCommand(jsonCommand);
  command.toLowerCase();
  command.trim();

  Serial.println("Processing command: " + command);

  // Route to appropriate handler
  if (command == "status") {
    return handleStatus();
  } else if (command == "health") {
    return handleHealth();
  } else if (command == "sensors") {
    return handleSensors();
  } else if (command == "check_sensor") {
    String sensor = extractParam(jsonCommand, "sensor");
    return handleCheckSensor(sensor);
  } else if (command == "memory") {
    return handleMemory();
  } else if (command == "network") {
    return handleNetwork();
  } else if (command == "system_info") {
    return handleSystemInfo();
  } else if (command == "uptime") {
    return handleUptime();
  } else if (command == "reset_stats") {
    return handleResetStats();
  } else if (command == "ping") {
    return handlePing();
  } else if (command == "help") {
    return handleHelp();
  } else if (command == "ecg_raw") {
    return handleECGRaw();
  } else if (command == "spo2_raw") {
    return handleSpO2Raw();
  } else if (command == "reboot") {
    return handleReboot();
  } else if (command == "wifi_scan") {
    return handleWiFiScan();
  } else {
    return createErrorResponse("Unknown command: " + command + ". Type 'help' for available commands.");
  }
}

String CommandHandler::handleStatus() {
  if (!systemMonitor) return createErrorResponse("System monitor not initialized");

  String data = systemMonitor->getStatusJSON();
  return createResponse("status", data);
}

String CommandHandler::handleHealth() {
  if (!systemMonitor) return createErrorResponse("System monitor not initialized");

  String data = systemMonitor->getHealthJSON();
  return createResponse("health", data);
}

String CommandHandler::handleSensors() {
  bool ecgActive = (ecgSensor != nullptr) && ecgSensor->isActive();
  bool spo2Active = (spo2Sensor != nullptr) && spo2Sensor->isActive();
  bool ecgLeadsOff = ecgActive && ecgSensor->areLeadsOff();
  bool fingerDetected = spo2Active && spo2Sensor->isFingerDetected();

  String data = "{";
  data += "\"ecg\":{";
  data += "\"active\":" + String(ecgActive ? "true" : "false") + ",";
  data += "\"leadsOff\":" + String(ecgLeadsOff ? "true" : "false");
  if (ecgActive) {
    data += ",\"lastValue\":" + String(ecgSensor->getLastValue());
  }
  data += "},";
  data += "\"spo2\":{";
  data += "\"active\":" + String(spo2Active ? "true" : "false") + ",";
  data += "\"fingerDetected\":" + String(fingerDetected ? "true" : "false");
  if (spo2Active) {
    data += ",\"spo2\":" + String(spo2Sensor->getSpo2Value()) + ",";
    data += "\"valid\":" + String(spo2Sensor->isSpo2Valid()) + ",";
    data += "\"ir\":" + String(spo2Sensor->getIRValue()) + ",";
    data += "\"red\":" + String(spo2Sensor->getRedValue());
  }
  data += "}";
  data += "}";

  return createResponse("sensors", data);
}

String CommandHandler::handleCheckSensor(const String& sensorName) {
  String sensor = sensorName;
  sensor.toLowerCase();
  sensor.trim();

  String data = "{\"sensor\":\"" + sensor + "\",";

  if (sensor == "ecg") {
    if (!ecgSensor) {
      data += "\"error\":\"ECG sensor not initialized\"";
    } else {
      data += "\"active\":" + String(ecgSensor->isActive() ? "true" : "false") + ",";
      data += "\"leadsOff\":" + String(ecgSensor->areLeadsOff() ? "true" : "false") + ",";
      data += "\"lastValue\":" + String(ecgSensor->getLastValue()) + ",";
      data += "\"pin\":" + String(ECG_PIN) + ",";
      data += "\"sampleRate\":" + String(ECG_SAMPLE_RATE);
    }
  } else if (sensor == "spo2") {
    if (!spo2Sensor) {
      data += "\"error\":\"SpO2 sensor not initialized\"";
    } else {
      data += "\"active\":" + String(spo2Sensor->isActive() ? "true" : "false") + ",";
      data += "\"fingerDetected\":" + String(spo2Sensor->isFingerDetected() ? "true" : "false") + ",";
      data += "\"spo2\":" + String(spo2Sensor->getSpo2Value()) + ",";
      data += "\"valid\":" + String(spo2Sensor->isSpo2Valid()) + ",";
      data += "\"ir\":" + String(spo2Sensor->getIRValue()) + ",";
      data += "\"red\":" + String(spo2Sensor->getRedValue());
    }
  } else {
    data += "\"error\":\"Unknown sensor. Use 'ecg' or 'spo2'\"";
  }

  data += "}";
  return createResponse("check_sensor", data);
}

String CommandHandler::handleMemory() {
  if (!systemMonitor) return createErrorResponse("System monitor not initialized");

  String data = systemMonitor->getMemoryJSON();
  return createResponse("memory", data);
}

String CommandHandler::handleNetwork() {
  if (!systemMonitor) return createErrorResponse("System monitor not initialized");

  String data = systemMonitor->getNetworkJSON();
  return createResponse("network", data);
}

String CommandHandler::handleSystemInfo() {
  if (!systemMonitor) return createErrorResponse("System monitor not initialized");

  String data = systemMonitor->getSystemInfoJSON();
  return createResponse("system_info", data);
}

String CommandHandler::handleUptime() {
  if (!systemMonitor) return createErrorResponse("System monitor not initialized");

  uint32_t uptime = systemMonitor->getUptime();
  String data = "{";
  data += "\"uptimeMs\":" + String(uptime) + ",";
  data += "\"uptimeSec\":" + String(uptime / 1000) + ",";
  data += "\"uptimeMin\":" + String(uptime / 60000) + ",";
  data += "\"uptimeHours\":" + String(uptime / 3600000);
  data += "}";

  return createResponse("uptime", data);
}

String CommandHandler::handleResetStats() {
  // Reset minimum heap tracking
  if (systemMonitor) {
    // This would require adding a reset method to SystemMonitor
    String data = "{\"message\":\"Statistics reset requested\",\"note\":\"Restart device for full reset\"}";
    return createResponse("reset_stats", data);
  }
  return createErrorResponse("System monitor not initialized");
}

String CommandHandler::handlePing() {
  String data = "{\"message\":\"pong\",\"timestamp\":" + String(millis()) + "}";
  return createResponse("ping", data);
}

String CommandHandler::handleECGRaw() {
  if (!ecgSensor || !ecgSensor->isActive()) {
    return createErrorResponse("ECG sensor not active");
  }

  String data = "{";
  data += "\"value\":" + String(ecgSensor->getLastValue()) + ",";
  data += "\"timestamp\":" + String(ecgSensor->getLastSampleTime()) + ",";
  data += "\"leadsOff\":" + String(ecgSensor->areLeadsOff() ? "true" : "false");
  data += "}";

  return createResponse("ecg_raw", data);
}

String CommandHandler::handleSpO2Raw() {
  if (!spo2Sensor || !spo2Sensor->isActive()) {
    return createErrorResponse("SpO2 sensor not active");
  }

  String data = "{";
  data += "\"spo2\":" + String(spo2Sensor->getSpo2Value()) + ",";
  data += "\"valid\":" + String(spo2Sensor->isSpo2Valid()) + ",";
  data += "\"ir\":" + String(spo2Sensor->getIRValue()) + ",";
  data += "\"red\":" + String(spo2Sensor->getRedValue()) + ",";
  data += "\"fingerDetected\":" + String(spo2Sensor->isFingerDetected() ? "true" : "false");
  data += "}";

  return createResponse("spo2_raw", data);
}

String CommandHandler::handleReboot() {
  String data = "{\"message\":\"Reboot requested. Device will restart in 2 seconds.\"}";
  String response = createResponse("reboot", data);

  // Schedule reboot (done in main loop after sending response)
  Serial.println("REBOOT REQUESTED");

  return response;
}

String CommandHandler::handleWiFiScan() {
  String data = "{\"message\":\"WiFi scan not implemented in current version\",\"note\":\"Use network command for current WiFi status\"}";
  return createResponse("wifi_scan", data);
}

String CommandHandler::handleHelp() {
  String data = "{\"commands\":[";
  data += "\"status - Get overall system status\",";
  data += "\"health - Get system health metrics\",";
  data += "\"sensors - Get all sensor states\",";
  data += "\"check_sensor - Check specific sensor (param: sensor=ecg|spo2)\",";
  data += "\"memory - Get memory information\",";
  data += "\"network - Get network information\",";
  data += "\"system_info - Get hardware information\",";
  data += "\"uptime - Get system uptime\",";
  data += "\"ecg_raw - Get raw ECG data\",";
  data += "\"spo2_raw - Get raw SpO2 data\",";
  data += "\"reset_stats - Reset statistics\",";
  data += "\"reboot - Reboot device\",";
  data += "\"ping - Connection test\",";
  data += "\"help - Show this help\"";
  data += "]}";

  return createResponse("help", data);
}

// ========================================
// Helper Functions
// ========================================

String CommandHandler::extractCommand(const String& json) {
  // Simple JSON parsing for "command" field
  int cmdStart = json.indexOf("\"command\"");
  if (cmdStart == -1) return "";

  int colonPos = json.indexOf(":", cmdStart);
  if (colonPos == -1) return "";

  int quoteStart = json.indexOf("\"", colonPos);
  if (quoteStart == -1) return "";

  int quoteEnd = json.indexOf("\"", quoteStart + 1);
  if (quoteEnd == -1) return "";

  return json.substring(quoteStart + 1, quoteEnd);
}

String CommandHandler::extractParam(const String& json, const String& paramName) {
  // Simple JSON parsing for any parameter
  String searchStr = "\"" + paramName + "\"";
  int paramStart = json.indexOf(searchStr);
  if (paramStart == -1) return "";

  int colonPos = json.indexOf(":", paramStart);
  if (colonPos == -1) return "";

  int quoteStart = json.indexOf("\"", colonPos);
  if (quoteStart == -1) return "";

  int quoteEnd = json.indexOf("\"", quoteStart + 1);
  if (quoteEnd == -1) return "";

  return json.substring(quoteStart + 1, quoteEnd);
}

String CommandHandler::createResponse(const String& command, const String& data, bool success) {
  String response = "{";
  response += "\"type\":\"command_response\",";
  response += "\"command\":\"" + command + "\",";
  response += "\"success\":" + String(success ? "true" : "false") + ",";
  response += "\"timestamp\":" + String(millis()) + ",";
  response += "\"data\":" + data;
  response += "}";
  return response;
}

String CommandHandler::createErrorResponse(const String& error) {
  String response = "{";
  response += "\"type\":\"error\",";
  response += "\"success\":false,";
  response += "\"timestamp\":" + String(millis()) + ",";
  response += "\"error\":\"" + error + "\"";
  response += "}";
  return response;
}
