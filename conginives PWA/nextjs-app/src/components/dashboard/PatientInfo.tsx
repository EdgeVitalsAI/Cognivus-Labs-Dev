'use client';

import { Patient } from '@/app/providers';

interface PatientInfoProps {
    patient: Patient;
}

interface InfoItemProps {
    icon: string;
    label: string;
    value: string;
    color: string;
    delay: string;
}

function InfoItem({ icon, label, value, color, delay }: InfoItemProps) {
    return (
        <div
            className="flex items-center p-3.5 px-4 glass-card rounded-xl mb-2.5 animate-fade-in-up"
            style={{ animationDelay: delay }}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3.5 text-sm
                       ${color}`}>
                <i className={`fas ${icon} text-white`}></i>
            </div>
            <div className="flex flex-col flex-1">
                <span className="text-[10px] text-text-muted mb-0.5 uppercase tracking-widest font-medium">{label}</span>
                <span className="text-sm font-semibold text-text-primary">{value}</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-white/[0.03] flex items-center justify-center">
                <i className="fas fa-chevron-right text-[10px] text-text-muted"></i>
            </div>
        </div>
    );
}

export default function PatientInfo({ patient }: PatientInfoProps) {
    return (
        <div className="px-4 mb-5">
            <h3 className="text-sm font-semibold mb-3 pl-1 section-title text-text-primary">Patient Information</h3>

            <InfoItem
                icon="fa-venus-mars"
                label="Gender"
                value={patient.gender}
                color="bg-gradient-to-br from-accent-pink to-accent-purple"
                delay="0s"
            />
            <InfoItem
                icon="fa-id-card"
                label="NIC"
                value={patient.nic}
                color="bg-gradient-to-br from-accent-blue to-accent-cyan"
                delay="0.05s"
            />
            <InfoItem
                icon="fa-bed"
                label="Room"
                value={patient.room}
                color="bg-gradient-to-br from-accent-emerald to-accent-teal"
                delay="0.1s"
            />
            <InfoItem
                icon="fa-user-md"
                label="Doctor"
                value={patient.doctor}
                color="bg-gradient-to-br from-accent-amber to-accent-orange"
                delay="0.15s"
            />
        </div>
    );
}
