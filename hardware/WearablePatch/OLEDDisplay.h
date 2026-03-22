#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Config.h"

// Forward declarations
class ECGSensor;
class SpO2Sensor;
class SystemMonitor;
class WiFiManager;

/**
 * OLEDDisplay Class
 *
 * Manages a 0.91" 128x32 SSD1306 OLED display on a SEPARATE I2C bus (Wire1).
 * Uses GPIO 16 (SDA) and GPIO 17 (SCL) — completely independent from
 * the SpO2 sensor's I2C bus (Wire, GPIO 21/22).
 *
 * Provides boot animation, 6 info screens cycled by push button,
 * auto-return to dashboard, and buzzer click feedback.
 */

enum DisplayScreen {
  SCREEN_DASHBOARD = 0,
  SCREEN_SYSTEM_HEALTH,
  SCREEN_WIFI_INFO,
  SCREEN_NETWORK,
  SCREEN_DEVICE_INFO,
  SCREEN_SENSORS,
  SCREEN_COUNT  // Total number of screens
};

class OLEDDisplay {
public:
  OLEDDisplay();

  // Set references to other modules (call before begin)
  void setSensorReferences(ECGSensor* ecg, SpO2Sensor* spo2,
                           SystemMonitor* sysMon, WiFiManager* wifiMgr);

  // Initialize display, button, buzzer, and run boot animation
  bool begin();

  // Main update — call in loop(), handles button + screen refresh
  void update();

  // Get current screen
  DisplayScreen getCurrentScreen() const;

private:
  Adafruit_SSD1306 display;

  // Module references
  ECGSensor* ecgSensor;
  SpO2Sensor* spo2Sensor;
  SystemMonitor* systemMonitor;
  WiFiManager* wifiManager;

  // State
  DisplayScreen currentScreen;
  bool displayActive;
  unsigned long lastButtonPress;
  unsigned long lastRefresh;
  bool lastButtonState;

  // Boot animation
  void drawBootSequence();
  void drawBootFrame1();
  void drawBootFrame2();
  void drawBootFrame3();

  // Screen draw methods
  void drawCurrentScreen();
  void drawDashboard();
  void drawSystemHealth();
  void drawWiFiInfo();
  void drawNetworkDetails();
  void drawDeviceInfo();
  void drawSensorStatus();

  // UI helpers
  void drawHeader(const char* title);
  void drawSignalBars(int x, int y, int8_t rssi);
  void drawStatusDot(int x, int y, bool healthy);
  void drawProgressBar(int x, int y, int w, int h, int percent);
  String formatUptime(uint32_t ms);

  // Button
  void handleButton();
};

#endif // OLED_DISPLAY_H
