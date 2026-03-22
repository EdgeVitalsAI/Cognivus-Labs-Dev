import '../models/patient_model.dart';
import '../models/vitals_model.dart';
import 'dart:math';

Patient mockPatient = Patient(
  patientId: 'PT004',
  fullName: 'Dinithi Kavindya Rathnayake',
  gender: 'Female',
  nic: '200045678912',
  roomNumber: 'Ward 2 - Bed 07',
  doctor: 'Dr. Sanduni Jayawardena',
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

List<Patient> mockPatients = [
  Patient(
    patientId: 'PT001',
    fullName: 'Lakindu Minosha Senarathne',
    gender: 'Male',
    nic: '200112345678',
    roomNumber: 'Ward 1 - Bed 05',
    doctor: 'Dr. Nimal Perera',
  ),

  
  Patient(
    patientId: 'PT002',
    fullName: 'Nadeesha Fernando',
    gender: 'Female',
    nic: '199845678912',
    roomNumber: 'Ward 2 - Bed 08',
    doctor: 'Dr. Chamila Silva',
  ),
