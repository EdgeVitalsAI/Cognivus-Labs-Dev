import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { Activity } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
      <p className="text-[11px] text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-xs text-slate-300">{p.name}:</span>
          <span className="text-xs font-semibold text-white">{p.value != null ? p.value : 'N/A'}</span>
        </div>
      ))}
    </div>
  )
}

export default function VitalsOverviewChart() {
  const [data, setData] = useState([])
  const [hours, setHours] = useState(24)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [hours])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_BASE_URL}/dashboard/vitals-overview`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { hours },
      })
      const formatted = (res.data.data || []).map((d) => ({
        ...d,
        time: d.time
          ? new Date(d.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : '',
      }))
      setData(formatted)
    } catch (e) {
      console.error('Failed to fetch vitals overview:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#6E80E7]/10">
            <Activity className="w-4 h-4 text-[#6E80E7]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Vitals Overview</h3>
            <p className="text-[11px] text-slate-500">Heart rate & oxygen saturation trends</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-400 rounded-full inline-block" />
              <span className="text-[11px] text-slate-400">Heart Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#6E80E7] rounded-full inline-block" />
              <span className="text-[11px] text-slate-400">SpO₂</span>
            </div>
          </div>
          {/* Time buttons */}
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            {[6, 12, 24].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  hours === h
                    ? 'bg-[#6E80E7] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-5 min-h-0">
        {loading ? (
          <div className="h-[260px] flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-[#6E80E7]" />
            <p className="text-xs text-slate-500">Loading vitals data…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center gap-2">
            <Activity className="w-10 h-10 text-slate-700" />
            <p className="text-sm text-slate-500">No vitals data for this range</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spo2Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6E80E7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6E80E7" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#334155"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="hr"
                stroke="#334155"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                domain={[40, 140]}
                width={32}
              />
              <YAxis
                yAxisId="spo2"
                orientation="right"
                stroke="#334155"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                domain={[85, 100]}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />

              {/* Normal range reference lines */}
              <ReferenceLine yAxisId="hr" y={100} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.25} />
              <ReferenceLine yAxisId="hr" y={60} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.25} />
              <ReferenceLine yAxisId="spo2" y={95} stroke="#6E80E7" strokeDasharray="4 4" strokeOpacity={0.25} />

              <Area
                yAxisId="hr"
                type="monotone"
                dataKey="avg_hr"
                name="Heart Rate (BPM)"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#hrFill)"
                dot={false}
                activeDot={{ r: 4, fill: '#ef4444', stroke: '#1e293b', strokeWidth: 2 }}
                connectNulls
              />
              <Area
                yAxisId="spo2"
                type="monotone"
                dataKey="avg_spo2"
                name="SpO₂ (%)"
                stroke="#6E80E7"
                strokeWidth={2}
                fill="url(#spo2Fill)"
                dot={false}
                activeDot={{ r: 4, fill: '#6E80E7', stroke: '#1e293b', strokeWidth: 2 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
