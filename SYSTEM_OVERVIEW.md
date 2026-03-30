# Cognivus Health Monitoring System — Full System Overview

> Viva reference document — architecture, data flow, database internals, Docker commands

---

## Table of Contents

1. [System Architecture Summary](#1-system-architecture-summary)
2. [Project Directory Structure](#2-project-directory-structure)
3. [Services & Ports](#3-services--ports)
4. [Docker Commands — List, Access, Debug](#4-docker-commands--list-access-debug)
5. [Data Flow — End to End](#5-data-flow--end-to-end)
6. [Database Schemas](#6-database-schemas)
7. [API Endpoints](#7-api-endpoints)
8. [Machine Learning Pipeline](#8-machine-learning-pipeline)
9. [Authentication & Security](#9-authentication--security)
10. [Startup Sequence](#10-startup-sequence)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Key Environment Variables](#12-key-environment-variables)

---

## 1. System Architecture Summary

Cognivus is a **real-time clinical monitoring platform** that connects ESP32 wearable patches to a hospital dashboard. It streams ECG and SpO2 data, runs ML inference on-the-fly, and alerts clinicians to deteriorating patients.

```
[ESP32 Wearable Patch]
    │  WebSocket (Port 81)  →  ECG @ 25 Hz, SpO2 @ 0.5 Hz
    │  HTTP REST (Port 80)  →  /ecg-raw, /spo2-raw, /status
    ▼
[FastAPI Backend] (Port 8000)
    │  ├─ Buffer Manager   (circular buffer per patient)
    │  ├─ ML Inference     (LSTM models — ECG arrhythmia + SpO2 trend)
    │  ├─ Risk Scoring     (Digital Twin — weighted ECG+SpO2+stability)
    │  ├─ Notification Svc (dedup, 5-min window, severity alert)
    │  └─ Heartbeat Monitor(device online/offline, every 30s)
    │
    ├──► PostgreSQL (Port 5432)     — users, patients, clinical records
    ├──► TimescaleDB (Port 5433)    — time-series vitals, hypertables
    │
    └──► WebSocket Broadcast
           WS /ws/ecg/{patient_id}
           WS /ws/spo2/{patient_id}
           WS /ws/vitals/{patient_id}
                    ▼
[React Frontend] (Port 3000/5173)
    ├─ Doctor Dashboard  — live ECG waveform, AI insights, prescriptions
    ├─ Staff Dashboard   — task queue, patient monitoring, incidents
    └─ Admin Panel       — system health, device management, ML testing
```

---

## 2. Project Directory Structure

```
Cognivus-Labs-Dev/
├── web-app/
│   ├── backend/                    ← FastAPI Python service
│   │   ├── app/
│   │   │   ├── main.py             ← App init, route mounting, startup tasks
│   │   │   ├── core/
│   │   │   │   ├── config.py       ← Pydantic settings
│   │   │   │   ├── database.py     ← PostgreSQL connection
│   │   │   │   ├── timescale_database.py  ← TimescaleDB connection
│   │   │   │   └── security.py     ← JWT + bcrypt
│   │   │   ├── models/             ← SQLAlchemy ORM models (1017 lines)
│   │   │   ├── api/routes/         ← 22 route modules
│   │   │   ├── services/           ← Business logic, ML, buffers
│   │   │   ├── middleware/auth.py  ← JWT dependency, RBAC
│   │   │   └── schemas/            ← Pydantic request/response models
│   │   ├── docker-compose.yml      ← Main services
│   │   ├── docker-compose.admin.yml← Admin-only services
│   │   ├── Dockerfile
│   │   ├── init_db.py              ← Table creation + seed users
│   │   ├── init_timescaledb.sql    ← Hypertable + aggregates + retention
│   │   └── requirements.txt
│   └── frontend/                   ← React 18 + Vite + Tailwind
│       └── src/
│           ├── main.jsx            ← Doctor/Staff entry
│           ├── main-admin.jsx      ← Admin entry
│           └── pages/
├── hardware/                       ← ESP32 / Arduino firmware
├── ml-models/
│   ├── ecg-analysis/               ← LSTM ECG model (.h5 / SavedModel)
│   └── spo2-prediction/            ← LSTM SpO2 model
├── mobile-app/                     ← Flutter app
└── README.md
```

---

## 3. Services & Ports

| Service | Container Name | External Port | Internal Port | Purpose |
|---------|---------------|---------------|---------------|---------|
| FastAPI Backend | `cognivus_backend` | **8000** | 8000 | REST API + WebSocket |
| PostgreSQL | `cognivus_postgres` | **5432** | 5432 | Auth DB, clinical records |
| TimescaleDB | `cognivus_timescaledb` | **5433** | 5432 | Time-series vitals |
| PgAdmin | `cognivus_pgadmin` | **5050** | 80 | DB GUI browser |
| React Frontend | (local dev) | **3000** / **5173** | — | Doctor/Staff UI |
| Admin Backend | `cognivus-backend-admin` | **8001** | 8000 | Admin-only API |
| Admin PostgreSQL | `cognivus-postgres-admin` | **5434** | 5432 | Admin health DB |
| Admin PgAdmin | (admin compose) | **5051** | 80 | Admin DB GUI |
| Redis (admin) | `cognivus-redis-admin` | **6380** | 6379 | Admin caching |
| ESP32 HTTP | (hardware) | **80** | — | REST data push |
| ESP32 WebSocket | (hardware) | **81** | — | Streaming data |

**Network:** All main containers share `cognivus_network` (bridge driver).

---

## 4. Docker Commands — List, Access, Debug

### Start / Stop Everything

```bash
# Navigate to backend folder first
cd /home/wathsala/Projects/Cognivus-Labs-Dev/web-app/backend

# Start all services (detached)
docker-compose up -d

# Start with live logs
docker-compose up

# Stop all services
docker-compose down

# Stop and delete all volumes (CAUTION: deletes DB data)
docker-compose down -v

# Rebuild images and restart
docker-compose up -d --build
```

---

### List Services & Containers

```bash
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# List services defined in docker-compose
docker-compose ps

# List container resource usage (CPU, memory, network)
docker stats

# List volumes
docker volume ls

# List networks
docker network ls

# Inspect the cognivus network (see all IPs)
docker network inspect cognivus_network
```

---

### View Logs

```bash
# Logs for all services
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f timescaledb

# Last 50 lines
docker-compose logs --tail=50 backend
```

---

### Access PostgreSQL (`cognivus_auth`) — User Data, Patients, Devices

```bash
# Option 1: exec into the running postgres container
docker exec -it cognivus_postgres psql -U cognivus_user -d cognivus_auth

# Option 2: from host machine (requires psql installed locally)
psql -h localhost -p 5432 -U cognivus_user -d cognivus_auth
# Password: cognivus_secure_password_123

# Non-interactive one-liner query
docker exec -it cognivus_postgres psql -U cognivus_user -d cognivus_auth -c "SELECT * FROM users;"
```

**Useful PostgreSQL queries:**

```sql
-- List all tables
\dt

-- Describe a table
\d patients
\d devices
\d users

-- List all patients
SELECT id, name, status, room_number, assigned_doctor_id FROM patients;

-- List all devices and their assignment status
SELECT device_id, status, assignment_status, patient_id, last_ping FROM devices;

-- List all users (doctors + staff)
SELECT id, email, role, full_name, is_active FROM users;

-- List all active prescriptions for a patient
SELECT medication_name, dosage, frequency, status FROM prescriptions WHERE patient_id = 1;

-- List all notifications (unread)
SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC;

-- List system logs
SELECT action, resource_type, timestamp FROM system_logs ORDER BY timestamp DESC LIMIT 20;

-- Exit psql
\q
```

---

### Access TimescaleDB (`cognivus_vitals_timeseries`) — Real-time Vitals

```bash
# Option 1: exec into timescaledb container
docker exec -it cognivus_timescaledb psql -U timescale_user -d cognivus_vitals_timeseries

# Option 2: from host machine (note port 5433)
psql -h localhost -p 5433 -U timescale_user -d cognivus_vitals_timeseries
# Password: timescale_secure_password_123

# Non-interactive query
docker exec -it cognivus_timescaledb psql -U timescale_user -d cognivus_vitals_timeseries -c "\dt"
```

**Useful TimescaleDB queries:**

```sql
-- List all tables (includes hypertables and continuous aggregates)
\dt

-- Check hypertable info
SELECT * FROM timescaledb_information.hypertables;

-- Check continuous aggregates
SELECT * FROM timescaledb_information.continuous_aggregates;

-- Check compression status
SELECT * FROM timescaledb_information.compression_settings;

-- Check data retention policies
SELECT * FROM timescaledb_information.jobs WHERE proc_name = 'policy_retention';

-- Query latest vitals per patient
SELECT patient_id, time, heart_rate, spo2_value, ecg_value
FROM vitals_timeseries
ORDER BY time DESC
LIMIT 20;

-- Query vitals for a specific patient in the last hour
SELECT time, heart_rate, spo2_value, temperature
FROM vitals_timeseries
WHERE patient_id = 'patient-uuid-here'
  AND time > NOW() - INTERVAL '1 hour'
ORDER BY time DESC;

-- Query 1-minute aggregates (continuous aggregate)
SELECT * FROM vitals_1min
WHERE patient_id = 'patient-uuid-here'
ORDER BY bucket DESC
LIMIT 10;

-- Query 1-hour aggregates
SELECT * FROM vitals_1hour
WHERE patient_id = 'patient-uuid-here'
ORDER BY bucket DESC
LIMIT 10;

-- Count records per patient
SELECT patient_id, COUNT(*) as record_count
FROM vitals_timeseries
GROUP BY patient_id;

-- Show chunk info (time partitioning)
SELECT * FROM timescaledb_information.chunks
WHERE hypertable_name = 'vitals_timeseries';

-- Exit psql
\q
```

---

### Access PgAdmin (GUI)

```bash
# Open in browser
http://localhost:5050

# Login
Email: admin@cognivuslabs.com
Password: admin

# Add server connections manually in PgAdmin:
# PostgreSQL:
#   Host: postgres (or localhost from outside)
#   Port: 5432
#   Database: cognivus_auth
#   Username: cognivus_user
#   Password: cognivus_secure_password_123

# TimescaleDB:
#   Host: timescaledb (or localhost from outside)
#   Port: 5433
#   Database: cognivus_vitals_timeseries
#   Username: timescale_user
#   Password: timescale_secure_password_123
```

---

### Inspect Container Internals

```bash
# Get a bash shell inside a container
docker exec -it cognivus_backend bash
docker exec -it cognivus_postgres bash
docker exec -it cognivus_timescaledb bash

# Check container environment variables
docker exec cognivus_backend env

# Check container resource limits
docker inspect cognivus_backend

# Check health status
docker inspect --format='{{.State.Health.Status}}' cognivus_backend
docker inspect --format='{{.State.Health.Status}}' cognivus_postgres
docker inspect --format='{{.State.Health.Status}}' cognivus_timescaledb

# View container IP addresses
docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q)
```

---

### FastAPI / Backend Checks

```bash
# Check backend health
curl http://localhost:8000/health

# View all API routes (Swagger docs)
http://localhost:8000/docs

# View ReDoc documentation
http://localhost:8000/redoc

# Get auth token (doctor login)
curl -X POST http://localhost:8000/api/auth/doctor/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@cognivuslabs.com", "password": "doctor123"}'

# Get auth token (admin login)
curl -X POST http://localhost:8000/api/sys/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## 5. Data Flow — End to End

```
Step 1: Device Registration
────────────────────────────
ESP32 boots up
  → POST /api/devices/register  (no auth required)
  → Backend upserts device in PostgreSQL devices table
  → Sets device status = ONLINE

Step 2: Live Data Ingestion
────────────────────────────
ESP32 WebSocket (port 81) pushes:
  → ECG samples @ 25 Hz (raw mV values + leads-off flag)
  → SpO2 samples @ 0.5 Hz (IR/Red signals + SpO2 % + finger flag)

Backend Hardware Ingestion Services receive data
  → Store each reading in TimescaleDB vitals_timeseries hypertable
  → Push samples into in-memory circular buffer (per patient)

Step 3: ML Inference (every 2 seconds)
────────────────────────────────────────
ECG Buffer Manager accumulates 15s window (5,400 samples @ 360 Hz after resample)
  → Notch filter (50 Hz) + Bandpass filter (0.5–45 Hz) + Z-score normalize
  → LSTM model inference
  → Output: is_abnormal (bool) + confidence + heart_rate

SpO2 Buffer Manager accumulates recent SpO2 readings
  → Engineer 19 features (rate_of_change, signal quality, motion artifact, etc.)
  → LSTM model inference
  → Output: trend (stable/declining/critical) + confidence + decline_alert

Step 4: Risk Scoring (Digital Twin)
──────────────────────────────────────
Risk Score = (ECG result × 0.42) + (SpO2 result × 0.40) + (stability × 0.18)
  → Rolling 1-minute average to smooth noise
  → Risk Level: low / medium / high / critical

Step 5: Notifications
──────────────────────
Notification Service (runs every 5s)
  → Checks risk levels and ML predictions
  → Creates notification if risk is high/critical AND not already notified in last 5 min
  → Types: ECG_ABNORMAL, SPO2_LOW, SENSOR_OFF
  → Stored in PostgreSQL notifications table
  → Pushed via WebSocket to connected frontend clients

Step 6: Frontend Streaming
───────────────────────────
React frontend opens WebSocket connections:
  WS /api/ws/ecg/{patient_id}    → ECG waveform + ML predictions
  WS /api/ws/spo2/{patient_id}   → SpO2 values + trend predictions
  WS /api/ws/vitals/{patient_id} → Combined feed (HR, BP, temp, SpO2)

Step 7: Data Aging & Compression
──────────────────────────────────
TimescaleDB continuous aggregates:
  → vitals_1min  — 1-minute time-bucketed averages (for charts)
  → vitals_1hour — 1-hour min/max/avg (for history)
Compression policy: chunks older than 7 days are compressed
Retention policy:   data older than 90 days is dropped
```

---

## 6. Database Schemas

### A. PostgreSQL — `cognivus_auth`

#### `users`
```
id, email, hashed_password, full_name,
role (DOCTOR | STAFF),
is_active, specialty, license_number,
department, employee_id,
created_at, updated_at
```

#### `admins`
```
id, username, email, hashed_password, full_name,
is_active, is_super_admin,
last_login, last_ip,
failed_login_attempts, locked_until,
created_at, updated_at, created_by
```

#### `patients`
```
id, name, date_of_birth, age, gender, blood_type,
email, phone, address,
emergency_contact (JSON), insurance_info (JSON),
room_number, ward_location,
admission_date, discharge_date,
status (CRITICAL | WARNING | STABLE | DISCHARGED),
department, assigned_doctor_id, assigned_nurse_id,
medical_history (JSON), allergies (JSON),
current_medications (JSON),
created_at, updated_at
```

#### `devices`
```
id, device_id (unique), device_name, device_type,
status (ONLINE | OFFLINE | MAINTENANCE | ERROR),
battery_level, firmware_version, last_ping,
assignment_status (AVAILABLE | ASSIGNED | IN_USE | MAINTENANCE | DECOMMISSIONED),
patient_id, patient_name, assigned_room, assigned_at, assigned_by,
ip_address, mac_address,
spo2, heart_rate, blood_pressure_sys, blood_pressure_dia, temperature,
location, notes, config (JSON),
activated_at, created_at, updated_at
```

#### `device_logs`
```
id, device_id,
log_type (info | warning | error | debug),
message, data (JSON), timestamp
```

#### `device_assignments`
```
id, device_id, device_name,
patient_id, patient_name, assigned_room,
assigned_by, assigned_by_name, assigned_at,
unassigned_at, unassigned_by, is_active,
assignment_notes, unassignment_notes
```

#### `patient_vitals`
```
id, patient_id,
heart_rate, blood_pressure_systolic, blood_pressure_diastolic,
oxygen_saturation, respiratory_rate, body_temperature,
blood_glucose, weight, height, bmi,
ecg_data (JSON),
overall_status (NORMAL | WARNING | CRITICAL),
is_abnormal, alert_triggered, alert_message,
device_id, device_type,
measurement_source (WEARABLE | MANUAL | MONITOR),
notes, recorded_by_user_id, measured_at,
created_at, updated_at
```

#### `prescriptions`
```
id, patient_id, prescribed_by_id,
medication_name, generic_name, medication_class,
dosage, frequency, custom_frequency, route,
duration, instructions, special_instructions,
start_date, end_date, discontinued_date,
status (ACTIVE | COMPLETED | DISCONTINUED | ON_HOLD),
is_critical, requires_monitoring,
refills_allowed, refills_remaining,
discontinued_by_id, discontinuation_reason,
side_effects_warning, interaction_warnings, notes,
created_at, updated_at
```

#### `clinical_notes`
```
id, patient_id, created_by_id,
note_type (PROGRESS_NOTE | ADMISSION_NOTE | DISCHARGE_SUMMARY |
           CONSULTATION_NOTE | PROCEDURE_NOTE | NURSING_NOTE |
           FOLLOW_UP | LAB_RESULTS | RADIOLOGY_REPORT | OTHER),
title, specialty,
subjective, objective, assessment, plan,   ← SOAP format
content, diagnosis, treatment_plan, follow_up_instructions,
attachments, visit_date, visit_type,
is_confidential, is_signed, signed_at,
created_at, updated_at, last_modified_by_id
```

#### `ai_insights`
```
id, patient_id, created_by_id,
insight_type, title, description,
severity (LOW | MEDIUM | HIGH | CRITICAL),
status (ACTIVE | RESOLVED | ACKNOWLEDGED),
confidence, source_data (JSON), recommendations,
created_at, updated_at, acknowledged_at
```

#### `notifications`
```
id, patient_id, user_id,
notification_type (ECG_ABNORMAL | SPO2_LOW | SENSOR_OFF | OTHER),
priority (LOW | MEDIUM | HIGH | CRITICAL),
title, message,
is_read, created_at, read_at
```

#### `staff_tasks`
```
id, assigned_to_id, patient_id,
task_type, title, description,
status (PENDING | IN_PROGRESS | COMPLETED | CANCELLED),
priority (LOW | MEDIUM | HIGH | URGENT),
category (VITALS_CHECK | MEDICATION_DELIVERY | INCIDENT_REPORT |
          PATIENT_CARE | OTHER),
due_date, completed_at, assigned_at,
created_at, updated_at
```

#### `telemedicine_consultations`
```
id, patient_id, initiated_by_id,
video_call_id,
status (SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED),
consultation_type, scheduled_at, started_at, ended_at,
duration_minutes, notes, recording_url,
created_at, updated_at
```

#### `system_logs`
```
id, user_id, action, resource_type, resource_id,
details (JSON), timestamp, ip_address
```

---

### B. TimescaleDB — `cognivus_vitals_timeseries`

#### `vitals_timeseries` (hypertable, partitioned by time — 1-day chunks)
```
time              TIMESTAMPTZ   ← partition key
patient_id        TEXT
device_id         TEXT
ecg_value         FLOAT
ecg_leads_off     BOOLEAN
ecg_active        BOOLEAN
heart_rate        FLOAT
heart_rate_valid  BOOLEAN
spo2_value        FLOAT
spo2_valid        BOOLEAN
finger_detected   BOOLEAN
spo2_ir_signal    FLOAT
spo2_red_signal   FLOAT
spo2_active       BOOLEAN
temperature       FLOAT
data_type         TEXT
source            TEXT
```

**Indexes:** patient_time, device_time, type_time, abnormal_hr, abnormal_spo2

**Compression:** Enabled — chunks older than 7 days are compressed

**Retention:** Data older than 90 days is automatically dropped

#### Continuous Aggregates

`vitals_1min` — 1-minute time buckets:
```
bucket, patient_id, device_id,
avg_heart_rate, min_heart_rate, max_heart_rate,
avg_spo2, min_spo2, max_spo2,
avg_temperature, sample_count
```

`vitals_1hour` — 1-hour time buckets (same structure, coarser granularity)

---

## 7. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/doctor/login` | Doctor login → JWT access + refresh tokens |
| POST | `/api/auth/staff/login` | Staff login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/verify` | Verify current token |

### Admin (prefix `/api/sys`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sys/auth/login` | Admin login |
| GET | `/api/sys/system/health` | System health stats |
| GET | `/api/sys/system/analytics` | Usage analytics |
| GET/POST | `/api/sys/devices` | Device management |
| GET/POST | `/api/sys/users` | User management |
| GET | `/api/sys/model-inference` | ML model testing |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/patients` | List / create patients |
| GET/PUT | `/api/patients/{id}` | Get / update patient |
| GET/POST | `/api/patients/{id}/vitals` | Vitals history |
| POST | `/api/patients/{id}/vital-alerts` | Create alert |
| GET | `/api/patients/{id}/live-vitals` | Live vitals from device |
| GET | `/api/patients/live-vitals/bulk` | Bulk live vitals |

### Clinical
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/prescriptions` | Prescriptions |
| GET/POST | `/api/clinical-notes` | Clinical notes (SOAP) |
| GET/POST | `/api/ai-insights` | AI-generated insights |
| GET/POST | `/api/telemedicine/consultations` | Video consultations |
| GET/POST | `/api/staff-tasks` | Nursing task queue |
| GET | `/api/notifications` | Notification feed |
| GET | `/api/dashboard` | Dashboard summary |
| GET/PUT | `/api/profile` | User profile |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/devices/register` | Auto-register ESP32 (no auth) |
| GET | `/api/devices` | List all devices |

### WebSocket (Real-time)
| Endpoint | Data | Rate |
|----------|------|------|
| `WS /api/ws/ecg/{patient_id}` | ECG waveform + ML prediction | 25 Hz |
| `WS /api/ws/spo2/{patient_id}` | SpO2 + trend prediction | 0.5 Hz |
| `WS /api/ws/vitals/{patient_id}` | Combined vitals feed | Mixed |

---

## 8. Machine Learning Pipeline

### ECG Model

- **Task:** Detect arrhythmias (binary: Normal / Abnormal)
- **Architecture:** CNN-LSTM hybrid
- **Input:** 15-second sliding window @ 360 Hz = 5,400 samples
- **Update interval:** Every 2 seconds (sliding window)
- **Preprocessing:**
  1. Resample: 250 Hz (sensor) → 360 Hz (model)
  2. Notch filter: 60 Hz power-line interference rejection
  3. Bandpass filter: 0.5–45 Hz (physiology band)
  4. Z-score normalization
- **Output:** `is_abnormal` (bool), `confidence` (0–1), `heart_rate` (BPM)
- **Fallback:** Mock predictions if TensorFlow fails to load model

### SpO2 Model

- **Task:** Predict SpO2 trend and hypoxia risk
- **Architecture:** LSTM (64 units) with BatchNormalization
- **Input:** Variable-length sequence with 19 engineered features
- **Features:** SpO2 value, rate of change, signal quality, motion artifact, etc.
- **Loss:** Weighted cross-entropy (false negative weight = 10.0 — clinical safety)
- **Threshold:** Optimized on F2-score (penalizes false negatives more)
- **Output:** `trend` (stable/declining/critical), `confidence`, `decline_alert`

### Risk Scoring — Digital Twin

```
Risk Score = (ECG result × 0.42) + (SpO2 result × 0.40) + (signal stability × 0.18)
```

- Rolling 1-minute average applied to smooth transient noise
- Output: `risk_level` (low / medium / high / critical) + contributing factors + explanation
- Drives notification thresholds and alert priority

---

## 9. Authentication & Security

| Aspect | Detail |
|--------|--------|
| Token type | JWT (HS256) |
| Access token TTL | 30 minutes |
| Refresh token TTL | 7 days |
| Password hashing | bcrypt |
| Admin lockout | 30 minutes after 5 failed attempts |
| CORS origins | localhost:3000, localhost:5173, localhost:5174 |
| Device registration | No auth (intentional — IoT auto-discovery) |

### Roles
- **DOCTOR** — Clinical data, patient management, prescriptions, AI insights
- **STAFF** — Task queue, patient monitoring, incidents, device inventory
- **ADMIN** — System health, user management, device debugging, ML testing

### Default Seed Credentials (from `init_db.py`)
| Role | Username / Email | Password |
|------|------------------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `doctor@cognivuslabs.com` | `doctor123` |
| Staff | `staff@cognivuslabs.com` | `staff123` |

---

## 10. Startup Sequence

### Docker Compose Order
1. **PostgreSQL** starts → health check (`pg_isready`) passes
2. **TimescaleDB** starts → `init_timescaledb.sql` runs (creates hypertable, aggregates, policies)
3. **FastAPI** container starts:
   - Waits 5s for PostgreSQL
   - Runs `init_db.py` (creates all tables + seeds demo users)
   - Waits 3s for TimescaleDB
   - Starts `uvicorn app.main:app --reload`
4. **PgAdmin** starts (no dependencies)

### FastAPI `@app.on_event("startup")` Order
1. Start device heartbeat monitoring (checks every 30s, marks offline if >2 min silent)
2. Resolve ECG model file path (env var or candidate scan)
3. Initialize ECG ML service (load LSTM, fallback to mock on error)
4. Start ECG buffer manager + monitoring service
5. Resolve SpO2 model file path
6. Initialize SpO2 ML service
7. Start SpO2 buffer manager + monitoring service
8. Start notification service (checks every 5s, 5-minute dedup window)

---

## 11. Frontend Architecture

**Stack:** React 18.3, Vite, React Router v6, Tailwind CSS, Framer Motion, Recharts, Axios

### Entry Points
| File | URL Prefix | Who Uses It |
|------|-----------|-------------|
| `main.jsx` | `/doctor`, `/staff` | Clinical staff |
| `main-admin.jsx` | `/sys` | System administrators |

### Key Pages

**Doctor Portal (`/doctor`)**
- Login → Dashboard → Patient List → Patient Detail
- Patient Detail includes: Live ECG waveform (WebSocket), SpO2 charts, AI insights, risk score
- Prescriptions, Clinical Notes, AI Insights, Telemedicine, Devices

**Staff Portal (`/staff`)**
- Login → Dashboard → Task Queue → Patient Monitoring
- Inventory management, Incident reporting, Communication, Notes

**Admin Panel (`/sys`)**
- Login → Dashboard → Device debugging → User/role management → ML inference testing → System health

### API Communication
- HTTP: Axios with JWT Bearer token in `Authorization` header
- WebSocket: Native browser WebSocket API
- Token refresh: Interceptor auto-refreshes on 401 response
- Vite proxy: `/api` → `http://localhost:8000` (avoids CORS in dev)

---

## 12. Key Environment Variables

```bash
# JWT Security
SECRET_KEY=0I837dIFGDVi9IARkabkPaMTHUR4u0id
REFRESH_SECRET_KEY=GluCjrCfFOHMLXH9JwWnRZIxj6M2SSV2
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# PostgreSQL
POSTGRES_USER=cognivus_user
POSTGRES_PASSWORD=cognivus_secure_password_123
POSTGRES_DB=cognivus_auth
POSTGRES_HOST=postgres        # container name (inside Docker)
POSTGRES_PORT=5432

# TimescaleDB
TIMESCALE_USER=timescale_user
TIMESCALE_PASSWORD=timescale_secure_password_123
TIMESCALE_DB=cognivus_vitals_timeseries
TIMESCALE_HOST=timescaledb    # container name (inside Docker)
TIMESCALE_PORT=5432           # internal port (5433 is external only)

# App
APP_NAME=Cognivus Health Monitoring System
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Quick Reference Card (for Viva)

```bash
# Start system
cd web-app/backend && docker-compose up -d

# Check all services running
docker-compose ps

# PostgreSQL shell
docker exec -it cognivus_postgres psql -U cognivus_user -d cognivus_auth

# TimescaleDB shell
docker exec -it cognivus_timescaledb psql -U timescale_user -d cognivus_vitals_timeseries

# Backend logs
docker-compose logs -f backend

# API docs
open http://localhost:8000/docs

# PgAdmin GUI
open http://localhost:5050   # admin@cognivuslabs.com / admin

# Test backend health
curl http://localhost:8000/health

# List docker containers
docker ps

# List docker volumes
docker volume ls

# Inspect network
docker network inspect cognivus_network
```

---
