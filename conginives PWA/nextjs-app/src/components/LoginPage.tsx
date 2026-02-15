'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/providers';

export default function LoginPage() {
  const [patientId, setPatientId] = useState('');
  const router = useRouter();
  const { showToast } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const id = patientId.trim().toUpperCase();
    
    if (!id) {
      showToast('Please enter a Patient ID', 'error');
      return;
    }

    // Save to local storage
    localStorage.setItem('lastPatientId', id);
    
    // Navigate to dashboard
    router.push(`/dashboard?id=${id}`);
  };

  // Load saved patient ID on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastPatientId');
    if (saved) setPatientId(saved);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-10 bg-gradient-to-b from-background-dark to-[#0d1220]">
      {/* Logo Section */}
      <div className="text-center mb-16">
        <div className="w-28 h-28 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/40 shimmer relative overflow-hidden">
          <i className="fas fa-heartbeat text-6xl text-white"></i>
        </div>
        <h1 className="text-3xl font-bold tracking-widest mb-3 gradient-text">
          COGNIVUSLABS
        </h1>
        <p className="text-primary-light text-sm tracking-[0.25em] font-medium">
          PREDICT. PROTECT. HEAL.
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="relative mb-5">
          <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-text-muted text-lg"></i>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID"
            className="w-full py-4 px-5 pl-14 bg-background-input border-2 border-transparent rounded-xl text-white text-base focus:border-primary transition-all duration-300"
            autoComplete="off"
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-4 px-8 bg-primary rounded-xl text-white text-base font-semibold shadow-lg shadow-primary/40 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/50 active:translate-y-0 transition-all duration-300"
        >
          View Patient Data
        </button>
      </form>

      {/* Demo Info */}
      <p className="mt-8 text-text-muted text-sm text-center">
        Demo IDs: PT001, PT002, PT003
      </p>
    </div>
  );
}
