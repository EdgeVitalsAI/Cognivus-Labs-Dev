#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "Config.h"

/**
 * WiFiManager Class
 * Handles WiFi connection initialization, status monitoring,
 * and automatic device registration with backend server
 */
class WiFiManager {
public:
  WiFiManager();

  // Connection management
  bool connect();
  bool isConnected() const;
  String getIPAddress() const;
  String getMACAddress() const;

  // Device identification
  String getDeviceID() const;
  String getDeviceName() const;

  // Backend registration
  bool registerWithBackend();
  bool isRegistered() const;

private:
  bool connected;
  bool registered;
  String deviceID;
  String deviceName;

  // Helper methods
  String generateDeviceID();
  String generateDeviceName();
  bool sendRegistrationRequest();
};

#endif // WIFI_MANAGER_H
