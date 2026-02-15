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
}

function VitalCard({ icon, label, value, unit, gradient, percentage }: VitalCardProps) {
  return (
    <div className={`${gradient} p-5 rounded-xl text-center vital-card-hover`}>
      <div className="text-3xl mb-2 opacity-90">
        <i className={`fas ${icon}`}></i>
      </div>
      <span className="block text-xs opacity-90 mb-2">{label}</span>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold leading-none">{value}</span>
        <span className="text-sm opacity-80">{unit}</span>
      </div>
      <div className="mt-3 h-1 bg-white/30 rounded overflow-hidden">
        <div 
          className="h-full bg-white/80 rounded transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        ></div>
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
    <div className="px-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold">Vital Signs</h3>
        <span className="text-xs text-text-muted">Updated: {lastUpdated}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <VitalCard
          icon="fa-lungs"
          label="SpO₂"
          value={vitals.spo2.value}
          unit="%"
          gradient="gradient-spo2"
          percentage={spo2Percent}
        />
        <VitalCard
          icon="fa-heart"
          label="Pulse"
          value={vitals.pulse.value}
          unit="bpm"
          gradient="gradient-pulse"
          percentage={pulsePercent}
        />
        <VitalCard
          icon="fa-thermometer-half"
          label="Temperature"
          value={vitals.temperature.value.toFixed(1)}
          unit="°C"
          gradient="gradient-temp"
          percentage={tempPercent}
        />
        <VitalCard
          icon="fa-tint"
          label="Blood Pressure"
          value={`${vitals.bp.systolic}/${vitals.bp.diastolic}`}
          unit="mmHg"
          gradient="gradient-bp"
          percentage={bpPercent}
        />
      </div>
    </div>
  );
}
