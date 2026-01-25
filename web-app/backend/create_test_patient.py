"""
Create a test patient for ECG monitoring demonstration.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.models.patient import Patient
from datetime import datetime


def create_test_patient():
    db = SessionLocal()
    try:
        # Check if patient 1 already exists
        existing = db.query(Patient).filter(Patient.id == 1).first()
        if existing:
            print(f"✓ Patient 1 already exists: {existing.first_name} {existing.last_name}")
            return
        
        # Create test patient
        patient = Patient(
            id=1,
            first_name="John",
            last_name="Doe",
            date_of_birth=datetime(1980, 1, 1),
            gender="male",
            blood_type="O+",
            phone="+1234567890",
            email="john.doe@test.com",
            address="123 Test Street",
            emergency_contact_name="Jane Doe",
            emergency_contact_phone="+1234567891",
            medical_history="Test patient for ECG monitoring demonstration",
            allergies="None",
            current_medications="None",
            admission_date=datetime.utcnow(),
            room_number="101",
            status="active"
        )
        
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        print(f"✓ Created test patient:")
        print(f"  ID: {patient.id}")
        print(f"  Name: {patient.first_name} {patient.last_name}")
        print(f"  Room: {patient.room_number}")
        print(f"  Status: {patient.status}")
        
    except Exception as e:
        print(f"✗ Error creating patient: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_test_patient()
