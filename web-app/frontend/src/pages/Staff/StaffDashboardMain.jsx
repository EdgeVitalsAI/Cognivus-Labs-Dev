import { useState, useEffect } from 'react'
import { AlertCircle, Users, CheckSquare, Package, Clock, TrendingUp, Activity, Heart } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import StatCard from '../../components/staff/StatCard'
import ActiveMonitoringPanel from '../../components/dashboard/ActiveMonitoringPanel'
import AlertsPanel from '../../components/dashboard/AlertsPanel'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

export default function StaffDashboardMain() {
  const [dashboardData, setDashboardData] = useState({
    assignedPatients: 0,
    pendingTasks: 0,
    criticalAlertCount: 0,
    tasksToday: 0,
    completedToday: 0
  })

  const [urgentTasks, setUrgentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [tasksRes, patientsRes, statsRes, unreadRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tasks`, { headers, params: { limit: 10, status: 'PENDING', priority: 'HIGH' } }),
        axios.get(`${API_BASE_URL}/patients`, { headers, params: { limit: 4, status: 'ADMITTED' } }),
        axios.get(`${API_BASE_URL}/tasks/statistics/summary`, { headers }),
        axios.get(`${API_BASE_URL}/notifications/unread-count`, { headers }).catch(() => ({ data: { unread_count: 0, critical_count: 0 } }))
      ])

      const transformedTasks = tasksRes.data.tasks.map(t => ({
        id: t.id,
        title: t.title,
        dueIn: t.due_date ? new Date(t.due_date).toLocaleTimeString() : 'N/A',
        patient: t.patient_name || 'Unassigned',
        priority: t.priority.toLowerCase(),
        time: new Date(t.created_at).toLocaleTimeString()
      }))

      setUrgentTasks(transformedTasks)
      setDashboardData({
        assignedPatients: patientsRes.data.total || 0,
        pendingTasks: statsRes.data.pending || 0,
        criticalAlertCount: unreadRes.data.critical_count + (unreadRes.data.high_count || 0),
        tasksToday: statsRes.data.total_tasks || 0,
        completedToday: statsRes.data.completed || 0
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const completionPct = dashboardData.tasksToday > 0
    ? Math.round((dashboardData.completedToday / dashboardData.tasksToday) * 100)
    : 0

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Staff Dashboard</h1>
              <p className="text-sm text-slate-400">Day Shift • 7:00 AM - 3:00 PM</p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E80E7]"></div>
                <p className="ml-4 text-slate-400">Loading dashboard...</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="My Patients" value={dashboardData.assignedPatients} sub="Assigned to you" />
                  <StatCard icon={CheckSquare} label="Pending Tasks" value={dashboardData.pendingTasks} sub={`${dashboardData.completedToday} completed today`} />
                  <StatCard icon={AlertCircle} label="Urgent Alerts" value={dashboardData.criticalAlertCount} sub="Require immediate attention" />
                  <StatCard icon={Activity} label="Tasks Today" value={dashboardData.tasksToday} sub={`${completionPct}% complete`} />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Urgent Tasks + Active Monitoring */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Urgent Tasks */}
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
                        {urgentTasks.length === 0 ? (
                          <div className="px-6 py-8 text-center">
                            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No urgent tasks</p>
                          </div>
                        ) : (
                          urgentTasks.map((task) => (
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
                                  }`}>Due {task.dueIn}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Active Patient Monitoring */}
                    <ActiveMonitoringPanel basePath="/staff" />
                  </div>

                  {/* Right: Alerts */}
                  <div>
                    <AlertsPanel basePath="/staff" />
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
