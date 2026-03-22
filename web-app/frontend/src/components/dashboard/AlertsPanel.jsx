import { useState, useEffect } from 'react'
import { Bell, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const priorityConfig = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle, dot: 'bg-red-500' },
  HIGH: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, dot: 'bg-amber-500' },
  MEDIUM: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info, dot: 'bg-blue-500' },
  LOW: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Info, dot: 'bg-slate-500' },
}

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function AlertsPanel({ basePath = '/doctor' }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 },
      })
      setNotifications(res.data.notifications || [])
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#6E80E7]" />
          <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
        </div>
        <button
          onClick={() => navigate(`${basePath}/notifications`)}
          className="text-xs text-[#6E80E7] hover:text-[#8B9BF0]"
        >
          View all
        </button>
      </div>

      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6E80E7]"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No recent alerts</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {notifications.map((n) => {
            const cfg = priorityConfig[n.priority] || priorityConfig.LOW
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                onClick={() => n.patient_id && navigate(`${basePath}/patients/${n.patient_id}`)}
                className="px-5 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {n.priority}
                      </span>
                      <span className="text-xs text-slate-500">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-white truncate mt-0.5">{n.title}</p>
                    {n.patient_name && (
                      <p className="text-xs text-slate-500">{n.patient_name} {n.patient_room ? `• ${n.patient_room}` : ''}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
