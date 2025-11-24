#include "SystemMonitor.h"

SystemMonitor::SystemMonitor()
  : bootTime(0),
    minFreeHeap(0xFFFFFFFF) {
}

void SystemMonitor::begin() {
  bootTime = millis();
  minFreeHeap = ESP.getFreeHeap();
  Serial.println("✓ System Monitor: Initialized");
}

void SystemMonitor::update() {
  // Track minimum free heap over time
  uint32_t currentFree = ESP.getFreeHeap();
  if (currentFree < minFreeHeap) {
    minFreeHeap = currentFree;
  }
}

uint32_t SystemMonitor::getFreeHeap() const {
  return ESP.getFreeHeap();
}

uint32_t SystemMonitor::getMinFreeHeap() const {
  return minFreeHeap;
}

uint32_t SystemMonitor::getHeapSize() const {
  return ESP.getHeapSize();
}

uint32_t SystemMonitor::getUptime() const {
  return millis() - bootTime;
}

int8_t SystemMonitor::getWiFiRSSI() const {
  return WiFi.RSSI();
}

bool SystemMonitor::isWiFiConnected() const {
  return WiFi.status() == WL_CONNECTED;
}

String SystemMonitor::getChipModel() const {
  return String(ESP.getChipModel());
}

uint32_t SystemMonitor::getCpuFreqMHz() const {
  return ESP.getCpuFreqMHz();
}

uint32_t SystemMonitor::getFlashSize() const {
  return ESP.getFlashChipSize();
}

String SystemMonitor::getMacAddress() const {
  return WiFi.macAddress();
}

String SystemMonitor::getIPAddress() const {
  return WiFi.localIP().toString();
}

bool SystemMonitor::isMemoryHealthy() const {
  uint32_t freeHeap = getFreeHeap();
  return freeHeap > MIN_HEAP_WARNING;
}

bool SystemMonitor::isWiFiHealthy() const {
  if (!isWiFiConnected()) return false;
  return getWiFiRSSI() > WIFI_RSSI_WARNING;
}

String SystemMonitor::getOverallStatus() const {
  uint32_t freeHeap = getFreeHeap();
  int8_t rssi = getWiFiRSSI();
  bool wifiOk = isWiFiConnected();

  // Critical conditions
  if (freeHeap < MIN_HEAP_CRITICAL || (!wifiOk)) {
    return "critical";
  }

  // Warning conditions
  if (freeHeap < MIN_HEAP_WARNING || rssi < WIFI_RSSI_WARNING) {
    return "warning";
  }

  return "healthy";
}

String SystemMonitor::getStatusJSON() const {
  String json = "{";
  json += "\"status\":\"" + getOverallStatus() + "\",";
  json += "\"wifi\":\"" + String(isWiFiConnected() ? "connected" : "disconnected") + "\",";
  json += "\"uptime\":" + String(getUptime() / 1000) + ","; // seconds
  json += "\"freeHeap\":" + String(getFreeHeap()) + ",";
  json += "\"rssi\":" + String(getWiFiRSSI());
  json += "}";
  return json;
}

String SystemMonitor::getHealthJSON() const {
  String json = "{";
  json += "\"overall\":\"" + getOverallStatus() + "\",";
  json += "\"memory\":{";
  json += "\"healthy\":" + String(isMemoryHealthy() ? "true" : "false") + ",";
  json += "\"freeHeap\":" + String(getFreeHeap()) + ",";
  json += "\"minHeap\":" + String(getMinFreeHeap()) + ",";
  json += "\"totalHeap\":" + String(getHeapSize());
  json += "},";
  json += "\"wifi\":{";
  json += "\"healthy\":" + String(isWiFiHealthy() ? "true" : "false") + ",";
  json += "\"connected\":" + String(isWiFiConnected() ? "true" : "false") + ",";
  json += "\"rssi\":" + String(getWiFiRSSI());
  json += "},";
  json += "\"uptime\":" + String(getUptime() / 1000); // seconds
  json += "}";
  return json;
}

String SystemMonitor::getSystemInfoJSON() const {
  String json = "{";
  json += "\"chip\":\"" + getChipModel() + "\",";
  json += "\"cpuFreq\":" + String(getCpuFreqMHz()) + ",";
  json += "\"flashSize\":" + String(getFlashSize()) + ",";
  json += "\"mac\":\"" + getMacAddress() + "\",";
  json += "\"ip\":\"" + getIPAddress() + "\",";
  json += "\"uptime\":" + String(getUptime() / 1000); // seconds
  json += "}";
  return json;
}

String SystemMonitor::getMemoryJSON() const {
  String json = "{";
  json += "\"freeHeap\":" + String(getFreeHeap()) + ",";
  json += "\"minFreeHeap\":" + String(getMinFreeHeap()) + ",";
  json += "\"heapSize\":" + String(getHeapSize()) + ",";
  json += "\"heapUsagePercent\":" + String(100 - (getFreeHeap() * 100 / getHeapSize()));
  json += "}";
  return json;
}

String SystemMonitor::getNetworkJSON() const {
  String json = "{";
  json += "\"connected\":" + String(isWiFiConnected() ? "true" : "false") + ",";
  json += "\"ip\":\"" + getIPAddress() + "\",";
  json += "\"mac\":\"" + getMacAddress() + "\",";
  json += "\"rssi\":" + String(getWiFiRSSI()) + ",";
  json += "\"signalQuality\":\"";

  int8_t rssi = getWiFiRSSI();
  if (rssi > -50) json += "excellent";
  else if (rssi > -60) json += "good";
  else if (rssi > -70) json += "fair";
  else if (rssi > -80) json += "weak";
  else json += "poor";

  json += "\"";
  json += "}";
  return json;
}
