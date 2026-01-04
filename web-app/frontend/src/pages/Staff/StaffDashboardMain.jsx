import { useState, useEffect } from 'react'
import { AlertCircle, Users, CheckSquare, Package, Clock, TrendingUp, Activity, Heart } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import StatCard from '../../components/staff/StatCard'

export default function StaffDashboardMain() {
  const [dashboardData, setDashboardData] = useState({
    assignedPatients: 12,
    pendingTasks: 8,
    criticalAlertCount: 3,
    tasksToday: 15,
    completedToday: 7
  })

  const [urgentTasks] = useState([
    { id: 1, title: 'Administer meds - Room 302A', dueIn: '15 mins', patient: 'Sarah Johnson', priority: 'high', time: '2:45 PM' },
    { id: 2, title: 'Check vitals - Room 410C', dueIn: '30 mins', patient: 'Emma Davis', priority: 'high', time: '3:00 PM' },
    { id: 3, title: 'Wound dressing - Room 215B', dueIn: '2 hours', patient: 'Michael Chen', priority: 'medium', time: '4:30 PM' },
    { id: 4, title: 'Assist with mobility - Room 108A', dueIn: '3 hours', patient: 'Robert Williams', priority: 'low', time: '5:30 PM' }
  ])

  const [myPatients] = useState([
    { id: 1, name: 'Sarah Johnson', room: '302A', age: 58, condition: 'Post-op', hr: 125, temp: 98.6, bp: '135/85', o2: 97, status: 'critical' },
    { id: 2, name: 'Emma Davis', room: '410C', age: 67, condition: 'Recovery', hr: 88, temp: 99.1, bp: '140/90', o2: 88, status: 'critical' },
    { id: 3, name: 'Michael Chen', room: '215B', age: 45, condition: 'Stable', hr: 72, temp: 98.2, bp: '120/78', o2: 98, status: 'stable' },
    { id: 4, name: 'Robert Williams', room: '108A', age: 52, condition: 'Observation', hr: 78, temp: 98.4, bp: '118/76', o2: 99, status: 'stable' }
  ])

  const [recentActivity] = useState([
    { id: 1, action: 'Vitals recorded', patient: 'Sarah Johnson', room: '302A', time: '10 mins ago', type: 'vital' },
    { id: 2, action: 'Medication administered', patient: 'Michael Chen', room: '215B', time: '25 mins ago', type: 'medication' },
    { id: 3, action: 'Incident reported', patient: 'Emma Davis', room: '410C', time: '1 hour ago', type: 'incident' },
    { id: 4, action: 'Task completed', patient: 'Robert Williams', room: '108A', time: '2 hours ago', type: 'task' }
  ])

  useEffect(() => {
    // Load dashboard data from API
    const loadData = async () => {
      try {
        // API call here
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }
    loadData()
  }, [])

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
          </div>
        </div>
      </div>
    </div>
  )
}
