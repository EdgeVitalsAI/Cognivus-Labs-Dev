'use client';

import AlertsSection from '@/components/dashboard/AlertsSection';
import Header from '@/components/dashboard/Header';
import PatientInfo from '@/components/dashboard/PatientInfo';
import PatientProfile from '@/components/dashboard/PatientProfile';
import VitalsSection from '@/components/dashboard/VitalsSection';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Alert, Patient, useApp, Vitals } from '../providers';

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
    const [isLoading, setIsLoading] = useState(true);

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

    const fetchVitalsForPatient = useCallback(async (id: string) => {
        const vitalsResponse = await fetch(`/api/vitals/${id}`, { cache: 'no-store' });
        if (!vitalsResponse.ok) {
            throw new Error('Failed to load vitals');
        }

        const currentVitals: Vitals = await vitalsResponse.json();
        setLocalVitals(currentVitals);
        setVitals(currentVitals);
        setLastUpdated(new Date().toLocaleTimeString());

        const newAlerts = checkAlerts(currentVitals);
        setLocalAlerts(newAlerts);
        setAlerts(newAlerts);
    }, [checkAlerts, setAlerts, setVitals]);

    const loadPatientAndVitals = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const patientResponse = await fetch(`/api/patients/${id}`, { cache: 'no-store' });

            if (!patientResponse.ok) {
                throw new Error('Patient not found');
            }

            const loadedPatient: Patient = await patientResponse.json();
            setPatient(loadedPatient);
            setCurrentPatient(loadedPatient);

            await fetchVitalsForPatient(id);
        } catch (error) {
            console.error(error);
            showToast('Patient not found', 'error');
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    }, [fetchVitalsForPatient, router, setCurrentPatient, showToast]);

    // Load patient data
    useEffect(() => {
        if (!patientId) {
            router.push('/');
            return;
        }

        loadPatientAndVitals(patientId.toUpperCase());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    // Real-time vitals monitoring
    useEffect(() => {
        if (!patientId) return;
        const normalizedId = patientId.toUpperCase();

        const interval = setInterval(() => {
            fetchVitalsForPatient(normalizedId).catch((error) => {
                console.error(error);
            });
        }, 10000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchVitalsForPatient, patientId]);

    const handleBack = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }

        router.push('/');
    }, [router]);

    const handleRefresh = useCallback(() => {
        if (!patientId) return;

        setIsRefreshing(true);
        fetchVitalsForPatient(patientId.toUpperCase())
            .then(() => {
                showToast('Vitals refreshed', 'success');
            })
            .catch((error) => {
                console.error(error);
                showToast('Failed to refresh vitals', 'error');
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    }, [fetchVitalsForPatient, patientId, showToast]);

    if (isLoading || !patient || !vitals) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-glow-pulse">
                        <i className="fas fa-spinner fa-spin text-2xl text-primary-light"></i>
                    </div>
                    <p className="text-text-secondary font-medium">Loading patient data...</p>
                    <p className="text-text-muted text-sm mt-1">Please wait</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark smooth-scroll relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl animate-float" />
                <div className="absolute top-1/3 -right-32 w-80 h-80 bg-accent-blue/[0.05] rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-accent-purple/[0.04] rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative z-10">
                <Header
                    onBack={handleBack}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />
                <PatientProfile patient={patient} />
                <VitalsSection vitals={vitals} lastUpdated={lastUpdated} />
                <PatientInfo patient={patient} />
                <AlertsSection alerts={alerts} />

                {/* Bottom spacer for safe area */}
                <div className="h-8"></div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-background-dark">
                    <div className="text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-glow-pulse">
                            <i className="fas fa-spinner fa-spin text-2xl text-primary-light"></i>
                        </div>
                        <p className="text-text-secondary font-medium">Loading...</p>
                    </div>
                </div>
            }
        >
            <DashboardPageInner />
        </Suspense>
    );
}
