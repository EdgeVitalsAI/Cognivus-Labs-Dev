# Chapter 2: Testing

## 2.1 Chapter Introduction

This chapter documents the testing performed for the Smart IoT-Based Healthcare Monitoring and Management System. The goal of testing was to verify that implemented system capabilities work as expected under realistic use conditions, identify incomplete requirements, and provide evidence for system quality.

Testing in this project was carried out across hardware simulation scripts, backend service tests, WebSocket streaming checks, model inference validation, and UI-level checks. Since development is phase-based, this chapter prioritizes completed functionality first, then reports partially completed and not-yet-implemented requirements.

The documented evidence is based on:
- Executable test scripts in the repository.
- Backend and firmware integration test tools.
- Project-level performance and implementation notes.
- Existing run logs and validation outputs.

---

## 2.2 Testing Criteria

The following criteria were selected to evaluate the current system implementation.

| Criterion | Purpose | Measurement Method |
|---|---|---|
| Functional correctness | Validate each implemented feature against FR definitions | Script execution, API/WebSocket behavior, DB checks |
| Data flow integrity | Ensure end-to-end pipeline works (sensor/simulator -> backend -> storage -> frontend) | Live stream simulation + DB verification |
| Real-time behavior | Verify periodic processing and timely event delivery | Message interval checks, inference cycle checks |
| Reliability and fault handling | Ensure system behaves safely on missing models, connection drops, and invalid states | Startup fallback validation, reconnection behavior, service status checks |
| Security controls | Validate authentication and role restrictions | JWT, password hashing, protected route behavior |
| Usability and accessibility baseline | Verify essential user workflows are understandable and operable | Dashboard flow checks, Flutter widget load test |
| Compatibility | Confirm multi-platform and multi-client operability | Browser/web stack checks, Flutter multi-target support, API/WebSocket client compatibility |

Acceptance logic used:
- Pass: Feature works according to current implementation scope and has supporting evidence.
- Partial: Feature exists but with limited scope, incomplete automation, or in-progress integration.
- Fail/Not implemented: Feature absent or explicitly marked as future work.

---

## 2.3 Testing Functional Requirements

### 2.3.1 Prioritized Functional Test Results (Completed First)

| FR | Priority | Requirement | Status | Evidence Summary |
|---|---|---|---|---|
| FR1 | Critical | Real-time vital sign monitoring | Completed | ECG + SpO2 + HR streaming pipeline implemented; live monitoring services and WebSocket routes active. |
| FR2 | Critical | Wireless data transmission | Completed | ESP32 and simulator clients transmit over Wi-Fi/WebSocket and HTTP stream endpoints. |
| FR3 | Critical | ML-based health predictions | Completed | ECG and SpO2 inference services integrated with buffer managers and live publishing. |
| FR6 | Critical | Web portal for doctors and staff | Completed | Multi-role React web portal with doctor/staff/admin dashboards and patient views. |
| FR7 | Critical | Alert generation for abnormal readings | Completed | ECG/SpO2 prediction outputs include abnormal trend and alert-oriented status/events. |
| FR10 | Critical | Data logging and storage | Completed | TimescaleDB + relational models, history routes, and feeder validation scripts confirm data persistence. |
| FR18 | Critical | Local network backend processing | Completed | Local FastAPI backend performs data processing and model inference on LAN workflow. |
| FR17 | Desirable | User-friendly dashboard | Completed | Structured dashboards for real-time vitals, trends, and clinical tasks available in web frontend. |
| FR8 | Desirable | Patient profile management | Completed | Patient CRUD and profile data model/routes implemented. |
| FR15 | Desirable | Report generation for doctors | Partial | Notes/history/analytics are available, but formal downloadable report workflow is still limited. |
| FR11 | Desirable | Multi-patient monitoring support | Partial | Backend models and dashboards support multiple patients; stress validation for full-scale operations is limited. |
| FR12 | Desirable | Secure login and authentication | Partial to Completed | JWT + bcrypt + role checks implemented; WebSocket auth hardening remains pending. |
| FR13 | Desirable | Sensor connectivity status monitoring | Partial | Device heartbeat and connection status exist; full notification escalation can be expanded. |
| FR9 | Critical | Automated medication reminder notifications | Partial | Prescription/task reminder fields exist, but full patient/caregiver reminder automation is not complete. |
| FR20 | Desirable | Caregiver notification system | Partial | Alert-related structures exist; dedicated caregiver communication workflow is not fully completed. |
| FR5 | Desirable | Mobile application for patients | In Progress | Flutter project exists with base test; feature-complete patient app still under development. |
| FR4 | Critical | Medicine dispensing automation | Not Implemented | Explicitly planned for later phase. |
| FR19 | Critical | Fail-safe medicine dispensing | Not Implemented | Depends on dispenser subsystem; not yet integrated. |
| FR14 | Luxury | Medicine stock tracking | In Progress/Partial | Inventory-facing UI/backend entities exist, but full device stock telemetry and enforcement are not complete. |
| FR16 | Luxury | OTA updates for ESP32 firmware | Not Implemented | Mentioned as future roadmap item. |

### 2.3.2 Functional Test Cases Executed

1. End-to-end ECG data flow validation.
- Script: `test_ecg_flow.py`.
- Validation: checks TimescaleDB connection, sample counts, first/last sample times, and 15-second active window.
- Outcome: confirms FR1 + FR10 data pipeline when feeder is running.

2. Backend WebSocket live monitoring simulation.
- Script: `web-app/backend/test_websocket.py`.
- Validation: simulates ECG, HR, and SpO2 payload transmission to backend WebSocket route.
- Outcome: confirms FR1, FR2, FR6 real-time stream pathway without hardware dependency.

3. Continuous stream endpoint ingestion test.
- Script: `hardware/WearablePatch/python_clients/continuous_stream_test.py`.
- Validation: sends periodic ECG/SpO2/HR HTTP stream payloads and checks backend response.
- Outcome: supports FR2 + FR10 continuous ingestion behavior.

4. Multi-device registration test.
- Script: `hardware/WearablePatch/python_clients/test_device_registration.py`.
- Validation: registers multiple synthetic ESP32 devices with unique MAC/IP values.
- Outcome: supports FR11 + FR13 readiness for multi-device operation.

5. Real-time ECG monitor test tools.
- Scripts: `tests/ECG-Sensor-Test/monitor.py`, `tests/ECG-Sensor-Test/real-time.py`, `tests/ECG-Sensor-Test/monitor-cli.py`.
- Validation: serial/WebSocket stream, preprocessing, model inference, abnormal event reporting.
- Outcome: supports FR1 + FR3 + FR7 algorithm and live processing flow.

### 2.3.3 Screenshot Evidence to Include

Add the following screenshots when compiling the final thesis document:
- Screenshot A: terminal output of `python test_ecg_flow.py` showing DB count and recent 15-second window.
- Screenshot B: terminal output of `python web-app/backend/test_websocket.py` showing successful WebSocket connection and sample send logs.
- Screenshot C: terminal output of continuous stream script showing repeated success responses.
- Screenshot D: admin/device listing after registration test showing multiple devices.
- Screenshot E: live ECG monitor output (normal/abnormal inference logs).

---

## 2.4 Testing Non-Functional Requirements

### 2.4.1 NFR Test Results (Completed First)

| NFR | Priority | Requirement | Status | Evidence Summary |
|---|---|---|---|---|
| NFR3 | Critical | Real-time performance | Completed | Configured 2-second inference cycle, real-time WebSocket delivery, and documented latency targets. |
| NFR1 | Critical | System reliability | Completed (current scope) | Service startup/shutdown lifecycle, buffering, reconnection, and graceful fallback support. |
| NFR8 | Critical | Accuracy of AI predictions | Partial to Completed | Production models integrated with monitoring tools and training metrics; full clinical validation set is outside current scope. |
| NFR9 | Critical | Fault tolerance | Completed (baseline) | Handles missing model/version issues with mock fallback; buffer timeout and connection resiliency implemented. |
| NFR2 | Critical | Data security and privacy | Partial | JWT, bcrypt, RBAC present; full transport hardening and compliance controls still need expansion. |
| NFR4 | Desirable | Usability and accessibility | Partial | Multi-role dashboards and simple workflows exist; formal accessibility audit not yet completed. |
| NFR6 | Desirable | Scalability | Partial | Architecture supports multi-patient operations; broad load testing evidence is limited. |
| NFR7 | Desirable | Maintainability | Completed | Modular services (buffer/inference/monitoring), clear route separation, and componentized firmware/backend structure. |
| NFR5 | Desirable | Wearability and comfort | Not Yet Fully Tested | Hardware usability testing exists informally; no formal comfort study results included yet. |
| NFR10 | Luxury | Interoperability | Partial | Standard REST/WebSocket JSON interfaces exist; integration with external hospital systems pending. |

### 2.4.2 Key Non-Functional Checks Performed

1. Reliability and startup resilience.
- Verified startup sequence initializes ML services and monitoring managers.
- Verified fallback operation when model incompatibility/missing model occurs.

2. Security mechanism verification.
- Password hashing via bcrypt.
- JWT access and refresh token generation and decode checks.
- Role-based route protection for doctor/staff/admin workflows.

3. Fault tolerance checks.
- WebSocket reconnection patterns and long-running stream validation.
- Buffer timeout handling and stale data protection paths in monitoring services.

4. Maintainability checks.
- Modularized architecture across services, routes, schemas, and models.
- Isolated sensor firmware modules and backend service boundaries.

### 2.4.3 Screenshot Evidence to Include

- Screenshot F: backend startup logs showing ECG/SpO2 service initialization and fallback behavior.
- Screenshot G: protected route behavior with invalid/expired token.
- Screenshot H: WebSocket reconnection or resumed streaming after interruption.

---

## 2.5 Unit Testing

Formal unit testing is currently limited, but targeted script-level and widget-level tests are present.

### 2.5.1 Unit/Component Test Evidence

1. Flutter widget unit test.
- File: `mobile-app/Test_Flutter_Project/test/widget_test.dart`.
- Test objective: ensure patient app loads and essential login text is rendered.
- Assertion examples: checks for "Patient Monitor" and login helper text.

2. Backend component behavior verification through focused scripts.
- `test_ecg_flow.py` validates data state assumptions for ECG pipeline.
- `test_device_registration.py` validates deterministic device identity handling behavior.

3. ECG processing component validation.
- ECG monitor scripts in `tests/ECG-Sensor-Test` validate preprocessing + model inference cycle.

### 2.5.2 Justification

Because this project includes hardware, streaming, and ML inference components, test strategy currently emphasizes integration-driven verification. Existing unit-level coverage is strongest in Flutter UI and component logic checks, while backend and firmware testing is presently script-oriented. Expanding automated unit tests (pytest for backend services and mocks for WebSocket/device adapters) is recommended as next work.

### 2.5.3 Screenshot Evidence to Include

- Screenshot I: Flutter test run output for `widget_test.dart` passing.
- Screenshot J: selected code snippets from widget test and one backend script with expected assertions/checks.

---

## 2.6 Performance Testing

### 2.6.1 Performance Scope

The current performance verification focused on real-time processing constraints:
- ECG processing and prediction cycle timing.
- SpO2 periodic inference throughput.
- WebSocket stream responsiveness.
- Backend data query responsiveness.

### 2.6.2 Performance Evidence

1. Documented target metrics (project baseline):
- ECG end-to-end latency target: < 5 seconds.
- ECG inference time target: < 2 seconds.
- SpO2 inference target: < 1 second.
- WebSocket rates: ECG 25 Hz, SpO2 0.5 Hz.

2. ECG monitoring implementation characteristics:
- Inference loop interval: 2 seconds.
- Backend ML inference noted around ~50-200 ms per prediction in implementation documentation.
- Frontend WebSocket latency target noted as < 100 ms (local environment).

3. Firmware stability evidence:
- Continuous-load stability and memory behavior documented in ESP32 performance section.

### 2.6.3 Justification

Given medical monitoring context, predictability and low-latency behavior are critical. Current performance checks confirm that the implemented architecture supports near real-time monitoring in local deployment. A formal load-testing suite (multiple concurrent patient streams with measured P95/P99 latency) should be added for final production validation.

### 2.6.4 Screenshot Evidence to Include

- Screenshot K: backend logs showing periodic prediction generation.
- Screenshot L: WebSocket stream monitor showing steady message cadence.
- Screenshot M: ESP32 memory/performance monitoring output.

---

## 2.7 Usability Testing

### 2.7.1 Usability Scope

Usability testing focused on practical user flows for clinicians/staff and basic patient app accessibility.

### 2.7.2 Activities Performed

1. Doctor/staff dashboard workflow walkthrough.
- Verified patient list access, patient detail navigation, and live vitals visibility.
- Verified access to prescriptions, notes, and AI insight pages.

2. Admin usability check.
- Verified login and device/user management navigation paths.

3. Mobile baseline check.
- Verified Flutter app startup and initial guidance text through widget test.

### 2.7.3 Findings

- Core navigation and role-based dashboard segmentation are usable.
- Real-time visual components are integrated and understandable for technical users.
- Formal usability scoring with end users (elderly patients, caregivers, clinicians) is still pending and should be conducted using SUS or task-completion metrics.

### 2.7.4 Screenshot Evidence to Include

- Screenshot N: doctor dashboard main view.
- Screenshot O: patient detail with live vitals and AI insights.
- Screenshot P: admin devices/users screen.
- Screenshot Q: Flutter app initial screen.

---

## 2.8 Compatibility Testing

### 2.8.1 Compatibility Scope

Compatibility was examined across API clients, browser-based frontend runtime, and mobile app target structure.

### 2.8.2 Evidence and Results

1. Protocol and client compatibility.
- REST and WebSocket interfaces use JSON payloads, enabling cross-client interoperability.
- Python clients and backend test scripts validate protocol compatibility.

2. Browser compatibility baseline.
- Frontend built using Vite + React, tested in modern Chromium-class environments during development.
- No browser-specific APIs without fallbacks were identified in the tested workflow.

3. Mobile platform compatibility baseline.
- Flutter project contains Android, iOS, web, Windows, Linux, and macOS targets.
- Base widget test confirms application boot path at framework level.

4. Device/backend compatibility.
- ESP32 firmware and backend integration scripts confirm network protocol compatibility on local network deployment.

### 2.8.3 Limitations

- Formal cross-browser matrix (Chrome, Firefox, Edge, Safari versions) is not yet fully documented.
- Real-device mobile compatibility matrix (multiple Android/iOS versions) is still pending.

### 2.8.4 Screenshot Evidence to Include

- Screenshot R: same frontend page rendered in at least two browsers.
- Screenshot S: WebSocket message logs from backend and browser dev tools.
- Screenshot T: mobile app running on emulator/device.

---

## 2.9 Chapter Summary

This chapter presented testing performed for the current project phase and mapped outcomes directly to functional and non-functional requirements. Completed areas are strongest in real-time monitoring, data transmission, backend processing, ML inference integration, storage, and role-based web operations. Performance and reliability baselines are also established through streaming and service-level checks.

At the same time, the testing report clearly identifies partial or pending areas: medicine dispensing automation, OTA firmware updates, full caregiver notification automation, broader security hardening for all channels, and formalized cross-browser/mobile test matrices.

Overall, the implemented system demonstrates a stable and testable foundation for a real-time healthcare monitoring platform, with clear next steps for completing advanced and luxury requirements.

---

## Appendix: Quick Command Set Used During Testing

```bash
# Backend websocket simulation
python web-app/backend/test_websocket.py

# End-to-end ECG flow check (DB validation)
python test_ecg_flow.py

# Continuous HTTP streaming simulation
python hardware/WearablePatch/python_clients/continuous_stream_test.py

# Multi-device registration simulation
python hardware/WearablePatch/python_clients/test_device_registration.py

# Flutter widget test
cd mobile-app/Test_Flutter_Project
flutter test
```
