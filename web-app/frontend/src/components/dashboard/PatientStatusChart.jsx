import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts'
import { Users } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const STATUS = {
  critical: { color: '#ef4444', label: 'Critical', bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' },
  warning:  { color: '#f59e0b', label: 'Warning',  bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  stable:   { color: '#22c55e', label: 'Stable',   bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-sm font-semibold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p className="text-xs text-slate-400">{d.value} patients</p>
    </div>
  )
}

export default function PatientStatusChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const s = res.data.patients_by_status || {}
      const chartData = [
        { name: 'Critical', value: s.critical || 0, fill: STATUS.critical.color, key: 'critical' },
        { name: 'Warning',  value: s.warning  || 0, fill: STATUS.warning.color,  key: 'warning'  },
        { name: 'Stable',   value: s.stable   || 0, fill: STATUS.stable.color,   key: 'stable'   },
      ].filter((d) => d.value > 0)
      setData(chartData)
    } catch (e) {
      console.error('Failed to fetch patient status:', e)
    } finally {
      setLoading(false)
    }
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2.5 flex-shrink-0">
        <div className="p-1.5 rounded-lg bg-[#6E80E7]/10">
          <Users className="w-4 h-4 text-[#6E80E7]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Patient Status</h3>
          <p className="text-[11px] text-slate-500">Current ward distribution</p>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-[#6E80E7]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Users className="w-10 h-10 text-slate-700" />
            <p className="text-sm text-slate-500">No patient data</p>
          </div>
        ) : (
          <>
            {/* Donut chart */}
            <div className="flex-1 min-h-0" style={{ minHeight: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    dataKey="value"
                    strokeWidth={3}
                    stroke="#0f172a"
                    paddingAngle={3}
                  >
                    {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    <Label
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox
                        return (
                          <g>
                            <text x={cx} y={cy - 6} textAnchor="middle" fill="#ffffff" fontSize={26} fontWeight="700">
                              {total}
                            </text>
                            <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize={11}>
                              patients
                            </text>
                          </g>
                        )
                      }}
                    />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with bars */}
            <div className="space-y-2.5 mt-4 flex-shrink-0">
              {[
                { key: 'critical', name: 'Critical' },
                { key: 'warning',  name: 'Warning'  },
                { key: 'stable',   name: 'Stable'   },
              ].map(({ key, name }) => {
                const entry = data.find(d => d.key === key)
                const val = entry?.value || 0
                const pct = total > 0 ? Math.round((val / total) * 100) : 0
                const s = STATUS[key]
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-slate-400">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${s.text}`}>{val}</span>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
