#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include "Config.h"

/**
 * WiFiManager Class
 * Handles WiFi connection initialization and status monitoring
 */
class WiFiManager {
public:
  WiFiManager();

  // Connection management
  bool connect();
  bool isConnected() const;
  String getIPAddress() const;

private:
  bool connected;
};

#endif // WIFI_MANAGER_H
