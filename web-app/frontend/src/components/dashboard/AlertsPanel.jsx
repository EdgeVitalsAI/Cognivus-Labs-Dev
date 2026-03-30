import { useState, useEffect } from 'react'
import { Bell, AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const PRIORITY = {
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    leftBar: 'bg-red-500',
    rowBg: 'hover:bg-red-500/5',
    icon: AlertCircle,
  },
  HIGH: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    leftBar: 'bg-amber-500',
    rowBg: 'hover:bg-amber-500/5',
    icon: AlertTriangle,
  },
  MEDIUM: {
    color: 'text-[#6E80E7]',
    bg: 'bg-[#6E80E7]/10',
    border: 'border-[#6E80E7]/30',
    leftBar: 'bg-[#6E80E7]',
    rowBg: 'hover:bg-[#6E80E7]/5',
    icon: Info,
  },
  LOW: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-600/30',
    leftBar: 'bg-slate-600',
    rowBg: 'hover:bg-slate-800/40',
    icon: Info,
  },
}

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
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

  const criticalCount = notifications.filter(n => n.priority === 'CRITICAL').length

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 rounded-lg bg-[#6E80E7]/10">
            <Bell className="w-4 h-4 text-[#6E80E7]" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                {criticalCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
            <p className="text-[11px] text-slate-500">{notifications.length} notifications</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`${basePath}/notifications`)}
          className="flex items-center gap-0.5 text-xs text-[#6E80E7] hover:text-[#8B9BF0] transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-700 border-t-[#6E80E7]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Bell className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No recent alerts</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/70 overflow-y-auto">
          {notifications.map((n) => {
            const cfg = PRIORITY[n.priority] || PRIORITY.LOW
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                onClick={() => n.patient_id && navigate(`${basePath}/patients/${n.patient_id}`)}
                className={`relative flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${cfg.rowBg} border-l-2 ${
                  n.priority === 'CRITICAL' ? 'border-l-red-500' :
                  n.priority === 'HIGH'     ? 'border-l-amber-500' :
                  n.priority === 'MEDIUM'   ? 'border-l-[#6E80E7]' :
                                              'border-l-slate-700'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {n.priority}
                    </span>
                    <span className="text-[10px] text-slate-600">{timeAgo(n.created_at)}</span>
                    {!n.is_read && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6E80E7] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-white leading-snug line-clamp-1">{n.title}</p>
                  {n.patient_name && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {n.patient_name}{n.patient_room ? ` · ${n.patient_room}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
