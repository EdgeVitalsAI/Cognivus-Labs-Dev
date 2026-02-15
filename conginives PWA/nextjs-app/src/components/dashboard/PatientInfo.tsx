'use client';

import { Patient } from '@/app/providers';

interface PatientInfoProps {
  patient: Patient;
}

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center p-4 px-5 bg-background-card rounded-xl mb-3 card-hover">
      <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center mr-4 text-primary-light text-lg">
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-text-muted mb-0.5">{label}</span>
        <span className="text-base font-medium text-white">{value}</span>
      </div>
    </div>
  );
}

export default function PatientInfo({ patient }: PatientInfoProps) {
  return (
    <div className="px-4 mb-6">
      <h3 className="text-base font-semibold mb-4 pl-1">Patient Information</h3>
      
      <InfoItem icon="fa-venus-mars" label="Gender" value={patient.gender} />
      <InfoItem icon="fa-id-card" label="NIC" value={patient.nic} />
      <InfoItem icon="fa-bed" label="Room" value={patient.room} />
      <InfoItem icon="fa-user-md" label="Doctor" value={patient.doctor} />
    </div>
  );
}
