'use client';

import { Patient } from '@/app/providers';

interface PatientProfileProps {
  patient: Patient;
}

export default function PatientProfile({ patient }: PatientProfileProps) {
  // Get initials from patient name
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="gradient-primary-mesh mesh-dots py-10 px-6 text-center">
        {/* Decorative floating circles */}
        <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/[0.04] animate-float"></div>
        <div className="absolute bottom-6 right-12 w-24 h-24 rounded-full bg-white/[0.03] animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-4 w-8 h-8 rounded-full bg-white/[0.05] animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Avatar */}
        <div className="relative inline-block animate-fade-in-up">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 
                          flex items-center justify-center mx-auto avatar-glow
                          border-[3px] border-white/25">
            <span className="text-3xl font-bold text-white tracking-wider">{initials}</span>
          </div>
          {/* Online status badge */}
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-accent-green 
                          border-[3px] border-[#4338CA] shadow-glow-green"></div>
        </div>

        {/* Patient Name */}
        <h2 className="text-2xl font-bold mt-5 mb-1 tracking-tight text-white animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}>
          {patient.name}
        </h2>

        {/* Patient ID Badge */}
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full 
                        bg-white/[0.12] border border-white/[0.15] backdrop-blur-sm
                        animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan"></div>
          <span className="text-sm font-medium text-white/90 tracking-wide">ID: {patient.id}</span>
        </div>
      </div>

      {/* Curved bottom edge */}
      <div className="h-6 bg-background-dark -mt-6 rounded-t-3xl relative z-10"></div>
    </div>
  );
}
