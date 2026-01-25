import { useState, useEffect } from 'react'
import { Brain, Activity, Wind, Thermometer, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import axios from 'axios'
import ECGMonitoring from '../ECG/ECGMonitoring'

const API_BASE_URL = 'http://localhost:8000/api'
const WS_BASE_URL = 'ws://localhost:8001/api'

const AIInsights = ({ patientId, patientData }) => {
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState(null)
  const [error, setError] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    fetchAIInsights()
    connectToECGWebSocket()
  }, [patientId])

  const connectToECGWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/ecg/${patientId}`)
      
      ws.onopen = () => {
        console.log('✓ AIInsights: ECG WebSocket connected')
        setWsConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'ecg_prediction') {
            console.log('📊 AIInsights: Received ECG prediction:', message)
            
            // Update ECG health based on prediction
            setAiInsights(prev => ({
              ...prev,
              ecgHealth: {
                status: message.trend === 'abnormal' ? 'abnormal' : 'normal',
                confidence: Math.round(message.confidence || 0),
                details: message.details || prev.ecgHealth.details,
                lastAnalyzed: message.timestamp || new Date().toISOString()
              }
            }))
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      ws.onerror = (error) => {
        console.error('✗ AIInsights: ECG WebSocket error:', error)
        setWsConnected(false)
      }
      
      ws.onclose = () => {
        console.log('✗ AIInsights: ECG WebSocket closed')
        setWsConnected(false)
        // Attempt reconnect after 3 seconds
        setTimeout(() => connectToECGWebSocket(), 3000)
      }
      
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
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
      
      // TODO: Replace with your actual AI insights endpoint
      const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/ai-insights`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setAiInsights(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
      
      // Mock data for development - remove this when backend is ready
      setAiInsights({
        ecgHealth: {
          status: 'normal', // 'normal' or 'abnormal'
          confidence: 92,
          details: 'Regular sinus rhythm detected. No significant abnormalities.',
          lastAnalyzed: new Date().toISOString()
        },
        spo2Health: {
          status: 'stable', // 'declining', 'stable', or 'improving'
          trend: 'stable',
          currentValue: 98,
          averageValue: 97.5,
          details: 'Oxygen saturation levels are within normal range and stable.',
          lastAnalyzed: new Date().toISOString()
        },
        temperatureStatus: {
          status: 'stable', // 'decrease', 'stable', or 'increase'
          trend: 'stable',
          currentValue: 37.2,
          averageValue: 37.1,
          details: 'Body temperature is within normal range with no significant changes.',
          lastAnalyzed: new Date().toISOString()
        }
      })
      
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing patient data...</p>
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
              : 'bg-slate-500/20 text-slate-400'
          }`}>
            {wsConnected ? '● Live' : '○ Offline'}
          </div>
        </div>
      </div>

      {/* Real-Time ECG Monitoring with ML Analysis */}
      <ECGMonitoring patientId={patientId} />

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* ECG Health Status */}
        <ECGHealthCard data={aiInsights.ecgHealth} />

        {/* SpO2 Health Status */}
        <SpO2HealthCard data={aiInsights.spo2Health} />

        {/* Temperature Status */}
        <TemperatureHealthCard data={aiInsights.temperatureStatus} />
      </div>

      {/* Detailed Analysis Section */}
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

      {/* Recommendations */}
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
    </div>
  )
}

// ECG Health Card Component
const ECGHealthCard = ({ data }) => {
  const isNormal = data.status === 'normal'
  
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