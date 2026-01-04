import 'package:flutter/material.dart';
import 'dart:async';
import '../models/patient_model.dart';
import '../models/vitals_model.dart';
import '../services/api_service.dart';
import '../widgets/info_card.dart';
import '../widgets/vital_card.dart';
import '../theme/app_colors.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Patient? _patient;
  Vitals? _vitals;
  bool _isLoading = true;
  Timer? _refreshTimer;
  String? _patientId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_patientId == null) {
      _patientId = ModalRoute.of(context)?.settings.arguments as String? ?? 'PT001';
      _loadData();
      _startAutoRefresh();
    }
  }

  Future<void> _loadData() async {
    try {
      final patient = await ApiService.getPatient(_patientId!);
      final vitals = await ApiService.getVitals(_patientId!);

      if (mounted) {
        setState(() {
          _patient = patient;
          _vitals = vitals;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  void _startAutoRefresh() {
    // Refresh vitals every 5 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _refreshVitals();
    });
  }

  Future<void> _refreshVitals() async {
    try {
      final vitals = await ApiService.getVitals(_patientId!);
      if (mounted) {
        setState(() {
          _vitals = vitals;
        });
      }
    } catch (e) {
      // Handle error silently for auto-refresh
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Dashboard'),
        backgroundColor: AppColors.backgroundLight,
        foregroundColor: AppColors.textPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _isLoading = true;
              });
              _loadData();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _patient == null
              ? const Center(child: Text('No patient data found', style: TextStyle(color: AppColors.textPrimary)))
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Patient Info Section
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: AppColors.primaryGradient,
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(30),
                              bottomRight: Radius.circular(30),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 40,
                                backgroundColor: AppColors.textPrimary,
                                child: Icon(
                                  Icons.person,
                                  size: 50,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _patient!.fullName,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'ID: ${_patient!.patientId}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Patient Details
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'Patient Information',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        InfoCard(
                          title: 'Gender',
                          value: _patient!.gender,
                          icon: Icons.person_outline,
                        ),
                        InfoCard(
                          title: 'NIC',
                          value: _patient!.nic,
                          icon: Icons.credit_card,
                        ),
                        InfoCard(
                          title: 'Room',
                          value: _patient!.roomNumber,
                          icon: Icons.room,
                        ),
                        InfoCard(
                          title: 'Doctor',
                          value: _patient!.doctor,
                          icon: Icons.medical_services,
                        ),

                        const SizedBox(height: 20),

                        // Vitals Section
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Vital Signs',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              if (_vitals != null)
                                Text(
                                  'Updated: ${_formatTime(_vitals!.lastUpdated)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 12),

                        if (_vitals != null)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: GridView.count(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 1.1,
                              children: [
                                VitalCard(
                                  title: 'SpO₂',
                                  value: '${_vitals!.spo2}',
                                  unit: '%',
                                  icon: Icons.air,
                                  color: AppColors.spo2Color,
                                ),
                                VitalCard(
                                  title: 'Pulse',
                                  value: '${_vitals!.pulse}',
                                  unit: 'bpm',
                                  icon: Icons.favorite,
                                  color: AppColors.heartRateColor,
                                ),
                                VitalCard(
                                  title: 'Temperature',
                                  value: _vitals!.temperature.toStringAsFixed(1),
                                  unit: '°C',
                                  icon: Icons.thermostat,
                                  color: AppColors.temperatureColor,
                                ),
                              ],
                            ),
                          ),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
    );
  }

  String _formatTime(String dateTimeStr) {
    try {
      final dateTime = DateTime.parse(dateTimeStr);
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}:${dateTime.second.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr;
    }
  }
}

