import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value != null ? p.value : 'N/A'}
        </p>
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
        time: d.time ? new Date(d.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      }))
      setData(formatted)
    } catch (e) {
      console.error('Failed to fetch vitals overview:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Vitals Overview</h3>
        <div className="flex gap-1">
          {[6, 12, 24].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                hours === h
                  ? 'bg-[#6E80E7] text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6E80E7]"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
            No vitals data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="hr" stroke="#ef4444" tick={{ fontSize: 11 }} domain={[40, 140]} />
              <YAxis yAxisId="spo2" orientation="right" stroke="#3b82f6" tick={{ fontSize: 11 }} domain={[85, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
              />
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="avg_hr"
                name="Avg Heart Rate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="spo2"
                type="monotone"
                dataKey="avg_spo2"
                name="Avg SpO2"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
