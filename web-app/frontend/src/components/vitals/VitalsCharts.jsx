import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Heart, Wind, Thermometer, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export function HeartRateChart({ data, timeRange }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <p className="text-slate-400">No heart rate data available</p>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    fullTime: new Date(item.time).toLocaleString(),
    hr: item.avg_heart_rate,
    abnormal: item.abnormal_hr_count > 0
  }))

  const avgHr = (data.reduce((sum, item) => sum + (item.avg_heart_rate || 0), 0) / data.length).toFixed(1)

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Heart className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Heart Rate Trend</h3>
            <p className="text-sm text-slate-400">{timeRange} average: <span className="text-white font-medium">{avgHr} BPM</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-400">Heart Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-emerald-500"></div>
            <span className="text-slate-400">Normal (60-100)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={[40, 120]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => chartData.find(d => d.time === value)?.fullTime || value}
          />
          <Legend />
          <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Min Normal', position: 'left', fill: '#10b981', fontSize: 10 }} />
          <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Max Normal', position: 'left', fill: '#10b981', fontSize: 10 }} />
          <Area 
            type="monotone" 
            dataKey="hr" 
            stroke="#ef4444" 
            strokeWidth={2}
            fill="url(#hrGradient)"
            name="Heart Rate (BPM)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SpO2Chart({ data, timeRange }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <p className="text-slate-400">No SpO2 data available</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    fullTime: new Date(item.time).toLocaleString(),
    spo2: item.avg_spo2,
    low: item.low_spo2_count > 0
  }))

  const avgSpo2 = (data.reduce((sum, item) => sum + (item.avg_spo2 || 0), 0) / data.length).toFixed(1)

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Wind className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Oxygen Saturation Trend</h3>
            <p className="text-sm text-slate-400">{timeRange} average: <span className="text-white font-medium">{avgSpo2}%</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-400">SpO2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-emerald-500"></div>
            <span className="text-slate-400">Normal (≥95%)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={[85, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => chartData.find(d => d.time === value)?.fullTime || value}
          />
          <Legend />
          <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal Threshold', position: 'left', fill: '#10b981', fontSize: 10 }} />
          <Area 
            type="monotone" 
            dataKey="spo2" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#spo2Gradient)"
            name="SpO2 (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CombinedVitalsChart({ data, timeRange }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <p className="text-slate-400">No vitals data available</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    fullTime: new Date(item.time).toLocaleString(),
    hr: item.avg_heart_rate,
    spo2: item.avg_spo2,
  }))

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Combined Vitals Overview</h3>
            <p className="text-sm text-slate-400">Heart Rate & SpO2 correlation</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={[40, 120]}
            label={{ value: 'BPM', angle: -90, position: 'insideLeft', fill: '#64748b' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={[85, 100]}
            label={{ value: 'SpO2 %', angle: 90, position: 'insideRight', fill: '#64748b' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => chartData.find(d => d.time === value)?.fullTime || value}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="hr" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
            name="Heart Rate (BPM)"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="spo2" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="SpO2 (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function VitalsSummaryCards({ summary }) {
  if (!summary) return null

  const { heart_rate, spo2, sensor_issues } = summary

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Heart Rate Summary */}
      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            <h4 className="text-sm font-medium text-white">Heart Rate</h4>
          </div>
          {heart_rate.abnormal_count > 0 && (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Average:</span>
            <span className="text-white font-medium">{heart_rate.average} BPM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Range:</span>
            <span className="text-white font-medium">{heart_rate.min} - {heart_rate.max} BPM</span>
          </div>
          {heart_rate.abnormal_count > 0 && (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs">
              {heart_rate.abnormal_count} abnormal readings detected
            </div>
          )}
        </div>
      </div>

      {/* SpO2 Summary */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-medium text-white">Oxygen Saturation</h4>
          </div>
          {spo2.low_count > 0 && (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Average:</span>
            <span className="text-white font-medium">{spo2.average}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Range:</span>
            <span className="text-white font-medium">{spo2.min} - {spo2.max}%</span>
          </div>
          {spo2.low_count > 0 && (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs">
              {spo2.low_count} low SpO2 readings detected
            </div>
          )}
        </div>
      </div>

      {/* Sensor Status */}
      <div className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border border-slate-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-slate-400" />
          <h4 className="text-sm font-medium text-white">Sensor Status</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">ECG Leads Off:</span>
            <span className="text-white font-medium">{sensor_issues.leads_off_count} times</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">No Finger Detected:</span>
            <span className="text-white font-medium">{sensor_issues.no_finger_count} times</span>
          </div>
          {(sensor_issues.leads_off_count > 0 || sensor_issues.no_finger_count > 0) && (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs">
              Sensor connectivity issues detected
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
