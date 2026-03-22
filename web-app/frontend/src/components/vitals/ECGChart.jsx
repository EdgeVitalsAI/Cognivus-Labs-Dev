import { useEffect, useRef, useState } from 'react'
import { Activity } from 'lucide-react'

/**
 * Real-time ECG Chart Component
 * Displays live ECG waveform data from ESP32 device
 */
const ECGChart = ({ ecgData, leadsConnected = true }) => {
  const canvasRef = useRef(null)
  const [dataBuffer, setDataBuffer] = useState([])
  const MAX_DATA_POINTS = 500 // Show last 500 points (20 seconds at 25Hz)

  // Determine if leads are actually connected based on ecgData
  // Default to false (leads off) until we get actual data
  const actualLeadsConnected = ecgData ? !ecgData.leadsOff : false

  useEffect(() => {
    if (ecgData?.val !== undefined) {
      setDataBuffer(prev => {
        const newBuffer = [...prev, ecgData.val]
        // Keep only last MAX_DATA_POINTS
        if (newBuffer.length > MAX_DATA_POINTS) {
          return newBuffer.slice(-MAX_DATA_POINTS)
        }
        return newBuffer
      })
    }
  }, [ecgData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#0f172a' // bg-slate-900
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#1e293b' // bg-slate-800
    ctx.lineWidth = 1

    // Vertical grid lines
    const gridSpacingX = width / 20
    for (let x = 0; x < width; x += gridSpacingX) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal grid lines
    const gridSpacingY = height / 10
    for (let y = 0; y < height; y += gridSpacingY) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (dataBuffer.length === 0) {
      // Show waiting message
      ctx.fillStyle = '#64748b' // text-slate-500
      ctx.font = '14px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for ECG data...', width / 2, height / 2)
      return
    }

    // Draw ECG waveform
    ctx.strokeStyle = actualLeadsConnected ? '#10b981' : '#ef4444' // green-500 : red-500
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const pointSpacing = width / MAX_DATA_POINTS
    const centerY = height / 2
    const scale = height / 1024 // ECG value range 0-1023

    ctx.beginPath()
    dataBuffer.forEach((value, index) => {
      const x = (MAX_DATA_POINTS - dataBuffer.length + index) * pointSpacing
      const y = centerY - (value - 512) * scale * 0.7 // Center around 512, scale down

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw real-time indicator (moving line)
    const indicatorX = dataBuffer.length * pointSpacing
    ctx.strokeStyle = '#3b82f6' // blue-500
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(indicatorX, 0)
    ctx.lineTo(indicatorX, height)
    ctx.stroke()
    ctx.setLineDash([])

  }, [dataBuffer, leadsConnected])

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Live ECG Waveform</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            actualLeadsConnected 
              ? 'bg-emerald-900/30 border border-emerald-700' 
              : 'bg-red-900/30 border border-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              actualLeadsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            <span className={`text-xs font-semibold ${
              actualLeadsConnected ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {actualLeadsConnected ? 'Leads Connected' : 'Leads Off'}
            </span>
          </div>
          <span className="text-xs text-slate-400">25 Hz • {dataBuffer.length} samples</span>
        </div>
      </div>

      {/* Canvas for ECG waveform */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={300}
        className="w-full h-auto bg-slate-950 rounded border border-slate-700"
      />

      <div className="mt-4 flex items-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-emerald-500"></div>
          <span>ECG Signal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-slate-700"></div>
          <span>Grid (200ms × 0.5mV)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500" style={{backgroundImage: 'linear-gradient(to right, #3b82f6 50%, transparent 50%)', backgroundSize: '10px 100%'}}></div>
          <span>Real-time Indicator</span>
        </div>
      </div>
    </div>
  )
}

export default ECGChart
