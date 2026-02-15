'use client';

import { Patient } from '@/app/providers';

interface PatientProfileProps {
  patient: Patient;
}

export default function PatientProfile({ patient }: PatientProfileProps) {
  return (
    <div className="gradient-primary py-8 px-6 text-center mb-6">
      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl text-white border-[3px] border-white/30">
        <i className="fas fa-user-circle"></i>
      </div>
      <h2 className="text-2xl font-semibold mb-1">{patient.name}</h2>
      <p className="text-sm opacity-90">ID: {patient.id}</p>
    </div>
  );
}
