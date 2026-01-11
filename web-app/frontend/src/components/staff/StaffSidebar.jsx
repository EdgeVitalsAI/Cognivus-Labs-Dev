import { Link, useLocation } from 'react-router-dom'
import { BarChart3, CheckSquare, Users, Package, AlertTriangle, MessageSquare, FileText, Cpu, LogOut } from 'lucide-react'
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
  )
}
