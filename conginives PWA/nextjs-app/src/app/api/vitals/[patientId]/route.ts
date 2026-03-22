import { prisma } from '@/lib/db';
import { MOCK_VITALS_BASE } from '@/lib/mock-data';
import { NextRequest, NextResponse } from 'next/server';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function randomVariation(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
    const { patientId } = params;
    const normalizedId = patientId.toUpperCase();
    const useMock = process.env.USE_MOCK_DATA !== 'false';

    if (!useMock) {
        const latest = await prisma.vital.findFirst({
            where: { patientId: normalizedId },
            orderBy: { createdAt: 'desc' },
        });

        if (!latest) {
            return NextResponse.json(
                { error: 'No vitals found for this patient' },
                { status: 404 }
            );
        }

        const vitals = {
            spo2: {
                value: Number(latest.spo2),
                min: 95,
                max: 100,
            },
            pulse: {
                value: Number(latest.pulse),
                min: 60,
                max: 100,
            },
            temperature: {
                value: Number(latest.temp),
                min: 36.5,
                max: 37.5,
            },
            bp: {
                systolic: Number(latest.bpSys),
                diastolic: Number(latest.bpDia),
            },
            timestamp: latest.createdAt.toISOString(),
        };

        return NextResponse.json(vitals);
    }

    const base = MOCK_VITALS_BASE[normalizedId];

    if (!base) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
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
            value: parseFloat(clamp(base.temp + randomVariation(-0.1, 0.1), 35.5, 39.5).toFixed(1)),
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
