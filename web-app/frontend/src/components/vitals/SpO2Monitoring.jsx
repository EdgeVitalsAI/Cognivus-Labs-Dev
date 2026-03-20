import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Droplet, Loader, Minus, TrendingDown } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const defaultPrediction = {
  trend: 'stable',
  confidence: 0,
  details: 'Waiting for SpO2 trend prediction.',
  current_value: null,
  average_value: null,
  timestamp: null,
}

const SpO2Monitoring = ({ patientId }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prediction, setPrediction] = useState(defaultPrediction)
  const [recentValues, setRecentValues] = useState([])

  useEffect(() => {
    let mounted = true

    const fetchPrediction = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/spo2/prediction/${patientId}`)
        if (!mounted) return

        if (response.data?.success) {
          const data = response.data
          setPrediction({
            trend: data.trend || 'stable',
            confidence: data.confidence || 0,
            details: data.details || defaultPrediction.details,
            current_value: data.current_value,
            average_value: data.average_value,
            timestamp: data.timestamp || null,
          })
          setError(null)
        } else {
          setPrediction(defaultPrediction)
        }
      } catch (err) {
        if (!mounted) return
        setError('SpO2 prediction endpoint is not reachable yet.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchPrediction()
    const timer = setInterval(fetchPrediction, 3000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [patientId])

  useEffect(() => {
    if (prediction.current_value == null) return

    setRecentValues(prev => {
      const next = [...prev, Number(prediction.current_value)]
      return next.slice(-20)
    })
  }, [prediction.current_value])

  const trendStyle = useMemo(() => {
    if (prediction.trend === 'critical') {
      return {
        badge: 'bg-red-900/40 text-red-300 border border-red-700/60',
        panel: 'border-red-700/50',
        icon: AlertTriangle,
      }
    }
    if (prediction.trend === 'declining') {
      return {
        badge: 'bg-amber-900/40 text-amber-300 border border-amber-700/60',
        panel: 'border-amber-700/50',
        icon: TrendingDown,
      }
    }
    return {
      badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/60',
      panel: 'border-emerald-700/50',
      icon: Minus,
    }
  }, [prediction.trend])

  const TrendIcon = trendStyle.icon

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 flex items-center gap-3">
        <Loader className="w-5 h-5 text-sky-400 animate-spin" />
        <p className="text-slate-300">Loading SpO2 trend model output...</p>
      </div>
    )
  }

  return (
    <div className={`bg-slate-900 border rounded-lg p-6 ${trendStyle.panel}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-900/30 border border-sky-700/50 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h3 className="text-white font-semibold">SpO2 Trend Monitoring</h3>
            <p className="text-xs text-slate-400">MEDIUM model prediction</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${trendStyle.badge}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {prediction.trend}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-amber-900/20 border border-amber-700/40 text-amber-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Metric label="Current SpO2" value={prediction.current_value != null ? `${prediction.current_value}%` : '--'} />
        <Metric label="Average" value={prediction.average_value != null ? `${prediction.average_value}%` : '--'} />
        <Metric label="Confidence" value={`${Math.round(prediction.confidence || 0)}%`} />
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-4">
        <p className="text-xs text-slate-400 mb-1">Model detail</p>
        <p className="text-sm text-slate-200">{prediction.details}</p>
      </div>

      <div>
        <p className="text-xs text-slate-400 mb-2">Recent values</p>
        <div className="flex items-end gap-1.5 h-16">
          {recentValues.length === 0 ? (
            <p className="text-xs text-slate-500">No recent values yet</p>
          ) : (
            recentValues.map((v, idx) => {
              const h = Math.max(12, Math.min(64, (v - 80) * 3))
              return (
                <div
                  key={`${idx}-${v}`}
                  className="w-2 rounded-sm bg-sky-400/70"
                  style={{ height: `${h}px` }}
                  title={`${v}%`}
                />
              )
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" />
        Last update: {prediction.timestamp ? new Date(prediction.timestamp).toLocaleTimeString() : 'N/A'}
      </div>
    </div>
  )
}

const Metric = ({ label, value }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
    <p className="text-xs text-slate-400 mb-1">{label}</p>
    <p className="text-lg font-semibold text-white">{value}</p>
  </div>
)

export default SpO2Monitoring
