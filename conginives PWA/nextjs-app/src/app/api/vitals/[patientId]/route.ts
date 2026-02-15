import { NextRequest, NextResponse } from 'next/server';

// Base vitals for each patient
const baseVitals: Record<string, any> = {
  PT001: { spo2: 97, pulse: 77, temp: 37.3, bpSys: 120, bpDia: 80 },
  PT002: { spo2: 98, pulse: 72, temp: 36.8, bpSys: 118, bpDia: 75 },
  PT003: { spo2: 94, pulse: 95, temp: 38.2, bpSys: 145, bpDia: 95 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomVariation(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const { patientId } = params;
  const base = baseVitals[patientId.toUpperCase()];

  if (!base) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }

  // Generate vitals with random variations
  const vitals = {
    spo2: {
      value: Math.round(clamp(base.spo2 + randomVariation(-1, 1), 90, 100)),
      min: 95,
      max: 100,
    },
    pulse: {
      value: Math.round(clamp(base.pulse + randomVariation(-3, 3), 50, 120)),
      min: 60,
      max: 100,
    },
    temperature: {
      value: parseFloat(
        clamp(base.temp + randomVariation(-0.1, 0.1), 35.5, 39.5).toFixed(1)
      ),
      min: 36.5,
      max: 37.5,
    },
    bp: {
      systolic: Math.round(clamp(base.bpSys + randomVariation(-2, 2), 90, 160)),
      diastolic: Math.round(clamp(base.bpDia + randomVariation(-2, 2), 60, 100)),
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(vitals);
}
