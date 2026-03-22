import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck, AlertTriangle, AlertCircle, Info, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL, WS_BASE_URL } from '../../config'

const WS_URL = WS_BASE_URL + '/ws/notifications'

const priorityConfig = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle, dot: 'bg-red-500' },
  HIGH: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, dot: 'bg-amber-500' },
  MEDIUM: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info, dot: 'bg-blue-500' },
  LOW: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Activity, dot: 'bg-slate-500' },
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [criticalCount, setCriticalCount] = useState(0)
  const panelRef = useRef(null)
  const wsRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUnreadCount()
    fetchNotifications()
    connectWebSocket()

    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL)
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'new_notifications') {
          setNotifications((prev) => [...data.notifications, ...prev].slice(0, 50))
          setUnreadCount((prev) => prev + data.count)
          setCriticalCount((prev) => prev + data.notifications.filter(n => n.priority === 'CRITICAL').length)
        }
      }
      ws.onclose = () => {
        setTimeout(connectWebSocket, 5000)
      }
      wsRef.current = ws
    } catch (e) {
      console.error('WS notification connect failed:', e)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUnreadCount(res.data.unread_count)
      setCriticalCount(res.data.critical_count)
    } catch (e) { /* silent */ }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 },
      })
      setNotifications(res.data.notifications)
    } catch (e) { /* silent */ }
  }

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (e) { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('access_token')
      await axios.put(`${API_BASE_URL}/notifications/read-all`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      setCriticalCount(0)
    } catch (e) { /* silent */ }
  }

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) markRead(notif.id)
    if (notif.patient_id) {
      setOpen(false)
      const path = window.location.pathname.startsWith('/staff')
        ? `/staff/patients/${notif.patient_id}`
        : `/doctor/patients/${notif.patient_id}`
      navigate(path)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Bell className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 ${
            criticalCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-[#6E80E7] text-white'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-[400px] max-h-[520px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#6E80E7] hover:text-[#8B9BF0] flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = priorityConfig[notif.priority] || priorityConfig.LOW
                const Icon = cfg.icon
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                      !notif.is_read ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {!notif.is_read && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {notif.priority}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-auto flex-shrink-0">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                        <p className="text-xs text-slate-400 truncate">{notif.message}</p>
                        {notif.patient_name && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {notif.patient_name} {notif.patient_room ? `• ${notif.patient_room}` : ''}
                          </p>
                        )}
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(notif.id) }}
                          className="p-1 hover:bg-slate-700 rounded self-start flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-700">
              <button
                onClick={() => {
                  setOpen(false)
                  const path = window.location.pathname.startsWith('/staff')
                    ? '/staff/notifications'
                    : '/doctor/notifications'
                  navigate(path)
                }}
                className="text-xs text-[#6E80E7] hover:text-[#8B9BF0] font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
