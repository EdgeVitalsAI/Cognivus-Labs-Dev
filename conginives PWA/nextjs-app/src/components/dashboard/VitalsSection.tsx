'use client';

import { Vitals } from '@/app/providers';

interface VitalsSectionProps {
  vitals: Vitals;
  lastUpdated: string;
}

interface VitalCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit: string;
  gradient: string;
  percentage: number;
  delay: string;
}

function VitalCard({ icon, label, value, unit, gradient, percentage, delay }: VitalCardProps) {
  const clampedPercent = Math.min(100, Math.max(0, percentage));

  return (
    <div 
      className={`${gradient} p-5 rounded-2xl text-center vital-card-hover relative overflow-hidden shadow-card animate-scale-in`}
      style={{ animationDelay: delay }}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent h-1/2 pointer-events-none rounded-2xl"></div>
      
      {/* Icon */}
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/[0.15] rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
          <i className={`fas ${icon} text-xl text-white`}></i>
        </div>
        
        {/* Label */}
        <span className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-2">{label}</span>
        
        {/* Value */}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold leading-none text-white tracking-tight">{value}</span>
          <span className="text-sm font-medium text-white/70">{unit}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/80 rounded-full progress-bar-animated shadow-sm"
            style={{ width: `${clampedPercent}%` }}
          ></div>
        </div>
        
        {/* Progress percentage */}
        <span className="block text-[10px] text-white/50 mt-1.5 font-medium">{Math.round(clampedPercent)}%</span>
      </div>
    </div>
  );
}

export default function VitalsSection({ vitals, lastUpdated }: VitalsSectionProps) {
  // Calculate percentages for progress bars
  const spo2Percent = ((vitals.spo2.value - 90) / 10) * 100;
  const pulsePercent = ((vitals.pulse.value - 40) / 80) * 100;
  const tempPercent = ((vitals.temperature.value - 35) / 4) * 100;
  const bpPercent = ((vitals.bp.systolic - 90) / 70) * 100;

  return (
    <div className="px-4 mb-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold section-title text-text-primary">Vital Signs</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></div>
          <span className="text-xs text-text-muted font-medium">Live &middot; {lastUpdated}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <VitalCard
          icon="fa-lungs"
          label="SpO₂"
          value={vitals.spo2.value}
          unit="%"
          gradient="gradient-spo2"
          percentage={spo2Percent}
          delay="0s"
        />
        <VitalCard
          icon="fa-heartbeat"
          label="Pulse"
          value={vitals.pulse.value}
          unit="bpm"
          gradient="gradient-pulse"
          percentage={pulsePercent}
          delay="0.05s"
        />
        <VitalCard
          icon="fa-thermometer-half"
          label="Temp"
          value={vitals.temperature.value.toFixed(1)}
          unit="°C"
          gradient="gradient-temp"
          percentage={tempPercent}
          delay="0.1s"
        />
        <VitalCard
          icon="fa-tint"
          label="Blood Pressure"
          value={`${vitals.bp.systolic}/${vitals.bp.diastolic}`}
          unit="mmHg"
          gradient="gradient-bp"
          percentage={bpPercent}
          delay="0.15s"
        />
      </div>
    </div>
  );
}
