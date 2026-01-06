import { useState, useEffect } from 'react'
import { AlertCircle, Users, CheckSquare, Package, Clock, TrendingUp, Activity, Heart } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import StatCard from '../../components/staff/StatCard'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

export default function StaffDashboardMain() {
  const [dashboardData, setDashboardData] = useState({
    assignedPatients: 0,
    pendingTasks: 0,
    criticalAlertCount: 0,
    tasksToday: 0,
    completedToday: 0
  })

  const [urgentTasks, setUrgentTasks] = useState([])
  const [myPatients, setMyPatients] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [tasksRes, patientsRes, activityRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tasks`, { headers, params: { limit: 10, status: 'PENDING', priority: 'HIGH' } }),
        axios.get(`${API_BASE_URL}/patients`, { headers, params: { limit: 4, status: 'ADMITTED' } }),
        axios.get(`${API_BASE_URL}/dashboard/activity`, { headers, params: { limit: 4 } }),
        axios.get(`${API_BASE_URL}/tasks/statistics/summary`, { headers })
      ])

      const transformedTasks = tasksRes.data.tasks.map(t => ({
        id: t.id,
        title: t.title,
        dueIn: t.due_date ? new Date(t.due_date).toLocaleTimeString() : 'N/A',
        patient: t.patient_name || 'Unassigned',
        priority: t.priority.toLowerCase(),
        time: new Date(t.created_at).toLocaleTimeString()
      }))

      const transformedPatients = patientsRes.data.patients.map(p => {
        const latestVital = p.vitals?.[0] || {}
        return {
          id: p.id,
          name: p.name,
          room: p.room_number || 'N/A',
          age: p.age || 0,
          condition: p.primary_diagnosis || 'Unknown',
          hr: latestVital.heart_rate || 0,
          temp: latestVital.temperature || 0,
          bp: latestVital.blood_pressure_systolic ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}` : 'N/A',
          o2: latestVital.oxygen_saturation || 0,
          status: p.status === 'CRITICAL' ? 'critical' : 'stable'
        }
      })

      const transformedActivity = activityRes.data.activity.map(a => ({
        id: a.id,
        action: a.description,
        patient: a.patient_name || 'System',
        room: 'N/A',
        time: new Date(a.created_at).toLocaleTimeString(),
        type: 'task'
      }))

      setUrgentTasks(transformedTasks)
      setMyPatients(transformedPatients)
      setRecentActivity(transformedActivity)
      setDashboardData({
        assignedPatients: patientsRes.data.total || 0,
        pendingTasks: statsRes.data.pending || 0,
        criticalAlertCount: statsRes.data.pending || 0,
        tasksToday: statsRes.data.total_tasks || 0,
        completedToday: statsRes.data.completed || 0
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Staff Dashboard</h1>
              <p className="text-sm text-slate-400">Day Shift • 7:00 AM - 3:00 PM</p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                <p className="ml-4 text-slate-400">Loading dashboard...</p>
              </div>
            ) : (
              <>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="My Patients" value={dashboardData.assignedPatients} sub="Assigned to you" />
              <StatCard icon={CheckSquare} label="Pending Tasks" value={dashboardData.pendingTasks} sub={`${dashboardData.completedToday} completed today`} />
              <StatCard icon={AlertCircle} label="Critical Alerts" value={dashboardData.criticalAlertCount} sub="Require immediate attention" />
              <StatCard icon={Activity} label="Tasks Today" value={dashboardData.tasksToday} sub={`${Math.round((dashboardData.completedToday / dashboardData.tasksToday) * 100)}% complete`} />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Urgent Tasks - Takes 2 columns */}
              <div className="lg:col-span-2">
                <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <h2 className="text-lg font-semibold text-white">Urgent Tasks</h2>
                    </div>
                    <span className="text-xs px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
                      {urgentTasks.filter(t => t.priority === 'high').length} High Priority
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {urgentTasks.map((task) => (
                      <div key={task.id} className="px-6 py-4 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${
                                task.priority === 'high' ? 'bg-red-500' :
                                task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              <h3 className="text-sm font-medium text-white">{task.title}</h3>
                            </div>
                            <p className="text-xs text-slate-400">Patient: {task.patient}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-slate-300">{task.time}</p>
                            <p className={`text-xs ${
                              task.priority === 'high' ? 'text-red-400' :
                              task.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>Due in {task.dueIn}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-slate-400" />
                      Recent Activity
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="px-6 py-4 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activity.type === 'vital' ? 'bg-blue-500/10 text-blue-400' :
                              activity.type === 'medication' ? 'bg-purple-500/10 text-purple-400' :
                              activity.type === 'incident' ? 'bg-red-500/10 text-red-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {activity.type === 'vital' ? <Heart className="w-4 h-4" /> :
                               activity.type === 'medication' ? <Package className="w-4 h-4" /> :
                               activity.type === 'incident' ? <AlertCircle className="w-4 h-4" /> :
                               <CheckSquare className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{activity.action}</p>
                              <p className="text-xs text-slate-400">{activity.patient} • {activity.room}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* My Patients */}
              <div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-400" />
                      My Patients
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {myPatients.map((patient) => (
                      <div key={patient.id} className="px-6 py-4 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-white">{patient.name}</h3>
                              <span className={`w-2 h-2 rounded-full ${
                                patient.status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'
                              }`} />
                            </div>
                            <p className="text-xs text-slate-400">{patient.room} • {patient.condition}</p>
                          </div>
                          <span className="text-xs text-slate-500">{patient.age}y</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <p className="text-xs text-slate-500">HR</p>
                            <p className={`text-sm font-medium ${patient.hr > 100 ? 'text-red-400' : 'text-slate-300'}`}>{patient.hr}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <p className="text-xs text-slate-500">O₂</p>
                            <p className={`text-sm font-medium ${patient.o2 < 90 ? 'text-red-400' : 'text-slate-300'}`}>{patient.o2}%</p>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <p className="text-xs text-slate-500">BP</p>
                            <p className="text-sm font-medium text-slate-300">{patient.bp}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <p className="text-xs text-slate-500">Temp</p>
                            <p className="text-sm font-medium text-slate-300">{patient.temp}°F</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
