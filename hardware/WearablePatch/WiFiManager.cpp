#include "WiFiManager.h"

WiFiManager::WiFiManager()
  : connected(false) {
}

bool WiFiManager::connect() {
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < WIFI_CONNECTION_TIMEOUT) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    connected = true;
    Serial.println("\n✓ WiFi: Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    connected = false;
    Serial.println("\n✗ WiFi: Connection failed");
    return false;
  }
}

bool WiFiManager::isConnected() const {
  return (WiFi.status() == WL_CONNECTED);
}

String WiFiManager::getIPAddress() const {
  return WiFi.localIP().toString();
}
