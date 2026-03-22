import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Clipboard, Package, TrendingUp } from 'lucide-react'
import { authService } from '../services/api'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl p-5 bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 text-slate-200">
    <div className="flex items-center gap-3">
      <div className="p-3 rounded-lg bg-slate-800">
        <Icon className="w-6 h-6 text-slate-200" />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  </div>
)

const TasksPanel = ({ tasks }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Assigned Tasks ({tasks.length})</h3>
      <button className="text-xs px-3 py-1 bg-slate-800 rounded-md border border-slate-700">+ New Task</button>
    </div>
    <ul className="divide-y divide-slate-800">
      {tasks.map((t, i) => (
        <li key={i} className="px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200">{t.title}</p>
            <p className="text-xs text-slate-400">{t.assignedBy} • {t.dueDate}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${t.status === 'pending' ? 'border-amber-400 text-amber-300' : t.status === 'in-progress' ? 'border-sky-400 text-sky-300' : 'border-emerald-500 text-emerald-300'}`}>{t.status.toUpperCase()}</span>
        </li>
      ))}
    </ul>
  </div>
)

const PatientAdmissionPanel = ({ admissions }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Recent Patient Admissions</h3>
      <button className="text-xs px-3 py-1 bg-slate-800 rounded-md border border-slate-700">+ Admit</button>
    </div>
    <ul className="divide-y divide-slate-800">
      {admissions.map((a, i) => (
        <li key={i} className="px-5 py-3">
          <p className="text-sm text-slate-200 font-medium">{a.name}</p>
          <p className="text-xs text-slate-400">{a.room} • {a.diagnosis}</p>
          <p className="text-[11px] text-slate-500 mt-1">{a.time}</p>
        </li>
      ))}
    </ul>
  </div>
)

const InventoryPanel = ({ items }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Inventory Status</h3>
      <button className="text-xs px-3 py-1 bg-slate-800 rounded-md border border-slate-700">View All</button>
    </div>
    <ul className="divide-y divide-slate-800">
      {items.map((it, i) => (
        <li key={i} className="px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200">{it.name}</p>
            <p className="text-xs text-slate-400">Stock: {it.stock}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${it.level === 'low' ? 'border-red-500 text-red-400' : it.level === 'medium' ? 'border-amber-400 text-amber-300' : 'border-emerald-500 text-emerald-300'}`}>{it.level.toUpperCase()}</span>
        </li>
      ))}
    </ul>
  </div>
)

const ActivityLog = ({ activities }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700">
      <h3 className="text-sm font-semibold">Activity Log</h3>
    </div>
    <ul className="divide-y divide-slate-800">
      {activities.map((act, i) => (
        <li key={i} className="px-5 py-3">
          <p className="text-sm text-slate-200">{act.action}</p>
          <p className="text-xs text-slate-400">{act.by}</p>
          <p className="text-[11px] text-slate-500 mt-1">{act.time}</p>
        </li>
      ))}
    </ul>
  </div>
)

const StaffDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [inventory, setInventory] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePatients, setActivePatients] = useState(0)

  useEffect(() => {
    const userData = authService.getCurrentUser()
    setUser(userData)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [tasksRes, patientsRes, activityRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tasks`, { headers, params: { limit: 10, status: 'PENDING' } }),
        axios.get(`${API_BASE_URL}/patients`, { headers, params: { limit: 5, status: 'ADMITTED' } }),
        axios.get(`${API_BASE_URL}/dashboard/activity`, { headers, params: { limit: 5 } })
      ])

      const transformedTasks = tasksRes.data.tasks.map(t => ({
        title: t.title,
        assignedBy: 'System',
        dueDate: t.due_date ? new Date(t.due_date).toLocaleString() : 'No due date',
        status: t.status.toLowerCase()
      }))

      const transformedAdmissions = patientsRes.data.patients.map(p => ({
        name: p.name,
        room: p.room_number || 'Unassigned',
        diagnosis: p.primary_diagnosis || 'N/A',
        time: new Date(p.admission_date).toLocaleString()
      }))

      const transformedActivity = activityRes.data.activity.map(a => ({
        action: a.description,
        by: a.created_by_name || 'System',
        time: new Date(a.created_at).toLocaleString()
      }))

      setTasks(transformedTasks)
      setAdmissions(transformedAdmissions)
      setActivities(transformedActivity)
      setActivePatients(patientsRes.data.total || 0)

      setInventory([])
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/staff/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar userName={user?.full_name || 'Loading...'} />

      <div className="flex">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
              <p className="ml-4 text-slate-400">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard icon={Activity} label="Active Patients" value={activePatients} sub={'Currently monitored'} />
                <StatCard icon={Clipboard} label="Pending Tasks" value={tasks.filter(t => t.status !== 'completed').length} sub={'Assigned to you'} />
                <StatCard icon={Package} label="Low Stock Items" value={inventory.length} sub={'Requires order'} />
                <StatCard icon={TrendingUp} label="Patient Admissions" value={admissions.length} sub={'This shift'} />
              </section>

              {/* Main grid */}
              <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TasksPanel tasks={tasks} />
                <PatientAdmissionPanel admissions={admissions} />
              </section>

              {/* Bottom grid */}
              <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InventoryPanel items={inventory} />
                <ActivityLog activities={activities} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default StaffDashboard
