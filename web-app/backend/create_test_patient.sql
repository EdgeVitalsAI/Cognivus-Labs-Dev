-- Create test patient for ECG monitoring
-- Run this in pgAdmin or psql connected to cognivus_postgres database

INSERT INTO patients (
    id, first_name, last_name, date_of_birth, gender, blood_type,
    phone, email, address, emergency_contact_name, emergency_contact_phone,
    medical_history, allergies, current_medications,
    admission_date, room_number, status, created_at, updated_at
) VALUES (
    1,
    'John',
    'Doe',
    '1980-01-01',
    'male',
    'O+',
    '+1234567890',
    'john.doe@test.com',
    '123 Test Street, Test City',
    'Jane Doe',
    '+1234567891',
    'Test patient for ECG monitoring demonstration',
    'None',
    'None',
    NOW(),
    '101',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the patient was created
SELECT id, first_name, last_name, room_number, status FROM patients WHERE id = 1;
