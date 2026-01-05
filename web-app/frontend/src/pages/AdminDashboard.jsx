import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Server, Database, Cpu, HardDrive, Zap, Wifi, WifiOff,
  Users, Shield, Terminal, TrendingUp, AlertTriangle, CheckCircle,
  Circle, RefreshCw, LogOut, Bell, Settings, BarChart3, Package
} from 'lucide-react'
import axios from 'axios'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState(null)
  const [systemHealth, setSystemHealth] = useState([])
  const [devices, setDevices] = useState([])
  const [logs, setLogs] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/sys/auth')
      return
    }

    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      const [analyticsRes, healthRes, devicesRes, logsRes, metricsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/sys/system/analytics', config),
        axios.get('http://localhost:8000/api/sys/system/health', config),
        axios.get('http://localhost:8000/api/sys/devices/devices?limit=10', config),
        axios.get('http://localhost:8000/api/sys/system/logs?limit=20', config),
        axios.get('http://localhost:8000/api/sys/system/metrics', config)
      ])

      setAnalytics(analyticsRes.data)
      setSystemHealth(healthRes.data)
      setDevices(devicesRes.data)
      setLogs(logsRes.data)
      setMetrics(metricsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      if (error.response?.status === 401) {
        navigate('/sys/auth')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    navigate('/sys/auth')
  }

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      degraded: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      down: 'text-red-400 bg-red-500/10 border-red-500/30',
      online: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      offline: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
      error: 'text-red-400 bg-red-500/10 border-red-500/30',
      maintenance: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    }
    return colors[status] || colors.offline
  }

  const getLogLevelColor = (level) => {
    const colors = {
      info: 'text-blue-400',
      warning: 'text-amber-400',
      error: 'text-red-400',
      critical: 'text-purple-400',
      debug: 'text-cyan-400'
    }
    return colors[level] || 'text-slate-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading system data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Admin Control Panel
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">SYS::MONITOR::v1.0</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/sys/dashboard')}
                className="px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/sys/devices')}
                className="px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors text-sm"
              >
                Devices
              </button>
              <button
                onClick={() => navigate('/sys/users')}
                className="px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors text-sm"
              >
                Users
              </button>
              <button
                onClick={() => navigate('/sys/settings')}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Package className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-1">Total Devices</p>
            <p className="text-3xl font-bold text-white">{analytics?.total_devices || 0}</p>
            <p className="text-xs text-cyan-400 mt-2">{analytics?.online_devices || 0} online</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-1">Active Patients</p>
            <p className="text-3xl font-bold text-white">{analytics?.total_patients || 0}</p>
            <p className="text-xs text-emerald-400 mt-2">Monitored 24/7</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex items-center gap-1.5 text-red-400 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>+3</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-1">Alerts Today</p>
            <p className="text-3xl font-bold text-white">{analytics?.alerts_today || 0}</p>
            <p className="text-xs text-amber-400 mt-2">2 critical</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>100%</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-1">System Health</p>
            <p className="text-3xl font-bold text-white">99.9%</p>
            <p className="text-xs text-purple-400 mt-2">All systems operational</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* System Health */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                System Health
              </h2>
              <button
                onClick={loadData}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {systemHealth.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                        service.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <h3 className="font-semibold text-white">{service.service_name}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.response_time && (
                        <span className="text-xs text-slate-500">{service.response_time}ms</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                  {service.details && (
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      {Object.entries(service.details).map(([key, value]) => (
                        <span key={key}>{key}: {value}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* System Metrics */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5 text-cyan-400" />
              System Metrics
            </h2>

            <div className="space-y-4">
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">CPU Usage</span>
                  <span className="text-sm font-mono text-white">{metrics?.cpu.usage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${metrics?.cpu.usage}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Memory</span>
                  <span className="text-sm font-mono text-white">{metrics?.memory.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${metrics?.memory.percent}%` }}
                  />
                </div>
              </div>

              {/* Disk */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Disk Usage</span>
                  <span className="text-sm font-mono text-white">{metrics?.disk.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${metrics?.disk.percent}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Cores:</span>
                  <span className="text-slate-300">{metrics?.cpu.cores}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Memory:</span>
                  <span className="text-slate-300">{(metrics?.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Disk Free:</span>
                  <span className="text-slate-300">{(metrics?.disk.free / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Devices */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-cyan-400" />
              Recent Devices
            </h2>

            <div className="space-y-2">
              {devices.length > 0 ? devices.map((device) => (
                <div
                  key={device.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:bg-slate-800/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-white">{device.device_name}</p>
                        <p className="text-xs text-slate-500">{device.device_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                      {device.battery_level && (
                        <p className="text-xs text-slate-500 mt-1">{device.battery_level}% battery</p>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-8">No devices found</p>
              )}
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5 text-cyan-400" />
              System Logs
            </h2>

            <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="font-mono text-xs py-1.5 px-2 hover:bg-slate-800/50 rounded transition-colors"
                >
                  <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {' '}
                  <span className={`font-semibold ${getLogLevelColor(log.level)}`}>{log.level.toUpperCase()}</span>
                  {' '}
                  <span className="text-slate-500">{log.service}</span>
                  {' → '}
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
