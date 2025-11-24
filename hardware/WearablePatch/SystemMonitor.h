#ifndef SYSTEM_MONITOR_H
#define SYSTEM_MONITOR_H

#include <Arduino.h>
#include <WiFi.h>
#include "Config.h"

/**
 * SystemMonitor Class
 *
 * Tracks and reports system health metrics including:
 * - Memory usage (heap, PSRAM)
 * - Uptime tracking
 * - WiFi signal strength
 * - CPU and system information
 *
 * Provides lightweight JSON responses for API endpoints
 * and command handling without heavy processing overhead.
 */
class SystemMonitor {
public:
  SystemMonitor();

  // Initialization
  void begin();

  // Update monitoring (call periodically)
  void update();

  // System health metrics
  uint32_t getFreeHeap() const;
  uint32_t getMinFreeHeap() const;
  uint32_t getHeapSize() const;
  uint32_t getUptime() const;        // milliseconds
  int8_t getWiFiRSSI() const;
  bool isWiFiConnected() const;

  // System information
  String getChipModel() const;
  uint32_t getCpuFreqMHz() const;
  uint32_t getFlashSize() const;
  String getMacAddress() const;
  String getIPAddress() const;

  // Health status
  bool isMemoryHealthy() const;      // True if enough free heap
  bool isWiFiHealthy() const;        // True if WiFi connected with good signal
  String getOverallStatus() const;   // "healthy", "warning", "critical"

  // JSON builders for API responses
  String getStatusJSON() const;
  String getHealthJSON() const;
  String getSystemInfoJSON() const;
  String getMemoryJSON() const;
  String getNetworkJSON() const;

private:
  unsigned long bootTime;
  uint32_t minFreeHeap;

  // Health thresholds
  static constexpr uint32_t MIN_HEAP_WARNING = 50000;   // 50KB
  static constexpr uint32_t MIN_HEAP_CRITICAL = 20000;  // 20KB
  static constexpr int8_t WIFI_RSSI_WARNING = -80;      // dBm
  static constexpr int8_t WIFI_RSSI_CRITICAL = -90;     // dBm
};

#endif // SYSTEM_MONITOR_H
