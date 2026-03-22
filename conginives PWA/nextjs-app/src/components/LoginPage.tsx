'use client';

import { useApp } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
        <div className="min-h-screen flex flex-col justify-center items-center px-6 py-10 bg-background-dark relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-accent-blue/[0.04] rounded-full blur-3xl" />
            </div>

            {/* Logo Section */}
            <div className="text-center mb-14 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-7 shadow-glow-primary shimmer relative overflow-hidden">
                    <i className="fas fa-heartbeat text-5xl text-white"></i>
                </div>
                <h1 className="text-2xl font-bold tracking-[0.2em] mb-2 text-white">
                    COGNIVUSLABS
                </h1>
                <p className="text-primary-light/70 text-xs tracking-[0.3em] font-medium uppercase">
                    Predict. Protect. Heal.
                </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-sm relative z-10">
                <div className="relative mb-4">
                    <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm"></i>
                    <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="Enter Patient ID"
                        className="w-full py-3.5 px-4 pl-12 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-text-muted focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
                        autoComplete="off"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 px-8 bg-primary rounded-xl text-white text-sm font-semibold shadow-glow-primary hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                    View Patient Data
                </button>
            </form>

            {/* Demo Info */}
            <p className="mt-6 text-text-muted text-xs text-center relative z-10">
                Demo IDs: PT001, PT002, PT003
            </p>
        </div>
    );
}
