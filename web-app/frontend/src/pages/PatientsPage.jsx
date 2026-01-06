import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus } from 'lucide-react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import PatientCard from '../components/patients/PatientCard'
import AddPatientModal from '../components/patients/AddPatientModal'
import { authService } from '../services/api'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const PatientsPage = () => {
  const navigate = useNavigate()
  const [user] = useState(authService.getCurrentUser())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [sortOption, setSortOption] = useState('recent')
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    stable: 0
  })

  // Fetch patients from API
  useEffect(() => {
    fetchPatients()
    fetchStats()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 500
        }
      })

      // Transform API data to match component expectations
      const transformedPatients = response.data.patients.map(p => ({
        id: p.id,
        name: p.name,
        room: p.room_number || 'Not Assigned',
        age: p.age,
        status: p.status,
        department: p.department || 'General',
        photo: p.photo_url || `https://via.placeholder.com/300x400/4a5568/ffffff?text=${p.name.split(' ')[0]}`,
        heartRate: 0, // Will be fetched from latest vitals if needed
        bpm: 0,
        temperature: 0,
        bloodPressure: 'N/A',
        o2Saturation: 0,
        respiratoryRate: 0,
        pH: 7.40,
        addedDate: new Date(p.admission_date || p.created_at),
      }))

      setPatients(transformedPatients)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch patients:', err)
      setError('Failed to load patients. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/patients/statistics/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setStats({
        total: response.data.total_patients,
        critical: response.data.by_status.critical,
        warning: response.data.by_status.warning,
        stable: response.data.by_status.stable
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }


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

  const handleAddPatient = async (newPatient) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE_URL}/patients`, newPatient, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Refresh patient list after adding
      await fetchPatients()
      await fetchStats()
      setIsAddPatientModalOpen(false)
    } catch (err) {
      console.error('Failed to add patient:', err)
      alert('Failed to add patient. Please try again.')
    }
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
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Critical</p>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Warning</p>
              <p className="text-2xl font-bold text-amber-400">{stats.warning}</p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Stable</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.stable}</p>
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
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
              <p className="ml-4 text-slate-400">Loading patients...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 text-center">
              <p className="text-red-400 text-lg">{error}</p>
              <button
                onClick={fetchPatients}
                className="mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
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
                  <p className="text-slate-400 text-lg">
                    {patients.length === 0
                      ? 'No patients in the system yet. Add your first patient!'
                      : 'No patients match your filters'}
                  </p>
                </div>
              )}
            </div>
          )}
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
