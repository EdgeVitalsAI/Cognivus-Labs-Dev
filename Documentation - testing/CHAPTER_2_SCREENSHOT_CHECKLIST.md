# Chapter 2 Screenshot Checklist Template

Use this template to attach screenshot evidence for Chapter 2 and keep figure numbering, captions, and justification consistent.

## Instructions

1. Capture each screenshot after a successful run.
2. Name files using this pattern: `CH2_<ID>_<short-name>.png`.
3. Store images in your thesis assets folder.
4. Paste the final image path and figure number in the table.
5. Keep one clear technical justification per screenshot.

---

## Master Checklist

| ID | Chapter Section | What to Capture | Script/Page/Source | Expected Visible Evidence | Image File Name | Figure No. | Caption (Final Thesis Text) | Justification |
|---|---|---|---|---|---|---|---|---|
| A | 2.3 Functional Testing | ECG flow terminal output | `test_ecg_flow.py` | DB connection success, sample count, recent 15-second window | CH2_A_ecg_flow.png |  |  | Confirms end-to-end data persistence and active ECG ingestion. |
| B | 2.3 Functional Testing | WebSocket simulation output | `web-app/backend/test_websocket.py` | Successful connection and sample send logs | CH2_B_ws_simulation.png |  |  | Confirms real-time data transmission and backend stream handling. |
| C | 2.3 Functional Testing | Continuous stream sender output | `hardware/WearablePatch/python_clients/continuous_stream_test.py` | Repeated successful API responses | CH2_C_continuous_stream.png |  |  | Confirms sustained periodic data ingestion behavior. |
| D | 2.3 Functional Testing | Device registration plus list view | Device registration script + admin devices page | Multiple registered devices with unique identifiers | CH2_D_device_registration.png |  |  | Confirms multi-device registration and management capability. |
| E | 2.3 Functional Testing | ECG monitor anomaly output | `tests/ECG-Sensor-Test/monitor.py` or `real-time.py` | Normal/abnormal predictions or alert message | CH2_E_ecg_alerts.png |  |  | Confirms ML inference and abnormality signaling behavior. |
| F | 2.4 Non-Functional Testing | Backend startup logs | Backend runtime console | Service initialization for ECG/SpO2 and monitoring loops | CH2_F_startup_logs.png |  |  | Demonstrates reliability of startup and service orchestration. |
| G | 2.4 Non-Functional Testing | Auth failure response | Protected API route call | 401/403 response for invalid or expired token | CH2_G_auth_failure.png |  |  | Confirms enforcement of security and access control. |
| H | 2.4 Non-Functional Testing | Stream continuity after interruption | WebSocket client or backend logs | Reconnection or resumed stream updates | CH2_H_recovery.png |  |  | Demonstrates baseline fault tolerance and stream resilience. |
| I | 2.5 Unit Testing | Flutter widget test result | `mobile-app/Test_Flutter_Project/test/widget_test.dart` | Test pass output in terminal | CH2_I_flutter_widget_test.png |  |  | Provides unit-level proof for mobile UI boot behavior. |
| J | 2.5 Unit Testing | Unit/component code plus output | One test script and its output | Code snippet and matching successful execution output | CH2_J_unit_component.png |  |  | Supports traceability between test implementation and result. |
| K | 2.6 Performance Testing | Periodic prediction generation logs | Backend monitoring logs | Stable periodic prediction updates | CH2_K_prediction_cadence.png |  |  | Supports real-time processing claims. |
| L | 2.6 Performance Testing | Message cadence evidence | WebSocket monitor or dashboard developer tools | Continuous and stable stream updates | CH2_L_stream_rate.png |  |  | Supports live stream responsiveness and continuity claims. |
| M | 2.6 Performance Testing | Firmware performance metrics | ESP32 serial output or health endpoint output | Memory and stability indicators | CH2_M_firmware_perf.png |  |  | Supports embedded performance and stability claims. |
| N | 2.7 Usability Testing | Doctor dashboard screen | Web frontend doctor view | Clear patient-centric monitoring dashboard | CH2_N_doctor_dashboard.png |  |  | Demonstrates usability of clinician workflow entry point. |
| O | 2.7 Usability Testing | Patient detail page | Web frontend patient view | Live vitals and AI insight sections visible | CH2_O_patient_detail.png |  |  | Demonstrates usability of detailed patient monitoring workflow. |
| P | 2.7 Usability Testing | Admin management screen | Admin dashboard | Device/user management elements visible | CH2_P_admin_panel.png |  |  | Demonstrates usability of administrative controls. |
| Q | 2.7 Usability Testing | Mobile app entry screen | Flutter app run | Initial patient monitoring/login screen | CH2_Q_mobile_start.png |  |  | Demonstrates baseline mobile usability. |
| R | 2.8 Compatibility Testing | Same web page in browser 1 and browser 2 | Web frontend in two browsers | Consistent rendering across browsers | CH2_R_browser_compare.png |  |  | Demonstrates browser compatibility baseline. |
| S | 2.8 Compatibility Testing | Protocol compatibility evidence | Backend logs + browser dev tools | REST/WebSocket payload exchange visibility | CH2_S_protocol_compat.png |  |  | Demonstrates client-protocol compatibility. |
| T | 2.8 Compatibility Testing | Mobile compatibility run | Emulator or physical mobile device | App runs on selected target environment | CH2_T_mobile_device.png |  |  | Demonstrates baseline mobile target compatibility. |

---

## Optional Figure Text Template

Use the format below in the thesis under each figure.

- Figure X.X: <caption>
- Context: <where/when this screenshot was captured>
- Result: <what this proves>

Example:

- Figure 2.3: WebSocket simulation successfully streaming ECG, heart-rate, and SpO2 payloads to the backend.
- Context: Captured during execution of `web-app/backend/test_websocket.py` on local development server.
- Result: Confirms functional compliance for real-time wireless data transmission.
