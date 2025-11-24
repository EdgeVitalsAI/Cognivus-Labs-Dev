#ifndef WEBSOCKET_SERVER_H
#define WEBSOCKET_SERVER_H

#include <Arduino.h>
#include <WebSocketsServer.h>
#include "Config.h"

// Forward declarations
class CommandHandler;

/**
 * WebSocketServer Class
 *
 * Manages bidirectional WebSocket communication for:
 * - Real-time sensor data streaming (ECG, SpO2, future sensors)
 * - JSON command processing from remote clients
 * - System event notifications
 *
 * This is a lightweight, non-blocking implementation optimized for
 * continuous data streaming without overloading the ESP32.
 *
 * Data Format:
 * - Outbound: JSON messages with sensor readings
 * - Inbound: JSON commands for remote control/troubleshooting
 */
class WebSocketServer {
public:
  WebSocketServer();

  // Initialization and core loop
  bool begin();
  void loop();

  // Set command handler reference
  void setCommandHandler(CommandHandler* handler);

  // Connection status
  bool isClientConnected() const { return clientConnected; }
  uint8_t getClientCount();

  // Real-time data streaming
  void sendECGData(unsigned long timestamp, int value, bool leadsConnected);
  void sendSpO2Data(int32_t spo2, int8_t valid, long irValue, long redValue, bool fingerDetected);
  void sendHeartRateData(int32_t heartRate, int8_t valid);
  void sendFingerRemoved();

  // System events
  void sendSystemEvent(const String& event, const String& message);
  void sendPing();

  // WebSocket event handler (must be public for callback)
  void handleEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);

private:
  WebSocketsServer webSocket;
  CommandHandler* commandHandler;

  bool clientConnected;
  uint8_t clientNum;
  unsigned long lastPingTime;

  // Helper methods
  void sendJSON(const String& json);
  void processIncomingCommand(uint8_t* payload, size_t length);
};

// Global instance for callback binding
extern WebSocketServer* g_webSocketServer;

// C-style callback wrapper for WebSocketsServer
void webSocketEventCallback(uint8_t num, WStype_t type, uint8_t* payload, size_t length);

#endif // WEBSOCKET_SERVER_H
