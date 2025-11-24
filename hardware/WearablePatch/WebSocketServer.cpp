#include "WebSocketServer.h"
#include "CommandHandler.h"

// Global instance pointer for callback
WebSocketServer* g_webSocketServer = nullptr;

// C-style callback wrapper
void webSocketEventCallback(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (g_webSocketServer) {
    g_webSocketServer->handleEvent(num, type, payload, length);
  }
}

WebSocketServer::WebSocketServer()
  : webSocket(WEBSOCKET_PORT),
    commandHandler(nullptr),
    clientConnected(false),
    clientNum(0),
    lastPingTime(0) {
  g_webSocketServer = this;
}

void WebSocketServer::setCommandHandler(CommandHandler* handler) {
  commandHandler = handler;
}

bool WebSocketServer::begin() {
  webSocket.begin();
  webSocket.onEvent(webSocketEventCallback);
  Serial.println("✓ WebSocket Server: Started on port " + String(WEBSOCKET_PORT));
  return true;
}

void WebSocketServer::loop() {
  webSocket.loop();

  // Send periodic ping to keep connection alive
  if (clientConnected && millis() - lastPingTime > WEBSOCKET_PING_INTERVAL) {
    sendPing();
  }
}

uint8_t WebSocketServer::getClientCount() {
  return webSocket.connectedClients();
}

// ========================================
// Real-time Data Streaming
// ========================================

void WebSocketServer::sendECGData(unsigned long timestamp, int value, bool leadsConnected) {
  if (!clientConnected) return;

  String json = "{";
  json += "\"type\":\"ecg\",";
  json += "\"ts\":" + String(timestamp) + ",";
  json += "\"val\":" + String(value) + ",";
  json += "\"leads\":\"" + String(leadsConnected ? "connected" : "off") + "\"";
  json += "}";

  sendJSON(json);
}

void WebSocketServer::sendSpO2Data(int32_t spo2, int8_t valid, long irValue, long redValue, bool fingerDetected) {
  if (!clientConnected) return;

  String json = "{";
  json += "\"type\":\"spo2\",";
  json += "\"spo2\":" + String(spo2) + ",";
  json += "\"valid\":" + String(valid) + ",";
  json += "\"ir\":" + String(irValue) + ",";
  json += "\"red\":" + String(redValue) + ",";
  json += "\"finger\":" + String(fingerDetected ? "true" : "false");
  json += "}";

  sendJSON(json);
}

void WebSocketServer::sendHeartRateData(int32_t heartRate, int8_t valid) {
  if (!clientConnected) return;

  String json = "{";
  json += "\"type\":\"heart_rate\",";
  json += "\"hr\":" + String(heartRate) + ",";
  json += "\"valid\":" + String(valid);
  json += "}";

  sendJSON(json);
}

void WebSocketServer::sendFingerRemoved() {
  if (!clientConnected) return;

  String json = "{\"type\":\"spo2\",\"finger\":false}";
  sendJSON(json);
}

// ========================================
// System Events
// ========================================

void WebSocketServer::sendSystemEvent(const String& event, const String& message) {
  if (!clientConnected) return;

  String json = "{";
  json += "\"type\":\"system_event\",";
  json += "\"event\":\"" + event + "\",";
  json += "\"message\":\"" + message + "\",";
  json += "\"timestamp\":" + String(millis());
  json += "}";

  sendJSON(json);
}

void WebSocketServer::sendPing() {
  if (!clientConnected) return;

  lastPingTime = millis();
  String json = "{\"type\":\"ping\",\"timestamp\":" + String(millis()) + "}";
  sendJSON(json);
}

// ========================================
// WebSocket Event Handler
// ========================================

void WebSocketServer::handleEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      {
        Serial.printf("[WS] Client #%u disconnected\n", num);
        clientConnected = false;
      }
      break;

    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[WS] Client #%u connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        clientConnected = true;
        clientNum = num;

        // Send welcome message
        String welcome = "{\"type\":\"system\",\"message\":\"Connected to ESP32 Medical Sensor System\",\"version\":\"3.0\"}";
        webSocket.sendTXT(num, welcome);
      }
      break;

    case WStype_TEXT:
      {
        Serial.printf("[WS] Received from #%u: %s\n", num, payload);
        processIncomingCommand(payload, length);
      }
      break;

    case WStype_ERROR:
      Serial.printf("[WS] Error on client #%u\n", num);
      break;

    default:
      break;
  }
}

// ========================================
// Helper Methods
// ========================================

void WebSocketServer::sendJSON(const String& json) {
  if (clientConnected) {
    String jsonCopy = json;  // Create mutable copy for sendTXT
    webSocket.sendTXT(clientNum, jsonCopy);
  }
}

void WebSocketServer::processIncomingCommand(uint8_t* payload, size_t length) {
  if (!commandHandler) {
    Serial.println("[WS] Command handler not initialized");
    String error = "{\"type\":\"error\",\"message\":\"Command handler not available\"}";
    sendJSON(error);
    return;
  }

  // Convert payload to String
  String command = "";
  for (size_t i = 0; i < length; i++) {
    command += (char)payload[i];
  }

  // Process command and send response
  String response = commandHandler->processCommand(command);
  sendJSON(response);
}
