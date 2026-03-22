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
      className="glass-card p-4 rounded-2xl text-center vital-card-hover relative overflow-hidden animate-scale-in"
      style={{ animationDelay: delay }}
    >
      {/* Colored top accent line */}
      <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full ${gradient} opacity-60`} />

      <div className="relative z-10">
        {/* Icon with colored bg */}
        <div className={`w-10 h-10 ${gradient} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
          <i className={`fas ${icon} text-base text-white`}></i>
        </div>

        {/* Label */}
        <span className="block text-[10px] font-medium text-text-muted uppercase tracking-widest mb-1.5">{label}</span>

        {/* Value */}
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-3xl font-bold leading-none text-white tracking-tight">{value}</span>
          <span className="text-xs font-medium text-text-secondary">{unit}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full progress-bar-animated ${gradient}`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        <span className="block text-[9px] text-text-muted mt-1 font-medium">{Math.round(clampedPercent)}%</span>
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
    <div className="px-4 mb-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold section-title text-text-primary">Vital Signs</h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></div>
          <span className="text-[10px] text-text-muted font-medium">Live &middot; {lastUpdated}</span>
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
