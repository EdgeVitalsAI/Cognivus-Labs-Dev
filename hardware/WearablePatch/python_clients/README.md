# ESP32 Medical Sensor - Python Test Clients

Python clients for testing real-time data streaming and REST API endpoints of the ESP32 medical sensor system.

## Installation

```bash
pip install -r requirements.txt
```

Or install dependencies individually:
```bash
pip install websocket-client requests
```

## 1. WebSocket Client (`websocket_client.py`)

Real-time data streaming and command testing client.

### Features
- Receives real-time ECG and SpO2 sensor data streams
- Sends JSON commands to ESP32
- Interactive command interface
- Live data visualization in terminal

### Usage

```bash
python websocket_client.py <ESP32_IP>
```

Example:
```bash
python websocket_client.py 192.168.1.100
```

### Available Commands

Once connected, you can send these commands interactively:

- `status` - Get overall system status
- `health` - Get system health metrics
- `sensors` - Get all sensor states
- `check_sensor ecg` - Check ECG sensor specifically
- `check_sensor spo2` - Check SpO2 sensor specifically
- `memory` - Get memory information
- `network` - Get network information
- `system_info` - Get hardware information
- `uptime` - Get system uptime
- `ecg_raw` - Get current ECG reading
- `spo2_raw` - Get current SpO2 reading
- `ping` - Test connection
- `help` - List all available commands
- `quit` - Exit client

### Example Session

```
╔════════════════════════════════════════════╗
║   Connected to ESP32 Medical Sensor       ║
╚════════════════════════════════════════════╝

[10:30:15.123] ECG: Value=2048, Leads=connected, Samples=25
[10:30:16.456] SpO2: 98%, Valid=1, IR=85000, Red=42000, Updates=1
[10:30:17.789] Heart Rate: 72 BPM, Valid=1

Command> status
Sent command: status

============================================================
Command Response: status
Success: True
Data: {
  "status": "healthy",
  "wifi": "connected",
  "uptime": 125,
  "freeHeap": 156832,
  "rssi": -45
}
============================================================
```

## 2. REST API Client (`api_client.py`)

Lightweight API testing and debugging tool.

### Features
- Tests all REST API endpoints
- Interactive endpoint testing
- Continuous sensor monitoring
- JSON response formatting

### Usage

**Interactive Mode:**
```bash
python api_client.py <ESP32_IP>
```

**Test All Endpoints:**
```bash
python api_client.py <ESP32_IP> test
```

**Monitor Sensors Continuously:**
```bash
python api_client.py <ESP32_IP> monitor
```

### API Endpoints Tested

| Endpoint | Description |
|----------|-------------|
| `/status` | Overall system status |
| `/health` | System health metrics |
| `/ecg-raw` | Current ECG sensor reading |
| `/spo2-raw` | Current SpO2 sensor reading |
| `/sensors` | All sensor states |
| `/memory` | Memory usage information |
| `/network` | Network information |
| `/system-info` | Hardware information |
| `/uptime` | System uptime |

### Example Output

```bash
$ python api_client.py 192.168.1.100 test

╔════════════════════════════════════════════╗
║    Testing All API Endpoints              ║
╚════════════════════════════════════════════╝

Testing /status... ✅
============================================================
  System Status (/status)
============================================================
{
  "status": "healthy",
  "wifi": "connected",
  "uptime": 245,
  "freeHeap": 158720,
  "rssi": -42
}
============================================================

Testing /health... ✅
...

╔════════════════════════════════════════════╗
║           Test Summary                     ║
╚════════════════════════════════════════════╝

Total Endpoints: 9
Successful: 9
Failed: 0
  ✅ /status
  ✅ /health
  ✅ /ecg-raw
  ✅ /spo2-raw
  ✅ /sensors
  ✅ /memory
  ✅ /network
  ✅ /system-info
  ✅ /uptime
```

## Monitoring Mode

The API client includes a real-time monitoring mode:

```bash
$ python api_client.py 192.168.1.100 monitor

╔════════════════════════════════════════════╗
║      Real-time Sensor Monitoring          ║
╚════════════════════════════════════════════╝

Press Ctrl+C to stop...

[10:35:20] Sensor Status:
  ECG:  Active=Yes, Leads=ON, Value=2156
  SpO2: Active=Yes, Finger=Yes, SpO2=98%, Valid=1, IR=86340

[10:35:22] Sensor Status:
  ECG:  Active=Yes, Leads=ON, Value=2089
  SpO2: Active=Yes, Finger=Yes, SpO2=97%, Valid=1, IR=85920
```

## Testing Workflow

1. **Initial Connection Test:**
   ```bash
   python api_client.py <ESP32_IP>
   # Select option 1 (System Status) to verify connection
   ```

2. **Full API Test:**
   ```bash
   python api_client.py <ESP32_IP> test
   ```

3. **Real-time Data Streaming:**
   ```bash
   python websocket_client.py <ESP32_IP>
   # Watch live ECG and SpO2 data
   ```

4. **Send Commands:**
   ```bash
   python websocket_client.py <ESP32_IP>
   # Type commands interactively: status, health, sensors, etc.
   ```

5. **Continuous Monitoring:**
   ```bash
   python api_client.py <ESP32_IP> monitor
   ```

## Troubleshooting

### Connection Issues

If you can't connect:
1. Verify ESP32 is powered on and connected to WiFi
2. Check the IP address (look at ESP32 serial output)
3. Ensure your PC is on the same network
4. Try pinging the ESP32: `ping <ESP32_IP>`

### WebSocket Timeout

If WebSocket connection times out:
- Check firewall settings (port 81)
- Verify WebSocket server started on ESP32
- Look for errors in ESP32 serial monitor

### API 404 Errors

If endpoints return 404:
- Ensure you're using the correct endpoint names (lowercase, with dashes)
- Verify API server is running (check ESP32 serial output)
- Try the base URL in a browser: `http://<ESP32_IP>/status`

## Development

### Adding New Commands

To add a new command to the WebSocket client:

1. Add the command name to the help text
2. Handle it in `interactive_mode()` or add to `processCommand()` on ESP32
3. The ESP32 `CommandHandler` will process and respond

### Custom Monitoring

You can modify `monitor_sensors()` in `api_client.py` to display data differently or add graphs using libraries like `matplotlib`.

## License

This software is part of the ESP32 Medical Sensor System v3.0.
