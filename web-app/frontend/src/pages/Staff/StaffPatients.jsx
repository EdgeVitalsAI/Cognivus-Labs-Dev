import { useState, useEffect } from 'react'
import { Search, Filter, Heart, Thermometer, Activity, Wind, User, Stethoscope, X, FileText, Pill, Plus } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

export default function StaffPatients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE_URL}/patients`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 100, status: 'ADMITTED' }
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

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

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
    </div>
  )
}
