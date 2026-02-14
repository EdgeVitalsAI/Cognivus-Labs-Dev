import { useState, useEffect, useRef } from 'react'
import { Brain, Activity, Wind, Thermometer, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader, WifiOff, Unplug } from 'lucide-react'
import axios from 'axios'
import ECGMonitoring from '../ECG/ECGMonitoring'

const API_BASE_URL = 'http://localhost:8000/api'
const WS_BASE_URL = 'ws://localhost:8001/api'

const AIInsights = ({ patientId, patientData }) => {
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState(null)
  const [error, setError] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState(null) // null = loading, 'online', 'no_device', 'offline'
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  useEffect(() => {
    checkDeviceStatus()

    return () => {
      // Cleanup WebSocket and timers on unmount
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [patientId])

  const checkDeviceStatus = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      // Check if patient has an assigned, online device via live-vitals endpoint
      const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/live-vitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data.success) {
        // Device is online and assigned
        setDeviceStatus('online')
        fetchAIInsights()
        connectToECGWebSocket()
      } else {
        // No device assigned or device is offline
        setDeviceStatus('no_device')
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to check device status:', err)

      // Also try fetching devices list as fallback
      try {
        const token = localStorage.getItem('access_token')
        const devicesRes = await axios.get(`${API_BASE_URL}/devices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const assignedDevice = devicesRes.data.find(
          d => String(d.assigned_patient_id) === String(patientId)
        )
        if (assignedDevice) {
          if (assignedDevice.status === 'online') {
            setDeviceStatus('online')
            fetchAIInsights()
            connectToECGWebSocket()
          } else {
            setDeviceStatus('offline')
            setLoading(false)
          }
        } else {
          setDeviceStatus('no_device')
          setLoading(false)
        }
      } catch {
        setDeviceStatus('no_device')
        setLoading(false)
      }
    }
  }

  const connectToECGWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/ecg/${patientId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('AIInsights: ECG WebSocket connected')
        setWsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'ecg_prediction') {
            setAiInsights(prev => ({
              ...prev,
              ecgHealth: {
                status: message.trend === 'abnormal' || message.trend === 'unstable' ? 'abnormal' : 'normal',
                confidence: Math.round(message.confidence || 0),
                details: message.details || (prev?.ecgHealth?.details ?? 'Awaiting analysis...'),
                lastAnalyzed: message.timestamp || new Date().toISOString()
              }
            }))
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = () => {
        setWsConnected(false)
      }

      ws.onclose = () => {
        setWsConnected(false)
        // Only reconnect if device was online and component is still mounted
        if (deviceStatus === 'online') {
          reconnectTimerRef.current = setTimeout(() => connectToECGWebSocket(), 3000)
        }
      }
    } catch (err) {
      console.error('Failed to connect ECG WebSocket:', err)
      setWsConnected(false)
    }
  }

  const fetchAIInsights = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/ai-insights`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setAiInsights(response.data)
      setError(null)
    } catch (err) {
      // No mock data - show real state: waiting for live data from device
      setAiInsights({
        ecgHealth: {
          status: 'waiting',
          confidence: 0,
          details: 'Waiting for ECG data from device. Analysis will begin once data is received.',
          lastAnalyzed: new Date().toISOString()
        },
        spo2Health: {
          status: 'waiting',
          trend: 'waiting',
          currentValue: 0,
          averageValue: 0,
          details: 'Waiting for SpO2 data from device.',
          lastAnalyzed: new Date().toISOString()
        },
        temperatureStatus: {
          status: 'waiting',
          trend: 'waiting',
          currentValue: 0,
          averageValue: 0,
          details: 'Waiting for temperature data from device.',
          lastAnalyzed: new Date().toISOString()
        }
      })
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  // --- No device / offline states ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking device status...</p>
        </div>
      </div>
    )
  }

  if (deviceStatus === 'no_device') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900/40 to-slate-800/40 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">AI Health Insights</h2>
              <p className="text-slate-400 text-sm">AI-powered analysis of patient vital signs and health trends</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-600/20 text-slate-400">
              No Device
            </div>
          </div>
        </div>

        {/* No device message */}
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto mb-6">
              <Unplug className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">No Device Assigned</h3>
            <p className="text-slate-400 mb-6">
              This patient does not have an ECG monitoring device assigned.
              Assign a wearable device to this patient to enable real-time AI health insights and ECG analysis.
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-500">
                Go to <span className="text-blue-400 font-semibold">Device Management</span> to assign a device to this patient.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (deviceStatus === 'offline') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900/40 to-slate-800/40 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">AI Health Insights</h2>
              <p className="text-slate-400 text-sm">AI-powered analysis of patient vital signs and health trends</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
              Device Offline
            </div>
          </div>
        </div>

        {/* Device offline message */}
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-900/30 border-2 border-red-800/50 flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Device Offline</h3>
            <p className="text-slate-400 mb-6">
              The monitoring device assigned to this patient is currently offline.
              AI insights will resume automatically once the device reconnects.
            </p>
            <button
              onClick={checkDeviceStatus}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-semibold"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchAIInsights}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // --- Online state with real data ---

  const isWaiting = aiInsights?.ecgHealth?.status === 'waiting'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">AI Health Insights</h2>
            <p className="text-slate-400 text-sm">AI-powered analysis of patient vital signs and health trends</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            wsConnected
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {wsConnected ? '● Live' : '○ Connecting...'}
          </div>
        </div>
      </div>

      {/* Real-Time ECG Monitoring with ML Analysis */}
      <ECGMonitoring patientId={patientId} />

      {/* Insights Grid */}
      {aiInsights && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ECGHealthCard data={aiInsights.ecgHealth} />
            <SpO2HealthCard data={aiInsights.spo2Health} />
            <TemperatureHealthCard data={aiInsights.temperatureStatus} />
          </div>

          {/* Detailed Analysis Section */}
          {!isWaiting && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Detailed Analysis
              </h3>
              <div className="space-y-4">
                <AnalysisDetail
                  title="ECG Analysis"
                  status={aiInsights.ecgHealth.status}
                  details={aiInsights.ecgHealth.details}
                  lastAnalyzed={aiInsights.ecgHealth.lastAnalyzed}
                />
                <AnalysisDetail
                  title="Oxygen Saturation Trend"
                  status={aiInsights.spo2Health.status}
                  details={aiInsights.spo2Health.details}
                  lastAnalyzed={aiInsights.spo2Health.lastAnalyzed}
                />
                <AnalysisDetail
                  title="Temperature Monitoring"
                  status={aiInsights.temperatureStatus.status}
                  details={aiInsights.temperatureStatus.details}
                  lastAnalyzed={aiInsights.temperatureStatus.lastAnalyzed}
                />
              </div>
            </div>
          )}

          {/* Recommendations */}
          {!isWaiting && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {aiInsights.ecgHealth.status === 'abnormal' && (
                  <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">ECG Abnormality Detected</p>
                      <p className="text-slate-300 text-sm">Recommend immediate cardiology consultation and continuous monitoring.</p>
                    </div>
                  </div>
                )}
                {aiInsights.spo2Health.status === 'declining' && (
                  <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">Declining SpO2 Levels</p>
                      <p className="text-slate-300 text-sm">Consider oxygen therapy and monitor respiratory function closely.</p>
                    </div>
                  </div>
                )}
                {aiInsights.ecgHealth.status === 'normal' &&
                 aiInsights.spo2Health.status === 'stable' &&
                 aiInsights.temperatureStatus.status === 'stable' && (
                  <div className="flex items-start gap-3 p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">All Vitals Normal</p>
                      <p className="text-slate-300 text-sm">Patient vitals are stable. Continue current treatment plan and routine monitoring.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ECG Health Card Component
const ECGHealthCard = ({ data }) => {
  const isWaiting = data.status === 'waiting'
  const isNormal = data.status === 'normal'

  if (isWaiting) {
    return (
      <div className="rounded-lg p-6 border-2 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">ECG Health</h3>
            <p className="text-xs text-slate-400">Cardiac Rhythm</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm bg-slate-500/20 text-slate-400">
            <Loader className="w-4 h-4 animate-spin" />
            Awaiting Data
          </div>
        </div>
        <p className="text-slate-400 text-sm">{data.details}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-6 border-2 ${
      isNormal
        ? 'bg-emerald-900/20 border-emerald-700/50'
        : 'bg-red-900/20 border-red-700/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isNormal ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            <Activity className={`w-5 h-5 ${isNormal ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">ECG Health</h3>
            <p className="text-xs text-slate-400">Cardiac Rhythm</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${
          isNormal
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {isNormal ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {isNormal ? 'Normal' : 'Abnormal'}
        </div>
      </div>

      <p className="text-slate-300 text-sm mb-3">{data.details}</p>

      <div className="pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Confidence</span>
          <span className="font-semibold text-white">{data.confidence}%</span>
        </div>
      </div>
    </div>
  )
}

// SpO2 Health Card Component
const SpO2HealthCard = ({ data }) => {
  const isWaiting = data.status === 'waiting' || data.trend === 'waiting'

  if (isWaiting) {
    return (
      <div className="rounded-lg p-6 border-2 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
            <Wind className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">SpO2 Health</h3>
            <p className="text-xs text-slate-400">Oxygen Saturation</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm bg-slate-500/20 text-slate-400">
            <Loader className="w-4 h-4 animate-spin" />
            Awaiting Data
          </div>
        </div>
        <p className="text-slate-400 text-sm">{data.details}</p>
      </div>
    )
  }

  const getTrendIcon = () => {
    if (data.trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-400" />
    if (data.trend === 'stable') return <Minus className="w-5 h-5 text-blue-400" />
    return <TrendingUp className="w-5 h-5 text-emerald-400" />
  }

  const getTrendColor = () => {
    if (data.trend === 'declining') return 'bg-red-900/20 border-red-700/50'
    if (data.trend === 'stable') return 'bg-blue-900/20 border-blue-700/50'
    return 'bg-emerald-900/20 border-emerald-700/50'
  }

  const getStatusColor = () => {
    if (data.trend === 'declining') return 'bg-red-500/20 text-red-400'
    if (data.trend === 'stable') return 'bg-blue-500/20 text-blue-400'
    return 'bg-emerald-500/20 text-emerald-400'
  }

  return (
    <div className={`rounded-lg p-6 border-2 ${getTrendColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            data.trend === 'declining' ? 'bg-red-500/20' :
            data.trend === 'stable' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
          }`}>
            <Wind className={`w-5 h-5 ${
              data.trend === 'declining' ? 'text-red-400' :
              data.trend === 'stable' ? 'text-blue-400' : 'text-emerald-400'
            }`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">SpO2 Health</h3>
            <p className="text-xs text-slate-400">Oxygen Saturation</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${getStatusColor()}`}>
          {getTrendIcon()}
          {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
        </div>
      </div>

      <p className="text-slate-300 text-sm mb-3">{data.details}</p>

      <div className="pt-3 border-t border-slate-700 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Current</span>
          <span className="font-semibold text-white">{data.currentValue}%</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Average</span>
          <span className="font-semibold text-white">{data.averageValue}%</span>
        </div>
      </div>
    </div>
  )
}

// Temperature Health Card Component
const TemperatureHealthCard = ({ data }) => {
  const isWaiting = data.status === 'waiting' || data.trend === 'waiting'

  if (isWaiting) {
    return (
      <div className="rounded-lg p-6 border-2 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Temperature</h3>
            <p className="text-xs text-slate-400">Body Temperature</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm bg-slate-500/20 text-slate-400">
            <Loader className="w-4 h-4 animate-spin" />
            Awaiting Data
          </div>
        </div>
        <p className="text-slate-400 text-sm">{data.details}</p>
      </div>
    )
  }

  const getTrendIcon = () => {
    if (data.trend === 'decrease') return <TrendingDown className="w-5 h-5 text-blue-400" />
    if (data.trend === 'stable') return <Minus className="w-5 h-5 text-emerald-400" />
    return <TrendingUp className="w-5 h-5 text-red-400" />
  }

  const getTrendColor = () => {
    if (data.trend === 'decrease') return 'bg-blue-900/20 border-blue-700/50'
    if (data.trend === 'stable') return 'bg-emerald-900/20 border-emerald-700/50'
    return 'bg-red-900/20 border-red-700/50'
  }

  const getStatusColor = () => {
    if (data.trend === 'decrease') return 'bg-blue-500/20 text-blue-400'
    if (data.trend === 'stable') return 'bg-emerald-500/20 text-emerald-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <div className={`rounded-lg p-6 border-2 ${getTrendColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            data.trend === 'decrease' ? 'bg-blue-500/20' :
            data.trend === 'stable' ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            <Thermometer className={`w-5 h-5 ${
              data.trend === 'decrease' ? 'text-blue-400' :
              data.trend === 'stable' ? 'text-emerald-400' : 'text-red-400'
            }`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">Temperature</h3>
            <p className="text-xs text-slate-400">Body Temperature</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${getStatusColor()}`}>
          {getTrendIcon()}
          {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
        </div>
      </div>

      <p className="text-slate-300 text-sm mb-3">{data.details}</p>

      <div className="pt-3 border-t border-slate-700 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Current</span>
          <span className="font-semibold text-white">{data.currentValue}°C</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Average</span>
          <span className="font-semibold text-white">{data.averageValue}°C</span>
        </div>
      </div>
    </div>
  )
}

// Analysis Detail Component
const AnalysisDetail = ({ title, status, details, lastAnalyzed }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-semibold">{title}</h4>
        <span className="text-xs text-slate-400">
          {new Date(lastAnalyzed).toLocaleString()}
        </span>
      </div>
      <p className="text-slate-300 text-sm">{details}</p>
    </div>
  )
}

export default AIInsights
