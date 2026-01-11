#include "Config.h"

// WiFi credentials - defined once here to avoid multiple definition errors
const char* WIFI_SSID = "CakeNet";
const char* WIFI_PASSWORD = "ignite@2006";

// Backend server configuration
// NOTE: Admin panel runs on port 8001 with cognivus_health database
// This is where devices should register to be visible in the admin panel
const char* BACKEND_SERVER_URL = "http://192.168.1.9:8001";
