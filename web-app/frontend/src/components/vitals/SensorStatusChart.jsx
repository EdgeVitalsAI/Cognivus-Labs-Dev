import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Wifi, WifiOff, Hand, Activity, AlertCircle, CheckCircle } from 'lucide-react'

export function SensorStatusChart({ data, timeRange }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <p className="text-slate-400">No sensor status data available</p>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    fullTime: new Date(item.time).toLocaleString(),
    fingerDetected: item.finger_detected_pct || (item.finger_detected ? 100 : 0),
    spo2Valid: item.spo2_valid_pct || (item.spo2_valid ? 100 : 0),
    hrValid: item.hr_valid_pct || (item.heart_rate_valid ? 100 : 0),
    leadsOff: item.ecg_leads_off_pct || (item.ecg_leads_off ? 100 : 0),
    dataQuality: item.data_quality_good !== undefined ? (item.data_quality_good ? 100 : 0) : (item.spo2_valid ? 100 : 0)
  }))

  // Calculate overall statistics
  const avgFingerDetection = (chartData.reduce((sum, item) => sum + item.fingerDetected, 0) / chartData.length).toFixed(1)
  const avgSpo2Valid = (chartData.reduce((sum, item) => sum + item.spo2Valid, 0) / chartData.length).toFixed(1)
  const avgHrValid = (chartData.reduce((sum, item) => sum + item.hrValid, 0) / chartData.length).toFixed(1)
  const avgLeadsOff = (chartData.reduce((sum, item) => sum + item.leadsOff, 0) / chartData.length).toFixed(1)

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Sensor Data Quality</h3>
            <p className="text-sm text-slate-400">Monitoring sensor connection and validity</p>
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Hand className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Finger Detected</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgFingerDetection}%</div>
          <div className={`text-xs mt-1 ${avgFingerDetection > 80 ? 'text-emerald-400' : avgFingerDetection > 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {avgFingerDetection > 80 ? 'Excellent' : avgFingerDetection > 50 ? 'Fair' : 'Poor'}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">SpO2 Valid</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgSpo2Valid}%</div>
          <div className={`text-xs mt-1 ${avgSpo2Valid > 80 ? 'text-emerald-400' : avgSpo2Valid > 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {avgSpo2Valid > 80 ? 'Excellent' : avgSpo2Valid > 50 ? 'Fair' : 'Poor'}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">HR Valid</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgHrValid}%</div>
          <div className={`text-xs mt-1 ${avgHrValid > 80 ? 'text-emerald-400' : avgHrValid > 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {avgHrValid > 80 ? 'Excellent' : avgHrValid > 50 ? 'Fair' : 'Poor'}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">ECG Leads Off</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgLeadsOff}%</div>
          <div className={`text-xs mt-1 ${avgLeadsOff < 20 ? 'text-emerald-400' : avgLeadsOff < 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {avgLeadsOff < 20 ? 'Good' : avgLeadsOff < 50 ? 'Fair' : 'Poor'}
          </div>
        </div>
      </div>

      {/* Sensor Status Over Time Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => chartData.find(d => d.time === value)?.fullTime || value}
            formatter={(value) => `${value.toFixed(1)}%`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="fingerDetected" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Finger Detected"
            dot={{ fill: '#3b82f6', r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="spo2Valid" 
            stroke="#10b981" 
            strokeWidth={2}
            name="SpO2 Valid"
            dot={{ fill: '#10b981', r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="hrValid" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="HR Valid"
            dot={{ fill: '#ef4444', r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="leadsOff" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="ECG Leads Off"
            dot={{ fill: '#f59e0b', r: 3 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Data Quality Indicators */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Quality Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Good Data Points</span>
              <span className="text-xs font-medium text-emerald-400">
                {chartData.filter(d => d.dataQuality >= 80).length} / {chartData.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Fair Data Points</span>
              <span className="text-xs font-medium text-amber-400">
                {chartData.filter(d => d.dataQuality >= 50 && d.dataQuality < 80).length} / {chartData.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Poor Data Points</span>
              <span className="text-xs font-medium text-red-400">
                {chartData.filter(d => d.dataQuality < 50).length} / {chartData.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Status Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">&gt;80% = Excellent data quality</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">50-80% = Fair, review sensors</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">&lt;50% = Poor, check connections</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
