import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import NotificationsPage from '../../components/notifications/NotificationsPage'

export default function StaffNotifications() {
  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-auto">
          <NotificationsPage />
        </div>
      </div>
    </div>
  )
}
