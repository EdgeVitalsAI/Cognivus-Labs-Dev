import { useState, useEffect } from 'react'
import { Bell, AlertCircle, AlertTriangle, Info, Activity, Check, CheckCheck, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL, WS_BASE_URL } from '../../config'

const priorityConfig = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle },
  HIGH: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle },
  MEDIUM: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info },
  LOW: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Activity },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ priority: '', is_read: '' })
  const navigate = useNavigate()

  useEffect(() => { fetchNotifications() }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const params = { limit: 100 }
      if (filter.priority) params.priority = filter.priority
      if (filter.is_read !== '') params.is_read = filter.is_read === 'true'

      const res = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setNotifications(res.data.notifications)
      setTotal(res.data.total)
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id) => {
    const token = localStorage.getItem('access_token')
    await axios.put(`${API_BASE_URL}/notifications/${id}/read`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const token = localStorage.getItem('access_token')
    await axios.put(`${API_BASE_URL}/notifications/read-all`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })))
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-[#6E80E7]" />
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-slate-400">{total} total notifications</p>
          </div>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
        >
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={filter.is_read}
          onChange={(e) => setFilter({ ...filter, is_read: e.target.value })}
          className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6E80E7]"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const cfg = priorityConfig[notif.priority] || priorityConfig.LOW
            const Icon = cfg.icon
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer hover:bg-slate-800/50 ${
                  !notif.is_read ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-900 border-slate-800'
                }`}
                onClick={() => {
                  if (notif.patient_id) {
                    const base = window.location.pathname.startsWith('/staff') ? '/staff' : '/doctor'
                    navigate(`${base}/patients/${notif.patient_id}`)
                  }
                }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#6E80E7]" />}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      {notif.priority}
                    </span>
                    <span className="text-xs text-slate-500">{notif.type?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{notif.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    {notif.patient_name && <span>{notif.patient_name}</span>}
                    {notif.patient_room && <span>{notif.patient_room}</span>}
                    <span>{formatTime(notif.created_at)}</span>
                  </div>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead(notif.id) }}
                    className="p-2 hover:bg-slate-700 rounded-lg flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
