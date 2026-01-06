#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ========================================
// System Information
// ========================================
#define FIRMWARE_VERSION "3.0.0"
#define DEVICE_NAME "ESP32-MedicalSensor"

// ========================================
// WiFi Configuration
// ========================================
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;
constexpr int WIFI_CONNECTION_TIMEOUT = 20; // seconds

// ========================================
// ECG Sensor Configuration (AD8232)
// ========================================
constexpr int ECG_PIN = 34;              // ECG output pin (ADC1: 32-39)
constexpr int LO_PLUS = 25;              // Leads-off detection +
constexpr int LO_MINUS = 26;             // Leads-off detection -
constexpr int ECG_SAMPLE_RATE = 250;     // Hz
constexpr unsigned long ECG_SAMPLE_INTERVAL = 1000000 / ECG_SAMPLE_RATE; // microseconds
constexpr int ECG_SEND_EVERY = 10;       // Send every Nth sample (25Hz over WebSocket)
constexpr int ECG_DEBUG_INTERVAL = 250;  // Print debug every N samples (10 seconds at 25Hz)

// ========================================
// SpO2 Sensor Configuration (MAX30102)
// ========================================
constexpr int SPO2_I2C_SDA = 21;         // I2C SDA pin
constexpr int SPO2_I2C_SCL = 22;         // I2C SCL pin
constexpr byte SPO2_LED_BRIGHTNESS = 60;
constexpr byte SPO2_SAMPLE_AVERAGE = 4;
constexpr byte SPO2_LED_MODE = 2;
constexpr byte SPO2_SAMPLE_RATE = 100;
constexpr int SPO2_PULSE_WIDTH = 411;
constexpr int SPO2_ADC_RANGE = 4096;
constexpr int SPO2_RED_AMPLITUDE = 0x0A;
constexpr int SPO2_GREEN_AMPLITUDE = 0;
constexpr int32_t SPO2_BUFFER_LENGTH = 100;
constexpr int SPO2_FINGER_THRESHOLD = 50000;  // IR threshold for finger detection
constexpr unsigned long SPO2_SAMPLE_INTERVAL = 40;  // milliseconds
constexpr unsigned long SPO2_SEND_INTERVAL = 2000;  // milliseconds (WebSocket update rate)

// ========================================
// Backend Server Configuration
// ========================================
extern const char* BACKEND_SERVER_URL;   // Backend API URL (e.g., "http://192.168.1.100:8000")
constexpr unsigned long REGISTRATION_RETRY_INTERVAL = 10000; // milliseconds

// ========================================
// Server Configuration
// ========================================
constexpr int WEB_SERVER_PORT = 80;      // REST API port (JSON only, no HTML)
constexpr int WEBSOCKET_PORT = 81;       // WebSocket port for real-time streaming
constexpr unsigned long WEBSOCKET_PING_INTERVAL = 5000; // milliseconds

// ========================================
// System Configuration
// ========================================
constexpr unsigned long SERIAL_BAUD_RATE = 115200;
constexpr int LOOP_DELAY = 1;            // milliseconds (prevent watchdog issues)
constexpr unsigned long SYSTEM_MONITOR_UPDATE_INTERVAL = 1000; // milliseconds

// ========================================
// Future Sensor Expansion Pins
// ========================================
// Reserve pins for future sensors:
// - Temperature sensor: GPIO 32
// - Accelerometer: GPIO 33, 27
// - Additional analog sensors: GPIO 35, 36, 39

#endif // CONFIG_H
