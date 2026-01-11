import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Droplet, Wind, Save, Pill, ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle, Clock, Phone, Mail, MapPin, Loader } from 'lucide-react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import PhotoUpload from '../components/patients/PhotoUpload'
import PrescriptionsTabComponent from '../components/patients/PrescriptionsTab'
import { authService } from '../services/api'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const PatientDetail = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [user] = useState(authService.getCurrentUser())
  const [photo, setPhoto] = useState('https://via.placeholder.com/300x400/4a5568/ffffff?text=Patient')
  const [activeTab, setActiveTab] = useState('profile')
  const [expandedPrescription, setExpandedPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [patientData, setPatientData] = useState(null)

  // Fetch patient data from API
  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      
      const response = await axios.get(`${API_BASE_URL}/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const patient = response.data
      const latestVital = patient.vitals?.[0] || {}
      
      // Transform API data to component format
      const transformedData = {
        id: patient.id,
        name: patient.name || 'Unknown Patient',
        dateOfBirth: patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A',
        room: patient.room_number || 'Not Assigned',
        age: patient.age || 0,
        gender: patient.gender || 'Unknown',
        bloodType: patient.blood_type || 'Unknown',
        email: patient.email || 'N/A',
        phone: patient.phone || 'N/A',
        address: patient.address || 'N/A',
        status: patient.status || 'STABLE',
        admissionDate: patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'N/A',
        department: patient.department || 'General',
        condition: patient.primary_diagnosis || 'N/A',
        doctor: patient.doctor_name ? `Dr. ${patient.doctor_name}` : 'Not Assigned',
        nurse: 'Not Assigned',
        emergencyContact: patient.emergency_contact || {
          name: 'N/A',
          relationship: 'N/A',
          phone: 'N/A'
        },
        insurance: patient.insurance_info || {
          provider: 'N/A',
          policy_number: 'N/A',
          group_number: 'N/A'
        },
        medicalHistory: Array.isArray(patient.medical_history) ? patient.medical_history : [],
        vitals: {
          heartRate: latestVital.heart_rate || 0,
          temperature: latestVital.temperature || 0,
          bloodPressure: latestVital.blood_pressure_systolic ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}` : 'N/A',
          o2Saturation: latestVital.oxygen_saturation || 0,
          respiratoryRate: latestVital.respiratory_rate || 0,
          pH: latestVital.ph || 0,
        },
        prescriptions: patient.prescriptions || [],
        aiSuggestions: null // AI suggestions would come from separate endpoint
      }

      setPatientData(transformedData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch patient:', err)
      setError('Failed to load patient data')
    } finally {
      setLoading(false)
    }
  }

  const [notes, setNotes] = useState('')
  const [editMode, setEditMode] = useState(false)

  const handlePhotoSelected = (photoData) => {
    setPhoto(photoData)
  }

  const handleSave = () => {
    console.log('Saving patient data and notes')
    setEditMode(false)
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/doctor/login')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />
        <div className="flex">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading patient data...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />
        <div className="flex">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">{error || 'Patient not found'}</p>
              <button
                onClick={() => navigate('/doctor/patients')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Back to Patients
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

      <div className="flex">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 p-6">
          {/* Header with Back Button and Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/doctor/patients')}
                className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">{patientData.name}</h1>
                <p className="text-slate-400">Patient ID: {patientData.id}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-lg font-semibold border-2 ${
              patientData.status === 'CRITICAL'
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : 'border-amber-400 text-amber-300 bg-amber-400/10'
            }`}>
              {patientData.status}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-slate-700 overflow-x-auto">
            {[
              { id: 'profile', label: 'Patient Profile' },
              { id: 'personal', label: 'Personal Information' },
              { id: 'prescriptions', label: 'Prescriptions Management' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-sky-400 border-sky-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && <ProfileTab patientData={patientData} photo={photo} setPhoto={setPhoto} handlePhotoSelected={handlePhotoSelected} notes={notes} setNotes={setNotes} editMode={editMode} setEditMode={setEditMode} handleSave={handleSave} />}
          
          {activeTab === 'personal' && <PersonalInformationTab patientData={patientData} />}
          
          {activeTab === 'prescriptions' && <PrescriptionsTabComponent patientData={patientData} expandedPrescription={expandedPrescription} setExpandedPrescription={setExpandedPrescription} />}
        </main>
      </div>
    </div>
  )
}

// Profile Tab Component
const ProfileTab = ({ patientData, photo, handlePhotoSelected, notes, setNotes, editMode, setEditMode, handleSave }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Photo and Basic Info */}
      <div className="lg:col-span-1 space-y-6">
        {/* Photo Section */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Patient Photo</h3>
          <PhotoUpload onPhotoSelected={handlePhotoSelected} currentPhoto={photo} />
        </div>

        {/* Patient Info Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-700 pb-3">
              <span className="text-slate-400">Age</span>
              <span className="text-white font-semibold">{patientData.age} years</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-3">
              <span className="text-slate-400">Gender</span>
              <span className="text-white font-semibold">{patientData.gender}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-3">
              <span className="text-slate-400">Blood Type</span>
              <span className="text-white font-semibold">{patientData.bloodType}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-3">
              <span className="text-slate-400">Department</span>
              <span className="text-white font-semibold">{patientData.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Admission</span>
              <span className="text-white font-semibold">{patientData.admissionDate}</span>
            </div>
          </div>
        </div>

        {/* Care Team */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Care Team</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Primary Doctor</p>
              <p className="text-white font-semibold">{patientData.doctor}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Nurse</p>
              <p className="text-white font-semibold">{patientData.nurse}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Vitals and Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Current Vitals */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Vitals</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-red-400 text-sm font-semibold mb-2">
                <Heart className="w-4 h-4" />
                Heart Rate
              </div>
              <p className="text-2xl font-bold text-white">{patientData.vitals.heartRate}</p>
              <p className="text-xs text-slate-400">bpm</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-orange-400 text-sm font-semibold mb-2">Temperature</div>
              <p className="text-2xl font-bold text-white">{patientData.vitals.temperature}</p>
              <p className="text-xs text-slate-400">°C</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-2">
                <Droplet className="w-4 h-4" />
                Blood Pressure
              </div>
              <p className="text-2xl font-bold text-white">{patientData.vitals.bloodPressure}</p>
              <p className="text-xs text-slate-400">mmHg</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-emerald-400 text-sm font-semibold mb-2">O2 Saturation</div>
              <p className="text-2xl font-bold text-white">{patientData.vitals.o2Saturation}%</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-2">
                <Wind className="w-4 h-4" />
                RR
              </div>
              <p className="text-2xl font-bold text-white">{patientData.vitals.respiratoryRate}</p>
              <p className="text-xs text-slate-400">breaths/min</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-pink-400 text-sm font-semibold mb-2">pH Level</div>
              <p className="text-2xl font-bold text-white">{patientData.vitals.pH}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Last updated: 2 mins ago</p>
        </div>

        {/* Medical History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Medical History</h3>
            <div className="space-y-2">
              {patientData.medicalHistory.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Active Medications</h3>
            <div className="space-y-2">
              {patientData.prescriptions.filter(p => p.status === 'ACTIVE').map((med, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  {med.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Clinical Notes</h3>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600">
              Add Note
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-4">Patient showing signs of improvement. Continue current treatment plan.</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
            Add Note
          </button>
          <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
            Prescribe
          </button>
          <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
            Call
          </button>
          <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
            Print
          </button>
        </div>
      </div>
    </div>
  )
}

// Personal Information Tab Component
const PersonalInformationTab = ({ patientData }) => {
  return (
    <div className="space-y-6">
      {/* Section 1: Personal Information */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Personal Information</h2>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-600">
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Full Name</p>
                <p className="text-white font-semibold">{patientData.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Date of Birth</p>
                <p className="text-white font-semibold">{patientData.dateOfBirth} (Age {patientData.age})</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Gender</p>
                <p className="text-white font-semibold">{patientData.gender}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Blood Type</p>
                <p className="text-white font-semibold">{patientData.bloodType}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <p className="text-slate-400 text-sm mb-1">Email</p>
                  <p className="text-white font-semibold break-all">{patientData.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <p className="text-slate-400 text-sm mb-1">Phone</p>
                  <p className="text-white font-semibold">{patientData.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <p className="text-slate-400 text-sm mb-1">Address</p>
                  <p className="text-white font-semibold">{patientData.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Emergency Contact */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Emergency Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-2">Name</p>
            <p className="text-white font-semibold text-lg">{patientData.emergencyContact.name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Relationship</p>
            <p className="text-white font-semibold text-lg">{patientData.emergencyContact.relationship}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Phone</p>
            <p className="text-white font-semibold text-lg">{patientData.emergencyContact.phone}</p>
          </div>
        </div>
      </div>

      {/* Section 3: Insurance Information */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Insurance Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-2">Provider</p>
            <p className="text-white font-semibold text-lg">{patientData.insurance.provider}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Policy Number</p>
            <p className="text-white font-semibold text-lg">{patientData.insurance.policyNumber}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Group Number</p>
            <p className="text-white font-semibold text-lg">{patientData.insurance.groupNumber}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Prescriptions Tab Component
const PrescriptionsTab = ({ patientData, expandedPrescription, setExpandedPrescription }) => {
  const activePrescriptions = patientData.prescriptions.filter(p => p.status === 'ACTIVE')
  const scheduledPrescriptions = patientData.prescriptions.filter(p => p.status === 'SCHEDULED')
  const discontinuedPrescriptions = patientData.prescriptions.filter(p => p.status === 'DISCONTINUED')

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex-1 min-w-80 relative">
          <input
            type="text"
            placeholder="Search medications..."
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <button className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 transition-colors">
          Filter
        </button>
        <button className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-semibold">
          + Add New Prescription
        </button>
      </div>

      {/* Tabs for Prescription Status */}
      <div className="flex gap-4 border-b border-slate-700">
        {[
          { label: 'Active', count: activePrescriptions.length },
          { label: 'Scheduled', count: scheduledPrescriptions.length },
          { label: 'Discontinued', count: discontinuedPrescriptions.length },
          { label: 'AI Suggestions', count: 1 },
          { label: 'All', count: patientData.prescriptions.length }
        ].map(tab => (
          <button key={tab.label} className="px-4 py-3 font-semibold text-sm border-b-2 border-sky-500 text-sky-400">
            {tab.label}
            <span className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Prescriptions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Active Prescriptions ({activePrescriptions.length})</h3>
        <div className="space-y-4">
          {activePrescriptions.map(prescription => (
            <PrescriptionCard key={prescription.id} prescription={prescription} isExpanded={expandedPrescription === prescription.id} onToggle={() => setExpandedPrescription(expandedPrescription === prescription.id ? null : prescription.id)} />
          ))}
        </div>
      </div>

      {/* Scheduled Prescriptions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Scheduled Prescriptions ({scheduledPrescriptions.length})</h3>
        <div className="space-y-4">
          {scheduledPrescriptions.map(prescription => (
            <PrescriptionCard key={prescription.id} prescription={prescription} isExpanded={expandedPrescription === prescription.id} onToggle={() => setExpandedPrescription(expandedPrescription === prescription.id ? null : prescription.id)} />
          ))}
        </div>
      </div>

      {/* Discontinued Prescriptions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Discontinued Prescriptions ({discontinuedPrescriptions.length})</h3>
        <div className="space-y-4">
          {discontinuedPrescriptions.map(prescription => (
            <PrescriptionCard key={prescription.id} prescription={prescription} isExpanded={expandedPrescription === prescription.id} onToggle={() => setExpandedPrescription(expandedPrescription === prescription.id ? null : prescription.id)} />
          ))}
        </div>
      </div>

      {/* AI Medication Suggestions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-sky-500 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-sky-400" />
          <h2 className="text-2xl font-bold text-white">AI Medication Suggestions</h2>
          <span className="ml-auto px-3 py-1 bg-sky-500 text-white rounded-full text-sm font-semibold">
            Confidence: {patientData.aiSuggestions.confidence}%
          </span>
        </div>

        <div className="space-y-6">
          {/* Suggested Medication */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-sky-400/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{patientData.aiSuggestions.medication}</h3>
                <p className="text-slate-400 text-sm">{patientData.aiSuggestions.reason}</p>
              </div>
              <button className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-semibold">
                Approve & Prescribe
              </button>
            </div>
          </div>

          {/* Clinical Indication */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Clinical Indication</h4>
            <p className="text-slate-300 leading-relaxed">{patientData.aiSuggestions.indication}</p>
          </div>

          {/* Supporting Evidence */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Supporting Evidence
            </h4>
            <ul className="space-y-2">
              {patientData.aiSuggestions.evidence.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Dosage Information */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">Suggested Dosage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-2">Loading Dose</p>
                <p className="text-white font-semibold">{patientData.aiSuggestions.dosage.loading}</p>
              </div>
              <div className="bg-slate-700/50 rounded p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-2">Maintenance & Duration</p>
                <p className="text-white font-semibold">{patientData.aiSuggestions.dosage.maintenance}</p>
                <p className="text-white font-semibold text-sm">{patientData.aiSuggestions.dosage.duration}</p>
              </div>
            </div>
          </div>

          {/* Expected Benefits */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Expected Benefits
            </h4>
            <ul className="space-y-2">
              {patientData.aiSuggestions.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Analysis */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">Safety Analysis</h4>
            <ul className="space-y-2">
              {patientData.aiSuggestions.safetyAnalysis.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300">
                  <input type="checkbox" checked={item.checked} readOnly className="w-5 h-5 cursor-pointer" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Drug Interactions */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">Drug Interactions</h4>
            <ul className="space-y-2">
              {patientData.aiSuggestions.drugInteractions.map((item, idx) => (
                <li key={idx} className="text-slate-300">• {item}</li>
              ))}
            </ul>
          </div>

          {/* Clinical Guidelines */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">Clinical Guidelines</h4>
            <ul className="space-y-2">
              {patientData.aiSuggestions.clinicalGuidelines.map((guideline, idx) => (
                <li key={idx} className="text-slate-300">• {guideline}</li>
              ))}
            </ul>
          </div>

          {/* Monitoring Plan */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Monitoring Plan if Approved
            </h4>
            <ul className="space-y-2">
              {patientData.aiSuggestions.monitoringPlan.map((plan, idx) => (
                <li key={idx} className="text-slate-300">• {plan}</li>
              ))}
            </ul>
          </div>

          {/* Similar Cases */}
          <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
            <p className="text-slate-300">
              <span className="font-semibold">{patientData.aiSuggestions.similarCases.prescribed}</span> out of{' '}
              <span className="font-semibold">{patientData.aiSuggestions.similarCases.total}</span> similar cases prescribed this medication with{' '}
              <span className="font-semibold text-emerald-400">{patientData.aiSuggestions.similarCases.outcomes}% positive outcomes</span>
            </p>
          </div>

          {/* Cost Consideration */}
          <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Cost Consideration</span>
              <span className="text-emerald-400 font-semibold">{patientData.aiSuggestions.costConsideration.generic}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-slate-300">Coverage</span>
              <span className="text-emerald-400 font-semibold">{patientData.aiSuggestions.costConsideration.coverage}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-700">
            <button className="flex-1 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-bold">
              Approve & Prescribe
            </button>
            <button className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-bold border border-slate-600">
              Reject
            </button>
            <button className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-bold border border-slate-600">
              Discuss
            </button>
            <button className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-bold border border-slate-600">
              View Full Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Prescription Card Component
const PrescriptionCard = ({ prescription, isExpanded, onToggle }) => {
  const statusColors = {
    ACTIVE: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
    SCHEDULED: 'bg-blue-500/10 border-blue-500 text-blue-400',
    DISCONTINUED: 'bg-slate-500/10 border-slate-500 text-slate-400'
  }

  return (
    <div className={`bg-slate-800 border-2 rounded-lg p-6 cursor-pointer transition-all ${statusColors[prescription.status]}`} onClick={onToggle}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Pill className="w-5 h-5" />
            <h4 className="text-lg font-bold text-white">{prescription.name}</h4>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[prescription.status]}`}>
              {prescription.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3">{prescription.category}</p>
          <p className="text-slate-300 text-sm mb-3"><span className="font-semibold">Dosage:</span> {prescription.dosage}</p>
          <p className="text-slate-400 text-xs">Duration: {prescription.duration}</p>
        </div>
        <button className="p-2">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Prescribed by</p>
              <p className="text-white font-semibold">{prescription.prescribedBy}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Last Dispensed</p>
              <p className="text-white font-semibold">{prescription.lastDispensed}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Adherence</p>
              <p className="text-white font-semibold">{prescription.adherence}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Notes</p>
            <p className="text-slate-300">{prescription.notes}</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
              Edit
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
              History
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
              Hold
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
              Discontinue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDetail
