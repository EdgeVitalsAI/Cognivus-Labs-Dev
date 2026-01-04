import { useState, useEffect } from 'react'
import { AlertCircle, Users, CheckSquare, Package, Zap } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import StatCard from '../../components/staff/StatCard'
import CriticalAlerts from '../../components/staff/CriticalAlerts'
import UrgentTasks from '../../components/staff/UrgentTasks'
import MyPatients from '../../components/staff/MyPatients'
import LowStock from '../../components/staff/LowStock'

export default function StaffDashboardMain() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    assignedPatients: 12,
    pendingTasks: 8,
    criticalAlertCount: 3,
    tasksToday: 15,
    urgentTasks: [],
    myPatients: [],
    lowStockItems: [],
    alerts: []
  })

  useEffect(() => {
    // Load dashboard data from API
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      setDashboardData({
        assignedPatients: 12,
        pendingTasks: 8,
        criticalAlertCount: 3,
        tasksToday: 15,
        urgentTasks: [
          {
            id: 1,
            title: 'Administer meds - Room 302A',
            dueIn: '15 mins',
            patient: 'Sarah J.',
            priority: 'high'
          },
          {
            id: 2,
            title: 'Check vitals - Room 410C',
            dueIn: '30 mins',
            patient: 'Emma D.',
            priority: 'high'
          }
        ],
        myPatients: [
          { id: 1, name: 'Sarah Johnson', room: '302A', age: 58, alerts: 2, hr: 125, temp: 98.6, bp: '135/85', o2: 97 },
          { id: 2, name: 'Michael Chen', room: '215B', age: 45, alerts: 1, hr: 72, temp: 98.2, bp: '120/78', o2: 98 }
        ],
        lowStockItems: [
          { id: 1, name: 'ECG Electrodes', stock: 45, level: 'high' },
          { id: 2, name: 'Blood Pressure Cuffs', stock: 12, level: 'medium' }
        ],
        alerts: [
          { id: 1, patient: 'Sarah J.', room: '302A', issue: 'High HR (125)', severity: 'critical', type: 'vital' },
          { id: 2, patient: 'Michael C.', room: '215B', issue: 'Low O2 (88%)', severity: 'critical', type: 'vital' }
        ]
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <StaffSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Jane Johnson</h1>
              <p className="text-slate-400">Shift: Day (7 AM - 3 PM) • Time: 11:30 AM</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Users}
                label="Active Patients"
                value={dashboardData.assignedPatients}
                sub="Currently monitored"
              />
              <StatCard
                icon={CheckSquare}
                label="Pending Tasks"
                value={dashboardData.pendingTasks}
                sub="Assigned to you"
              />
              <StatCard
                icon={AlertCircle}
                label="Critical Alerts"
                value={dashboardData.criticalAlertCount}
                sub="Requires attention"
              />
              <StatCard
                icon={Zap}
                label="Tasks Today"
                value={dashboardData.tasksToday}
                sub="Total for this shift"
              />
            </div>

            {/* Critical Alerts */}
            {dashboardData.alerts.length > 0 && (
              <CriticalAlerts alerts={dashboardData.alerts} />
            )}

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Urgent Tasks */}
              <UrgentTasks tasks={dashboardData.urgentTasks} />

              {/* My Patients */}
              <MyPatients patients={dashboardData.myPatients} />

              {/* Low Stock */}
              <LowStock items={dashboardData.lowStockItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
