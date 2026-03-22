#include "OLEDDisplay.h"
#include "ECGSensor.h"
#include "SpO2Sensor.h"
#include "SystemMonitor.h"
#include "WiFiManager.h"

// ========================================
// Constructor
// ========================================
OLEDDisplay::OLEDDisplay()
  : display(OLED_WIDTH, OLED_HEIGHT, &Wire1, -1),
    ecgSensor(nullptr),
    spo2Sensor(nullptr),
    systemMonitor(nullptr),
    wifiManager(nullptr),
    currentScreen(SCREEN_DASHBOARD),
    displayActive(false),
    lastButtonPress(0),
    lastRefresh(0),
    lastButtonState(HIGH) {
}

// ========================================
// Set references to other modules
// ========================================
void OLEDDisplay::setSensorReferences(ECGSensor* ecg, SpO2Sensor* spo2,
                                       SystemMonitor* sysMon, WiFiManager* wifiMgr) {
  ecgSensor = ecg;
  spo2Sensor = spo2;
  systemMonitor = sysMon;
  wifiManager = wifiMgr;
}

// ========================================
// Initialize display, button, buzzer
// ========================================
bool OLEDDisplay::begin() {
  // Setup button with internal pull-up
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Initialize separate I2C bus for OLED (Wire1 on GPIO 16/17)
  // This keeps the OLED completely isolated from the SpO2 sensor's I2C bus
  Wire1.begin(OLED_I2C_SDA, OLED_I2C_SCL);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR, true, false)) {
    Serial.println("✗ OLED Display: SSD1306 not found at 0x3C!");
    displayActive = false;
    return false;
  }

  displayActive = true;
  Serial.println("✓ OLED Display: SSD1306 128x32 initialized");

  // Run boot animation
  drawBootSequence();

  // Start on dashboard
  currentScreen = SCREEN_DASHBOARD;
  lastRefresh = millis();
  lastButtonPress = millis();

  return true;
}

// ========================================
// Main update loop
// ========================================
void OLEDDisplay::update() {
  if (!displayActive) return;

  // Handle button input
  handleButton();

  // Auto-return to dashboard after timeout
  if (currentScreen != SCREEN_DASHBOARD &&
      (millis() - lastButtonPress > DISPLAY_AUTO_RETURN)) {
    currentScreen = SCREEN_DASHBOARD;
  }

  // Refresh screen at configured interval
  if (millis() - lastRefresh >= DISPLAY_REFRESH_INTERVAL) {
    drawCurrentScreen();
    lastRefresh = millis();
  }
}

DisplayScreen OLEDDisplay::getCurrentScreen() const {
  return currentScreen;
}

// ========================================
// Boot Animation Sequence (~3 seconds)
// ========================================
void OLEDDisplay::drawBootSequence() {
  drawBootFrame1();
  delay(1200);
  drawBootFrame2();
  delay(1000);
  drawBootFrame3();
  delay(800);
}

// Frame 1: CognivusLabs brand splash
void OLEDDisplay::drawBootFrame1() {
  display.clearDisplay();

  // Draw border lines expanding from center
  int centerX = OLED_WIDTH / 2;
  for (int i = 0; i <= centerX; i += 4) {
    display.drawLine(centerX - i, 0, centerX + i, 0, SSD1306_WHITE);
    display.drawLine(centerX - i, 31, centerX + i, 31, SSD1306_WHITE);
    display.display();
  }

  // Brand name — large centered text
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // "CognivusLabs" in larger appearance using size 2 for brand
  display.setTextSize(2);
  // "CognivusLabs" is 12 chars * 12px = 144px wide at size 2, too wide
  // Use abbreviated "Cognivus" then "Labs" below
  String brand = "Cognivus";
  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(brand, 0, 0, &x1, &y1, &w, &h);
  display.setCursor((OLED_WIDTH - w) / 2, 2);
  display.print(brand);

  // Subtitle
  display.setTextSize(1);
  String subtitle = "Labs Medical Systems";
  display.getTextBounds(subtitle, 0, 0, &x1, &y1, &w, &h);
  display.setCursor((OLED_WIDTH - w) / 2, 22);
  display.print(subtitle);

  display.display();
}

// Frame 2: Device info + progress bar
void OLEDDisplay::drawBootFrame2() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Title
  display.setTextSize(1);
  String title = "Medical Patch v3.0";
  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(title, 0, 0, &x1, &y1, &w, &h);
  display.setCursor((OLED_WIDTH - w) / 2, 0);
  display.print(title);

  // "Initializing..." text
  display.setCursor(24, 24);
  display.print("Initializing...");

  display.display();

  // Animated progress bar
  int barX = 8;
  int barY = 13;
  int barW = 112;
  int barH = 8;

  // Draw bar outline
  display.drawRect(barX, barY, barW, barH, SSD1306_WHITE);
  display.display();

  // Fill bar progressively
  for (int i = 0; i <= barW - 4; i += 3) {
    display.fillRect(barX + 2, barY + 2, i, barH - 4, SSD1306_WHITE);
    display.display();
    delay(8);
  }
  // Fill completely
  display.fillRect(barX + 2, barY + 2, barW - 4, barH - 4, SSD1306_WHITE);
  display.display();
}

// Frame 3: System ready with IP
void OLEDDisplay::drawBootFrame3() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Checkmark symbol + "System Ready" in larger text
  display.setTextSize(2);
  display.setCursor(4, 0);
  display.print((char)0xFB); // checkmark-like character
  display.setCursor(22, 0);
  display.print("Ready!");

  // Divider line
  display.drawLine(0, 18, 127, 18, SSD1306_WHITE);

  // IP address
  display.setTextSize(1);
  String ip = "IP: ";
  if (wifiManager && wifiManager->isConnected()) {
    ip += wifiManager->getIPAddress();
  } else {
    ip += "Not connected";
  }
  display.setCursor(0, 22);
  display.print(ip);

  display.display();
}

// ========================================
// Screen Router
// ========================================
void OLEDDisplay::drawCurrentScreen() {
  switch (currentScreen) {
    case SCREEN_DASHBOARD:     drawDashboard();      break;
    case SCREEN_SYSTEM_HEALTH: drawSystemHealth();    break;
    case SCREEN_WIFI_INFO:     drawWiFiInfo();        break;
    case SCREEN_NETWORK:       drawNetworkDetails();  break;
    case SCREEN_DEVICE_INFO:   drawDeviceInfo();      break;
    case SCREEN_SENSORS:       drawSensorStatus();    break;
    default:                   drawDashboard();       break;
  }
}

// ========================================
// Screen 0: Dashboard — Live vitals overview
// ========================================
void OLEDDisplay::drawDashboard() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Row 1: Heart rate + SpO2 (larger text)
  display.setTextSize(1);

  // Heart symbol + BPM
  display.setCursor(0, 0);
  display.print((char)0x03); // heart symbol
  if (spo2Sensor && spo2Sensor->isHeartRateValid()) {
    display.print(String(spo2Sensor->getHeartRate()));
    display.print(" BPM");
  } else {
    display.print("-- BPM");
  }

  // SpO2 on right side
  display.setCursor(74, 0);
  display.print("SpO2:");
  if (spo2Sensor && spo2Sensor->isSpo2Valid()) {
    display.print(String(spo2Sensor->getSpo2Value()));
    display.print("%");
  } else {
    display.print("--%");
  }

  // Divider line
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // Row 2: Status + WiFi signal
  display.setCursor(0, 13);
  if (systemMonitor) {
    String status = systemMonitor->getOverallStatus();
    drawStatusDot(0, 14, status == "healthy");
    display.setCursor(10, 13);
    // Capitalize first letter
    status[0] = toupper(status[0]);
    display.print(status);
  }

  // WiFi signal bars on right
  if (systemMonitor) {
    int8_t rssi = systemMonitor->getWiFiRSSI();
    drawSignalBars(100, 12, rssi);
    // Show dBm
    display.setCursor(74, 13);
    display.print(String(rssi));
    display.print("dB");
  }

  // Row 3: Uptime + Free heap
  display.setCursor(0, 24);
  if (systemMonitor) {
    display.print(formatUptime(systemMonitor->getUptime()));
  }

  display.setCursor(74, 24);
  if (systemMonitor) {
    display.print(String(systemMonitor->getFreeHeap() / 1024));
    display.print("KB");
  }

  display.display();
}

// ========================================
// Screen 1: System Health
// ========================================
void OLEDDisplay::drawSystemHealth() {
  display.clearDisplay();
  drawHeader("SYSTEM");

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  if (systemMonitor) {
    // Status line
    String status = systemMonitor->getOverallStatus();
    display.setCursor(0, 10);
    display.print("Status: ");
    drawStatusDot(48, 11, status == "healthy");
    display.setCursor(58, 10);
    status[0] = toupper(status[0]);
    display.print(status);

    // Heap
    display.setCursor(0, 19);
    display.print("Heap:");
    display.print(String(systemMonitor->getFreeHeap() / 1024));
    display.print("KB/");
    display.print(String(systemMonitor->getHeapSize() / 1024));
    display.print("KB");

    // Uptime
    display.setCursor(0, 28);
    display.print("Up: ");
    display.print(formatUptime(systemMonitor->getUptime()));
  }

  display.display();
}

// ========================================
// Screen 2: WiFi Info
// ========================================
void OLEDDisplay::drawWiFiInfo() {
  display.clearDisplay();
  drawHeader("WIFI");

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // SSID
  display.setCursor(0, 10);
  display.print("SSID:");
  display.print(WIFI_SSID);

  // IP Address
  display.setCursor(0, 19);
  display.print("IP:");
  if (wifiManager && wifiManager->isConnected()) {
    display.print(wifiManager->getIPAddress());
  } else {
    display.print("Disconnected");
  }

  // Signal bars + dBm
  display.setCursor(0, 28);
  display.print("Sig:");
  if (systemMonitor) {
    int8_t rssi = systemMonitor->getWiFiRSSI();
    drawSignalBars(28, 27, rssi);
    display.setCursor(60, 28);
    display.print(String(rssi));
    display.print("dBm");
  }

  display.display();
}

// ========================================
// Screen 3: Network Details
// ========================================
void OLEDDisplay::drawNetworkDetails() {
  display.clearDisplay();
  drawHeader("NETWORK");

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // MAC address (compact, no colons)
  display.setCursor(0, 10);
  display.print("MAC:");
  if (wifiManager) {
    String mac = wifiManager->getMACAddress();
    mac.replace(":", "");
    display.print(mac);
  }

  // Device name
  display.setCursor(0, 19);
  display.print("Dev:");
  if (wifiManager) {
    display.print(wifiManager->getDeviceName());
  }

  // Backend connection status
  display.setCursor(0, 28);
  display.print("Backend:");
  if (wifiManager && wifiManager->isRegistered()) {
    drawStatusDot(52, 29, true);
    display.setCursor(60, 28);
    display.print("Linked");
  } else {
    drawStatusDot(52, 29, false);
    display.setCursor(60, 28);
    display.print("Unlinked");
  }

  display.display();
}

// ========================================
// Screen 4: Device Info
// ========================================
void OLEDDisplay::drawDeviceInfo() {
  display.clearDisplay();
  drawHeader("DEVICE");

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // Device type
  display.setCursor(0, 10);
  display.print("ESP32 Medical Patch");

  // Firmware + CPU
  display.setCursor(0, 19);
  display.print("FW:v");
  display.print(FIRMWARE_VERSION);
  if (systemMonitor) {
    display.print(" ");
    display.print(String(systemMonitor->getCpuFreqMHz()));
    display.print("MHz");
  }

  // Flash size
  display.setCursor(0, 28);
  display.print("Flash:");
  if (systemMonitor) {
    display.print(String(systemMonitor->getFlashSize() / (1024 * 1024)));
    display.print("MB");
  }
  display.print(" ID:");
  if (wifiManager) {
    // Show last 4 of device ID
    String devId = wifiManager->getDeviceID();
    display.print(devId.substring(devId.length() - 4));
  }

  display.display();
}

// ========================================
// Screen 5: Sensor Status
// ========================================
void OLEDDisplay::drawSensorStatus() {
  display.clearDisplay();
  drawHeader("SENSORS");

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // ECG status
  display.setCursor(0, 10);
  display.print("ECG:  ");
  bool ecgActive = ecgSensor && ecgSensor->isActive();
  drawStatusDot(36, 11, ecgActive);
  display.setCursor(46, 10);
  display.print(ecgActive ? "Active" : "Inactive");

  // SpO2 status
  display.setCursor(0, 19);
  display.print("SpO2: ");
  bool spo2Active = spo2Sensor && spo2Sensor->isActive();
  drawStatusDot(36, 20, spo2Active);
  display.setCursor(46, 19);
  display.print(spo2Active ? "Active" : "Inactive");

  // Leads/Finger status
  display.setCursor(0, 28);
  if (ecgSensor) {
    display.print("Leads:");
    display.print(ecgSensor->areLeadsOff() ? "Off " : "On  ");
  }
  if (spo2Sensor) {
    display.print("Finger:");
    display.print(spo2Sensor->isFingerDetected() ? "Y" : "N");
  }

  display.display();
}

// ========================================
// UI Helpers
// ========================================

// Draw inverted header bar at top of screen
void OLEDDisplay::drawHeader(const char* title) {
  // Fill top 9 pixels as white bar
  display.fillRect(0, 0, OLED_WIDTH, 9, SSD1306_WHITE);

  // Draw title in black on white background
  display.setTextSize(1);
  display.setTextColor(SSD1306_BLACK);

  // Center the title with decorative dashes
  String headerText = "- ";
  headerText += title;
  headerText += " -";

  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(headerText, 0, 0, &x1, &y1, &w, &h);
  display.setCursor((OLED_WIDTH - w) / 2, 1);
  display.print(headerText);

  // Reset text color for content below
  display.setTextColor(SSD1306_WHITE);
}

// Draw WiFi signal bars (5 bars)
void OLEDDisplay::drawSignalBars(int x, int y, int8_t rssi) {
  // 5 bars: each 4px wide, 2px gap, heights 2,4,6,8,10
  int barWidth = 4;
  int gap = 1;
  int bars;

  if (rssi > -50)      bars = 5;  // Excellent
  else if (rssi > -60) bars = 4;  // Good
  else if (rssi > -70) bars = 3;  // Fair
  else if (rssi > -80) bars = 2;  // Weak
  else if (rssi > -90) bars = 1;  // Very weak
  else                  bars = 0;  // No signal

  for (int i = 0; i < 5; i++) {
    int barHeight = 2 + (i * 2);
    int barX = x + i * (barWidth + gap);
    int barY = y + (10 - barHeight); // Align to bottom

    if (i < bars) {
      display.fillRect(barX, barY, barWidth, barHeight, SSD1306_WHITE);
    } else {
      display.drawRect(barX, barY, barWidth, barHeight, SSD1306_WHITE);
    }
  }
}

// Draw status indicator dot
void OLEDDisplay::drawStatusDot(int x, int y, bool healthy) {
  if (healthy) {
    display.fillCircle(x + 3, y + 3, 3, SSD1306_WHITE);
  } else {
    display.drawCircle(x + 3, y + 3, 3, SSD1306_WHITE);
  }
}

// Draw a progress bar
void OLEDDisplay::drawProgressBar(int x, int y, int w, int h, int percent) {
  display.drawRect(x, y, w, h, SSD1306_WHITE);
  int fillWidth = ((w - 4) * percent) / 100;
  if (fillWidth > 0) {
    display.fillRect(x + 2, y + 2, fillWidth, h - 4, SSD1306_WHITE);
  }
}

// Format uptime from milliseconds to human-readable string
String OLEDDisplay::formatUptime(uint32_t ms) {
  uint32_t totalSeconds = ms / 1000;
  uint32_t hours = totalSeconds / 3600;
  uint32_t minutes = (totalSeconds % 3600) / 60;
  uint32_t seconds = totalSeconds % 60;

  String result = "";
  if (hours > 0) {
    result += String(hours) + "h ";
  }
  result += String(minutes) + "m ";
  result += String(seconds) + "s";
  return result;
}

// ========================================
// Button Handler with Debounce
// ========================================
void OLEDDisplay::handleButton() {
  bool buttonState = digitalRead(BUTTON_PIN);

  // Detect falling edge (button press, active LOW)
  if (buttonState == LOW && lastButtonState == HIGH) {
    // Debounce check
    if (millis() - lastButtonPress > BUTTON_DEBOUNCE) {
      lastButtonPress = millis();

      // Cycle to next screen
      currentScreen = static_cast<DisplayScreen>(
        (static_cast<int>(currentScreen) + 1) % SCREEN_COUNT
      );

      // Force immediate screen redraw
      drawCurrentScreen();
      lastRefresh = millis();

      Serial.print("OLED: Screen -> ");
      Serial.println(currentScreen);
    }
  }

  lastButtonState = buttonState;
}

