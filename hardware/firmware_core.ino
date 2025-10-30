#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

// WiFi credentials
const char* ssid = "POCO X3 NFC";
const char* password = "66wathsala";

// Create instances
MAX30105 particleSensor;
WebServer server(80);
WebSocketsServer webSocket(81);

// ECG sensor pins
const int ECG_PIN = 34;      // ECG output pin (use ADC1 pins: 32-39)
const int LO_PLUS = 25;      // Leads-off detection +
const int LO_MINUS = 26;     // Leads-off detection -
const int ECG_SAMPLE_RATE = 250; // Hz
const unsigned long ECG_SAMPLE_INTERVAL = 1000000 / ECG_SAMPLE_RATE; // microseconds
unsigned long lastECGSampleTime = 0;
bool ecgLeadsOff = false;

// SpO2 calculation variables
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t bufferLength = 100;
int32_t spo2;
int8_t validSPO2;
int32_t heartRate;
int8_t validHeartRate;

bool fingerDetected = false;
bool spo2Ready = false;
unsigned long lastSpo2Update = 0;
int spo2SampleCount = 0;

// Status flags
bool ecgSensorActive = false;
bool spo2SensorActive = false;

// WebSocket client tracking
bool wsClientConnected = false;
uint8_t wsClientNum = 0;
unsigned long lastPingTime = 0;

// Rate limiting for WebSocket (send every Nth sample)
int ecgSendCounter = 0;
const int ECG_SEND_EVERY = 10; // Send every 10th ECG sample (25Hz instead of 250Hz)

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Medical Sensor System Initializing ===");

  // Initialize ECG sensor pins
  pinMode(LO_PLUS, INPUT);
  pinMode(LO_MINUS, INPUT);
  pinMode(ECG_PIN, INPUT);
  ecgSensorActive = true;
  Serial.println("✓ ECG Sensor: Initialized");

  // Initialize I2C for MAX30102
  Wire.begin(21, 22); // SDA=21, SCL=22 for ESP32

  // Initialize MAX30102 sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("✗ SpO2 Sensor: MAX30102 not found!");
    spo2SensorActive = false;
  } else {
    Serial.println("✓ SpO2 Sensor: MAX30102 initialized");
    spo2SensorActive = true;
    
    // Configure sensor
    byte ledBrightness = 60;
    byte sampleAverage = 4;
    byte ledMode = 2;
    byte sampleRate = 100;
    int pulseWidth = 411;
    int adcRange = 4096;
    
    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  // Connect to WiFi
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi: Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi: Connection failed");
  }

  // Setup WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✓ WebSocket: Started on port 81");

  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/api/v1/status", handleStatus);
  server.on("/api/v1/ecg-raw", handleECGRaw);
  server.on("/api/v1/spo2-raw", handleSpO2Raw);
  server.begin();
  Serial.println("✓ Web Server: Started on port 80");
  
  Serial.println("\n=== System Ready ===");
  Serial.println("Dashboard: http://" + WiFi.localIP().toString());
  Serial.println("WebSocket: ws://" + WiFi.localIP().toString() + ":81");
  Serial.println("========================\n");

  // Initialize values
  spo2 = 0;
  validSPO2 = 0;
}

void loop() {
  server.handleClient();
  webSocket.loop();
  
  // Send periodic ping to keep connection alive
  if (wsClientConnected && millis() - lastPingTime > 5000) {
    lastPingTime = millis();
    String ping = "{\"type\":\"ping\",\"time\":" + String(millis()) + "}";
    webSocket.sendTXT(wsClientNum, ping);
  }
  
  // Handle ECG sampling at 250Hz (but send at reduced rate)
  if (ecgSensorActive) {
    unsigned long currentTime = micros();
    
    if (currentTime - lastECGSampleTime >= ECG_SAMPLE_INTERVAL) {
      lastECGSampleTime = currentTime;
      ecgSendCounter++;
      
      // Check if leads are properly connected
      if ((digitalRead(LO_PLUS) == 1) || (digitalRead(LO_MINUS) == 1)) {
        ecgLeadsOff = true;
      } else {
        ecgLeadsOff = false;
        
        // Read ECG value
        int ecgValue = analogRead(ECG_PIN);
        
        // Send via WebSocket every Nth sample to avoid overwhelming connection
        if (ecgSendCounter >= ECG_SEND_EVERY && wsClientConnected) {
          ecgSendCounter = 0;
          
          // Create compact JSON
          String ecgData = "{\"type\":\"ecg\",\"ts\":" + String(currentTime) + 
                          ",\"val\":" + String(ecgValue) + ",\"leads\":\"connected\"}";
          webSocket.sendTXT(wsClientNum, ecgData);
          
          // Debug print occasionally
          static int debugCounter = 0;
          debugCounter++;
          if (debugCounter >= 250) { // Print every 10 seconds
            debugCounter = 0;
            Serial.printf("ECG: Sending value %d via WebSocket\n", ecgValue);
          }
        }
      }
    }
  }
  
  // Handle SpO2 sensor
  if (spo2SensorActive) {
    long irValue = particleSensor.getIR();
    
    // Check if finger is detected
    if (irValue < 50000) {
      if (fingerDetected) {
        // Send finger removed message
        if (wsClientConnected) {
          webSocket.sendTXT(wsClientNum, "{\"type\":\"spo2\",\"finger\":false}");
        }
      }
      fingerDetected = false;
      spo2 = 0;
      spo2Ready = false;
      spo2SampleCount = 0;
      validSPO2 = 0;
    } else {
      fingerDetected = true;
      
      // SpO2 calculation - collect samples in background
      if (millis() - lastSpo2Update > 40) { // Sample every 40ms
        lastSpo2Update = millis();
        
        if (spo2SampleCount < 100) {
          // Collecting initial samples
          redBuffer[spo2SampleCount] = particleSensor.getRed();
          irBuffer[spo2SampleCount] = irValue;
          spo2SampleCount++;
          
          if (spo2SampleCount == 100) {
            // First calculation after 100 samples
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
            spo2Ready = true;
            
            // Send initial reading
            if (wsClientConnected) {
              String spo2Data = "{\"type\":\"spo2\",\"spo2\":" + String(spo2) + 
                               ",\"valid\":" + String(validSPO2) + 
                               ",\"ir\":" + String(irValue) + 
                               ",\"red\":" + String(particleSensor.getRed()) + 
                               ",\"finger\":true}";
              webSocket.sendTXT(wsClientNum, spo2Data);
            }
          }
        } else {
          // Continuous update: shift buffer
          for (byte i = 25; i < 100; i++) {
            redBuffer[i - 25] = redBuffer[i];
            irBuffer[i - 25] = irBuffer[i];
          }
          
          // Add new samples
          for (byte i = 75; i < 100; i++) {
            while (particleSensor.available() == false)
              particleSensor.check();
            
            redBuffer[i] = particleSensor.getRed();
            irBuffer[i] = particleSensor.getIR();
            particleSensor.nextSample();
          }
          
          // Recalculate
          maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
          
          // Send via WebSocket (every 4 seconds to avoid spam)
          static unsigned long lastSpo2Send = 0;
          if (wsClientConnected && millis() - lastSpo2Send > 2000) {
            lastSpo2Send = millis();
            
            String spo2Data = "{\"type\":\"spo2\",\"spo2\":" + String(spo2) + 
                             ",\"valid\":" + String(validSPO2) + 
                             ",\"ir\":" + String(irValue) + 
                             ",\"red\":" + String(particleSensor.getRed()) + 
                             ",\"finger\":true}";
            webSocket.sendTXT(wsClientNum, spo2Data);
          }
        }
      }
    }
  }
  
  // Small delay to prevent watchdog issues
  delay(1);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] WebSocket Disconnected\n", num);
      wsClientConnected = false;
      break;
      
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] WebSocket Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        wsClientConnected = true;
        wsClientNum = num;
        
        // Send welcome message
        String welcome = "{\"type\":\"system\",\"msg\":\"Connected to ESP32\",\"ecg\":" + 
                        String(ecgSensorActive ? "true" : "false") + 
                        ",\"spo2\":" + String(spo2SensorActive ? "true" : "false") + "}";
        webSocket.sendTXT(num, welcome);
      }
      break;
      
    case WStype_TEXT:
      Serial.printf("[%u] Received: %s\n", num, payload);
      break;
  }
}

void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Medical Sensor Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0a0e27;
      color: #fff;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 28px;
      color: #00ff88;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1a1f3a;
      border-radius: 10px;
      padding: 20px;
      border: 1px solid #2a3f5f;
    }
    .card h2 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #00d4ff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-on { background: #00ff88; box-shadow: 0 0 10px #00ff88; }
    .status-off { background: #ff4444; }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #2a3f5f;
    }
    .metric:last-child { border-bottom: none; }
    .metric-label { color: #888; }
    .metric-value {
      font-weight: bold;
      font-size: 20px;
      color: #00ff88;
    }
    .chart-container {
      height: 200px;
      background: #0f1425;
      border-radius: 5px;
      margin-top: 15px;
      position: relative;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
    .endpoint {
      background: #0f1425;
      padding: 10px;
      border-radius: 5px;
      margin: 5px 0;
      font-family: monospace;
      font-size: 12px;
      color: #00d4ff;
    }
    .system-info {
      background: #1a1f3a;
      border-radius: 10px;
      padding: 20px;
      border: 1px solid #2a3f5f;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #2a3f5f;
    }
    .info-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏥 Medical Sensor System Dashboard</h1>
    
    <div class="grid">
      <div class="card">
        <h2>
          <span class="status-indicator" id="ecg-status"></span>
          ECG Sensor
        </h2>
        <div class="metric">
          <span class="metric-label">Status:</span>
          <span class="metric-value" id="ecg-state">Initializing...</span>
        </div>
        <div class="metric">
          <span class="metric-label">Sample Rate:</span>
          <span class="metric-value">25 Hz (WS)</span>
        </div>
        <div class="metric">
          <span class="metric-label">Last Value:</span>
          <span class="metric-value" id="ecg-value">--</span>
        </div>
        <div class="chart-container">
          <canvas id="ecg-chart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>
          <span class="status-indicator" id="spo2-status"></span>
          SpO2 Sensor
        </h2>
        <div class="metric">
          <span class="metric-label">Status:</span>
          <span class="metric-value" id="spo2-state">Initializing...</span>
        </div>
        <div class="metric">
          <span class="metric-label">SpO2:</span>
          <span class="metric-value" id="spo2-value">-- %</span>
        </div>
        <div class="metric">
          <span class="metric-label">Finger:</span>
          <span class="metric-value" id="finger-status">--</span>
        </div>
        <div class="chart-container">
          <canvas id="spo2-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="system-info">
      <h2 style="margin-bottom: 15px; color: #00d4ff;">📡 API Endpoints & WebSocket</h2>
      <div class="info-row">
        <span>WebSocket Stream:</span>
        <span class="endpoint" id="ws-endpoint">ws://loading...</span>
      </div>
      <div class="info-row">
        <span>System Status:</span>
        <span class="endpoint">/api/v1/status</span>
      </div>
      <div class="info-row">
        <span>ECG Raw Data:</span>
        <span class="endpoint">/api/v1/ecg-raw</span>
      </div>
      <div class="info-row">
        <span>SpO2 Raw Data:</span>
        <span class="endpoint">/api/v1/spo2-raw</span>
      </div>
      <div class="info-row">
        <span>WebSocket Status:</span>
        <span class="metric-value" id="ws-status" style="font-size: 14px;">Disconnected</span>
      </div>
    </div>
  </div>

  <script>
    const ecgCanvas = document.getElementById('ecg-chart');
    const spo2Canvas = document.getElementById('spo2-chart');
    const ecgCtx = ecgCanvas.getContext('2d');
    const spo2Ctx = spo2Canvas.getContext('2d');
    
    let ecgData = [];
    let spo2Data = [];
    const maxPoints = 250;
    
    // WebSocket connection
    const wsUrl = 'ws://' + window.location.hostname + ':81';
    document.getElementById('ws-endpoint').textContent = wsUrl;
    let ws;
    
    function connectWebSocket() {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        document.getElementById('ws-status').textContent = 'Connected';
        document.getElementById('ws-status').style.color = '#00ff88';
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        document.getElementById('ws-status').textContent = 'Disconnected';
        document.getElementById('ws-status').style.color = '#ff4444';
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ecg') {
            ecgData.push(data.val);
            if (ecgData.length > maxPoints) ecgData.shift();
            
            document.getElementById('ecg-state').textContent = 'Active';
            document.getElementById('ecg-status').className = 'status-indicator status-on';
            document.getElementById('ecg-value').textContent = data.val;
            
            drawECG();
          } else if (data.type === 'spo2') {
            if (data.finger === false) {
              document.getElementById('finger-status').textContent = 'No Finger';
              document.getElementById('spo2-value').textContent = '-- %';
            } else {
              spo2Data.push(data.ir / 1000);
              if (spo2Data.length > maxPoints) spo2Data.shift();
              
              document.getElementById('spo2-state').textContent = 'Active';
              document.getElementById('spo2-status').className = 'status-indicator status-on';
              document.getElementById('spo2-value').textContent = data.spo2 + ' %';
              document.getElementById('finger-status').textContent = 'Detected';
              
              drawSpO2();
            }
          } else if (data.type === 'system') {
            console.log('System message:', data.msg);
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      };
    }
    
    function drawECG() {
      ecgCanvas.width = ecgCanvas.offsetWidth;
      ecgCanvas.height = ecgCanvas.offsetHeight;
      
      ecgCtx.clearRect(0, 0, ecgCanvas.width, ecgCanvas.height);
      ecgCtx.strokeStyle = '#00ff88';
      ecgCtx.lineWidth = 2;
      ecgCtx.beginPath();
      
      for (let i = 0; i < ecgData.length; i++) {
        const x = (i / maxPoints) * ecgCanvas.width;
        const y = ecgCanvas.height - (ecgData[i] / 4096 * ecgCanvas.height);
        
        if (i === 0) ecgCtx.moveTo(x, y);
        else ecgCtx.lineTo(x, y);
      }
      
      ecgCtx.stroke();
    }
    
    function drawSpO2() {
      spo2Canvas.width = spo2Canvas.offsetWidth;
      spo2Canvas.height = spo2Canvas.offsetHeight;
      
      spo2Ctx.clearRect(0, 0, spo2Canvas.width, spo2Canvas.height);
      spo2Ctx.strokeStyle = '#00d4ff';
      spo2Ctx.lineWidth = 2;
      spo2Ctx.beginPath();
      
      const maxVal = Math.max(...spo2Data, 1);
      
      for (let i = 0; i < spo2Data.length; i++) {
        const x = (i / maxPoints) * spo2Canvas.width;
        const y = spo2Canvas.height - (spo2Data[i] / maxVal * spo2Canvas.height * 0.8);
        
        if (i === 0) spo2Ctx.moveTo(x, y);
        else spo2Ctx.lineTo(x, y);
      }
      
      spo2Ctx.stroke();
    }
    
    connectWebSocket();
  </script>
</body>
</html>
)rawliteral";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  String json = "{";
  json += "\"ecgActive\":" + String(ecgSensorActive ? "true" : "false") + ",";
  json += "\"spo2Active\":" + String(spo2SensorActive ? "true" : "false") + ",";
  json += "\"wifiConnected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
  json += "\"wsConnected\":" + String(wsClientConnected ? "true" : "false") + ",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\"";
  json += "}";
  
  server.send(200, "application/json", json);
}

void handleECGRaw() {
  if (!ecgSensorActive) {
    server.send(503, "application/json", "{\"error\":\"ECG sensor not active\"}");
    return;
  }
  
  int ecgValue = analogRead(ECG_PIN);
  bool leadsOff = (digitalRead(LO_PLUS) == 1) || (digitalRead(LO_MINUS) == 1);
  
  String json = "{";
  json += "\"timestamp\":" + String(micros()) + ",";
  json += "\"value\":" + String(ecgValue) + ",";
  json += "\"leadsOff\":" + String(leadsOff ? "true" : "false");
  json += "}";
  
  server.send(200, "application/json", json);
}

void handleSpO2Raw() {
  if (!spo2SensorActive) {
    server.send(503, "application/json", "{\"error\":\"SpO2 sensor not active\"}");
    return;
  }
  
  String json = "{";
  json += "\"spo2\":" + String(spo2) + ",";
  json += "\"valid\":" + String(validSPO2) + ",";
  json += "\"fingerDetected\":" + String(fingerDetected ? "true" : "false") + ",";
  json += "\"ir\":" + String(particleSensor.getIR()) + ",";
  json += "\"red\":" + String(particleSensor.getRed());
  json += "}";
  
  server.send(200, "application/json", json);
}