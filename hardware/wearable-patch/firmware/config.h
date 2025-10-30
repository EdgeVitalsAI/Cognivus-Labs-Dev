#ifndef CONFIG_H
#define CONFIG_H

// WiFi credentials
#define WIFI_SSID "POCO X3 NFC"
#define WIFI_PASSWORD "66wathsala"

// Server ports
#define HTTP_PORT 80
#define WS_PORT 81

// ECG Configuration
#define ECG_PIN 34
#define ECG_LO_PLUS 25
#define ECG_LO_MINUS 26
#define ECG_SAMPLE_RATE 250
#define ECG_SEND_EVERY 10  // Send every 10th sample

// I2C Configuration
#define I2C_SDA 21
#define I2C_SCL 22

// SpO2 Configuration
#define SPO2_BUFFER_LENGTH 100
#define SPO2_SAMPLE_INTERVAL 40    // ms
#define SPO2_SEND_INTERVAL 2000    // ms
#define SPO2_FINGER_THRESHOLD 50000

// SpO2 Sensor Settings
#define SPO2_LED_BRIGHTNESS 60
#define SPO2_SAMPLE_AVERAGE 4
#define SPO2_LED_MODE 2
#define SPO2_SAMPLE_RATE 100
#define SPO2_PULSE_WIDTH 411
#define SPO2_ADC_RANGE 4096

// System
#define SERIAL_BAUD 115200
#define PING_INTERVAL 5000

#endif