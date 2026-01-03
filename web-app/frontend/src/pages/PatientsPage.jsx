import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus } from 'lucide-react'
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
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [sortOption, setSortOption] = useState('recent')
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)

  // Mock patient data
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: 'Wathsala Dewmina',
      room: 'Room No. 302A',
      age: 20,
      status: 'CRITICAL',
      department: 'Cardiology',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Wathsala',
      heartRate: 110,
      bpm: 110,
      temperature: 38.5,
      bloodPressure: '140/90',
      o2Saturation: 92,
      respiratoryRate: 22,
      pH: 7.35,
      addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      name: 'Wooshan Gamage',
      room: 'Room No. 108C',
      age: 17,
      status: 'CRITICAL',
      department: 'Emergency',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Wooshan',
      heartRate: 59,
      bpm: 120,
      temperature: 37.2,
      bloodPressure: '120/80',
      o2Saturation: 95,
      respiratoryRate: 18,
      pH: 7.40,
      addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      name: 'Rivindu Ashinsa',
      room: 'Ward 3 2A',
      age: 19,
      status: 'CRITICAL',
      department: 'ICU',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Rivindu',
      heartRate: 95,
      bpm: 95,
      temperature: 36.8,
      bloodPressure: '130/85',
      o2Saturation: 88,
      respiratoryRate: 20,
      pH: 7.38,
      addedDate: new Date(),
    },
    {
      id: 4,
      name: 'Robert Key',
      room: 'Room No. 152B',
      age: 45,
      status: 'WARNING',
      department: 'Cardiology',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Robert',
      heartRate: 78,
      bpm: 78,
      temperature: 37.5,
      bloodPressure: '125/82',
      o2Saturation: 96,
      respiratoryRate: 16,
      pH: 7.39,
      addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 5,
      name: 'Lakindu Minosha',
      room: 'Ward 1 10C',
      age: 32,
      status: 'WARNING',
      department: 'Surgery',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Lakindu',
      heartRate: 82,
      bpm: 82,
      temperature: 37.0,
      bloodPressure: '120/80',
      o2Saturation: 97,
      respiratoryRate: 16,
      pH: 7.40,
      addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 6,
      name: 'Ben Southern',
      room: 'Room No. 311B',
      age: 52,
      status: 'STABLE',
      department: 'Pediatrics',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Ben',
      heartRate: 75,
      bpm: 75,
      temperature: 36.9,
      bloodPressure: '118/78',
      o2Saturation: 98,
      respiratoryRate: 15,
      pH: 7.41,
      addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 7,
      name: 'Emma Davis',
      room: 'Room No. 250A',
      age: 28,
      status: 'STABLE',
      department: 'Emergency',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Emma',
      heartRate: 72,
      bpm: 72,
      temperature: 36.8,
      bloodPressure: '115/75',
      o2Saturation: 99,
      respiratoryRate: 14,
      pH: 7.40,
      addedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: 8,
      name: 'Michael Johnson',
      room: 'Room No. 410C',
      age: 58,
      status: 'STABLE',
      department: 'Surgery',
      photo: 'https://via.placeholder.com/300x400/4a5568/ffffff?text=Michael',
      heartRate: 70,
      bpm: 70,
      temperature: 36.7,
      bloodPressure: '120/76',
      o2Saturation: 98,
      respiratoryRate: 14,
      pH: 7.40,
      addedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ])

  // Filter and sort logic
  const getFilteredAndSortedPatients = () => {
    let filtered = patients.filter(patient => {
      // Apply search filter
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.room.toLowerCase().includes(searchTerm.toLowerCase())

      // Apply status filter
      const statusMap = {
        all: true,
        critical: patient.status === 'CRITICAL',
        warning: patient.status === 'WARNING',
        stable: patient.status === 'STABLE',
      }
      const matchesStatus = statusMap[filterStatus] !== false

      // Apply department filter
      const matchesDepartment =
        filterDepartment === 'all' ||
        patient.department.toLowerCase() === filterDepartment.toLowerCase()

      return matchesSearch && matchesStatus && matchesDepartment
    })

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'recent':
          return new Date(b.addedDate) - new Date(a.addedDate)
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'room':
          // Extract room number and sort numerically
          const aRoom = parseInt(a.room.match(/\d+/)?.[0] || 0)
          const bRoom = parseInt(b.room.match(/\d+/)?.[0] || 0)
          return aRoom - bRoom
        case 'critical':
          // Critical patients first, then warning, then stable
          const statusOrder = { CRITICAL: 0, WARNING: 1, STABLE: 2 }
          return (
            (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3)
          )
        default:
          return 0
      }
    })

    return sorted
  }

  const filteredPatients = getFilteredAndSortedPatients()

  const handleViewProfile = (patientId) => {
    navigate(`/doctor/patients/${patientId}`)
  }

  const handleViewVitals = (patientId) => {
    console.log('View vitals for patient:', patientId)
  }

  const handlePrescribe = (patientId) => {
    console.log('Prescribe for patient:', patientId)
  }

  const handleAddPatient = (newPatient) => {
    setPatients([...patients, newPatient])
    setIsAddPatientModalOpen(false)
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/doctor/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

      <div className="flex">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Patients</h1>
            <p className="text-slate-400">Manage and monitor all patient records</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Patients</p>
              <p className="text-2xl font-bold text-white">{patients.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Critical</p>
              <p className="text-2xl font-bold text-red-400">
                {patients.filter((p) => p.status === 'CRITICAL').length}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Warning</p>
              <p className="text-2xl font-bold text-amber-400">
                {patients.filter((p) => p.status === 'WARNING').length}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Stable</p>
              <p className="text-2xl font-bold text-emerald-400">
                {patients.filter((p) => p.status === 'STABLE').length}
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 relative min-w-max">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient name or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              title="Filter by Status"
            >
              <option value="all">Status: All</option>
              <option value="critical">Critical Condition</option>
              <option value="warning">Under Observation</option>
              <option value="stable">Active/Admitted</option>
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              title="Filter by Department"
            >
              <option value="all">Department: All</option>
              <option value="cardiology">Cardiology</option>
              <option value="emergency">Emergency</option>
              <option value="icu">ICU</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="surgery">Surgery</option>
              <option value="other">Other</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              title="Sort patients"
            >
              <option value="recent">Sort: Recent</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="room">Room Number</option>
              <option value="critical">Critical First</option>
            </select>

            <button 
              onClick={() => setIsAddPatientModalOpen(true)}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add Patient
            </button>
          </div>

          {/* Patient Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onViewProfile={handleViewProfile}
                  onViewVitals={handleViewVitals}
                  onPrescribe={handlePrescribe}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-400 text-lg">No patients found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onAddPatient={handleAddPatient}
      />
    </div>
  )
}

export default PatientsPage
