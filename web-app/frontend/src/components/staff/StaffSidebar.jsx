import { Link, useLocation } from 'react-router-dom'
<<<<<<< HEAD
import { BarChart3, CheckSquare, Users, Package, AlertTriangle, MessageSquare, FileText, Settings, ChevronLeft } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: BarChart3, path: '/staff/dashboard' },
  { label: 'My Tasks', icon: CheckSquare, path: '/staff/tasks' },
  { label: 'Patients', icon: Users, path: '/staff/patients' },
  { label: 'Inventory', icon: Package, path: '/staff/inventory' },
  { label: 'Incidents', icon: AlertTriangle, path: '/staff/incidents' },
  { label: 'Communication', icon: MessageSquare, path: '/staff/communication' },
  { label: 'Notes & Reports', icon: FileText, path: '/staff/notes' },
  { label: 'Settings', icon: Settings, path: '/staff/settings' }
]

export default function StaffSidebar({ isOpen, setIsOpen }) {
  const location = useLocation()

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 text-slate-200 transition-all duration-300 flex flex-col`}
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-white">COGNIVUS</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 ${!isOpen && 'rotate-180'}`} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>Shift: Day (7 AM - 3 PM)</p>
          <p className="mt-1">Zone: Med Ward 3</p>
        </div>
      )}
    </div>
=======
import { BarChart3, Bell, CheckSquare, Users, Package, AlertTriangle, MessageSquare, FileText, Cpu, LogOut } from 'lucide-react'
import { authService } from '../../services/api'

const Item = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    className={
      `flex items-center gap-3 px-4 py-2 rounded-lg text-sm ` +
      (active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/60')
    }
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </Link>
)

export default function StaffSidebar() {
  const { pathname } = useLocation()

  const handleLogout = () => {
    authService.logout()
  }

  return (
    <aside className="w-[260px] bg-slate-900 border-r border-slate-800 h-screen sticky top-0 p-4 flex flex-col gap-2">
      <Item
        icon={BarChart3}
        label="Dashboard"
        to="/staff/dashboard"
        active={pathname.includes('/staff/dashboard')}
      />
      <Item
        icon={CheckSquare}
        label="My Tasks"
        to="/staff/tasks"
        active={pathname.includes('/staff/tasks')}
      />
      <Item
        icon={Users}
        label="Patients"
        to="/staff/patients"
        active={pathname.includes('/staff/patients')}
      />
      <Item
        icon={Package}
        label="Inventory"
        to="/staff/inventory"
        active={pathname.includes('/staff/inventory')}
      />
      <Item
        icon={AlertTriangle}
        label="Incidents"
        to="/staff/incidents"
        active={pathname.includes('/staff/incidents')}
      />
      <Item
        icon={MessageSquare}
        label="Communication"
        to="/staff/communication"
        active={pathname.includes('/staff/communication')}
      />
      <Item
        icon={FileText}
        label="Notes & Reports"
        to="/staff/notes"
        active={pathname.includes('/staff/notes')}
      />
      <Item
        icon={Bell}
        label="Notifications"
        to="/staff/notifications"
        active={pathname.includes('/staff/notifications')}
      />
      <Item
        icon={Cpu}
        label="Device Management"
        to="/staff/devices"
        active={pathname.includes('/staff/devices')}
      />
      <div className="mt-auto" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </aside>
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
  )
}
