import { useState } from 'react'
import { Search, Filter, Heart, Thermometer, AlertCircle, Wind } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffPatients() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      age: 58,
      gender: 'F',
      room: '302A',
      department: 'Cardiology',
      doctor: 'Dr. Smith',
      diagnosis: 'Acute Coronary Syndrome',
      hr: 125,
      temp: 98.6,
      bp: '135/85',
      o2: 97,
      alerts: 2,
      status: 'active'
    },
    {
      id: 2,
      name: 'Michael Chen',
      age: 45,
      gender: 'M',
      room: '215B',
      department: 'Cardiology',
      doctor: 'Dr. Johnson',
      diagnosis: 'Hypertension',
      hr: 72,
      temp: 98.2,
      bp: '120/78',
      o2: 98,
      alerts: 1,
      status: 'active'
    },
    {
      id: 3,
      name: 'Emma Davis',
      age: 72,
      gender: 'F',
      room: '410C',
      department: 'Post-op',
      doctor: 'Dr. Williams',
      diagnosis: 'Hip Replacement Recovery',
      hr: 68,
      temp: 98.4,
      bp: '118/76',
      o2: 96,
      alerts: 0,
      status: 'active'
    }
  ])

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.room.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">My Patients</h1>
              <p className="text-slate-400">{patients.length} Assigned</p>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPatient(patient)
                    setShowDetail(true)
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
                      <p className="text-sm text-slate-400">
                        {patient.age}{patient.gender} • Room {patient.room}
                      </p>
                    </div>
                    {patient.alerts > 0 && (
                      <span className="px-3 py-1 bg-red-900/30 border border-red-900/50 text-red-300 text-sm rounded-full font-semibold">
                        🔴 {patient.alerts}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-400 mb-2">Vitals:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-slate-300">{patient.hr} bpm</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-slate-300">{patient.temp}°F</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-slate-300">{patient.bp} mmHg</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Wind className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300">{patient.o2}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded transition-colors">
                      Vitals
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400">No patients found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {showDetail && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{selectedPatient.name} - Room {selectedPatient.room}</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-slate-200">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-400">DOB:</span> {selectedPatient.age} years old
                    </p>
                    <p>
                      <span className="text-slate-400">Department:</span> {selectedPatient.department}
                    </p>
                    <p>
                      <span className="text-slate-400">Doctor:</span> {selectedPatient.doctor}
                    </p>
                    <p>
                      <span className="text-slate-400">Diagnosis:</span> {selectedPatient.diagnosis}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">Current Vitals</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-400">Heart Rate:</span> {selectedPatient.hr} bpm
                    </p>
                    <p>
                      <span className="text-slate-400">Temperature:</span> {selectedPatient.temp}°F
                    </p>
                    <p>
                      <span className="text-slate-400">BP:</span> {selectedPatient.bp} mmHg
                    </p>
                    <p>
                      <span className="text-slate-400">O2 Sat:</span> {selectedPatient.o2}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors">
                  Add Note
                </button>
                <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded transition-colors">
                  Record Vitals
                </button>
                <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded transition-colors">
                  View Medications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
