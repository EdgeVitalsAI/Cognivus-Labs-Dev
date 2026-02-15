import { NextRequest, NextResponse } from 'next/server';

// Patient Database
const patients: Record<string, any> = {
  PT001: {
    id: 'PT001',
    name: 'John Silva',
    gender: 'Male',
    nic: '200112345678',
    room: 'Ward 3 - Bed 12',
    doctor: 'Dr. Perera',
  },
  PT002: {
    id: 'PT002',
    name: 'Sarah Fernando',
    gender: 'Female',
    nic: '199856789012',
    room: 'Ward 2 - Bed 5',
    doctor: 'Dr. Wijesinghe',
  },
  PT003: {
    id: 'PT003',
    name: 'Kumar Jayawardena',
    gender: 'Male',
    nic: '198523456789',
    room: 'ICU - Bed 2',
    doctor: 'Dr. Mendis',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const patient = patients[id.toUpperCase()];

  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(patient);
}
