import { useState, useEffect } from 'react'
import { Activity, Heart, Wind, AlertCircle, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const TREND = {
  normal:           { label: 'Normal',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  stable:           { label: 'Stable',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  abnormal:         { label: 'Abnormal', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',   dot: 'bg-amber-500'   },
  declining:        { label: 'Declining',cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',   dot: 'bg-amber-500'   },
  unstable:         { label: 'Unstable', cls: 'bg-red-500/10 text-red-400 border-red-500/30',         dot: 'bg-red-500'     },
  critical:         { label: 'Critical', cls: 'bg-red-500/10 text-red-400 border-red-500/30',         dot: 'bg-red-500'     },
  insufficient_data:{ label: 'No Data',  cls: 'bg-slate-500/10 text-slate-500 border-slate-600/30',   dot: 'bg-slate-600'   },
}

const Badge = ({ trend }) => {
  const t = TREND[trend] || TREND.insufficient_data
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${t.cls}`}>
      {t.label}
    </span>
  )
}

export default function ActiveMonitoringPanel({ basePath = '/doctor' }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_BASE_URL}/dashboard/patient-monitoring-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPatients(res.data.patients || [])
    } catch (e) {
      console.error('Failed to fetch monitoring summary:', e)
    } finally {
      setLoading(false)
    }
  }

  const getSeverity = (ecgTrend, spo2Trend) => {
    if (ecgTrend === 'unstable' || spo2Trend === 'critical') return 'critical'
    if (ecgTrend === 'abnormal' || spo2Trend === 'declining') return 'warning'
    return 'stable'
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#6E80E7]/10">
            <Activity className="w-4 h-4 text-[#6E80E7]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Active Monitoring</h3>
            <p className="text-[11px] text-slate-500">Live patient sensor feeds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <Radio className="w-3 h-3" />
            Live
          </span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-700 border-t-[#6E80E7]" />
        </div>
      ) : patients.length === 0 ? (
        <div className="p-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No patients actively monitored</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/70">
          {patients.map((p) => {
            const ecgTrend  = p.ecg?.trend  || 'insufficient_data'
            const spo2Trend = p.spo2?.trend || 'insufficient_data'
            const severity  = getSeverity(ecgTrend, spo2Trend)

            const borderColor =
              severity === 'critical' ? 'border-l-red-500' :
              severity === 'warning'  ? 'border-l-amber-500' :
                                        'border-l-emerald-500/40'

            return (
              <div
                key={p.patient_id}
                onClick={() => navigate(`${basePath}/patients/${p.patient_id}`)}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-800/40 border-l-2 ${borderColor}`}
              >
                {/* Status dot */}
                <div className="flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    severity === 'critical' ? 'bg-red-500 animate-pulse' :
                    severity === 'warning'  ? 'bg-amber-500' :
                                              'bg-emerald-500'
                  }`} />
                </div>

                {/* Patient info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-white truncate">{p.patient_name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{p.room || '—'}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* ECG */}
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <Badge trend={ecgTrend} />
                      {p.ecg?.heart_rate != null && (
                        <span className="text-xs font-semibold text-slate-200 tabular-nums">
                          {p.ecg.heart_rate} <span className="text-slate-500 font-normal">bpm</span>
                        </span>
                      )}
                    </div>

                    {/* SpO2 */}
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3 h-3 text-[#6E80E7] flex-shrink-0" />
                      <Badge trend={spo2Trend} />
                      {p.spo2?.current_value != null && (
                        <span className="text-xs font-semibold text-slate-200 tabular-nums">
                          {p.spo2.current_value}<span className="text-slate-500 font-normal">%</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sensor warnings */}
                  {(p.ecg?.leads_off || p.spo2?.finger_detected === false) && (
                    <div className="flex items-center gap-3 mt-1.5">
                      {p.ecg?.leads_off && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                          <AlertCircle className="w-3 h-3" /> ECG leads off
                        </span>
                      )}
                      {p.spo2?.finger_detected === false && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                          <AlertCircle className="w-3 h-3" /> No finger detected
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
