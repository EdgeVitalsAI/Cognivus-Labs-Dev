#include "config.h"
#include "sensors/ECGSensor.h"
#include "sensors/SpO2Sensor.h"
#include "communication/WebSocketManager.h"
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>

// Initialize components
ECGSensor ecg(ECG_PIN, ECG_LO_PLUS, ECG_LO_MINUS, ECG_SAMPLE_RATE, ECG_SEND_EVERY);
SpO2Sensor spo2(SPO2_BUFFER_LENGTH, SPO2_SAMPLE_INTERVAL, SPO2_SEND_INTERVAL, SPO2_FINGER_THRESHOLD);
WebSocketManager wsManager(WS_PORT, PING_INTERVAL);
WebServer server(HTTP_PORT);

void setup() {
    Serial.begin(SERIAL_BAUD);
    Serial.println("\n\n=== Medical Sensor System Initializing ===");
    
    // Initialize sensors
    ecg.begin();
    
    Wire.begin(I2C_SDA, I2C_SCL);
    spo2.begin(Wire);
    
    // Connect WiFi
    Serial.println("\nConnecting to WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✓ WiFi: Connected");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\n✗ WiFi: Connection failed");
    }
    
    // Start WebSocket
    wsManager.begin();
    
    // Setup web server (handlers defined in separate file)
    setupWebServer();
    server.begin();
    Serial.println("✓ Web Server: Started on port 80");
    
    Serial.println("\n=== System Ready ===");
    Serial.println("Dashboard: http://" + WiFi.localIP().toString());
    Serial.println("========================\n");
}

void loop() {
    server.handleClient();
    wsManager.loop();
    
    // Handle ECG
    if (ecg.update()) {
        wsManager.sendECGData(ecg.getTimestamp(), ecg.getValue(), ecg.areLeadsOff());
    }
    
    // Handle SpO2
    spo2.update();
    if (spo2.shouldSendData()) {
        wsManager.sendSpO2Data(spo2.getSpO2(), spo2.isValidSpO2(), 
                               spo2.getIR(), spo2.getRed(), spo2.isFingerDetected());
    }
    
    delay(1);
}

// Web server setup in separate file
void setupWebServer() {
    server.on("/", handleRoot);
    server.on("/api/v1/status", handleStatus);
    server.on("/api/v1/ecg-raw", handleECGRaw);
    server.on("/api/v1/spo2-raw", handleSpO2Raw);
}

// Handler functions (move to web/WebServerManager.cpp later)
void handleRoot() {
    // Include dashboard HTML from dashboard.h
    extern const char dashboard_html[];
    server.send(200, "text/html", dashboard_html);
}

void handleStatus() {
    String json = "{";
    json += "\"ecgActive\":" + String(ecg.isActiveSensor() ? "true" : "false") + ",";
    json += "\"spo2Active\":" + String(spo2.isActiveSensor() ? "true" : "false") + ",";
    json += "\"wifiConnected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
    json += "\"wsConnected\":" + String(wsManager.isClientConnected() ? "true" : "false") + ",";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\"";
    json += "}";
    
    server.send(200, "application/json", json);
}

void handleECGRaw() {
    if (!ecg.isActiveSensor()) {
        server.send(503, "application/json", "{\"error\":\"ECG sensor not active\"}");
        return;
    }
    
    String json = "{";
    json += "\"timestamp\":" + String(ecg.getTimestamp()) + ",";
    json += "\"value\":" + String(ecg.getValue()) + ",";
    json += "\"leadsOff\":" + String(ecg.areLeadsOff() ? "true" : "false");
    json += "}";
    
    server.send(200, "application/json", json);
}

void handleSpO2Raw() {
    if (!spo2.isActiveSensor()) {
        server.send(503, "application/json", "{\"error\":\"SpO2 sensor not active\"}");
        return;
    }
    
    String json = "{";
    json += "\"spo2\":" + String(spo2.getSpO2()) + ",";
    json += "\"valid\":" + String(spo2.isValidSpO2()) + ",";
    json += "\"fingerDetected\":" + String(spo2.isFingerDetected() ? "true" : "false") + ",";
    json += "\"ir\":" + String(spo2.getIR()) + ",";
    json += "\"red\":" + String(spo2.getRed());
    json += "}";
    
    server.send(200, "application/json", json);
}