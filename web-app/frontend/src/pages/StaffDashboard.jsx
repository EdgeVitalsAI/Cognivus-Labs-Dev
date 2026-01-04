import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Clipboard, Package, TrendingUp } from 'lucide-react'
import { authService } from '../services/api'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'

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

  const [tasks] = useState([
    { title: 'Prepare ECG equipment for Room 302A', assignedBy: 'Dr. Smith', dueDate: 'Today 2:00 PM', status: 'pending' },
    { title: 'Stock blood pressure monitors', assignedBy: 'Nurse Lead', dueDate: 'Today 3:30 PM', status: 'in-progress' },
    { title: 'Clean patient bed - Ward 105', assignedBy: 'Housekeeping', dueDate: 'Tomorrow', status: 'completed' },
  ])

  const [admissions] = useState([
    { name: 'Michael Johnson', room: 'Room 402B', diagnosis: 'Acute Cardiac Event', time: '30 mins ago' },
    { name: 'Sarah Williams', room: 'Ward 3 - 05C', diagnosis: 'Hypertension Monitoring', time: '2 hours ago' },
    { name: 'James Brown', room: 'Room 310A', diagnosis: 'Respiratory Monitor', time: '4 hours ago' },
  ])

  const [inventory] = useState([
    { name: 'ECG Electrodes', stock: '45 units', level: 'high' },
    { name: 'Blood Pressure Cuffs', stock: '12 units', level: 'medium' },
    { name: 'Oxygen Sensors', stock: '3 units', level: 'low' },
    { name: 'IV Stands', stock: '28 units', level: 'high' },
  ])

  const [activities] = useState([
    { action: 'Patient John Doe admitted to Room 402B', by: 'You', time: '30 mins ago' },
    { action: 'Equipment maintenance completed in Ward 5', by: 'Tech Sam', time: '1 hour ago' },
    { action: 'Inventory restocked - ECG Electrodes', by: 'Supply Manager', time: '2 hours ago' },
    { action: 'Patient discharge - Emma Davis from Room 310', by: 'Dr. Wilson', time: '4 hours ago' },
  ])

  useEffect(() => {
    const userData = authService.getCurrentUser()
    setUser(userData)
  }, [])

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
          {/* KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard icon={Activity} label="Active Patients" value={12} sub={'Currently monitored'} />
            <StatCard icon={Clipboard} label="Pending Tasks" value={tasks.filter(t => t.status !== 'completed').length} sub={'Assigned to you'} />
            <StatCard icon={Package} label="Low Stock Items" value={1} sub={'Requires order'} />
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
        </main>
      </div>
    </div>
  )
}

export default StaffDashboard
