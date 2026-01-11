import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom React Hook for Real-Time Vital Signs WebSocket Connection
 * 
 * Connects to backend WebSocket ONLY when component is mounted (patient profile open)
 * Automatically disconnects when component unmounts (leaving profile page)
 * 
 * @param {string} patientId - Patient ID to monitor
 * @param {boolean} enabled - Whether to enable WebSocket connection (default: true)
 * @returns {Object} { vitals, ecgData, connectionStatus, error }
 */
const useVitalsWebSocket = (patientId, enabled = true) => {
  const [vitals, setVitals] = useState({
    heartRate: null,
    temperature: null,
    spo2: null,
    bloodPressure: null,
    spo2Status: null, // For sensor status: finger detected, valid, etc.
    ecgStatus: null   // For ECG leads status
  })
  
  const [ecgData, setEcgData] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // disconnected | connecting | connected | error
  const [error, setError] = useState(null)
  
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const connect = useCallback(() => {
    if (!enabled || !patientId) {
      console.log('WebSocket not enabled or no patient ID')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting')
      return
    }

    try {
      const wsUrl = `ws://localhost:8000/ws/vitals/${patientId}`
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`)
      setConnectionStatus('connecting')
      setError(null)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✓ WebSocket connected successfully')
        setConnectionStatus('connected')
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Route data based on type
          switch (data.type) {
            case 'ecg':
              // Update ECG chart data with proper leads status
              setEcgData({
                val: data.value || data.val,
                ts: data.timestamp || data.ts,
                leadsOff: data.leadsOff || false,
                active: data.active
              })
              // Update ECG status for debug info
              setVitals(prev => ({ 
                ...prev, 
                ecgStatus: {
                  leadsOff: data.leadsOff || false,
                  active: data.active || false
                }
              }))
              break

            case 'heart_rate':
              // Update heart rate vital
              if (data.valid === 1 && data.hr > 0) {
                setVitals(prev => ({ ...prev, heartRate: data.hr }))
              }
              break

            case 'spo2':
              // Update SpO2 vital with full sensor status
              setVitals(prev => ({ 
                ...prev, 
                spo2: (data.valid === 1 && data.spo2 > 0 && data.fingerDetected) ? data.spo2 : prev.spo2,
                spo2Status: {
                  valid: data.valid === 1,
                  fingerDetected: data.fingerDetected || false,
                  ir: data.ir,
                  red: data.red,
                  active: data.active || false
                }
              }))
              break

            case 'temperature':
              // Update temperature vital (if ESP32 sends it)
              if (data.temp > 0) {
                setVitals(prev => ({ ...prev, temperature: data.temp }))
              }
              break

            case 'error':
              console.error('WebSocket error from server:', data.message)
              setError(data.message)
              break

            case 'ping':
              // Server keepalive ping, ignore
              break

            default:
              console.log('Unknown WebSocket message type:', data.type)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('✗ WebSocket error:', event)
        setConnectionStatus('error')
        setError('WebSocket connection error')
      }

      ws.onclose = (event) => {
        console.log('✗ WebSocket closed:', event.code, event.reason)
        setConnectionStatus('disconnected')
        wsRef.current = null

        // Auto-reconnect if unexpected close and haven't exceeded max attempts
        if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError('Failed to connect after multiple attempts. Please refresh the page.')
        }
      }

    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setConnectionStatus('error')
      setError(`Failed to connect: ${err.message}`)
    }
  }, [patientId, enabled])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      console.log('🔌 Disconnecting WebSocket...')
      wsRef.current.close(1000, 'Component unmounted')
      wsRef.current = null
      setConnectionStatus('disconnected')
    }
  }, [])

  // Connect when component mounts, disconnect when unmounts
  useEffect(() => {
    if (enabled && patientId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [patientId, enabled, connect, disconnect])

  return {
    vitals,
    ecgData,
    connectionStatus,
    error,
    reconnect: connect
  }
}

export default useVitalsWebSocket
