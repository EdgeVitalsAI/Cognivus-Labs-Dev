import { useState, useEffect, useRef } from 'react'
import { Activity, Heart, AlertTriangle, CheckCircle, TrendingUp, Clock, Wifi, WifiOff } from 'lucide-react'

const WS_BASE_URL = 'ws://localhost:8001/api'  // Updated to port 8001 for admin backend

/**
 * ECG Monitoring Component with ML Trend Analysis
 * 
 * Features:
 * - Real-time ECG waveform display (updates every 2 seconds)
 * - ML-powered trend predictions (normal/abnormal/unstable)
 * - Confidence scores for predictions
 * - Heart rate estimation
 * - Connection status monitoring
 */
const ECGMonitoring = ({ patientId }) => {
  // WebSocket state
  const [connected, setConnected] = useState(false)
  const [wsError, setWsError] = useState(null)
  const wsRef = useRef(null)
  
  // ECG data state
  // ML prediction state
  const [prediction, setPrediction] = useState(null)
  const [predictionHistory, setPredictionHistory] = useState([])
  
  // WebSocket connection
  useEffect(() => {
    if (!patientId) return
    
    connectWebSocket()
    
    return () => {
      disconnectWebSocket()
    }
  }, [patientId])
  
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/ecg/${patientId}`)
      
      ws.onopen = () => {
        console.log('✓ ECG WebSocket connected')
        setConnected(true)
        setWsError(null)
      }
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        handleWebSocketMessage(message)
      }
      
      ws.onerror = (error) => {
        console.error('✗ ECG WebSocket error:', error)
        setWsError('Connection error')
        setConnected(false)
      }
      
      ws.onclose = () => {
        console.log('✓ ECG WebSocket disconnected')
        setConnected(false)
        
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (wsRef.current === ws) {
            connectWebSocket()
          }
        }, 3000)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('✗ Failed to connect WebSocket:', error)
      setWsError('Failed to connect')
    }
  }
  
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }
  
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'connection_established':
        console.log('✓ ECG monitoring started:', message)
        break
      
      case 'ecg_waveform':
        // Waveform hidden in UI; still handled to keep buffer alive
        break
      
      case 'ecg_prediction':
        // Update ML prediction
        const newPrediction = {
          trend: message.trend,
          confidence: message.confidence,
          details: message.details,
          heartRate: message.heart_rate,
          timestamp: new Date(message.timestamp)
        }
        setPrediction(newPrediction)
        
        // Add to history (keep last 30 predictions = 1 minute)
        setPredictionHistory(prev => {
          const updated = [...prev, newPrediction]
          return updated.slice(-30)
        })
        break
      
      case 'ecg_status':
        // Handle status messages (e.g., leads disconnected)
        if (message.status === 'no_signal') {
          setWsError(message.message)
        }
        break
      
      case 'heartbeat':
        // Keep-alive message
        break
      
      default:
        console.log('Unknown message type:', message.type)
    }
  }
  
  // Get prediction status styling
  const getPredictionStyle = () => {
    if (!prediction) return { color: 'text-slate-400', bg: 'bg-slate-800/50', icon: Activity }
    
    switch (prediction.trend) {
      case 'normal':
        return { 
          color: 'text-green-400', 
          bg: 'bg-green-900/20 border-green-800/30', 
          icon: CheckCircle,
          label: 'Normal Rhythm'
        }
      case 'abnormal':
        return { 
          color: 'text-yellow-400', 
          bg: 'bg-yellow-900/20 border-yellow-800/30', 
          icon: AlertTriangle,
          label: 'Abnormal Rhythm'
        }
      case 'unstable':
        return { 
          color: 'text-red-400', 
          bg: 'bg-red-900/20 border-red-800/30', 
          icon: AlertTriangle,
          label: 'Critical Alert'
        }
      default:
        return { 
          color: 'text-slate-400', 
          bg: 'bg-slate-800/50', 
          icon: Activity,
          label: 'Analyzing...'
        }
    }
  }
  
  const style = getPredictionStyle()
  const StatusIcon = style.icon
  
  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ECG Monitoring</h3>
            <p className="text-sm text-slate-400">Real-time cardiac rhythm analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Disconnected</span>
            </>
          )}
        </div>
      </div>
      
      {/* Error display */}
      {wsError && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{wsError}</span>
          </div>
        </div>
      )}
      
      {/* ML Prediction Display */}
      {prediction && (
        <div className={`border rounded-lg p-6 ${style.bg}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-8 h-8 ${style.color}`} />
              <div>
                <h4 className="text-xl font-bold text-white">{style.label}</h4>
                <p className="text-sm text-slate-400 mt-1">{prediction.details}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-bold ${style.color}`}>
                {prediction.confidence.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Confidence</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 pt-4 border-t border-slate-700/50">
            {prediction.heartRate && (
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-white font-semibold">{prediction.heartRate} BPM</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {prediction.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Prediction History */}
      {predictionHistory.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Trend History</h4>
          <div className="space-y-2">
            {predictionHistory.slice(-5).reverse().map((pred, idx) => {
              const histStyle = pred.trend === 'normal' ? 'text-green-400' : 
                              pred.trend === 'abnormal' ? 'text-yellow-400' : 'text-red-400'
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className={histStyle}>
                    {pred.trend.toUpperCase()} ({pred.confidence.toFixed(0)}%)
                  </span>
                  <span className="text-slate-500">
                    {pred.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ECGMonitoring
