import { useState, useEffect } from 'react'
import { Search, Filter, Heart, Thermometer, Activity, Wind, User, Stethoscope, X, FileText, Pill, Plus, Wifi, WifiOff, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import ECGChart from '../../components/vitals/ECGChart'
import useVitalsWebSocket from '../../hooks/useVitalsWebSocket'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

export default function StaffPatients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatients()

    // Set up periodic refresh every 60 seconds (1 minute) for live vitals
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Refreshing live vitals from devices...')
      try {
        const token = localStorage.getItem('access_token')
        const response = await axios.get(`${API_BASE_URL}/patients/live-vitals/bulk`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.data.success && response.data.vitals.length > 0) {
          // Update patients with live vitals data
          setPatients(prev => prev.map(p => {
            const liveVital = response.data.vitals.find(v => v.patient_id === p.id)
            if (liveVital) {
              return {
                ...p,
                hr: liveVital.heart_rate || p.hr,
                o2: liveVital.spo2 || p.o2,
              }
            }
            return p
          }))
          console.log(`✓ Updated ${response.data.vitals.length} staff patients with live vitals`)
        }
      } catch (err) {
        console.error('Failed to fetch bulk live vitals:', err)
      }
    }, 60000) // 60 seconds (1 minute)

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval)
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE_URL}/patients`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 500 }
      })

      const transformed = response.data.patients.map(p => {
        const latestVital = p.vitals?.[0] || {}
        return {
          id: p.id,
          name: p.name,
          age: p.age || 0,
          gender: p.gender || 'U',
          room: p.room_number || 'N/A',
          department: p.department || 'General',
          doctor: 'Dr. ' + (p.doctor_name || 'Unknown'),
          diagnosis: p.primary_diagnosis || 'Unknown',
          hr: latestVital.heart_rate || 0,
          temp: latestVital.temperature || 0,
          bp: latestVital.blood_pressure_systolic ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}` : 'N/A',
          o2: latestVital.oxygen_saturation || 0,
          alerts: 0,
          status: p.status === 'CRITICAL' ? 'critical' : 'stable'
        }
      })

      setPatients(transformed)
    } catch (err) {
      console.error('Failed to fetch patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshVitals = async (patientId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/live-vitals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        // Update only this patient's vitals with live data
        setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
            return {
              ...p,
              hr: response.data.heart_rate || p.hr,
              o2: response.data.spo2 || p.o2,
            }
          }
          return p
        }))
        console.log(`✓ Refreshed live vitals for staff patient ${patientId}`)
      }
    } catch (err) {
      console.error('Failed to refresh vitals:', err)
    }
  }

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showLiveVitals, setShowLiveVitals] = useState(false)
  const [livePatientId, setLivePatientId] = useState(null)

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.room.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">My Patients</h1>
              <p className="text-sm text-slate-400">{patients.length} patients assigned to you</p>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                >
                  {/* Patient Header */}
                  <div className="px-4 py-4 border-b border-slate-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white">{patient.name}</h3>
                          <span className={`w-2 h-2 rounded-full ${
                            patient.status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'
                          }`} />
                        </div>
                        <p className="text-xs text-slate-400">
                          {patient.age}{patient.gender} • Room {patient.room}
                        </p>
                      </div>
                      {patient.alerts > 0 && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded border border-red-500/20">
                          {patient.alerts} Alert{patient.alerts > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Stethoscope className="w-3 h-3" />
                      <span>{patient.department}</span>
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="px-4 py-3 bg-slate-800/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/50 rounded px-2 py-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Heart className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-slate-500">HR</span>
                        </div>
                        <p className={`text-sm font-medium ${patient.hr > 100 ? 'text-red-400' : 'text-slate-300'}`}>
                          {patient.hr} <span className="text-xs text-slate-500">bpm</span>
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded px-2 py-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Wind className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs text-slate-500">O₂</span>
                        </div>
                        <p className={`text-sm font-medium ${patient.o2 < 90 ? 'text-red-400' : 'text-slate-300'}`}>
                          {patient.o2}<span className="text-xs text-slate-500">%</span>
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded px-2 py-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Activity className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-slate-500">BP</span>
                        </div>
                        <p className="text-sm font-medium text-slate-300">{patient.bp}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded px-2 py-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Thermometer className="w-3 h-3 text-orange-400" />
                          <span className="text-xs text-slate-500">Temp</span>
                        </div>
                        <p className="text-sm font-medium text-slate-300">{patient.temp}°F</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient)
                        setShowDetail(true)
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setLivePatientId(patient.id)
                        setShowLiveVitals(true)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Live Vitals
                    </button>
                    <button
                      onClick={() => handleRefreshVitals(patient.id)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Refresh vitals"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">No patients found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {showDetail && selectedPatient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                <p className="text-sm text-slate-400">Room {selectedPatient.room} • {selectedPatient.department}</p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Patient Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Basic Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Age:</span>
                      <span className="text-white">{selectedPatient.age} years old</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="text-white">{selectedPatient.gender === 'M' ? 'Male' : 'Female'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="text-white">{selectedPatient.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Doctor:</span>
                      <span className="text-white">{selectedPatient.doctor}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    Current Vitals
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Heart Rate:</span>
                      <span className={`font-medium ${selectedPatient.hr > 100 ? 'text-red-400' : 'text-white'}`}>
                        {selectedPatient.hr} bpm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">O₂ Saturation:</span>
                      <span className={`font-medium ${selectedPatient.o2 < 90 ? 'text-red-400' : 'text-white'}`}>
                        {selectedPatient.o2}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Blood Pressure:</span>
                      <span className="text-white font-medium">{selectedPatient.bp} mmHg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="text-white font-medium">{selectedPatient.temp}°F</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 mb-6">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  Diagnosis
                </h3>
                <p className="text-sm text-slate-300">{selectedPatient.diagnosis}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  Add Note
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700">
                  <Activity className="w-4 h-4" />
                  Record Vitals
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700">
                  <Pill className="w-4 h-4" />
                  Medications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Vitals Modal */}
      {showLiveVitals && livePatientId && <LiveVitalsModal patientId={livePatientId} onClose={() => setShowLiveVitals(false)} />}
    </div>
  )
}

// Live Vitals Modal Component
function LiveVitalsModal({ patientId, onClose }) {
  const { vitals: liveVitals, ecgData, connectionStatus, error: wsError } = useVitalsWebSocket(patientId, true)
  const [patientInfo, setPatientInfo] = useState(null)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await axios.get(`http://localhost:8000/api/patients/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setPatientInfo(response.data)
      } catch (err) {
        console.error('Failed to fetch patient:', err)
      }
    }
    fetchPatient()
  }, [patientId])

  const displayVitals = {
    heartRate: liveVitals.heartRate ?? 0,
    spo2: liveVitals.spo2 ?? 0,
    temperature: patientInfo?.vitals?.[0]?.temperature ?? 0
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-500" />
              Live Patient Monitoring
              {patientInfo && <span className="text-slate-400 text-base font-normal">• {patientInfo.name}</span>}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Real-time vital signs from wearable device</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status Badge */}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="relative flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="absolute inset-0 animate-ping">
                    <Wifi className="w-4 h-4 text-emerald-400 opacity-75" />
                  </span>
                </div>
                <span className="text-sm font-medium text-emerald-400">Streaming</span>
              </div>
            )}
            {connectionStatus === 'connecting' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-sm font-medium text-amber-400">Connecting...</span>
              </div>
            )}
            {connectionStatus === 'disconnected' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 border border-slate-500/30 rounded-lg">
                <WifiOff className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-400">Offline</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Live Vitals Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Heart Rate */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                {connectionStatus === 'connected' && displayVitals.heartRate > 0 && (
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Heart Rate</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{displayVitals.heartRate}</span>
                <span className="text-sm text-slate-400">bpm</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {displayVitals.heartRate >= 60 && displayVitals.heartRate <= 100 ? 'Normal' : displayVitals.heartRate > 100 ? 'Elevated' : displayVitals.heartRate > 0 ? 'Low' : 'No Data'}
              </p>
            </div>

            {/* SpO2 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Wind className="w-6 h-6 text-blue-400" />
                </div>
                {connectionStatus === 'connected' && displayVitals.spo2 > 0 && (
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Oxygen Saturation</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{displayVitals.spo2}</span>
                <span className="text-sm text-slate-400">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {displayVitals.spo2 >= 95 ? 'Normal' : displayVitals.spo2 >= 90 ? 'Low' : displayVitals.spo2 > 0 ? 'Critical' : 'No Data'}
              </p>
              {liveVitals.spo2Status && (
                <p className="text-xs text-slate-400 mt-1">
                  {liveVitals.spo2Status.fingerDetected ? '✓ Finger Detected' : '○ No Finger'}
                </p>
              )}
            </div>

            {/* Temperature */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Thermometer className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Temperature</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{displayVitals.temperature.toFixed(1)}</span>
                <span className="text-sm text-slate-400">°F</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {displayVitals.temperature >= 97 && displayVitals.temperature <= 99 ? 'Normal' : displayVitals.temperature > 99 ? 'Fever' : displayVitals.temperature > 0 ? 'Low' : 'No Data'}
              </p>
            </div>
          </div>

          {/* Sensor Debug Panel */}
          {connectionStatus === 'connected' && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Sensor Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* ECG Sensor */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-3">ECG Sensor</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Leads Status:</span>
                      <span className={liveVitals.ecgStatus?.leadsOff ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                        {liveVitals.ecgStatus?.leadsOff ? '✕ Disconnected' : '✓ Connected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active:</span>
                      <span className="text-slate-300">{liveVitals.ecgStatus?.active ? 'Yes' : 'No'}</span>
                    </div>
                    {liveVitals.ecgStatus?.leadsOff && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Please connect ECG leads
                      </div>
                    )}
                  </div>
                </div>

                {/* SpO2 Sensor */}
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-3">SpO2 Sensor</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Finger Detected:</span>
                      <span className={liveVitals.spo2Status?.fingerDetected ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                        {liveVitals.spo2Status?.fingerDetected ? '✓ Yes' : '✕ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valid Reading:</span>
                      <span className="text-slate-300">{liveVitals.spo2Status?.valid ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IR Signal:</span>
                      <span className="text-slate-300">{liveVitals.spo2Status?.ir || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RED Signal:</span>
                      <span className="text-slate-300">{liveVitals.spo2Status?.red || 0}</span>
                    </div>
                    {!liveVitals.spo2Status?.fingerDetected && (
                      <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Place finger on sensor
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ECG Waveform */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Live ECG Waveform
            </h3>
            <ECGChart ecgData={ecgData} />
          </div>

          {/* WebSocket Error */}
          {wsError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-1">Connection Error</h4>
                  <p className="text-sm text-red-300">{wsError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
