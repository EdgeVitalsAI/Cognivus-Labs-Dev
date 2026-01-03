import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import StatsSection from '../components/dashboard/StatsSection'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import TasksPanel from '../components/dashboard/TasksPanel'
import VitalsTrends from '../components/dashboard/VitalsTrends'

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [patients] = useState([
    { name: 'Wathsala Dewmina', room: 'Room No. 302A', condition: 'Low O2', severity: 'low', time: '2 sec ago' },
    { name: 'Wooshan Gamage', room: 'Room No. 108C', condition: 'High HR', severity: 'high', time: '1 mins ago' },
    { name: 'Rivindu Ashinsa', room: 'Ward 3 2A', condition: 'Low O2', severity: 'high', time: '2 mins ago' },
    { name: 'Robert Key', room: 'Room No. 152B', condition: 'Low BP', severity: 'medium', time: '5 mins ago' },
    { name: 'Lakindu Minosha', room: 'Ward 1 10C', condition: 'High HR', severity: 'medium', time: '5 mins ago' },
    { name: 'Ben Southern', room: 'Room No. 311B', condition: 'High HR', severity: 'medium', time: '9 mins ago' },
  ])
  const [alerts] = useState(
    patients.map((p) => ({ patient: p.name, room: p.room, condition: p.condition, severity: p.severity, time: p.time }))
  )
  const [activity] = useState([
    { title: 'Prescription approved for Emma Davis', author: 'Dr. Sarah Smith', time: '15 mins ago' },
    { title: 'Vitals updated for Wooshan - BP: 120/80', author: 'Nurse Teneesha', time: 'Today at 2:30 PM' },
    { title: 'New patient admitted - Room 405B', author: 'Staff Garcia', time: 'Oct 29, 2025 - 10:45 AM' },
  ])
  const [tasks] = useState([
    { title: 'Review lab results - Michael Chen', when: 'HIGH Due in 30 mins', priority: 'HIGH' },
    { title: 'Schedule follow-up - Emma Davis', when: 'MEDIUM Due in 2 hours', priority: 'MEDIUM' },
    { title: 'Update treatment plan - James W.', when: 'LOW Due in 4 hours', priority: 'LOW' },
  ])

  useEffect(() => {
    const userData = authService.getCurrentUser()
    setUser(userData)
  }, [])

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
          {/* KPI Cards */}
          <StatsSection />

          {/* Alerts */}
          <section className="mt-6">
            <AlertsPanel alerts={alerts} />
          </section>

          {/* Bottom grid */}
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <ActivityFeed items={activity} />
              <TasksPanel tasks={tasks} />
            </div>
            <VitalsTrends />
          </section>
        </main>
      </div>
    </div>
  )
}

export default DoctorDashboard
