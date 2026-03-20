# 🩺 Smart IoT-Based Healthcare Monitoring & Management System

## 🌍 Overview

A **production-grade, real-time healthcare IoT platform** that continuously monitors critical vital signs—including **ECG, blood oxygen saturation (SpO₂), and heart rate**—through wearable ESP32-based sensors. The system features:

- **Real-time biosignal streaming** from wearable patches via WebSocket and REST APIs
- **LSTM-based machine learning inference** for ECG arrhythmia detection and SpO₂ trend prediction
- **Multi-role web dashboard** for doctors, nursing staff, and system administrators
- **Comprehensive patient management** with medical history, prescriptions, and clinical notes
- **AI-powered risk scoring** (Digital Twin) combining multiple biomarkers with explainability
- **Secure role-based access control** with patient-doctor-staff hierarchies

By combining **edge computing (ESP32)**, **cloud analytics (FastAPI backend)**, and **real-time visualization (React frontend)**, the platform enables clinicians to make data-driven decisions and detect critical health events instantaneously.

---

## ⚙️ Core Components

### 🧠 1. Smart Wearable IoT Patch
**Hardware:** ESP32 microcontroller + multi-sensor array

**Sensors Integrated:**
- **ECG Sensor** (AD8232) – 250 Hz sampling, lead detection, arrhythmia-ready
- **SpO₂ Sensor** (MAX30102) – Pulse oximetry with Maxim algorithm integration
- **WiFi Connectivity** – 802.11 for real-time data transmission
- **Dual Transmission Mode:**
  - WebSocket (port 81) – Real-time streaming (ECG @ 25 Hz, SpO2 @ 0.5 Hz)
  - HTTP REST API (port 80) – Persistent logging and device management

**Data Acquisition:**
- High-fidelity analog-to-digital conversion
- On-device finger detection and signal quality assessment
- Automatic WiFi reconnection and data buffering
- REST endpoints for debugging: `/status`, `/health`, `/ecg-raw`, `/spo2-raw`, `/memory`, `/network`

**Firmware:** [WearablePatch.ino](hardware/WearablePatch/WearablePatch.ino) with modular sensor components

---

### 📊 2. Real-Time Backend System
**Framework:** FastAPI (Python) with PostgreSQL + TimescaleDB

#### **REST API Endpoints** (19 route modules)

**Authentication & Authorization:**
- JWT-based authentication for doctors, staff, and admins
- Role-based permission delegation

**Real-Time Monitoring (WebSocket):**
- `/ws/ecg/{patient_id}` – ECG streaming with live ML predictions
- `/ws/spo2/{patient_id}` – SpO₂ streaming with trend analysis
- `/ws/vitals/{patient_id}` – Combined vital signs feed

**Clinical Management:**
- `GET/POST /api/patients` – Patient CRUD, medical history, allergies, medications
- `GET/POST /api/patients/{id}/vitals` – Vital signs history and ranges
- `POST /api/prescriptions` – Prescription creation, tracking, expiry alerts
- `POST /api/clinical-notes` – Doctor/staff note creation and retrieval
- `GET /api/ai-insights/{patient_id}` – Digital-twin risk scores with explanations
- `GET/POST /api/staff-tasks` – Task assignment for nursing staff

**Device Management:**
- `POST /api/devices/register` – Auto-registration of ESP32 devices (no auth required)
- `GET /api/admin/devices` – Device monitoring, firmware versions, debug info
- `POST /api/admin/devices/{id}/command` – Remote command execution (JSON-based)

**Telemedicine:**
- `/api/telemedicine/consultations` – Video consultation infrastructure (scheduling/management)

#### **Machine Learning Inference Services**

**ECG Arrhythmia Detection** ([ecg_ml_inference.py](web-app/backend/app/services/ecg_ml_inference.py))
- Model: LSTM-based CNN-LSTM hybrid
- Input: 15-second ECG windows @ 360 Hz (5,400 samples)
- Preprocessing: Notch filter (50Hz rejection), bandpass (0.5-45 Hz), resampling, z-score normalization
- Output: Binary classification (Normal/Abnormal) + confidence score + heart rate
- Buffer Manager: Sliding 15-second window with 2-second updates for real-time performance
- Fallback: Mock predictions on model version mismatch

**SpO₂ Trend Prediction** ([spo2_ml_inference.py](web-app/backend/app/services/spo2_ml_inference.py))
- Model: LSTM (64 units) with BatchNorm and cost-sensitive loss
- Input: Variable-length SpO₂ sequences with 19 engineered features
- Loss Function: Weighted cross-entropy (FN weight = 10.0) to prioritize hypoxia detection
- Threshold Optimization: F2-score maximization for high recall on critical events
- Output: Trend classification + decline alerts + confidence metrics

**Risk Scoring Engine** ([patient_risk_scoring.py](web-app/backend/app/services/patient_risk_scoring.py))
- Digital Twin approach combining biomarkers:
  - ECG prediction: 42% weight
  - SpO₂ prediction: 40% weight
  - Signal stability/motion artifact: 18% weight
- Rolling 1-minute average to dampen transient artifacts
- Returns: Risk level (low/medium/high/critical), contributing factors, explanation

#### **Database Design**

**TimescaleDB Time-Series Storage:**
- Hypertable: `vitals_timeseries` (partitioned by time)
- Efficient storage for millions of vital sign readings
- Indexed on: `time`, `patient_id`, `device_id` for fast range queries

**Relational Models:**
- `patients` – Full patient profiles with demographics, medical history, emergency contacts, insurance
- `users` – Doctors, nurses, admins with role-based permissions
- `devices` – ESP32 device registration, WiFi credentials, firmware versions
- `prescriptions` – Medication orders with dosage schedules, renewal dates, patient compliance
- `clinical_notes` – Free-text medical notes from doctors/staff
- `ai_insights` – AI-generated health recommendations with timestamps and confidence
- `telemedicine_consultations` – Video call scheduling and metadata
- `staff_tasks` – Task queue for nursing staff (vitals check, medication delivery, incident reports)
- `system_logs` – Audit trail and error logging

---

### 💻 3. Real-Time Frontend Dashboard
**Technology Stack:** React + Vite + Tailwind CSS + WebSocket

**Doctor Dashboard** ([src/pages/DoctorDashboard.jsx](web-app/frontend/src/pages/DoctorDashboard.jsx))
- Patient list with risk indicators and alerts
- Real-time vital signs trending
- Quick access to recent clinical notes
- AI insight recommendations with explainability
- Activity feed (new prescriptions, consultation requests, staff updates)

**Patient Detail View** ([src/pages/PatientDetail.jsx](web-app/frontend/src/pages/PatientDetail.jsx))
- Live ECG waveform visualization with WebSocket streaming
- SpO₂ monitoring with historical charts
- Heart rate trends and variability analysis
- Prescription history and active medications
- AI insights panel with digital-twin risk breakdown
- Medical history sidebar with allergies, conditions, past hospitalizations

**Key Pages:**
- `PatientsPage` – Patient list filtering, search, and batch operations
- `PrescriptionsPage` – Medication management, dosage tracking, expiry alerts
- `TelemedicinePage` – Video consultation interface (in development)
- `AIInsightsPage` – Explainable AI recommendations dashboard
- `AdminDashboard` – System health, user management, device monitoring

**Real-Time Updates:**
- ECG chart updates @ 25 Hz via WebSocket
- SpO₂ and vitals @ 0.5 Hz
- Auto-refresh on patient/prescription changes
- Alert notifications for critical events

**Admin Panel** ([src/AdminApp.jsx](web-app/frontend/src/AdminApp.jsx))
- System status and performance metrics
- Device debugging and firmware monitoring
- User role management and permission delegation
- System configuration and settings

---

### 🔬 4. Machine Learning Models
All models trained on real clinical datasets and production-ready.

#### **ECG Analysis Model** ([ml-models/ecg-analysis/](ml-models/ecg-analysis/))
**Architecture:**
```
15-second window (5,400 samples @ 360 Hz)
    ↓
Conv1D (32 filters) + MaxPool
    ↓
Conv1D (64 filters) + MaxPool
    ↓
LSTM (128 units)
    ↓
Dense (64) + Dropout
    ↓
Output: Binary classification (Normal/Abnormal)
```
**Training Data:** MIT-BIH Arrhythmia Database (~100,000+ annotated beats)
**Model Storage:** 
- SavedModel format: `ecg_lstm_model_savedmodel/`
- Keras format: `best_ecg_model.keras`

#### **SpO₂ Prediction Model** ([ml-models/spo2-prediction/model/](ml-models/spo2-prediction/model/))
**Architecture:**
```
Variable-length sequence (19 features)
    ↓
LSTM (64 units) + L2 regularization
    ↓
BatchNorm + Dropout
    ↓
Dense (32) + BatchNorm
    ↓
Output: Probability of critical decline
```
**Key Innovation:** Cost-sensitive learning with 10x penalty for false negatives (missed hypoxia events)
**Model Variants:** Small, Medium, Large for different computational constraints
**Training Optimization:** F2-score threshold for high recall on critical thresholds

---

## 🏗️ Complete System Architecture

### **Data Flow Pipeline**

```
┌─────────────────────┐
│  Wearable Patch     │
│  - ECG Sensor       │
│  - SpO₂ Sensor      │
│  - Lead Detection   │
│  - Finger Detection │
└──────────┬──────────┘
           │ WiFi
           ├─ WebSocket (port 81): Real-time streaming
           └─ HTTP REST (port 80): Persistent logging
           │
           ▼
┌──────────────────────────────────┐
│    FastAPI Backend Services      │
│  - Device auto-registration      │
│  - Real-time WebSocket handlers  │
│  - Buffer management (15-sec)    │
└──────────┬───────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────────┐ ┌──────────────┐
│ ML Models  │ │  PostgreSQL  │
│ ECG LSTM   │ │  + Timescale │
│ SpO2 LSTM  │ │  DB (vitals) │
│ Risk Score │ │  relations   │
└──────┬─────┘ └──────┬───────┘
       │              │
       └──────┬───────┘
              ▼
       ┌─────────────────────┐
       │   Backend Services  │
       │  - AI Insights      │
       │  - Predictions      │
       │  - Risk Scoring     │
       └──────────┬──────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ WebSocket│ │ REST API │ │Telemedicine
│ Streaming│ │ Polling  │ │ Interface
└──────────┘ └──────────┘ └──────────┘
    │             │             │
    └─────────────┼─────────────┘
                  ▼
       ┌──────────────────────┐
       │  React Frontend      │
       │  - Doctor Dashboard  │
       │  - Patient Details   │
       │  - Real-time Charts  │
       │  - AI Insights View  │
       │  - Admin Panel       │
       └──────────────────────┘
```

---

## 📡 Technology Stack

| **Layer** | **Technology** |
|-----------|---|
| **Sensors & Hardware** | ESP32, AD8232 (ECG), MAX30102 (SpO₂) |
| **Sensor Firmware** | Arduino C++ (WearablePatch.ino) |
| **Real-Time Communication** | WebSocket (WSv1), HTTP/1.1 REST, JSON |
| **Backend Framework** | FastAPI (Python 3.8+) |
| **Databases** | PostgreSQL 13+, TimescaleDB 2.0+ |
| **ML & Inference** | TensorFlow/Keras, NumPy, SciPy, Scikit-learn |
| **Frontend Framework** | React 18+, Vite, React Router |
| **Styling** | Tailwind CSS 3+, Chart.js |
| **HTTP Client** | Axios |
| **Container Orchestration** | Docker Compose |
| **Authentication** | JWT tokens, bcrypt hashing |
| **Monitoring** | System logs, audit trails |

---

## 📁 Project Structure

```
Cognivus-Labs-Dev/
│
├── hardware/                          # ESP32 firmware & sensor libraries
│   ├── WearablePatch/
│   │   ├── WearablePatch.ino         # Main ESP32 sketch
│   │   ├── ECGSensor.h/cpp           # AD8232 integration (250 Hz)
│   │   ├── SpO2Sensor.h/cpp          # MAX30102 integration
│   │   ├── WebSocketServer.h/cpp     # Real-time streaming (port 81)
│   │   ├── APIServer.h/cpp           # REST API (port 80, JSON-only)
│   │   ├── WiFiManager.h/cpp         # WiFi handling & data transmission
│   │   ├── CommandHandler.h/cpp      # Remote troubleshooting
│   │   ├── SystemMonitor.h/cpp       # Memory & performance tracking
│   │   ├── Config.h/cpp              # Configuration parameters
│   │   └── python_clients/           # Test scripts (api_client, websocket_client)
│   └── firmware_core/
│       └── firmware_core.ino
│
├── web-app/
│   ├── backend/                       # FastAPI REST API + ML inference
│   │   ├── app/
│   │   │   ├── main.py               # FastAPI app setup (port 8000)
│   │   │   ├── core/
│   │   │   │   ├── config.py         # Environment variables & settings
│   │   │   │   ├── database.py       # SQLAlchemy ORM setup
│   │   │   │   ├── auth.py           # JWT authentication
│   │   │   │   └── dependencies.py   # Dependency injection
│   │   │   ├── models/               # Database models (SQLAlchemy)
│   │   │   │   ├── patient.py        # Patient profiles & medical history
│   │   │   │   ├── user.py           # Doctors, staff, admins
│   │   │   │   ├── device.py         # ESP32 device registration
│   │   │   │   ├── vital_timeseries.py # Time-series data (TimescaleDB)
│   │   │   │   ├── prescription.py   # Medication orders
│   │   │   │   ├── clinical_note.py  # Medical notes
│   │   │   │   ├── ai_insight.py     # AI predictions & recommendations
│   │   │   │   ├── staff_task.py     # Nursing staff task queue
│   │   │   │   └── telemedicine.py   # Consultation infrastructure
│   │   │   ├── api/routes/           # API endpoints (19 route files)
│   │   │   │   ├── auth.py           # User login, JWT tokens
│   │   │   │   ├── admin_auth.py     # Admin login
│   │   │   │   ├── patients.py       # Patient CRUD, medical history
│   │   │   │   ├── patient_vitals.py # Vital signs history
│   │   │   │   ├── prescriptions.py  # Prescription management
│   │   │   │   ├── clinical_notes.py # Doctor notes
│   │   │   │   ├── ai_insights.py    # Digital-twin predictions
│   │   │   │   ├── staff_tasks.py    # Task management
│   │   │   │   ├── telemedicine.py   # Consultation scheduling
│   │   │   │   ├── devices.py        # Device auto-registration
│   │   │   │   ├── admin_devices.py  # Device debugging & monitoring
│   │   │   │   ├── admin_users.py    # User management
│   │   │   │   ├── admin_system.py   # System health metrics
│   │   │   │   ├── ecg_websocket.py  # Real-time ECG with ML
│   │   │   │   ├── spo2_websocket.py # Real-time SpO₂ with ML
│   │   │   │   ├── vitals_websocket.py # Combined vitals streaming
│   │   │   │   └── live_vitals.py    # HTTP polling alternative
│   │   │   └── services/             # Business logic & ML inference
│   │   │       ├── ecg_ml_inference.py    # ECG arrhythmia detection
│   │   │       ├── spo2_ml_inference.py   # SpO₂ trend prediction
│   │   │       ├── patient_risk_scoring.py # Digital-twin risk engine
│   │   │       ├── buffer_manager.py      # Sliding window buffer
│   │   │       └── notification.py        # Alert systems
│   │   ├── requirements.txt           # Python dependencies
│   │   ├── run.py                     # Dev server runner
│   │   ├── run_ecg_feeder.py          # Simulation: ECG data feeder
│   │   ├── run_oxygen_feeder.py       # Simulation: SpO₂ data feeder
│   │   ├── docker-compose.yml         # Container orchestration
│   │   └── Dockerfile                 # Backend image definition
│   │
│   └── frontend/                      # React SPA with Vite
│       ├── src/
│       │   ├── pages/
│       │   │   ├── DoctorDashboard.jsx      # Doctor main dashboard
│       │   │   ├── PatientDetail.jsx        # Patient detailed view
│       │   │   ├── PatientsPage.jsx         # Patient list & search
│       │   │   ├── PrescriptionsPage.jsx    # Prescription management
│       │   │   ├── AIInsightsPage.jsx       # AI recommendations
│       │   │   ├── TelemedicinePage.jsx     # Video consultation
│       │   │   ├── AdminDashboard.jsx       # System admin panel
│       │   │   └── ... (more pages)
│       │   ├── components/            # Reusable UI components
│       │   │   ├── ECGChart.jsx       # Live ECG visualization
│       │   │   ├── SpO2Monitor.jsx    # SpO₂ trending
│       │   │   ├── VitalsPanel.jsx    # Multi-vital display
│       │   │   ├── AlertNotifications.jsx
│       │   │   └── ... (40+ components)
│       │   ├── hooks/
│       │   │   ├── useWebSocket.js    # WebSocket connection
│       │   │   ├── useAPI.js          # REST API calls
│       │   │   ├── useAuth.js         # Auth context
│       │   │   └── usePatient.js      # Patient data management
│       │   ├── services/              # API client services
│       │   │   ├── patientService.js
│       │   │   ├── vitalService.js
│       │   │   ├── prescriptionService.js
│       │   │   ├── aiInsightService.js
│       │   │   └── ... (more services)
│       │   ├── App.jsx                # Main router (doctor/staff/patient views)
│       │   ├── AdminApp.jsx           # Admin router (/sys/*)
│       │   └── index.css              # Global styles
│       ├── vite.config.js             # Main app build config
│       ├── vite.config.admin.js       # Admin panel build config
│       ├── package.json               # Main app dependencies
│       ├── package.admin.json         # Admin app dependencies
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── index.html                 # Main app entry
│       ├── index-admin.html           # Admin panel entry
│       └── public/                    # Static assets
│
├── ml-models/
│   ├── ecg-analysis/                  # ECG arrhythmia detection
│   │   ├── models/                    # Trained models
│   │   │   ├── ecg_lstm_model_savedmodel/  # TensorFlow SavedModel format
│   │   │   └── best_ecg_model.keras        # Keras H5 format
│   │   ├── data/
│   │   │   └── MIT-BIH Arrhythmia Dataset (100-105.hea/atr/xws)
│   │   ├── main.py                    # Training pipeline
│   │   ├── model.py                   # Model architecture
│   │   └── test.py                    # Validation script
│   │
│   └── spo2-prediction/               # SpO₂ trend forecasting
│       ├── model/
│       │   ├── model_small.keras      # Lightweight variant
│       │   ├── model_medium.keras     # Balanced variant
│       │   ├── spo2model.py           # Model definition
│       │   └── training/              # Training notebooks
│       ├── data/                      # Training datasets
│       └── test/                      # Validation scripts
│
├── mobile-app/
│   └── Test_Flutter_Project/          # Flutter patient app (in development)
│       ├── lib/                       # Dart app code
│       ├── pubspec.yaml               # Flutter dependencies
│       └── ... (platform-specific code)
│
├── database/
│   ├── init_timescaledb.sql           # TimescaleDB hypertable setup
│   ├── create_test_patient.sql        # Test data scripts
│   └── ... (migration files)
│
├── tests/
│   └── ECG-Sensor-Test/               # Hardware integration tests
│       ├── monitor.py, monitor-v2.py
│       └── real-time.py
│
├── requirements.txt                   # Root Python dependencies
├── convert_model_to_savedmodel.py     # Model format conversion utility
├── test_ecg_flow.py                   # End-to-end ECG pipeline test
├── ECG_QUICKSTART.md                  # Quick setup guide
└── README.md                          # This file
```

---

## ✨ Key Features & Capabilities

| **Feature** | **Status** | **Details** |
|---|---|---|
| **Real-Time ECG Monitoring** | ✅ Full | WebSocket streaming @ 25 Hz, 15-sec windows with LSTM inference |
| **SpO₂ Trend Tracking** | ✅ Full | WebSocket @ 0.5 Hz, LSTM predictions with decline alerts |
| **Heart Rate Extraction** | ✅ Full | Real-time HR from ECG with variability metrics |
| **Patient Management** | ✅ Full | CRUD, medical history, allergies, current medications, emergency contacts |
| **Prescription Tracking** | ✅ Full | Creation, expiry alerts, compliance monitoring |
| **Clinical Notes** | ✅ Full | Doctor/staff note creation with timestamps and patient linkage |
| **AI Risk Scoring** | ✅ Full | Digital-twin approach combining 3 biomarkers with explainability |
| **ECG Arrhythmia Detection** | ✅ Full | LSTM model trained on MIT-BIH database |
| **SpO₂ Hypoxia Prediction** | ✅ Full | Cost-sensitive LSTM with high recall on critical drops |
| **Device Auto-Registration** | ✅ Full | ESP32 devices register via REST API without manual setup |
| **WebSocket Dual-Stream** | ✅ Full | ECG + SpO₂ + vitals on separate channels with multiplexing |
| **Role-Based Access Control** | ✅ Full | Doctor, Nursing Staff, Admin with permission hierarchies |
| **Admin Dashboard** | ✅ Full | System metrics, user management, device debugging |
| **Telemedicine Infrastructure** | 🟡 Partial | Scheduling in place; video integration in development |
| **Mobile App (Flutter)** | 🟡 In Dev | Patient-facing monitoring interface |
| **Automated Medicine Dispenser** | 🔴 Not Impl. | Planned for Phase 2 |
| **Body Temperature Tracking** | 🔴 Not Impl. | Hardware not integrated |
| **Blood Pressure Monitoring** | 🔴 Not Impl. | Hardware not integrated |

---

## 🚀 Getting Started

### **1. Hardware Setup**

**Required Components:**
- ESP32 DevKit
- AD8232 ECG sensor module
- MAX30102 pulse oximeter module
- USB Serial adapter for programming

**Flash Firmware:**
```bash
# Arduino IDE or PlatformIO
# Open: hardware/WearablePatch/WearablePatch.ino
# Select Board: ESP32 Dev Module
# Configure pins in Config.h
# Flash to device
```

**WiFi Configuration:**
Update `Config.h` with your network credentials:
```cpp
const char* WIFI_SSID = "Your_SSID";
const char* WIFI_PASSWORD = "Your_Password";
const char* BACKEND_IP = "192.168.x.x";
const int BACKEND_PORT = 8000;
```

### **2. Backend Setup**

**Prerequisites:**
- Python 3.8+
- PostgreSQL 13+ with TimescaleDB extension
- pip/poetry

**Installation:**
```bash
cd web-app/backend
pip install -r requirements.txt
```

**Environment Variables** (`.env` file):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/cognivus
TIMESCALEDB_ENABLED=true
JWT_SECRET=your-secret-key
MQTT_BROKER=localhost
MQTT_PORT=1883
```

**Database Initialization:**
```bash
python init_db.py
# Creates tables, hypertables, and indexes
```

**Start Server:**
```bash
python run.py
# Runs on http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

**With Docker:**
```bash
docker-compose -f docker-compose.yml up
```

### **3. Frontend Setup**

**Installation:**
```bash
cd web-app/frontend
npm install
```

**Development Server:**
```bash
npm run dev
# Opens on http://localhost:5173
```

**Admin Panel (Separate Build):**
```bash
npm run dev:admin
# Opens on http://localhost:5174
```

**Production Build:**
```bash
npm run build
# Main app: dist/index.html
# Admin app: npm run build:admin
```

### **4. Test the Full Pipeline**

**Simulate Device Data:**
```bash
# Terminal 1: ECG data feeder
python web-app/backend/run_ecg_feeder.py --patient-id 1 --device-id ECG_SIM_001

# Terminal 2: SpO₂ data feeder
python web-app/backend/run_oxygen_feeder.py --patient-id 1 --device-id SPO2_SIM_001
```

**Monitor Real-Time Streams:**
```bash
cd hardware/WearablePatch/python_clients
python websocket_client.py  # Connect to ESP32 WebSocket
```

---

## 🔌 API Endpoints Overview

### **Authentication**
- `POST /api/auth/login` – Doctor/staff login
- `POST /api/auth/admin-login` – Admin login
- `POST /api/auth/logout` – Logout

### **Patients**
- `GET /api/patients` – List all patients
- `GET /api/patients/{id}` – Patient details
- `POST /api/patients` – Create patient
- `PUT /api/patients/{id}` – Update patient

### **Vital Signs**
- `GET /api/patients/{id}/vitals?start=&end=` – Vital history
- `POST /api/patients/{id}/vitals` – Log manual vitals
- `GET /api/patients/{id}/vitals/latest` – Last reading

### **Real-Time WebSocket**
- `ws://localhost:8000/ws/ecg/{patient_id}` – ECG stream + ML predictions
- `ws://localhost:8000/ws/spo2/{patient_id}` – SpO₂ stream + trend analysis
- `ws://localhost:8000/ws/vitals/{patient_id}` – Combined vitals

### **AI Insights**
- `GET /api/patients/{id}/ai-insights` – Risk scores and recommendations
- `GET /api/patients/{id}/ai-insights/latest` – Most recent prediction

### **Prescriptions**
- `GET /api/prescriptions?patient_id=` – Patient medications
- `POST /api/prescriptions` – Create prescription
- `PUT /api/prescriptions/{id}` – Update prescription

### **Admin Routes**
- `GET /api/admin/devices` – All registered devices
- `POST /api/admin/devices/{id}/command` – Send remote command
- `GET /api/admin/users` – All users
- `GET /api/admin/system/health` – System metrics

---

## 🔧 ML Model Usage

**Using ECG Model Directly:**
```python
from app.services.ecg_ml_inference import ECGMLInference

inference = ECGMLInference()
# Expects: 5400 samples (15 sec @ 360 Hz)
prediction = inference.predict(ecg_signal)
# Returns: {"is_abnormal": bool, "confidence": float, "heart_rate": float}
```

**Using SpO2 Model:**
```python
from app.services.spo2_ml_inference import SpO2MLInference

inference = SpO2MLInference()
# Expects: variable-length sequence with 19 features
prediction = inference.predict(spo2_sequence)
# Returns: {"prediction": float, "trend": str, "confidence": float}
```

### **Retraining Models**
```bash
cd ml-models/ecg-analysis
python main.py --epochs 50 --batch-size 32
```

---

## 📊 Database Schema Highlights

**TimescaleDB Hypertable** (`vitals_timeseries`):
- Optimized for fast time-range queries
- Automatic data compression on older records
- Automatic data retention policies

**Key Indexes:**
- `(time, patient_id)` – Fast patient vital retrieval
- `(patient_id, time DESC)` – Latest vitals lookup
- `(device_id, time DESC)` – Device data debugging

---

## 🔐 Security Features

✅ **JWT Authentication** – Secure API token generation and validation  
✅ **Password Hashing** – bcrypt with salt  
✅ **Role-Based Access Control** – Doctor/staff/admin hierarchies  
✅ **CORS Configuration** – Frontend-backend isolation  
✅ **Input Validation** – Pydantic models for all API inputs  
✅ **SQL Injection Prevention** – SQLAlchemy ORM parameterized queries  
✅ **Audit Logging** – All data access logged to `system_logs`  
✅ **Device Auto-Registration** – Cryptographic device tokens  

---

## 🧪 Testing

**Test Real-Time ECG Flow:**
```bash
python test_ecg_flow.py
```

**Test Device Integration:**
```bash
cd tests/ECG-Sensor-Test
python monitor.py
```

**API Testing via Swagger UI:**
Navigate to `http://localhost:8000/docs` and test endpoints interactively.

---

## 📈 Performance Metrics

| **Component** | **Metric** | **Target** |
|---|---|---|
| **ECG Processing** | Latency (end-to-end) | < 5 seconds |
| **SpO₂ Inference** | Throughput | 1 prediction / 2 sec |
| **WebSocket** | Message rate | 25 Hz (ECG), 0.5 Hz (SpO₂) |
| **Database** | Query time (patient vitals) | < 100 ms |
| **ML Model** | Inference time (ECG) | < 2 sec |
| **ML Model** | Inference time (SpO₂) | < 1 sec |
| **Uptime** | System availability | 99.9% |

---

## 🐛 Debugging & Troubleshooting

**Device Connection Issues:**
```bash
# Check device status
curl http://<ESP32_IP>/status

# Get real-time diagnostics
curl http://<ESP32_IP>/health
```

**Backend Logs:**
```bash
# Check FastAPI logs
docker-compose logs -f backend

# View database queries
export LOG_LEVEL=DEBUG; python run.py
```

**Frontend Issues:**
```bash
# Check browser console for WebSocket errors
# Inspect Network tab for API calls
# Verify backend is running on port 8000
```

---

## 📜 Project Roadmap

**Phase 1 (Current):** ✅
- Real-time ECG/SpO₂ monitoring
- LSTM-based ML inference
- Multi-role web dashboard
- Patient/prescription/clinical note management

**Phase 2 (Planned):**
- 🔴 Automated medicine dispenser integration
- 🟡 Telemedicine video consultation (in development)
- 🟡 Mobile app (Flutter) patient interface
- Temperature and blood pressure sensors

**Phase 3 (Future):**
- Wearable health alerts (push notifications)
- Advanced predictive modeling (multivariate forecasting)
- Inter-hospital data exchange protocols
- Wearable device firmware OTA updates

---

## 👥 Development Team

**Developers:**
- **Wathsala Dewmina** – Backend, ML Inference, Database Design
- **Rivindu Ashinsa** – Frontend, Real-time Visualization
- **Wooshan Gamage** – Hardware/Firmware, ESP32 Integration
- **Dulina Samarathunga** – DevOps, Docker, System Architecture
- **Lakidu Minosha** – ML Model Training, AI Insights

**Institution:**
Computing School (Bachelor of Science in Computer Science)  
*IIT (Informatics Institute Of Technology), Sri Lanka*

**Academic Supervision:**
Supervised as final-year capstone project focusing on IoT healthcare innovation and real-time biosignal processing.

---

## 📄 License

This project is developed for **academic research and educational purposes** as a capstone project at IIT.

**Use Restrictions:**
- Educational and research use only
- Requires permission for commercial deployment
- Not approved for clinical use without regulatory certification

© 2025-2026 Smart IoT Healthcare Monitoring System Team. All rights reserved.

---

## 📚 Documentation Files

- **[ECG_QUICKSTART.md](ECG_QUICKSTART.md)** – Quick start guide for ECG streaming
- **[ECG_MONITORING_IMPLEMENTATION.md](ECG_MONITORING_IMPLEMENTATION.md)** – Detailed ECG implementation guide
- **Swagger API Docs** – Interactive at `http://localhost:8000/docs`
- **Frontend Component Library** – Built-in Storybook integration

---

## 🔗 Related Resources

- **Hardware Documentation:** [hardware/WearablePatch/README.md](hardware/WearablePatch/README.md)
- **Backend Services:** [web-app/backend/requirements.txt](web-app/backend/requirements.txt)
- **Frontend Packages:** [web-app/frontend/package.json](web-app/frontend/package.json)
- **ML Model Details:** [ml-models/ecg-analysis/main.py](ml-models/ecg-analysis/main.py)

---

## 🎯 Citation

If you use this project for academic research, please cite:

```bibtex
@software{cognivus_2025,
  title   = {Smart IoT-Based Healthcare Monitoring System},
  author  = {Dewmina, W. and Ashinsa, R. and Gamage, W. and Samarathunga, D. and Minosha, L.},
  year    = {2025},
  school  = {Informatics Institute of Technology, Sri Lanka},
  type    = {Capstone Project}
}
```

---

## 📞 Support & Contributions

**For Bug Reports:**
Open an issue with:
- Reproduction steps
- Screenshots/logs
- ESP32 firmware version
- Backend version

**For Feature Requests:**
Describe the use case and expected behavior.

**For Contributors:**
- Follow PEP 8 (Python) and Prettier (JavaScript) style guides
- Write tests for new features
- Document API changes in Swagger
- Update this README for architecture changes

---

**Made with ❤️ for advancing healthcare technology**