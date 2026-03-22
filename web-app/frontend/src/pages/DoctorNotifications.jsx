import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import NotificationsPage from '../components/notifications/NotificationsPage'
import { authService } from '../services/api'

export default function DoctorNotifications() {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  const handleLogout = () => {
    authService.logout()
    navigate('/doctor/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />
      <div className="flex">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1">
          <NotificationsPage />
        </main>
      </div>
    </div>
  )
}
