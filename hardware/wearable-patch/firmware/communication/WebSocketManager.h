#ifndef WEBSOCKET_MANAGER_H
#define WEBSOCKET_MANAGER_H

#include <Arduino.h>
#include <WebSocketsServer.h>

class WebSocketManager {
private:
    WebSocketsServer* webSocket;
    bool clientConnected;
    uint8_t clientNum;
    unsigned long lastPingTime;
    int pingInterval;
    
    static void webSocketEventCallback(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
    static WebSocketManager* instance;

public:
    WebSocketManager(int port, int pingInt);
    bool begin();
    void loop();
    
    bool sendECGData(unsigned long timestamp, int value, bool leadsOff);
    bool sendSpO2Data(int32_t spo2, bool valid, long ir, long red, bool finger);
    bool sendSystemMessage(String message, bool ecgActive, bool spo2Active);
    
    bool isClientConnected();
    void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
};

#endif