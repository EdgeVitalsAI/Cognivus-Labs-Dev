import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Droplet, Wind, Save, Pill, ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle, Clock, Phone, Mail, MapPin, Loader, Activity, Wifi, WifiOff } from 'lucide-react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import PhotoUpload from '../components/patients/PhotoUpload'
import PrescriptionsTabComponent from '../components/patients/PrescriptionsTab'
import ECGChart from '../components/vitals/ECGChart'
import useVitalsWebSocket from '../hooks/useVitalsWebSocket'
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
      
      // Set photo with placeholder if none exists
      const patientPhoto = patient.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Patient')}&size=400&background=3b82f6&color=ffffff&bold=true`
      setPhoto(patientPhoto)
      
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
          {/* Header with Back Button */}
          <button
            onClick={() => navigate('/doctor/patients')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Patients</span>
          </button>

          {/* Patient Header Card */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{patientData.name}</h1>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ID</span>
                    <span className="text-slate-300 font-mono">{patientData.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Room</span>
                    <span className="text-slate-300 font-semibold">{patientData.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Age</span>
                    <span className="text-slate-300 font-semibold">{patientData.age} years</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  patientData.status === 'CRITICAL'
                    ? 'bg-red-900/30 text-red-400 border border-red-700'
                    : patientData.status === 'WARNING'
                    ? 'bg-amber-900/30 text-amber-400 border border-amber-700'
                    : 'bg-emerald-900/30 text-emerald-400 border border-emerald-700'
                }`}>
                  {patientData.status}
                </span>
              </div>
            </div>
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
  // Real-time vitals WebSocket connection (ONLY active when profile tab is open)
  const { vitals: liveVitals, ecgData, connectionStatus, error: wsError } = useVitalsWebSocket(
    patientData.id, 
    true // Enable WebSocket
  )

  // Merge live vitals with static vitals (live takes precedence)
  const displayVitals = {
    heartRate: liveVitals.heartRate ?? patientData.vitals.heartRate,
    temperature: liveVitals.temperature ?? patientData.vitals.temperature,
    bloodPressure: patientData.vitals.bloodPressure, // BP not from live stream yet
    o2Saturation: liveVitals.spo2 ?? patientData.vitals.o2Saturation
  }

  return (
    <div className="space-y-6">
      {/* Top Section - Patient Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Photo Section */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Patient Photo</h3>
          <PhotoUpload onPhotoSelected={handlePhotoSelected} currentPhoto={photo} />
        </div>

        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Basic Information</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Age</p>
              <p className="text-white font-semibold">{patientData.age} years</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Gender</p>
              <p className="text-white font-semibold">{patientData.gender}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Blood Type</p>
              <p className="text-white font-semibold">{patientData.bloodType}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Location</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Room</p>
              <p className="text-white font-semibold">{patientData.room}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Department</p>
              <p className="text-white font-semibold">{patientData.department}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Admission Date</p>
              <p className="text-white font-semibold">{patientData.admissionDate}</p>
            </div>
          </div>
        </div>

        {/* Care Team */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Care Team</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Primary Doctor</p>
              <p className="text-white font-semibold">{patientData.doctor}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Assigned Nurse</p>
              <p className="text-white font-semibold">{patientData.nurse}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Vitals - Full Width Large Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Live Vital Signs Monitor</h3>
            <p className="text-sm text-slate-400 mt-1">Real-time patient vitals from ESP32 wearable device</p>
          </div>
          <div className="flex items-center gap-3">
            {/* WebSocket Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-900/30 border border-emerald-700' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-900/30 border border-yellow-700'
                : 'bg-red-900/30 border border-red-700'
            }`}>
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs font-semibold ${
                connectionStatus === 'connected' 
                  ? 'text-emerald-400' 
                  : connectionStatus === 'connecting'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Streaming' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            {wsError && (
              <span className="text-xs text-red-400">{wsError}</span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Heart Rate */}
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-lg p-5 border border-red-800/30 relative">
            {liveVitals.heartRate && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Heart Rate</span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{displayVitals.heartRate || '--'}</p>
            <p className="text-xs text-slate-400">bpm</p>
          </div>

          {/* Temperature */}
          <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-lg p-5 border border-orange-800/30 relative">
            {liveVitals.temperature && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Temperature</span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{displayVitals.temperature || '--'}</p>
            <p className="text-xs text-slate-400">°C</p>
          </div>

          {/* Blood Pressure */}
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-lg p-5 border border-blue-800/30">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Blood Pressure</span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{displayVitals.bloodPressure || 'N/A'}</p>
            <p className="text-xs text-slate-400">mmHg</p>
          </div>

          {/* O2 Saturation */}
          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 rounded-lg p-5 border border-cyan-800/30 relative">
            {liveVitals.spo2 && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <Wind className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Oxygen</span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{displayVitals.o2Saturation || '--'}</p>
            <p className="text-xs text-slate-400">% SpO2</p>
          </div>
        </div>
      </div>

      {/* ECG Live Chart */}
      <ECGChart ecgData={ecgData} leadsConnected={ecgData?.leads ?? true} />

      {/* Medical History and Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Medical History</h3>
          {patientData.medicalHistory.length > 0 ? (
            <div className="space-y-2">
              {patientData.medicalHistory.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-2"></span>
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No medical history recorded</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Medications</h3>
          {patientData.prescriptions.filter(p => p.status === 'ACTIVE').length > 0 ? (
            <div className="space-y-2">
              {patientData.prescriptions.filter(p => p.status === 'ACTIVE').map((med, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  {med.name}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No active medications</p>
          )}
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Clinical Notes</h3>
          <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded transition-colors">
            + Add Note
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter clinical notes here..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-200 text-sm min-h-32 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors text-sm font-semibold">
          Save Changes
        </button>
        <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
          Prescribe Medication
        </button>
        <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
          Schedule Appointment
        </button>
        <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm font-semibold">
          Print Report
        </button>
      </div>
    </div>
  )
}

// Personal Information Tab Component
const PersonalInformationTab = ({ patientData }) => {
  return (
    <div className="space-y-6">
      {/* Basic & Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Basic Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-sm font-bold">{patientData.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Full Name</p>
                <p className="text-white font-semibold">{patientData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Date of Birth</p>
                <p className="text-white font-semibold">{patientData.dateOfBirth}</p>
                <p className="text-xs text-slate-400 mt-0.5">Age: {patientData.age} years</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Gender</p>
                <p className="text-white font-semibold">{patientData.gender}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Droplet className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Blood Type</p>
                <p className="text-white font-semibold">{patientData.bloodType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-sky-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-0.5">Email Address</p>
                <p className="text-white font-semibold break-all">{patientData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Phone Number</p>
                <p className="text-white font-semibold">{patientData.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Home Address</p>
                <p className="text-white font-semibold">{patientData.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Emergency Contact</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Contact Name</p>
            <p className="text-white font-semibold text-lg">{patientData.emergencyContact.name}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Relationship</p>
            <p className="text-white font-semibold text-lg">{patientData.emergencyContact.relationship}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Phone Number</p>
            <p className="text-white font-semibold text-lg">{patientData.emergencyContact.phone}</p>
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Insurance Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Insurance Provider</p>
            <p className="text-white font-semibold text-lg">{patientData.insurance.provider}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Policy Number</p>
            <p className="text-white font-semibold text-lg font-mono">{patientData.insurance.policy_number}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Group Number</p>
            <p className="text-white font-semibold text-lg font-mono">{patientData.insurance.group_number}</p>
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
        {discontinuedPrescriptions.length > 0 ? (
          <div className="space-y-4">
            {discontinuedPrescriptions.map(prescription => (
              <PrescriptionCard key={prescription.id} prescription={prescription} isExpanded={expandedPrescription === prescription.id} onToggle={() => setExpandedPrescription(expandedPrescription === prescription.id ? null : prescription.id)} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">No discontinued prescriptions</p>
          </div>
        )}
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
