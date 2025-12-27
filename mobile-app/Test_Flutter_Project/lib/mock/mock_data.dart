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

