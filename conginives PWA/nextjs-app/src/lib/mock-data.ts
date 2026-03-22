export interface MockPatient {
    id: string;
    name: string;
    gender: string;
    nic: string;
    room: string;
    doctor: string;
}

export interface MockVitalBase {
    spo2: number;
    pulse: number;
    temp: number;
    bpSys: number;
    bpDia: number;
}

export const MOCK_PATIENTS: Record<string, MockPatient> = {
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

export const MOCK_VITALS_BASE: Record<string, MockVitalBase> = {
    PT001: { spo2: 97, pulse: 77, temp: 37.3, bpSys: 120, bpDia: 80 },
    PT002: { spo2: 98, pulse: 72, temp: 36.8, bpSys: 118, bpDia: 75 },
    PT003: { spo2: 94, pulse: 95, temp: 38.2, bpSys: 145, bpDia: 95 },
};
