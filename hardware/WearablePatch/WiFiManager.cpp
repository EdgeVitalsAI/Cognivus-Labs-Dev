#include "WiFiManager.h"

WiFiManager::WiFiManager()
  : connected(false), registered(false) {
  // Generate unique device ID on construction
  deviceID = generateDeviceID();
  deviceName = generateDeviceName();
}

bool WiFiManager::connect() {
  Serial.println("\nConnecting to WiFi...");

  // Disconnect first to ensure clean connection
  WiFi.disconnect(true);
  delay(1000);

  // Set WiFi mode
  WiFi.mode(WIFI_STA);
  delay(100);

  // Start connection
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < WIFI_CONNECTION_TIMEOUT) {
    delay(500);
    Serial.print(".");
    attempts++;

    // If stuck, try reconnecting
    if (attempts > 0 && attempts % 20 == 0) {
      Serial.println("\nRetrying WiFi connection...");
      WiFi.disconnect();
      delay(500);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    connected = true;
    Serial.println("\n✓ WiFi: Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());
    Serial.print("Device ID: ");
    Serial.println(deviceID);
    Serial.print("Device Name: ");
    Serial.println(deviceName);

    // Auto-register with backend server
    Serial.println("\nRegistering device with backend...");
    if (registerWithBackend()) {
      Serial.println("✓ Device: Registered with backend successfully");
    } else {
      Serial.println("✗ Device: Registration failed (will retry)");
    }

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

String WiFiManager::getMACAddress() const {
  return WiFi.macAddress();
}

String WiFiManager::getDeviceID() const {
  return deviceID;
}

String WiFiManager::getDeviceName() const {
  return deviceName;
}

bool WiFiManager::isRegistered() const {
  return registered;
}

// Generate unique Device ID from MAC address
String WiFiManager::generateDeviceID() {
  String mac = WiFi.macAddress();
  // Remove colons and convert to uppercase
  mac.replace(":", "");
  mac.toUpperCase();
  // Format: ESP32-MACADDRESS (e.g., ESP32-A4CF12345678)
  return "ESP32-" + mac;
}

// Generate device name (can be customized later)
String WiFiManager::generateDeviceName() {
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  String lastFour = mac.substring(mac.length() - 4);
  lastFour.toUpperCase();
  // Format: Medical-Patch-XXXX (e.g., Medical-Patch-5678)
  return "Medical-Patch-" + lastFour;
}

// Register device with backend server
bool WiFiManager::registerWithBackend() {
  if (!isConnected()) {
    Serial.println("Cannot register: WiFi not connected");
    return false;
  }

  return sendRegistrationRequest();
}

// Send HTTP POST request to register device
bool WiFiManager::sendRegistrationRequest() {
  HTTPClient http;

  // Construct registration URL
  String url = String(BACKEND_SERVER_URL) + "/api/devices/register";

  Serial.print("Sending registration request to: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Build JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + deviceID + "\",";
  jsonPayload += "\"device_name\":\"" + deviceName + "\",";
  jsonPayload += "\"mac_address\":\"" + getMACAddress() + "\",";
  jsonPayload += "\"ip_address\":\"" + getIPAddress() + "\",";
  jsonPayload += "\"firmware_version\":\"" + String(FIRMWARE_VERSION) + "\",";
  jsonPayload += "\"device_type\":\"ESP32_MEDICAL_PATCH\"";
  jsonPayload += "}";

  Serial.print("Payload: ");
  Serial.println(jsonPayload);

  // Send POST request
  int httpCode = http.POST(jsonPayload);

  Serial.print("HTTP Response Code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);

    // Check if registration was successful (200 or 201)
    if (httpCode == 200 || httpCode == 201) {
      registered = true;
      http.end();
      return true;
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  registered = false;
  return false;
}

// Send heartbeat to backend server
bool WiFiManager::sendHeartbeat() {
  if (!isConnected()) {
    return false;
  }

  HTTPClient http;
  String url = String(BACKEND_SERVER_URL) + "/api/devices/" + deviceID + "/heartbeat";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Send POST request (empty body)
  int httpCode = http.POST("{}");

  if (httpCode == 200 || httpCode == 201) {
    http.end();
    return true;
  }

  http.end();
  return false;
}
