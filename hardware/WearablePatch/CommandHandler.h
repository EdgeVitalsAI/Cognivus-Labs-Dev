#ifndef COMMAND_HANDLER_H
#define COMMAND_HANDLER_H

#include <Arduino.h>
#include "Config.h"

// Forward declarations
class ECGSensor;
class SpO2Sensor;
class SystemMonitor;

/**
 * CommandHandler Class
 *
 * Processes JSON commands received via WebSocket for remote troubleshooting
 * and control. Supports diagnostic commands, sensor queries, and system operations.
 *
 * Command format: {"command": "commandName", "param1": "value1", ...}
 *
 * Supported commands:
 * - status: Get overall system status
 * - health: Get system health metrics
 * - sensors: Get all sensor states
 * - check_sensor: Check specific sensor (ecg/spo2)
 * - memory: Get memory information
 * - network: Get network information
 * - system_info: Get hardware information
 * - uptime: Get system uptime
 * - reset_stats: Reset statistics
 * - ping: Connection test
 * - help: List available commands
 */
class CommandHandler {
public:
  CommandHandler();

  // Set sensor and monitor references
  void setSensorReferences(ECGSensor* ecg, SpO2Sensor* spo2, SystemMonitor* monitor);

  // Main command processing
  String processCommand(const String& jsonCommand);

private:
  // Sensor references
  ECGSensor* ecgSensor;
  SpO2Sensor* spo2Sensor;
  SystemMonitor* systemMonitor;

  // Command processors
  String handleStatus();
  String handleHealth();
  String handleSensors();
  String handleCheckSensor(const String& sensorName);
  String handleMemory();
  String handleNetwork();
  String handleSystemInfo();
  String handleUptime();
  String handleResetStats();
  String handlePing();
  String handleHelp();
  String handleECGRaw();
  String handleSpO2Raw();
  String handleReboot();
  String handleWiFiScan();

  // Helper functions
  String extractCommand(const String& json);
  String extractParam(const String& json, const String& paramName);
  String createResponse(const String& command, const String& data, bool success = true);
  String createErrorResponse(const String& error);
};

#endif // COMMAND_HANDLER_H
