import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  stable: '#22c55e',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-medium" style={{ color: d.payload.fill }}>
        {d.name}: {d.value}
      </p>
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
        { name: 'Critical', value: s.critical || 0, fill: COLORS.critical },
        { name: 'Warning', value: s.warning || 0, fill: COLORS.warning },
        { name: 'Stable', value: s.stable || 0, fill: COLORS.stable },
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
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Patient Status</h3>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6E80E7]"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">
            No patient data
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-[140px] h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-slate-400">{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{d.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-semibold text-slate-300">{total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
