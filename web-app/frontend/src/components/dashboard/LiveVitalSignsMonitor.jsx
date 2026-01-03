import { useState, useEffect } from 'react'
import { Heart, Thermometer, Droplet, Wind, Pause, AlertCircle, Maximize2 } from 'lucide-react'

const LiveVitalSignsMonitor = () => {
  const [isPaused, setIsPaused] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [vitals, setVitals] = useState({
    heartRate: 110,
    temperature: 98.6,
    bloodPressure: { systolic: 140, diastolic: 90 },
    spO2: 87,
  })
  const [heartRateHistory, setHeartRateHistory] = useState(
    Array.from({ length: 60 }, (_, i) => 70 + Math.sin(i / 10) * 30 + Math.random() * 10)
  )
  const [lastUpdate, setLastUpdate] = useState('2s ago')

  // Simulate real-time updates
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setVitals((prev) => ({
        ...prev,
        heartRate: Math.max(60, Math.min(140, prev.heartRate + (Math.random() - 0.5) * 10)),
        temperature: Math.max(97, Math.min(101, prev.temperature + (Math.random() - 0.5) * 0.5)),
        bloodPressure: {
          systolic: Math.max(100, Math.min(180, prev.bloodPressure.systolic + (Math.random() - 0.5) * 8)),
          diastolic: Math.max(60, Math.min(120, prev.bloodPressure.diastolic + (Math.random() - 0.5) * 8)),
        },
        spO2: Math.max(80, Math.min(100, prev.spO2 + (Math.random() - 0.5) * 3)),
      }))

      setHeartRateHistory((prev) => {
        const newRate = 70 + Math.sin(prev.length / 10) * 30 + Math.random() * 10
        return [...prev.slice(1), newRate]
      })

      setLastUpdate('now')
      setTimeout(() => setLastUpdate('2s ago'), 2000)
    }, 2000)

    return () => clearInterval(interval)
  }, [isPaused])

  const getVitalStatus = (type, value) => {
    switch (type) {
      case 'heartRate':
        if (value < 60) return { label: 'LOW', color: 'text-blue-400', bg: 'bg-blue-900/30' }
        if (value < 100) return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-900/30' }
        if (value < 120) return { label: 'WARNING', color: 'text-yellow-400', bg: 'bg-yellow-900/30' }
        return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-900/30' }
      case 'temperature':
        if (value < 98) return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-900/30' }
        if (value < 99.5) return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-900/30' }
        if (value < 100.5) return { label: 'WARNING', color: 'text-yellow-400', bg: 'bg-yellow-900/30' }
        return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-900/30' }
      case 'bloodPressure':
        if (value.systolic < 120 && value.diastolic < 80) return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-900/30' }
        if (value.systolic < 140 && value.diastolic < 90) return { label: 'ELEVATED', color: 'text-yellow-400', bg: 'bg-yellow-900/30' }
        return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-900/30' }
      case 'spO2':
        if (value >= 95) return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-900/30' }
        if (value >= 90) return { label: 'WARNING', color: 'text-yellow-400', bg: 'bg-yellow-900/30' }
        return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-900/30' }
      default:
        return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-900/30' }
    }
  }

  const heartRateStatus = getVitalStatus('heartRate', vitals.heartRate)
  const tempStatus = getVitalStatus('temperature', vitals.temperature)
  const bpStatus = getVitalStatus('bloodPressure', vitals.bloodPressure)
  const spO2Status = getVitalStatus('spO2', vitals.spO2)

  // Simple ECG waveform visualization
  const maxHeartRate = Math.max(...heartRateHistory)
  const minHeartRate = Math.min(...heartRateHistory)
  const scale = (maxHeartRate - minHeartRate) || 1

  const points = heartRateHistory
    .map(
      (rate, i) =>
        `${(i / (heartRateHistory.length - 1)) * 100},${100 - ((rate - minHeartRate) / scale) * 80}`
    )
    .join(' ')

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Live Vital Signs Monitor</h2>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-green-400">Live</span>
            <span className="text-slate-400">Last: {lastUpdate}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
          >
            <Pause size={18} />
            {isPaused ? 'Resume' : 'Pause'} Updates
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition">
            <AlertCircle size={18} />
            Set Alert Thresholds
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition">
            <Maximize2 size={18} />
            Full Screen
          </button>
        </div>
      </div>

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Heart Rate */}
        <div className={`${bpStatus.bg} border border-slate-700 rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <Heart className="text-red-500" size={24} />
            <span className={`text-sm font-semibold ${heartRateStatus.color}`}>{heartRateStatus.label}</span>
          </div>
          <div className={`text-3xl font-bold ${heartRateStatus.color}`}>
            {Math.round(vitals.heartRate)}%
          </div>
          <div className="text-xs text-slate-400 mt-2">Heart Rate (BPM)</div>
        </div>

        {/* Temperature */}
        <div className={`${tempStatus.bg} border border-slate-700 rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <Thermometer className="text-orange-500" size={24} />
            <span className={`text-sm font-semibold ${tempStatus.color}`}>{tempStatus.label}</span>
          </div>
          <div className={`text-3xl font-bold ${tempStatus.color}`}>{vitals.temperature.toFixed(1)}°F</div>
          <div className="text-xs text-slate-400 mt-2">Temperature</div>
        </div>

        {/* Blood Pressure */}
        <div className={`${bpStatus.bg} border border-slate-700 rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <Droplet className="text-blue-500" size={24} />
            <span className={`text-sm font-semibold ${bpStatus.color}`}>{bpStatus.label}</span>
          </div>
          <div className={`text-3xl font-bold ${bpStatus.color}`}>
            {Math.round(vitals.bloodPressure.systolic)}/{Math.round(vitals.bloodPressure.diastolic)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Blood Pressure</div>
        </div>

        {/* SpO2 */}
        <div className={`${spO2Status.bg} border border-slate-700 rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <Wind className="text-cyan-500" size={24} />
            <span className={`text-sm font-semibold ${spO2Status.color}`}>{spO2Status.label}</span>
          </div>
          <div className={`text-3xl font-bold ${spO2Status.color}`}>{Math.round(vitals.spO2)}%</div>
          <div className="text-xs text-slate-400 mt-2">SpO2 (Oxygen)</div>
        </div>
      </div>

      {/* ECG Graph */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Heart Rate - Last 60 seconds</h3>
        <svg viewBox="0 0 100 100" className="w-full h-40 bg-slate-900 rounded">
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 20} x2="100" y2={i * 20} stroke="#334155" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#334155" strokeWidth="0.5" />
          ))}
          {/* ECG waveform */}
          <polyline points={points} fill="none" stroke="#10b981" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      {/* Date Range Selector */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Heart Rate - Last 60 seconds</h3>
        <label className="text-sm text-slate-400">
          Select Date Range:
          <input
            type="date"
            className="ml-2 px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
          />
        </label>
      </div>
    </div>
  )
}

export default LiveVitalSignsMonitor
