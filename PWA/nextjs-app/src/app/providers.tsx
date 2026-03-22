'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
export interface Patient {
  id: string;
  name: string;
  gender: string;
  nic: string;
  room: string;
  doctor: string;
}

export interface Vitals {
  spo2: { value: number; min: number; max: number };
  pulse: { value: number; min: number; max: number };
  temperature: { value: number; min: number; max: number };
  bp: { systolic: number; diastolic: number };
}

export interface Alert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
}

// Context Types
interface AppContextType {
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
  vitals: Vitals | null;
  setVitals: (vitals: Vitals | null) => void;
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  isOnline: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: ReactNode }) {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((message: string, type: string = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPatient,
        setCurrentPatient,
        vitals,
        setVitals,
        alerts,
        setAlerts,
        isOnline,
        showToast,
      }}
    >
      {children}
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-accent-orange text-white py-3 px-4 text-center text-sm font-medium z-50 animate-slide-down flex items-center justify-center gap-2">
          <i className="fas fa-wifi-slash"></i>
          <span>You are offline</span>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-background-card px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg z-50 max-w-[calc(100%-48px)] animate-fade-in`}
        >
          <i
            className={`fas ${
              toast.type === 'success'
                ? 'fa-check-circle text-accent-green'
                : toast.type === 'error'
                ? 'fa-times-circle text-accent-red'
                : toast.type === 'warning'
                ? 'fa-exclamation-triangle text-accent-orange'
                : 'fa-info-circle text-primary'
            }`}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within a Provider');
  }
  return context;
}
