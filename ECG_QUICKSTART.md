# ECG Monitoring System - Quick Start Guide

## Installation

### Backend Setup

1. **Install Python dependencies**:
```bash
cd web-app/backend
pip install -r requirements.txt
```

New dependencies added:
- `tensorflow==2.15.0` - ML model inference
- `scipy==1.11.4` - Signal processing
- `numpy==1.24.3` - Array operations

2. **Verify TimescaleDB connection**:
Ensure your `.env` file has:
```env
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DB=cognivus_timeseries
TIMESCALE_USER=postgres
TIMESCALE_PASSWORD=your_password
```

3. **(Optional) Add ML model**:
Place your trained model at:
```
ml-models/ecg-analysis/models/ecg_lstm_model.h5
```

If not present, the system will use mock predictions for development.

### Frontend Setup

No additional dependencies needed. The ECG monitoring component uses only existing React packages.

## Running the System

### Start Backend

```bash
cd web-app/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected console output:
```
✓ TimescaleDB connection successful
✓ Background tasks started
✓ ECG Buffer Manager started
✓ ECG Monitoring Service started
✓ ECG monitoring and ML inference services started
```

### Start Frontend

```bash
cd web-app/frontend
npm run dev
```

Navigate to: `http://localhost:5173`

## Usage

### 1. View ECG Monitoring

Navigate to a patient's AI Insights page:
```
http://localhost:5173/patient/{patient_id}/ai-insights
```

The ECG Monitoring component will automatically:
- Establish WebSocket connection
- Start receiving real-time ECG data
- Display ML predictions every 2 seconds
- Show live waveform updates

### 2. WebSocket Connection

The frontend automatically connects to:
```
ws://localhost:8000/api/ws/ecg/{patient_id}
```

### 3. Expected Behavior

**Every 2 seconds, you'll see**:
- ECG waveform update (2-second chunk, 500 samples)
- ML prediction (Normal/Abnormal/Unstable)
- Confidence score (0-100%)
- Heart rate estimate (if available)

**Prediction stability**:
Predictions should be relatively stable because each uses a 15-second overlapping window, not just the latest 2 seconds.

## Verifying the System

### Check Backend Logs

Look for these messages indicating proper operation:

```
✓ ECG buffer created for patient 1
✓ Fetched 500 ECG samples for patient 1, buffer size: 3750/3750
✓ Started ECG monitoring for patient 1
✓ ECG WebSocket connected for patient 1
```

### Check Frontend Console

Open browser DevTools and verify:
```javascript
✓ ECG WebSocket connected
```

You should see incoming messages:
```json
{
  "type": "ecg_waveform",
  "samples": [...],
  "sample_count": 500
}
```

```json
{
  "type": "ecg_prediction",
  "trend": "normal",
  "confidence": 92.5
}
```

## Testing Without Real Sensors

### Option 1: Mock Data (Recommended for Development)

The system will automatically use mock predictions when:
- No ML model is present
- TimescaleDB is empty

The mock system generates realistic predictions based on signal variability.

### Option 2: Seed Test Data

Use the provided test data seeding script (if available):
```bash
cd web-app/backend
python seed_ecg_test_data.py --patient-id 1 --duration 300
```

### Option 3: Use Existing MIT-BIH Data

The system can read from the MIT-BIH dataset in `ml-models/ecg-analysis/data/`:
- Files: `100.dat`, `101.dat`, etc.
- Format: WFDB format (requires `wfdb` Python package)

## API Endpoints

### WebSocket

```
ws://localhost:8000/api/ws/ecg/{patient_id}
```

**Client → Server messages**:
```json
{"type": "ping"}
```

**Server → Client messages**:
- `connection_established`
- `ecg_waveform`
- `ecg_prediction`
- `ecg_status`
- `heartbeat`

### HTTP (Polling Alternative)

```bash
# Get latest prediction
curl http://localhost:8000/api/ecg/prediction/1
```

Response:
```json
{
  "success": true,
  "patient_id": 1,
  "trend": "normal",
  "confidence": 92.5,
  "details": "Regular sinus rhythm detected...",
  "heart_rate": 72,
  "timestamp": "2026-01-24T10:00:02Z"
}
```

## Configuration

### Adjust Update Interval

**Backend** (`ecg_monitoring_service.py`):
```python
service = ECGMonitoringService(inference_interval_seconds=2)  # Change to 1, 3, 5, etc.
```

**Buffer Manager** (`ecg_buffer_manager.py`):
```python
manager = ECGBufferManager(update_interval_seconds=2)  # Should match inference interval
```

### Adjust Buffer Window

```python
buffer = ECGBuffer(
    patient_id=patient_id,
    window_seconds=15,  # Change to 10, 20, 30, etc.
    sampling_rate=250   # Must match your sensor
)
```

### Adjust ML Model Settings

```python
ml_service = ECGMLInferenceService()
ml_service.WIN_SEC = 15.0        # Analysis window
ml_service.FS_SENSOR = 250       # Sensor sampling rate
ml_service.FS_TARGET = 360       # Model expects 360 Hz
```

## Troubleshooting

### Problem: "ECG buffer not ready"

**Cause**: Not enough data in TimescaleDB

**Solution**:
1. Verify ECG data is being written to `vitals_timeseries` table
2. Check that `ecg_active = true` and `ecg_value IS NOT NULL`
3. Wait 15 seconds for buffer to fill

### Problem: "WebSocket connection failed"

**Cause**: Backend not running or CORS issues

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS settings in `main.py`
3. Ensure WebSocket port (8000) is not blocked

### Problem: "No ML predictions"

**Cause**: ML service error or insufficient data

**Solution**:
1. Check backend logs for errors
2. Verify TensorFlow is installed: `python -c "import tensorflow"`
3. System will fall back to mock predictions automatically

### Problem: "Predictions are unstable/jumping"

**Expected behavior**: Predictions should be relatively stable due to 15-second overlapping window

**If unstable**:
1. Increase window size to 20-30 seconds
2. Check signal quality (leads off?)
3. Verify ML model is loaded (not using mocks)
4. Add smoothing/filtering to predictions

## Performance Monitoring

### Backend Metrics

Monitor these in production:

```python
# Number of active monitoring sessions
len(ecg_service.active_patients)

# Buffer fill level
buffer.buffer.maxlen  # Should be 3750 for 15s @ 250Hz

# Inference time
# Should be < 200ms per prediction

# Memory usage
# ~60 KB per patient buffer
```

### Frontend Metrics

Monitor in browser DevTools:

- WebSocket message rate: ~1 Hz (2 messages per 2 seconds)
- Canvas render time: < 16ms (60 FPS capability)
- Memory usage: ~2-5 MB per session

## Next Steps

1. **Add real ECG sensors**: Connect ESP32 devices
2. **Train custom model**: Use your patient data
3. **Configure alerts**: Set up critical event notifications
4. **Add authentication**: Secure WebSocket connections
5. **Enable logging**: HIPAA-compliant audit trails

## Support

- **Documentation**: See `ECG_MONITORING_IMPLEMENTATION.md`
- **Issues**: Check GitHub issues or create new one
- **Email**: dev@cognivuslabs.com

---

**Production Checklist**:
- [ ] SSL/TLS for WebSocket (wss://)
- [ ] Token-based WebSocket authentication
- [ ] Rate limiting on endpoints
- [ ] Monitoring and alerting
- [ ] Database backup strategy
- [ ] Incident response procedures
