import { useState, useEffect } from 'react'
import { Cpu, Activity, Users, Search, Filter, RefreshCw, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { api } from '../services/api'

export default function DoctorDevices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAssignment, setFilterAssignment] = useState('all')

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const response = await api.get('/devices/register')
      setDevices(response.data || [])
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus
    const matchesAssignment = filterAssignment === 'all' || device.assignment_status === filterAssignment
    return matchesSearch && matchesStatus && matchesAssignment
  })

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'ONLINE').length,
    assigned: devices.filter(d => d.assignment_status === 'ASSIGNED' || d.assignment_status === 'IN_USE').length,
    available: devices.filter(d => d.assignment_status === 'AVAILABLE').length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONLINE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'OFFLINE': return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
      case 'MAINTENANCE': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      case 'ERROR': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getAssignmentColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'ASSIGNED': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'IN_USE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'MAINTENANCE': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      case 'DECOMMISSIONED': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ONLINE': return <Wifi className="w-4 h-4" />
      case 'OFFLINE': return <WifiOff className="w-4 h-4" />
      case 'MAINTENANCE': return <AlertCircle className="w-4 h-4" />
      case 'ERROR': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/doctor/login'
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Device Management</h1>
              <p className="text-sm text-slate-400">Monitor and manage medical wearable devices</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Devices</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                  </div>
                  <Cpu className="w-8 h-8 text-slate-600" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Online</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.online}</p>
                  </div>
                  <Activity className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Assigned</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{stats.assigned}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Available</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.available}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search devices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-600"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600"
                >
                  <option value="all">All Status</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ERROR">Error</option>
                </select>

                <select
                  value={filterAssignment}
                  onChange={(e) => setFilterAssignment(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600"
                >
                  <option value="all">All Assignment</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>

                <button
                  onClick={fetchDevices}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Devices List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Cpu className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm">No devices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Device</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Assignment</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Patient</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">IP Address</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Last Seen</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Firmware</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredDevices.map((device) => (
                        <tr key={device.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white font-medium text-sm">{device.device_name}</p>
                              <p className="text-slate-500 text-xs font-mono">{device.device_id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                              {getStatusIcon(device.status)}
                              {device.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getAssignmentColor(device.assignment_status)}`}>
                              {device.assignment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {device.assigned_patient_id ? (
                              <span className="text-white text-sm">{device.assigned_patient_name || 'Unknown Patient'}</span>
                            ) : (
                              <span className="text-slate-500 text-sm">Not Assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-400 text-sm font-mono">{device.ip_address || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                              <Clock className="w-3.5 h-3.5" />
                              {device.last_ping ? new Date(device.last_ping).toLocaleTimeString() : 'Never'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-400 text-sm">{device.firmware_version || 'N/A'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
