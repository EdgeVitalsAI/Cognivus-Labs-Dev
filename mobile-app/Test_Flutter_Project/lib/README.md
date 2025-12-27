📱 Patient Monitoring Mobile App (Flutter)
📌 Project Overview

This Flutter mobile application is developed as part of a Software Development Group Project (SDGP).
The app allows patients or guardians to view real-time patient health data by entering a Patient ID.

🔹 The application currently uses mock data to simulate backend behavior.
🔹 When the backend API is completed, mock data can be replaced with real API calls without changing UI logic.

🎯 Main Features

Patient ID–based access

Display patient personal details

Display real-time vital signs:

SpO₂

Pulse

Body Temperature

Auto-refresh (simulated real-time updates)

Clean, modular Flutter project structure

Backend-ready architecture (API contract based)

🧠 System Architecture (Current Phase)
Flutter Mobile App
↓
Mock Data Layer
↓
(Simulates Backend API)


🔜 Future Integration

Flutter App → Backend API → PostgreSQL Database

🛠️ Technologies Used

Flutter (Dart)

Provider (state management – ready)

Material UI

📁 Project Folder Structure
patient_monitor_app/
│
├── pubspec.yaml
└── lib/
├── main.dart
│
├── app/
│   ├── app.dart
│   └── routes.dart
│
├── screens/
│   ├── login_screen.dart
│   └── dashboard_screen.dart
│
├── models/
│   ├── patient_model.dart
│   └── vitals_model.dart
│
├── services/
│   └── api_service.dart
│
├── mock/
│   └── mock_data.dart
│
└── widgets/
├── info_card.dart
└── vital_card.dart

📦 Dependencies (pubspec.yaml)
dependencies:
flutter:
sdk: flutter
provider: ^6.0.5


Run:

flutter pub get

🚀 Application Entry Point
lib/main.dart
import 'package:flutter/material.dart';
import 'app/app.dart';

void main() {
runApp(const PatientApp());
}

🧠 App Configuration
lib/app/app.dart
import 'package:flutter/material.dart';
import 'routes.dart';

class PatientApp extends StatelessWidget {
const PatientApp({super.key});

@override
Widget build(BuildContext context) {
return MaterialApp(
title: 'Patient Monitor',
debugShowCheckedModeBanner: false,
initialRoute: Routes.login,
routes: Routes.routes,
);
}
}

lib/app/routes.dart
import 'package:flutter/material.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';

class Routes {
static const login = '/';
static const dashboard = '/dashboard';

static Map<String, WidgetBuilder> routes = {
login: (_) => const LoginScreen(),
dashboard: (_) => const DashboardScreen(),
};
}

📄 Data Models
lib/models/patient_model.dart
class Patient {
final String patientId;
final String fullName;
final String gender;
final String nic;
final String roomNumber;
final String doctor;

Patient({
required this.patientId,
required this.fullName,
required this.gender,
required this.nic,
required this.roomNumber,
required this.doctor,
});
}

lib/models/vitals_model.dart
class Vitals {
final int spo2;
final int pulse;
final double temperature;
final String lastUpdated;

Vitals({
required this.spo2,
required this.pulse,
required this.temperature,
required this.lastUpdated,
});
}

🧪 Mock Data (Temporary Backend Simulation)
lib/mock/mock_data.dart
import '../models/patient_model.dart';
import '../models/vitals_model.dart';
import 'dart:math';

Patient mockPatient = Patient(
patientId: 'PT001',
fullName: 'John Silva',
gender: 'Male',
nic: '200112345678',
roomNumber: 'Ward 3 - Bed 12',
doctor: 'Dr. Perera',
);

Vitals generateMockVitals() {
final random = Random();
return Vitals(
spo2: 95 + random.nextInt(4),
pulse: 70 + random.nextInt(10),
temperature: 36.5 + random.nextDouble(),
lastUpdated: DateTime.now().toString(),
);
}

🔌 API Service (Mocked for Now)
lib/services/api_service.dart
import '../mock/mock_data.dart';
import '../models/patient_model.dart';
import '../models/vitals_model.dart';

class ApiService {
static Future<Patient> getPatient(String patientId) async {
await Future.delayed(const Duration(seconds: 1));
return mockPatient;
}

static Future<Vitals> getVitals(String patientId) async {
await Future.delayed(const Duration(seconds: 1));
return generateMockVitals();
}
}

🧭 Screens
Login Screen

Accepts Patient ID

Navigates to Dashboard

Dashboard Screen

Displays patient profile

Displays live vitals

Auto-refresh every few seconds

📌 UI widgets are separated into reusable components (widgets/).

🔄 Real-Time Update Strategy

Uses periodic refresh (Timer)

New vitals generated every refresh

Simulates live database updates

This will later be replaced with:

API polling or

WebSocket-based updates