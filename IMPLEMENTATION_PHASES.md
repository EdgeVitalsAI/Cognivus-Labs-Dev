# 🚀 Device Auto-Discovery & Live Streaming - Implementation Phases

## Progress Tracker
- ✅ **Phase 1:** Device Auto-Discovery & Registration System - **COMPLETE**
- ⏳ **Phase 2:** Database Schema - Device Management - **NEXT**
- 📋 **Phase 3:** TimescaleDB Setup for Vital Data
- 📋 **Phase 4:** Real-Time WebSocket Streaming
- 📋 **Phase 5:** Periodic Background Vital Updates
- 📋 **Phase 6:** Admin Debug Interface
- 📋 **Phase 7:** Complete Docker Compose Setup

---

## ✅ Phase 1: Device Auto-Discovery & Registration System (COMPLETE)

**What We Built:**
- ESP32 auto-registration when connected to WiFi
- Unique device ID generation from MAC address
- Backend public registration endpoint (no auth)
- Heartbeat mechanism (ESP32 → Backend every 30s)
- Automatic offline detection (2-minute threshold)
- Admin/Doctor device management UI with refresh

**Files Modified:**
- ESP32: `Config.h`, `Config.cpp`, `WiFiManager.h`, `WiFiManager.cpp`, `WearablePatch.ino`
- Backend: `devices.py`, `background_tasks.py`, `main.py`
- Frontend: `AdminDevices.jsx`, `DeviceManagementPage.jsx`

**Test Results:**
- ✅ ESP32 connects and registers automatically
- ✅ Heartbeat sent every 30 seconds
- ✅ Device shows ONLINE in admin panel
- ✅ Device goes OFFLINE after 2 minutes when powered off
- ✅ Device comes back ONLINE when reconnected

---

## ⏳ Phase 2: Database Schema - Device Management (NEXT)

**Goal:** Allow doctors/staff to assign devices to specific patients

**What We'll Build:**
1. **Patient-Device Assignment:**
   - One device per patient (one-to-one relationship)
   - Track which device is assigned to which patient
   - Handle device reassignment (unassign from old patient, assign to new)
   - Track assignment history

2. **Device Availability Tracking:**
   - AVAILABLE: Device registered but not assigned
   - ASSIGNED: Device assigned to a patient
   - IN_USE: Device actively monitoring (patient wearing it)
   - MAINTENANCE: Device needs servicing
   - OFFLINE: Device not connected

3. **UI Changes:**
   - Admin panel: Assign/unassign devices
   - Doctor panel: Assign device when adding/editing patient
   - Show device status in patient list
   - Filter patients by device status

4. **Database Changes:**
   - Add `assignment_status` field to Device model
   - Create `device_assignments` history table
   - Update Device model with patient relationship
   - Migration script

**Deliverables:**
- Backend API endpoints for device assignment
- Updated Device model with assignment tracking
- Admin UI for device assignment management
- Doctor UI for patient-device linking
- Assignment history tracking

**Estimated Files to Modify:**
- Backend: `models/device.py`, `routes/admin_devices.py`, `routes/patients.py`
- Frontend: `AdminDevices.jsx`, `PatientList.jsx`, `AddPatientModal.jsx`
- Database: Migration script

---

## 📋 Phase 3: TimescaleDB Setup for Vital Data

**Goal:** Efficiently store and query time-series vital signs data

**What We'll Build:**
1. **TimescaleDB Integration:**
   - Add TimescaleDB to Docker Compose
   - Create hypertable for vital signs data
   - Partition by time (1-day chunks)
   - Data retention policies (keep 90 days, then aggregate)

2. **Vital Signs Schema:**
   - `patient_vitals_timeseries` table
   - Store: timestamp, patient_id, device_id, SpO2, heart_rate, temperature, etc.
   - Indexed by patient_id and timestamp
   - Fast queries for latest vitals and time ranges

3. **Data Ingestion:**
   - ESP32 sends vitals to backend
   - Backend stores in TimescaleDB
   - Efficient batch inserts
   - Handle missing/invalid data

4. **Query Optimization:**
   - Get latest vitals for a patient (fast)
   - Get vitals for time range (charts)
   - Aggregate functions (avg, min, max)
   - Real-time continuous aggregates

**Deliverables:**
- TimescaleDB Docker container
- Hypertable schema for vitals
- Backend API for vital ingestion
- Migration scripts
- Data retention policies

**Estimated Files to Modify:**
- Backend: `docker-compose.yml`, `models/vitals.py`, `routes/vitals.py`
- Database: TimescaleDB initialization scripts

---

## 📋 Phase 4: Real-Time WebSocket Streaming

**Goal:** Stream live vital signs from ESP32 → Backend → Frontend when doctor views patient

**What We'll Build:**
1. **ESP32 → Backend WebSocket:**
   - ESP32 sends real-time vitals via WebSocket/HTTP POST
   - Backend receives and validates data
   - Publish to Redis pub/sub channel

2. **Backend → Frontend WebSocket:**
   - WebSocket server for frontend connections
   - Authentication (only doctors/staff can connect)
   - Subscribe to specific patient's data stream
   - Push updates to connected clients

3. **Frontend Live Vitals:**
   - Connect to WebSocket when viewing patient
   - Real-time vitals display (SpO2, HR, temp)
   - Live ECG waveform (if applicable)
   - Disconnect when leaving patient page

4. **Redis Pub/Sub:**
   - Channel per patient: `patient:{id}:vitals`
   - Backend publishes vitals to Redis
   - WebSocket server subscribes to channels
   - Only stream when someone is watching (save bandwidth)

**Deliverables:**
- Redis Docker container
- WebSocket server in backend
- Frontend WebSocket client
- Live vitals display component
- Connection management (connect on view, disconnect on leave)

**Estimated Files to Modify:**
- Backend: `docker-compose.yml`, `websocket_server.py`, `routes/vitals.py`
- Frontend: `PatientDetails.jsx`, `LiveVitals.jsx`, `websocket_client.js`
- ESP32: No changes (already has WebSocket support)

---

## 📋 Phase 5: Periodic Background Vital Updates

**Goal:** Update vital signs every 1 minute for dashboard/patient list (non-real-time)

**What We'll Build:**
1. **Background Worker:**
   - Runs every 1 minute
   - Fetches latest vitals from all active devices
   - Updates Device model with latest readings
   - Cache in Redis for fast access

2. **Dashboard Display:**
   - Patient list shows latest vitals (from cache)
   - No need to query TimescaleDB for every patient
   - Color-coded alerts (red for abnormal, yellow for warning)
   - Last updated timestamp

3. **Alert Detection:**
   - Check vitals against thresholds
   - Generate alerts for abnormal readings
   - Notify doctors/staff
   - Store alerts in database

4. **Redis Caching:**
   - Cache key: `patient:{id}:latest_vitals`
   - TTL: 2 minutes (refresh every 1 min)
   - Fast reads for dashboard
   - Reduce database load

**Deliverables:**
- Background worker for periodic updates
- Redis caching layer
- Dashboard with live vitals preview
- Alert detection system
- Notification system

**Estimated Files to Modify:**
- Backend: `background_tasks.py`, `routes/dashboard.py`, `alerts.py`
- Frontend: `Dashboard.jsx`, `PatientList.jsx`, `VitalsPreview.jsx`

---

## 📋 Phase 6: Admin Debug Interface

**Goal:** Allow admins to send commands to ESP32 and view debug output

**What We'll Build:**
1. **Command Protocol:**
   - WebSocket/MQTT for bidirectional communication
   - Admin → Backend → ESP32: Commands
   - ESP32 → Backend → Admin: Responses/Debug output

2. **Supported Commands:**
   - `restart`: Restart ESP32
   - `get_sensor_status`: Check sensor health
   - `calibrate_spo2`: Calibrate SpO2 sensor
   - `set_config`: Update device configuration
   - `get_logs`: Retrieve device logs
   - `run_diagnostic`: Run full diagnostic test

3. **Admin Debug UI:**
   - Terminal-like interface
   - Send commands and see responses
   - Real-time debug output
   - Command history
   - Device status monitoring

4. **ESP32 Command Handler:**
   - Listen for commands via WebSocket
   - Execute commands safely
   - Return results/status
   - Log all commands received

**Deliverables:**
- WebSocket/MQTT command protocol
- ESP32 command handler
- Admin debug console UI
- Command execution logs
- Safety checks (prevent dangerous commands)

**Estimated Files to Modify:**
- Backend: `routes/admin_devices.py`, `command_handler.py`
- Frontend: `AdminDevices.jsx` (debug panel)
- ESP32: `CommandHandler.cpp`, `WiFiManager.cpp`

---

## 📋 Phase 7: Complete Docker Compose Setup

**Goal:** Containerize everything for easy deployment

**What We'll Build:**
1. **Services:**
   - PostgreSQL (already done)
   - TimescaleDB (or PostgreSQL with TimescaleDB extension)
   - Redis
   - Backend (FastAPI)
   - Frontend (React with Nginx)
   - PgAdmin (already done)

2. **Networking:**
   - Internal network for backend services
   - Expose only necessary ports
   - Environment variable management
   - Secrets management

3. **Data Persistence:**
   - Volume for PostgreSQL data
   - Volume for Redis persistence
   - Volume for logs
   - Backup strategy

4. **Production Ready:**
   - Health checks for all services
   - Restart policies
   - Resource limits
   - Logging configuration
   - Environment-based config (dev/prod)

**Deliverables:**
- Complete `docker-compose.yml`
- Production-ready configurations
- Environment templates (`.env.example`)
- Deployment documentation
- Backup/restore scripts

**Estimated Files to Modify:**
- `docker-compose.yml`
- `Dockerfile` (frontend)
- `.env.example`
- `nginx.conf`
- Deployment docs

---

## 🎯 Current Focus: Phase 2

**Next Steps:**
1. Update Device model with assignment fields
2. Create device assignment endpoints
3. Build assignment UI in admin panel
4. Allow doctors to assign devices to patients
5. Show device status in patient list

**Ready to start Phase 2?** Let me know and I'll begin implementation!

---

## Technology Stack Summary

### Backend:
- FastAPI (Python)
- PostgreSQL (primary database)
- TimescaleDB (time-series data) - Phase 3
- Redis (caching + pub/sub) - Phase 4
- WebSocket (real-time streaming) - Phase 4
- SQLAlchemy 2.0 (ORM)

### Frontend:
- React
- Axios (HTTP client)
- WebSocket client - Phase 4
- Lucide icons
- Tailwind CSS / Custom styling

### ESP32:
- Arduino/C++
- WiFi
- HTTPClient (REST API)
- WebSocket client (already implemented)
- Sensor libraries (MAX30102, AD8232)

### DevOps:
- Docker & Docker Compose
- Nginx (frontend serving)
- PostgreSQL + TimescaleDB
- Redis
- Background workers (asyncio)

---

## Success Metrics

**Phase 1 ✅:**
- [x] ESP32 auto-registers on WiFi connect
- [x] Heartbeat every 30 seconds
- [x] Automatic offline detection (2 min)
- [x] Devices visible in admin/doctor panels

**Phase 2 (Next):**
- [ ] Assign device to patient from admin panel
- [ ] Assign device when adding patient
- [ ] Unassign device (make available)
- [ ] See device status in patient list
- [ ] Track assignment history

**Phase 3:**
- [ ] TimescaleDB storing vital signs
- [ ] Query vitals for time range
- [ ] Data retention working
- [ ] Fast query performance (<100ms)

**Phase 4:**
- [ ] Real-time vitals when viewing patient
- [ ] WebSocket connection stable
- [ ] Live ECG waveform (if applicable)
- [ ] Auto-reconnect on disconnect

**Phase 5:**
- [ ] Dashboard shows latest vitals
- [ ] Updates every 1 minute
- [ ] Redis caching working
- [ ] Alert detection functional

**Phase 6:**
- [ ] Send commands to ESP32
- [ ] Receive debug output
- [ ] Device restarts remotely
- [ ] Sensor diagnostics working

**Phase 7:**
- [ ] Full Docker Compose setup
- [ ] One-command deployment
- [ ] All services healthy
- [ ] Production-ready configuration
