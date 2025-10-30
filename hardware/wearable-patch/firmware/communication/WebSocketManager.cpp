#include "WebSocketManager.h"

WebSocketManager* WebSocketManager::instance = nullptr;

WebSocketManager::WebSocketManager(int port, int pingInt) {
    webSocket = new WebSocketsServer(port);
    clientConnected = false;
    pingInterval = pingInt;
    lastPingTime = 0;
    instance = this;
}

bool WebSocketManager::begin() {
    webSocket->begin();
    webSocket->onEvent(webSocketEventCallback);
    Serial.println("✓ WebSocket: Started on port 81");
    return true;
}

void WebSocketManager::loop() {
    webSocket->loop();
    
    // Send periodic ping
    if (clientConnected && millis() - lastPingTime > pingInterval) {
        lastPingTime = millis();
        String ping = "{\"type\":\"ping\",\"time\":" + String(millis()) + "}";
        webSocket->sendTXT(clientNum, ping);
    }
}

bool WebSocketManager::sendECGData(unsigned long timestamp, int value, bool leadsOff) {
    if (!clientConnected) return false;
    
    String data = "{\"type\":\"ecg\",\"ts\":" + String(timestamp) + 
                  ",\"val\":" + String(value) + 
                  ",\"leads\":\"" + String(leadsOff ? "disconnected" : "connected") + "\"}";
    webSocket->sendTXT(clientNum, data);
    return true;
}

bool WebSocketManager::sendSpO2Data(int32_t spo2, bool valid, long ir, long red, bool finger) {
    if (!clientConnected) return false;
    
    if (!finger) {
        webSocket->sendTXT(clientNum, "{\"type\":\"spo2\",\"finger\":false}");
    } else {
        String data = "{\"type\":\"spo2\",\"spo2\":" + String(spo2) + 
                     ",\"valid\":" + String(valid ? "true" : "false") + 
                     ",\"ir\":" + String(ir) + 
                     ",\"red\":" + String(red) + 
                     ",\"finger\":true}";
        webSocket->sendTXT(clientNum, data);
    }
    return true;
}

bool WebSocketManager::sendSystemMessage(String message, bool ecgActive, bool spo2Active) {
    if (!clientConnected) return false;
    
    String msg = "{\"type\":\"system\",\"msg\":\"" + message + 
                 "\",\"ecg\":" + String(ecgActive ? "true" : "false") + 
                 ",\"spo2\":" + String(spo2Active ? "true" : "false") + "}";
    webSocket->sendTXT(clientNum, msg);
    return true;
}

bool WebSocketManager::isClientConnected() {
    return clientConnected;
}

void WebSocketManager::webSocketEventCallback(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    if (instance) {
        instance->webSocketEvent(num, type, payload, length);
    }
}

void WebSocketManager::webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] WebSocket Disconnected\n", num);
            clientConnected = false;
            break;
            
        case WStype_CONNECTED:
            {
                IPAddress ip = webSocket->remoteIP(num);
                Serial.printf("[%u] WebSocket Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
                clientConnected = true;
                clientNum = num;
            }
            break;
            
        case WStype_TEXT:
            Serial.printf("[%u] Received: %s\n", num, payload);
            break;
    }
}