import { useState, useEffect, useRef } from 'react'
import { Activity, Heart, AlertTriangle, CheckCircle, TrendingUp, Clock, Wifi, WifiOff } from 'lucide-react'

const WS_BASE_URL = 'ws://localhost:8000/api'

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
  const [ecgSamples, setEcgSamples] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  
  // ML prediction state
  const [prediction, setPrediction] = useState(null)
  const [predictionHistory, setPredictionHistory] = useState([])
  
  // Chart reference
  const canvasRef = useRef(null)
  
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
        // Update ECG waveform display (2 seconds of data)
        setEcgSamples(message.samples || [])
        setLastUpdate(new Date(message.timestamp))
        
        // Render waveform on canvas
        if (message.samples && message.samples.length > 0) {
          renderECGWaveform(message.samples)
        }
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
  
  const renderECGWaveform = (samples) => {
    const canvas = canvasRef.current
    if (!canvas || !samples || samples.length === 0) return
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)
    
    // Draw grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    
    // Vertical lines
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    // Normalize samples to canvas height
    const maxVal = Math.max(...samples)
    const minVal = Math.min(...samples)
    const range = maxVal - minVal || 1
    
    const normalizedSamples = samples.map(val => {
      return height - ((val - minVal) / range) * height * 0.8 - height * 0.1
    })
    
    // Draw ECG waveform
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const stepX = width / (samples.length - 1)
    
    normalizedSamples.forEach((y, i) => {
      const x = i * stepX
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
  }
  
  // Auto-resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        
        // Re-render with current data
        if (ecgSamples.length > 0) {
          renderECGWaveform(ecgSamples)
        }
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [ecgSamples])
  
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
      
      {/* ECG Waveform Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">ECG Waveform</h4>
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="relative w-full h-64 bg-slate-950 rounded-lg overflow-hidden">
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
          />
          
          {!connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
              <div className="text-center">
                <WifiOff className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">Waiting for connection...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>2-second window • 250 Hz sampling rate</span>
          <span>15-second analysis window</span>
        </div>
      </div>
      
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
