'use client';

import { Patient } from '@/app/providers';

interface PatientProfileProps {
  patient: Patient;
}

export default function PatientProfile({ patient }: PatientProfileProps) {
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      {/* Clean gradient hero area */}
      <div className="relative py-10 px-6 text-center overflow-hidden">
        {/* Subtle radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.08] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/[0.06] rounded-full blur-3xl" />

        {/* Avatar */}
        <div className="relative inline-block animate-fade-in-up z-10">
          <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-primary/40 to-primary-dark/30
                          flex items-center justify-center mx-auto
                          border-2 border-primary/30 shadow-glow-primary">
            <span className="text-2xl font-bold text-white/90 tracking-wider">{initials}</span>
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-accent-green
                          border-2 border-background-dark shadow-glow-green"></div>
        </div>

        {/* Patient Name */}
        <h2 className="relative z-10 text-xl font-semibold mt-4 mb-1 tracking-tight text-white animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}>
          {patient.name}
        </h2>

        {/* Patient ID Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 mt-2 px-3.5 py-1 rounded-full
                        bg-white/[0.06] border border-white/[0.08]
                        animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green"></div>
          <span className="text-xs font-medium text-white/70 tracking-wide">ID: {patient.id}</span>
        </div>
      </div>
    </div>
  );
}
