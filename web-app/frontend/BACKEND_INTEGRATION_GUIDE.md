# Backend Integration Guide - Add Patient Feature

## Overview
This guide shows how to connect the Add Patient frontend form to a backend API.

---

## 1. Python/FastAPI Backend Example

### Create Patient Endpoint

```python
# backend/app/api/routes/patients.py

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["patients"])

# Pydantic models for validation
class PatientCreate(BaseModel):
    firstName: str
    lastName: str
    dateOfBirth: str
    gender: str
    phoneNumber: str
    email: str
    room: Optional[str] = None
    
    bloodType: Optional[str] = None
    allergies: Optional[str] = None
    medicalHistory: Optional[str] = None
    currentMedications: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceId: Optional[str] = None
    
    heartRate: int = 72
    spo2: int = 98
    bloodPressure: str = "120/80"
    temperature: float = 98.6
    respiratoryRate: int = 16
    glucose: int = 100
    
    emergencyContactName: str
    emergencyContactPhone: str
    relationship: str = "Spouse"
    clinicalNotes: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    name: str
    firstName: str
    lastName: str
    age: int
    room: str
    status: str
    
    class Config:
        from_attributes = True

# Create Patient
@router.post("/")
async def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    """Create a new patient"""
    try:
        # Calculate age from date of birth
        birth_date = datetime.strptime(patient.dateOfBirth, "%Y-%m-%d")
        today = datetime.now()
        age = today.year - birth_date.year
        if (today.month, today.day) < (birth_date.month, birth_date.day):
            age -= 1
        
        # Create new patient record
        new_patient = Patient(
            id=str(uuid.uuid4()),
            first_name=patient.firstName,
            last_name=patient.lastName,
            full_name=f"{patient.firstName} {patient.lastName}",
            date_of_birth=birth_date,
            age=age,
            gender=patient.gender,
            phone_number=patient.phoneNumber,
            email=patient.email,
            room=patient.room,
            status="Active",
            
            # Medical Info
            blood_type=patient.bloodType,
            allergies=patient.allergies,
            medical_history=patient.medicalHistory,
            current_medications=patient.currentMedications,
            insurance_provider=patient.insuranceProvider,
            insurance_id=patient.insuranceId,
            
            # Vitals
            heart_rate=patient.heartRate,
            spo2=patient.spo2,
            blood_pressure=patient.bloodPressure,
            temperature=patient.temperature,
            respiratory_rate=patient.respiratoryRate,
            glucose=patient.glucose,
            
            # Emergency Contact
            emergency_contact_name=patient.emergencyContactName,
            emergency_contact_phone=patient.emergencyContactPhone,
            emergency_contact_relationship=patient.relationship,
            
            # Notes
            clinical_notes=patient.clinicalNotes,
            created_at=datetime.now()
        )
        
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        return {
            "id": new_patient.id,
            "name": new_patient.full_name,
            "firstName": new_patient.first_name,
            "lastName": new_patient.last_name,
            "age": new_patient.age,
            "room": new_patient.room,
            "status": new_patient.status,
            "message": "Patient created successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Upload Patient Photo
@router.post("/{patient_id}/photo")
async def upload_patient_photo(
    patient_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload photo for a patient"""
    try:
        # Check if patient exists
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Save file
        file_path = f"uploads/patients/{patient_id}/{file.filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Update patient photo path
        patient.photo_path = file_path
        db.commit()
        
        return {"message": "Photo uploaded successfully", "path": file_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Get All Patients
@router.get("/")
async def get_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all patients with pagination"""
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

# Get Patient by ID
@router.get("/{patient_id}")
async def get_patient(patient_id: str, db: Session = Depends(get_db)):
    """Get a specific patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
```

### Patient Database Model

```python
# backend/app/models/patient.py

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"
    
    # Identifiers
    id = Column(String, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    full_name = Column(String)
    
    # Personal Info
    date_of_birth = Column(DateTime)
    age = Column(Integer)
    gender = Column(String)
    phone_number = Column(String)
    email = Column(String)
    room = Column(String)
    status = Column(String, default="Active")
    photo_path = Column(String, nullable=True)
    
    # Medical Info
    blood_type = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    
    # Insurance
    insurance_provider = Column(String, nullable=True)
    insurance_id = Column(String, nullable=True)
    
    # Vitals
    heart_rate = Column(Integer, default=72)
    spo2 = Column(Integer, default=98)
    blood_pressure = Column(String, default="120/80")
    temperature = Column(Float, default=98.6)
    respiratory_rate = Column(Integer, default=16)
    glucose = Column(Integer, default=100)
    
    # Emergency Contact
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    emergency_contact_relationship = Column(String)
    
    # Additional Info
    clinical_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
```

---

## 2. Updated Frontend - PatientsPage.jsx

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus } from 'lucide-react'
import axios from 'axios'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import PatientCard from '../components/patients/PatientCard'
import AddPatientModal from '../components/patients/AddPatientModal'
import { authService } from '../services/api'

const PatientsPage = () => {
  const navigate = useNavigate()
  const [user] = useState(authService.getCurrentUser())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/patients')
      setPatients(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch patients')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (newPatient) => {
    try {
      // Create patient record
      const response = await axios.post('/api/patients', {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        dateOfBirth: newPatient.dateOfBirth,
        gender: newPatient.gender,
        phoneNumber: newPatient.phoneNumber,
        email: newPatient.email,
        room: newPatient.room,
        bloodType: newPatient.bloodType,
        allergies: newPatient.allergies,
        medicalHistory: newPatient.medicalHistory,
        currentMedications: newPatient.currentMedications,
        insuranceProvider: newPatient.insuranceProvider,
        insuranceId: newPatient.insuranceId,
        heartRate: newPatient.heartRate,
        spo2: newPatient.spo2,
        bloodPressure: newPatient.bloodPressure,
        temperature: newPatient.temperature,
        respiratoryRate: newPatient.respiratoryRate,
        glucose: newPatient.glucose,
        emergencyContactName: newPatient.emergencyContact.name,
        emergencyContactPhone: newPatient.emergencyContact.phone,
        relationship: newPatient.emergencyContact.relationship,
        clinicalNotes: newPatient.clinicalNotes,
      })

      const createdPatient = response.data

      // Upload photo if exists
      if (newPatient.photo) {
        const formData = new FormData()
        // Convert base64 to blob
        const blob = await fetch(newPatient.photo).then(r => r.blob())
        formData.append('file', blob, 'patient-photo.jpg')

        try {
          await axios.post(`/api/patients/${createdPatient.id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch (photoErr) {
          console.error('Photo upload failed:', photoErr)
          // Continue even if photo fails
        }
      }

      // Update local state
      setPatients([createdPatient, ...patients])
      setIsAddPatientModalOpen(false)

      // Show success message
      // toast.success('Patient added successfully')
    } catch (err) {
      console.error('Error adding patient:', err)
      // toast.error(err.response?.data?.detail || 'Failed to add patient')
    }
  }

  // ... rest of component
}
```

---

## 3. Environment Configuration

### .env File
```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### Axios Instance Configuration
```javascript
// services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/doctor/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
```

---

## 4. Error Handling

### Frontend Validation + Backend Validation

```javascript
// Frontend validates format, Backend validates business logic
const handleAddPatient = async (newPatient) => {
  try {
    // Frontend already validated required fields and format
    
    const response = await axios.post('/api/patients', newPatient)
    
    if (response.status === 201) {
      // Success
      setPatients([response.data, ...patients])
      setIsAddPatientModalOpen(false)
      showSuccessNotification('Patient added successfully')
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Validation error from backend
      showErrorNotification(error.response.data.detail)
    } else if (error.response?.status === 409) {
      // Duplicate patient
      showErrorNotification('Patient with this email already exists')
    } else {
      // Network or server error
      showErrorNotification('Failed to add patient. Please try again.')
    }
  }
}
```

---

## 5. Testing with cURL

```bash
# Create a patient
curl -X POST http://localhost:8000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1979-12-30",
    "gender": "Male",
    "phoneNumber": "+94 23 567 8901",
    "email": "john@example.com",
    "room": "Room 302A",
    "bloodType": "O+",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+94 23 567 8902",
    "relationship": "Spouse"
  }'

# Upload photo
curl -X POST http://localhost:8000/api/patients/patient-id-123/photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/photo.jpg"

# Get all patients
curl http://localhost:8000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific patient
curl http://localhost:8000/api/patients/patient-id-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. Database Migrations (Alembic)

```python
# backend/alembic/versions/001_create_patients_table.py

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'patients',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.DateTime(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('room', sa.String()),
        sa.Column('status', sa.String(), default='Active'),
        sa.Column('blood_type', sa.String()),
        sa.Column('allergies', sa.Text()),
        sa.Column('medical_history', sa.Text()),
        sa.Column('current_medications', sa.Text()),
        sa.Column('insurance_provider', sa.String()),
        sa.Column('insurance_id', sa.String()),
        sa.Column('heart_rate', sa.Integer()),
        sa.Column('spo2', sa.Integer()),
        sa.Column('blood_pressure', sa.String()),
        sa.Column('temperature', sa.Float()),
        sa.Column('respiratory_rate', sa.Integer()),
        sa.Column('glucose', sa.Integer()),
        sa.Column('emergency_contact_name', sa.String()),
        sa.Column('emergency_contact_phone', sa.String()),
        sa.Column('emergency_contact_relationship', sa.String()),
        sa.Column('clinical_notes', sa.Text()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patients_email'), 'patients', ['email'])
    op.create_index(op.f('ix_patients_phone_number'), 'patients', ['phone_number'])

def downgrade():
    op.drop_index(op.f('ix_patients_phone_number'), table_name='patients')
    op.drop_index(op.f('ix_patients_email'), table_name='patients')
    op.drop_table('patients')
```

---

## 7. Docker Compose for Local Development

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: cognivus
      POSTGRES_PASSWORD: password
      POSTGRES_DB: cognivus_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://cognivus:password@postgres:5432/cognivus_db
    depends_on:
      - postgres
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:8000

volumes:
  postgres_data:
```

---

## Summary

To enable backend integration:
1. Implement FastAPI endpoints for `/api/patients`
2. Create Patient model in database
3. Update frontend to use axios for API calls
4. Handle photo uploads to backend
5. Test with Postman or cURL
6. Deploy with Docker Compose
