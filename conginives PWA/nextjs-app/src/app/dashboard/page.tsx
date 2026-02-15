'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import PatientProfile from '@/components/dashboard/PatientProfile';
import PatientInfo from '@/components/dashboard/PatientInfo';
import VitalsSection from '@/components/dashboard/VitalsSection';
import { useApp, Patient, Vitals, Alert } from '../providers';

// Patient Database (mock data)
const PatientDatabase: Record<string, { patient: Patient; vitals: Vitals }> = {
  PT001: {
    patient: {
      id: 'PT001',
      name: 'John Silva',
      gender: 'Male',
      nic: '200112345678',
      room: 'Ward 3 - Bed 12',
      doctor: 'Dr. Perera',
    },
    vitals: {
      spo2: { value: 97, min: 95, max: 100 },
      pulse: { value: 77, min: 60, max: 100 },
      temperature: { value: 37.3, min: 36.5, max: 37.5 },
      bp: { systolic: 120, diastolic: 80 },
    },
  },
  PT002: {
    patient: {
      id: 'PT002',
      name: 'Sarah Fernando',
      gender: 'Female',
      nic: '199856789012',
      room: 'Ward 2 - Bed 5',
      doctor: 'Dr. Wijesinghe',
    },
    vitals: {
      spo2: { value: 98, min: 95, max: 100 },
      pulse: { value: 72, min: 60, max: 100 },
      temperature: { value: 36.8, min: 36.5, max: 37.5 },
      bp: { systolic: 118, diastolic: 75 },
    },
  },
  PT003: {
    patient: {
      id: 'PT003',
      name: 'Kumar Jayawardena',
      gender: 'Male',
      nic: '198523456789',
      room: 'ICU - Bed 2',
      doctor: 'Dr. Mendis',
    },
    vitals: {
      spo2: { value: 94, min: 95, max: 100 },
      pulse: { value: 95, min: 60, max: 100 },
      temperature: { value: 38.2, min: 36.5, max: 37.5 },
      bp: { systolic: 145, diastolic: 95 },
    },
  },
};

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');
  const { setCurrentPatient, setVitals, setAlerts, showToast } = useApp();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setLocalVitals] = useState<Vitals | null>(null);
  const [alerts, setLocalAlerts] = useState<Alert[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check alerts based on vitals
  const checkAlerts = useCallback((currentVitals: Vitals): Alert[] => {
    const newAlerts: Alert[] = [];

    if (currentVitals.spo2.value < currentVitals.spo2.min) {
      newAlerts.push({
        type: 'critical',
        title: 'Low SpO₂ Level',
        message: `SpO₂ at ${currentVitals.spo2.value}% - Below normal range`,
      });
    }

    if (currentVitals.pulse.value > currentVitals.pulse.max || 
        currentVitals.pulse.value < currentVitals.pulse.min) {
      newAlerts.push({
        type: 'warning',
        title: 'Abnormal Heart Rate',
        message: `Pulse at ${currentVitals.pulse.value} bpm`,
      });
    }

    if (currentVitals.temperature.value > currentVitals.temperature.max) {
      newAlerts.push({
        type: 'warning',
        title: 'Elevated Temperature',
        message: `Temperature at ${currentVitals.temperature.value}°C`,
      });
    }

    if (currentVitals.bp.systolic > 140 || currentVitals.bp.diastolic > 90) {
      newAlerts.push({
        type: 'warning',
        title: 'High Blood Pressure',
        message: `BP at ${currentVitals.bp.systolic}/${currentVitals.bp.diastolic} mmHg`,
      });
    }

    return newAlerts;
  }, []);

  // Update vitals with random variations
  const updateVitals = useCallback((baseVitals: Vitals): Vitals => {
    const clamp = (value: number, min: number, max: number) => 
      Math.min(Math.max(value, min), max);
    
    const randomVariation = (min: number, max: number) => 
      Math.random() * (max - min) + min;

    return {
      spo2: {
        ...baseVitals.spo2,
        value: Math.round(clamp(baseVitals.spo2.value + randomVariation(-1, 1), 90, 100)),
      },
      pulse: {
        ...baseVitals.pulse,
        value: Math.round(clamp(baseVitals.pulse.value + randomVariation(-3, 3), 50, 120)),
      },
      temperature: {
        ...baseVitals.temperature,
        value: parseFloat(clamp(
          baseVitals.temperature.value + randomVariation(-0.1, 0.1),
          35.5,
          39.5
        ).toFixed(1)),
      },
      bp: {
        systolic: Math.round(clamp(baseVitals.bp.systolic + randomVariation(-2, 2), 90, 160)),
        diastolic: Math.round(clamp(baseVitals.bp.diastolic + randomVariation(-2, 2), 60, 100)),
      },
    };
  }, []);

  // Load patient data
  useEffect(() => {
    if (!patientId) {
      router.push('/');
      return;
    }

    const data = PatientDatabase[patientId.toUpperCase()];
    if (!data) {
      showToast('Patient not found', 'error');
      router.push('/');
      return;
    }

    setPatient(data.patient);
    setLocalVitals(data.vitals);
    setCurrentPatient(data.patient);
    setVitals(data.vitals);
    setLastUpdated(new Date().toLocaleTimeString());

    const initialAlerts = checkAlerts(data.vitals);
    setLocalAlerts(initialAlerts);
    setAlerts(initialAlerts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Real-time vitals monitoring
  useEffect(() => {
    if (!vitals) return;

    const interval = setInterval(() => {
      setLocalVitals((prev) => {
        if (!prev) return prev;
        const updated = updateVitals(prev);
        setVitals(updated);
        setLastUpdated(new Date().toLocaleTimeString());
        
        const newAlerts = checkAlerts(updated);
        setLocalAlerts(newAlerts);
        setAlerts(newAlerts);
        
        return updated;
      });
    }, 10000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateVitals, checkAlerts]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  }, [router]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (vitals) {
        const updated = updateVitals(vitals);
        setLocalVitals(updated);
        setVitals(updated);
        setLastUpdated(new Date().toLocaleTimeString());
        
        const newAlerts = checkAlerts(updated);
        setLocalAlerts(newAlerts);
        setAlerts(newAlerts);
      }
      setIsRefreshing(false);
      showToast('Vitals refreshed', 'success');
    }, 1000);
  }, [vitals, updateVitals, checkAlerts, setVitals, setAlerts, showToast]);

  if (!patient || !vitals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-text-secondary">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark animate-fade-in">
      <Header 
        onBack={handleBack} 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />
      <PatientProfile patient={patient} />
      <PatientInfo patient={patient} />
      <VitalsSection vitals={vitals} lastUpdated={lastUpdated} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-dark">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}
