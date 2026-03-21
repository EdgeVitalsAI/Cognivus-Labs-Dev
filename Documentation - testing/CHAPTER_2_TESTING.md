# Chapter 2: Testing

## 2.1 Chapter Introduction

This chapter presents the testing activities conducted for the Smart IoT-Based Healthcare Monitoring and Management System. The objective of the testing process was to determine whether the implemented modules satisfy the defined functional and non-functional requirements, while also identifying limitations and partially completed areas that require further work.

Testing was performed across the complete operational path of the system, including wearable data simulation, backend ingestion and processing, machine learning inference, WebSocket delivery, and user interface verification. Since the project is being developed in phases, the chapter intentionally reports completed functionality first, followed by partially implemented and pending features.

The evidence in this chapter is derived from executable scripts in the codebase, implementation logs, technical documentation, and direct validation of service behavior.

---

## 2.2 Testing Criteria

The following criteria were selected to evaluate the current implementation state of the system.

| Criterion | Rationale | Evaluation Method |
|---|---|---|
| Functional correctness | To verify that implemented features behave according to their requirement definitions | Execution of test scripts, route validation, WebSocket payload inspection |
| End-to-end data integrity | To ensure that data moves correctly from source to storage and presentation layers | Stream simulation, database state verification, frontend observation |
| Real-time responsiveness | To evaluate timeliness of processing and delivery for clinical monitoring use | Inference interval checks, stream cadence checks, latency observations |
| Reliability and resilience | To assess continuity of operation under non-ideal conditions | Startup/shutdown lifecycle checks, fallback behavior, reconnection checks |
| Security controls | To confirm existence and operation of access protection mechanisms | JWT validation paths, password hashing behavior, role-based access checks |
| Usability baseline | To ensure core user workflows are understandable and operable | Dashboard workflow walkthroughs, UI smoke tests |
| Compatibility baseline | To verify operation across expected clients and deployment targets | Protocol checks, browser/runtime checks, mobile framework checks |

To maintain consistency in reporting, each requirement was categorized using the following outcome labels.

- Completed: Implemented and supported by current test evidence.
- Partial/In Progress: Implemented in part, but lacking full workflow completion or comprehensive validation.
- Not Implemented: Not currently available in the active project scope.

---

## 2.3 Testing Functional Requirements

### 2.3.1 Prioritized Functional Test Results

In accordance with the requirement priorities provided for the project, completed critical and desirable functionalities are presented first.

| FR | Priority | Requirement | Status | Summary of Current Evidence |
|---|---|---|---|---|
| FR1 | Critical | Real-time vital sign monitoring | Completed | ECG, SpO2, and heart-rate monitoring paths are implemented with active stream handling. |
| FR2 | Critical | Wireless data transmission | Completed | Sensor and simulator data transmission is supported through WebSocket and HTTP pathways over local network. |
| FR3 | Critical | Machine learning-based health predictions | Completed | ECG and SpO2 inference services are integrated with buffering and monitoring workflows. |
| FR6 | Critical | Web portal for doctors and staff | Completed | Multi-role web interfaces for doctors, staff, and administrators are implemented. |
| FR7 | Critical | Alert generation for abnormal readings | Completed | Abnormal trend outputs and alert-oriented status messaging are available in monitoring flows. |
| FR10 | Critical | Data logging and storage | Completed | Time-series and relational persistence are implemented and verifiable through test and history routes. |
| FR18 | Critical | Local network backend processing | Completed | Data processing and prediction pipelines run in local backend deployment. |
| FR8 | Desirable | Patient profile management | Completed | Patient profile creation and management routes are implemented. |
| FR17 | Desirable | User-friendly dashboard | Completed | Dashboards provide live vitals, trends, and patient-centered workflow views. |
| FR9 | Critical | Automated medication reminder notifications | Partial/In Progress | Reminder-related data structures exist, but complete automated reminder delivery is not finalized. |
| FR11 | Desirable | Multi-patient monitoring support | Partial/In Progress | Core architecture supports multiple patients; full-scale concurrency testing remains limited. |
| FR12 | Desirable | Secure login and authentication | Partial/In Progress | JWT and RBAC are implemented; complete security hardening across all channels is still pending. |
| FR13 | Desirable | Sensor connectivity status monitoring | Partial/In Progress | Device status tracking is present; escalation and richer notification logic require expansion. |
| FR15 | Desirable | Report generation for doctors | Partial/In Progress | Clinical data views are present, but finalized downloadable report generation is limited. |
| FR20 | Desirable | Caregiver notification system | Partial/In Progress | Alert structures are available, while dedicated caregiver notification workflow is incomplete. |
| FR5 | Desirable | Mobile application for patients | Partial/In Progress | Flutter application structure and basic test coverage exist; full patient feature set is under development. |
| FR14 | Luxury | Medicine stock tracking | Partial/In Progress | Some inventory-related structures exist; complete stock telemetry and enforcement workflow is pending. |
| FR4 | Critical | Medicine dispensing automation | Not Implemented | Not implemented in the current phase. |
| FR19 | Critical | Fail-safe medicine dispensing | Not Implemented | Dependent on dispensing subsystem that is not yet integrated. |
| FR16 | Luxury | OTA updates for ESP32 firmware | Not Implemented | Marked as planned future functionality. |

### 2.3.2 Functional Test Activities and Outcomes

1. End-to-end ECG data flow validation.
- Artifact: test_ecg_flow.py.
- Method: verifies database connectivity, sample availability, and active 15-second data windows.
- Outcome: validates continuity between feeder data and persistent storage.

2. WebSocket live monitoring simulation.
- Artifact: web-app/backend/test_websocket.py.
- Method: transmits simulated ECG, heart-rate, and SpO2 payloads through backend WebSocket endpoints.
- Outcome: confirms real-time ingestion and stream compatibility without requiring physical hardware.

3. Continuous ingestion validation.
- Artifact: hardware/WearablePatch/python_clients/continuous_stream_test.py.
- Method: sends recurring vital payloads to continuous backend endpoints and inspects response behavior.
- Outcome: validates sustained data ingestion behavior under repetitive load.

4. Multi-device registration validation.
- Artifact: hardware/WearablePatch/python_clients/test_device_registration.py.
- Method: registers multiple simulated devices with unique identifiers.
- Outcome: supports readiness for multi-device and multi-patient expansion.

5. Real-time ECG analysis toolchain validation.
- Artifacts: tests/ECG-Sensor-Test/monitor.py, tests/ECG-Sensor-Test/real-time.py, tests/ECG-Sensor-Test/monitor-cli.py.
- Method: verifies stream handling, preprocessing stages, model inference cycle, and abnormality reporting.
- Outcome: confirms operational behavior of the ECG analysis and alert pipeline.

### 2.3.3 Required Screenshot Evidence

The following screenshots should be captured and inserted into the final implementation report.

- Screenshot A: test_ecg_flow.py terminal output with sample counts and recent-window confirmation.
- Screenshot B: test_websocket.py terminal output showing successful connection and streamed payload logs.
- Screenshot C: continuous_stream_test.py output showing recurring successful submissions.
- Screenshot D: device registration output and corresponding device list view in the administrative interface.
- Screenshot E: ECG monitoring output demonstrating normal and abnormal inference messages.

---

## 2.4 Testing Non-Functional Requirements

### 2.4.1 Non-Functional Requirement Outcomes

| NFR | Priority | Requirement | Status | Summary of Current Evidence |
|---|---|---|---|---|
| NFR3 | Critical | Real-time performance | Completed | Real-time buffering, periodic inference cycles, and stream-based delivery are active. |
| NFR1 | Critical | System reliability | Completed (current scope) | Lifecycle handling, buffered processing, and fallback behavior are implemented. |
| NFR9 | Critical | Fault tolerance | Completed (baseline) | Recovery-oriented behavior exists for model loading issues and stream continuity concerns. |
| NFR8 | Critical | Accuracy of AI predictions | Partial/In Progress | ML models are integrated and tested operationally; full clinical-grade validation is pending. |
| NFR2 | Critical | Data security and privacy | Partial/In Progress | Authentication and role controls are implemented; full compliance hardening is pending. |
| NFR7 | Desirable | Maintainability | Completed | Modular structure across backend services, routes, and firmware components supports maintainability. |
| NFR4 | Desirable | Usability and accessibility | Partial/In Progress | Core workflows are usable; formal accessibility evaluation has not yet been completed. |
| NFR6 | Desirable | Scalability | Partial/In Progress | Multi-patient architecture exists, but large-scale stress evidence remains limited. |
| NFR10 | Luxury | Interoperability | Partial/In Progress | Standard REST and WebSocket interfaces are provided; external healthcare integrations are pending. |
| NFR5 | Desirable | Wearability and comfort | Not Yet Fully Tested | Formal long-duration comfort studies are not yet documented. |

### 2.4.2 Non-Functional Validation Activities

1. Reliability and service resilience checks.
- Startup and shutdown behavior for ECG and SpO2 monitoring services was verified.
- Model-loading fallback behavior was validated for compatibility and missing-model cases.

2. Security control checks.
- Password hashing workflow (bcrypt) and token-based authentication paths were verified.
- Role-based endpoint access control for doctor, staff, and administrator roles was reviewed.

3. Fault-tolerance checks.
- Continuous stream and WebSocket behaviors were observed for long-running scenarios.
- Timeout and stale-data safeguards in buffering and monitoring layers were reviewed.

4. Maintainability checks.
- Separation of concerns was verified across services, models, routes, and frontend modules.
- Firmware components were confirmed to follow modular structure for extensibility.

### 2.4.3 Required Screenshot Evidence

- Screenshot F: backend startup logs showing monitoring service initialization.
- Screenshot G: authentication failure behavior for invalid or expired token.
- Screenshot H: stream recovery or continued monitoring after connection interruption.

---

## 2.5 Unit Testing

Unit testing coverage is currently limited but includes direct evidence at component and UI levels.

### 2.5.1 Unit and Component-Level Evidence

1. Flutter widget test.
- Artifact: mobile-app/Test_Flutter_Project/test/widget_test.dart.
- Purpose: verifies application boot and initial user-facing login text.
- Outcome: confirms baseline UI integrity for the patient mobile application entry state.

2. Backend component-oriented checks.
- Artifacts: test_ecg_flow.py and test_device_registration.py.
- Purpose: validate assumptions at individual pipeline segments, including data persistence and deterministic identity behavior.
- Outcome: confirms expected behavior of specific backend interaction units.

3. ECG processing component checks.
- Artifacts: tests/ECG-Sensor-Test scripts.
- Purpose: validate preprocessing, buffering, and model invocation behavior.
- Outcome: supports confidence in ECG-specific computational components.

### 2.5.2 Interpretation

Due to the hybrid nature of this system (embedded device + backend streaming + machine learning), testing has emphasized integration behavior. Nevertheless, available unit-oriented checks provide useful baseline confidence. Additional automated backend unit test suites with mocks are recommended for stronger regression control.

### 2.5.3 Required Screenshot Evidence

- Screenshot I: successful execution of Flutter widget tests.
- Screenshot J: code snippet and output evidence from one backend-focused component test.

---

## 2.6 Performance Testing

### 2.6.1 Performance Objectives

Performance testing focused on whether the current implementation can sustain near real-time clinical monitoring behavior.

The evaluated dimensions were:

- ECG processing and prediction turnaround.
- SpO2 prediction cadence.
- WebSocket delivery continuity and responsiveness.
- Backend read/write responsiveness for vital records.

### 2.6.2 Performance Evidence Summary

1. Baseline targets documented in project artifacts.
- ECG end-to-end latency target: < 5 seconds.
- ECG inference target: < 2 seconds.
- SpO2 inference target: < 1 second.
- Stream rates: ECG 25 Hz, SpO2 0.5 Hz.

2. Observed implementation characteristics.
- Monitoring cycle configured at 2-second intervals for inference updates.
- Inference and stream behavior align with real-time dashboard update expectations.

3. Firmware-side stability evidence.
- Continuous-load behavior and memory stability are documented in embedded performance notes.

### 2.6.3 Interpretation

Current results indicate that the architecture is suitable for local near real-time monitoring in the current deployment context. For production-readiness, formal benchmark campaigns with concurrent patient simulations and percentile latency reporting should be added.

### 2.6.4 Required Screenshot Evidence

- Screenshot K: periodic prediction logs from backend runtime.
- Screenshot L: steady stream cadence as observed in monitoring client or dashboard logs.
- Screenshot M: firmware memory and stability output under sustained operation.

---

## 2.7 Usability Testing

### 2.7.1 Scope

Usability testing at this stage focused on validating core workflows for doctors, staff, and administrators, with baseline verification for the patient mobile interface.

### 2.7.2 Activities Conducted

1. Clinical dashboard workflow walkthrough.
- Verified navigation from patient list to patient detail pages.
- Verified visibility of real-time vital information and related clinical sections.

2. Administrative workflow walkthrough.
- Verified login flow and access to user and device management views.

3. Mobile baseline verification.
- Verified successful loading of the patient mobile app entry interface through widget testing.

### 2.7.3 Findings

The current interfaces support the primary technical workflows required for monitoring and management. However, formal usability studies involving representative end users should be completed to provide quantitative usability evidence.

### 2.7.4 Required Screenshot Evidence

- Screenshot N: doctor dashboard landing view.
- Screenshot O: patient detail interface with live monitoring elements.
- Screenshot P: administrative interface for device and user management.
- Screenshot Q: patient mobile application initial screen.

---

## 2.8 Compatibility Testing

### 2.8.1 Scope

Compatibility testing was performed at baseline level across communication protocols, browser runtime expectations, and mobile framework targets.

### 2.8.2 Results

1. Protocol compatibility.
- JSON-based REST and WebSocket interfaces were validated using backend and client-side scripts.

2. Browser compatibility baseline.
- Frontend architecture uses standard React and Vite tooling suitable for modern browser environments.
- No critical browser-specific dependency was identified in tested workflows.

3. Mobile target compatibility baseline.
- Flutter project includes Android, iOS, web, Windows, Linux, and macOS targets.
- Entry-path widget tests execute successfully as a baseline compatibility indicator.

4. Device-backend compatibility.
- Integration scripts and wearable communication patterns confirm compatibility over local network deployment.

### 2.8.3 Current Limitations

- A full browser-version compatibility matrix is not yet documented.
- Formal device-lab validation across multiple Android and iOS versions remains pending.

### 2.8.4 Required Screenshot Evidence

- Screenshot R: same dashboard view rendered in at least two browser environments.
- Screenshot S: backend and browser-side stream messages confirming protocol compatibility.
- Screenshot T: mobile app execution on emulator or physical device.

---

## 2.9 Chapter Summary

This chapter documented the testing process and outcomes for the current development stage of the Smart IoT-Based Healthcare Monitoring and Management System. Results indicate strong progress in real-time monitoring, wireless transmission, local AI-enabled processing, data persistence, and role-based web portal functionality. Non-functional baselines for reliability, performance, and maintainability are also established.

At the same time, this chapter identifies clearly bounded gaps, including medicine dispensing automation, fail-safe dispensing logic, OTA firmware updates, full caregiver notification workflows, and comprehensive compatibility and usability studies. These findings provide a transparent basis for final-phase implementation and validation planning.

Overall, the present evidence demonstrates that the system has achieved a stable technical foundation appropriate for continued development toward full requirement completion.

---

## Appendix: Command Set Used During Testing

```bash
python web-app/backend/test_websocket.py
python test_ecg_flow.py
python hardware/WearablePatch/python_clients/continuous_stream_test.py
python hardware/WearablePatch/python_clients/test_device_registration.py

cd mobile-app/Test_Flutter_Project
flutter test
```
