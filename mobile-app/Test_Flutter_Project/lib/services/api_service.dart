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

