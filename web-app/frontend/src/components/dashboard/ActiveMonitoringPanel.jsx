import { useState, useEffect } from 'react'
import { Activity, Heart, Wind, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const trendBadge = (trend) => {
  const configs = {
    normal: { label: 'Normal', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    stable: { label: 'Stable', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    abnormal: { label: 'Abnormal', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    declining: { label: 'Declining', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    unstable: { label: 'Unstable', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
    critical: { label: 'Critical', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
    insufficient_data: { label: 'No Data', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  }
  const cfg = configs[trend] || configs.insufficient_data
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.label}
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

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#6E80E7]" />
          Active Monitoring
        </h3>
        <span className="text-xs text-slate-500">{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6E80E7]"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="p-8 text-center">
          <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No patients actively monitored</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {patients.map((p) => {
            const ecgTrend = p.ecg?.trend || 'insufficient_data'
            const spo2Trend = p.spo2?.trend || 'insufficient_data'
            const isCritical = ecgTrend === 'unstable' || spo2Trend === 'critical'

            return (
              <div
                key={p.patient_id}
                onClick={() => navigate(`${basePath}/patients/${p.patient_id}`)}
                className={`px-5 py-3 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                  isCritical ? 'border-l-2 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isCritical ? 'bg-red-500 animate-pulse' : ecgTrend === 'abnormal' || spo2Trend === 'declining' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-sm font-medium text-white">{p.patient_name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{p.room || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {/* ECG */}
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-slate-400">ECG:</span>
                    {trendBadge(ecgTrend)}
                    {p.ecg?.heart_rate && (
                      <span className="text-slate-300 ml-1">{p.ecg.heart_rate} BPM</span>
                    )}
                  </div>

                  {/* SpO2 */}
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3 h-3 text-blue-400" />
                    <span className="text-slate-400">SpO2:</span>
                    {trendBadge(spo2Trend)}
                    {p.spo2?.current_value && (
                      <span className="text-slate-300 ml-1">{p.spo2.current_value}%</span>
                    )}
                  </div>
                </div>

                {/* Sensor warnings */}
                {(p.ecg?.leads_off || p.spo2?.finger_detected === false) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {p.ecg?.leads_off && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> ECG leads off
                      </span>
                    )}
                    {p.spo2?.finger_detected === false && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> No finger detected
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
