import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Search, Filter, Wifi, WifiOff, Battery, BatteryCharging,
  Activity, Heart, Thermometer, Wind, Terminal, Send, RefreshCw,
  AlertTriangle, CheckCircle, Settings, Power, PlayCircle, X
} from 'lucide-react'
import axios from 'axios'

export default function AdminDevices() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceDetails, setDeviceDetails] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugCommand, setDebugCommand] = useState('')
  const [debugOutput, setDebugOutput] = useState([])

  useEffect(() => {
    loadDevices()
    const interval = setInterval(loadDevices, 5000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const loadDevices = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const url = statusFilter === 'all'
        ? 'http://localhost:8000/api/sys/devices/devices'
        : `http://localhost:8000/api/sys/devices/devices?status=${statusFilter}`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDevices(response.data)
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const loadDeviceDetails = async (deviceId) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(
        `http://localhost:8000/api/sys/devices/devices/${deviceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDeviceDetails(response.data)
      setShowDebugPanel(true)
    } catch (error) {
      console.error('Failed to load device details:', error)
    }
  }

  const sendDebugCommand = async () => {
    if (!selectedDevice || !debugCommand.trim()) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.post(
        `http://localhost:8000/api/sys/devices/devices/${selectedDevice.device_id}/debug`,
        {
          device_id: selectedDevice.device_id,
          command: debugCommand,
          parameters: {}
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setDebugOutput(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          type: 'command',
          content: debugCommand
        },
        {
          timestamp: new Date().toISOString(),
          type: 'response',
          content: response.data.message
        }
      ])
      setDebugCommand('')
    } catch (error) {
      setDebugOutput(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          type: 'error',
          content: error.response?.data?.detail || 'Command failed'
        }
      ])
    }
  }

  const restartDevice = async (deviceId) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        `http://localhost:8000/api/sys/devices/devices/${deviceId}/restart`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      loadDevices()
    } catch (error) {
      console.error('Failed to restart device:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      online: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      offline: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
      error: 'text-red-400 bg-red-500/10 border-red-500/30',
      maintenance: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    }
    return colors[status] || colors.offline
  }

  const filteredDevices = devices.filter(device =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Package className="w-6 h-6 text-cyan-400" />
          Device Management
        </h1>
        <p className="text-sm text-slate-400">Monitor and debug smart patient tracking devices</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search devices by name, ID, or patient..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="lg:col-span-3 flex gap-2">
          <button
            onClick={loadDevices}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Devices List */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold text-white">
                Devices ({filteredDevices.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-800 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => {
                    setSelectedDevice(device)
                    loadDeviceDetails(device.device_id)
                  }}
                  className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-white mb-1">{device.device_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{device.device_id}</p>
                        {device.patient_name && (
                          <p className="text-xs text-slate-400 mt-1">
                            Patient: {device.patient_name} • Room {device.assigned_room}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                      {device.battery_level && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                          {device.battery_level > 20 ? (
                            <Battery className="w-3 h-3" />
                          ) : (
                            <BatteryCharging className="w-3 h-3 text-red-400" />
                          )}
                          <span>{device.battery_level}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vitals */}
                  {device.status === 'online' && (
                    <div className="grid grid-cols-4 gap-2">
                      {device.heart_rate && (
                        <div className="bg-slate-800/50 rounded px-2 py-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-slate-500">HR</span>
                          </div>
                          <p className="text-xs font-medium text-white">{device.heart_rate}</p>
                        </div>
                      )}
                      {device.spo2 && (
                        <div className="bg-slate-800/50 rounded px-2 py-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Wind className="w-3 h-3 text-cyan-400" />
                            <span className="text-xs text-slate-500">SpO2</span>
                          </div>
                          <p className="text-xs font-medium text-white">{device.spo2}%</p>
                        </div>
                      )}
                      {device.temperature && (
                        <div className="bg-slate-800/50 rounded px-2 py-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Thermometer className="w-3 h-3 text-orange-400" />
                            <span className="text-xs text-slate-500">Temp</span>
                          </div>
                          <p className="text-xs font-medium text-white">{device.temperature}°F</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredDevices.length === 0 && (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No devices found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <div className="lg:col-span-5">
          {showDebugPanel && deviceDetails ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Debug Console
                </h2>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Device Info */}
              <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <h3 className="text-sm font-semibold text-white mb-2">{deviceDetails.device.device_name}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">ID:</span>{' '}
                    <span className="text-slate-300 font-mono">{deviceDetails.device.device_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Firmware:</span>{' '}
                    <span className="text-slate-300">{deviceDetails.device.firmware_version || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">IP:</span>{' '}
                    <span className="text-slate-300 font-mono">{deviceDetails.device.ip_address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">MAC:</span>{' '}
                    <span className="text-slate-300 font-mono">{deviceDetails.device.mac_address || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => restartDevice(deviceDetails.device.device_id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded border border-red-500/30 transition-colors"
                  >
                    <Power className="w-3 h-3" />
                    Restart
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition-colors">
                    <Settings className="w-3 h-3" />
                    Config
                  </button>
                </div>
              </div>

              {/* Terminal Output */}
              <div className="p-4 bg-black/50 font-mono text-xs h-64 overflow-y-auto">
                {debugOutput.map((output, idx) => (
                  <div key={idx} className="mb-2">
                    <span className="text-slate-600">[{new Date(output.timestamp).toLocaleTimeString()}]</span>
                    {' '}
                    {output.type === 'command' && (
                      <span className="text-cyan-400">$ {output.content}</span>
                    )}
                    {output.type === 'response' && (
                      <span className="text-emerald-400">{output.content}</span>
                    )}
                    {output.type === 'error' && (
                      <span className="text-red-400">Error: {output.content}</span>
                    )}
                  </div>
                ))}
                {debugOutput.length === 0 && (
                  <p className="text-slate-600">Waiting for commands...</p>
                )}
              </div>

              {/* Command Input */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={debugCommand}
                    onChange={(e) => setDebugCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendDebugCommand()}
                    placeholder="Enter debug command..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={sendDebugCommand}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Try: status, reboot, reset, get_logs, update_firmware
                </p>
              </div>

              {/* Recent Logs */}
              <div className="p-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Logs</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {deviceDetails.recent_logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="text-xs font-mono">
                      <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {' '}
                      <span className={
                        log.log_type === 'error' ? 'text-red-400' :
                        log.log_type === 'warning' ? 'text-amber-400' :
                        log.log_type === 'debug' ? 'text-cyan-400' : 'text-slate-400'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">Select a device to debug</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
