import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MOCK_PATIENTS } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const normalizedId = id.toUpperCase();
  const useMock = process.env.USE_MOCK_DATA !== 'false';

  if (useMock) {
    const patient = MOCK_PATIENTS[normalizedId];

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  }

  const patient = await prisma.patient.findUnique({
    where: { id: normalizedId },
    select: {
      id: true,
      name: true,
      gender: true,
      nic: true,
      room: true,
      doctor: true,
    },
  });

  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(patient);
}
