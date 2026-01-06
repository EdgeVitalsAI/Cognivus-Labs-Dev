import { MessageSquare, Clock } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffCommunication() {
  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-6">
              <MessageSquare className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Coming Soon</h1>
            <p className="text-slate-400 text-lg mb-6">
              Staff Communication feature is currently under development
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Expected release: Q1 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
