import { useState, useEffect } from 'react'
import { Clock, RefreshCw, AlertTriangle, TrendingUp, Calendar, Zap } from 'lucide-react'
import axios from 'axios'
import { HeartRateChart, SpO2Chart, CombinedVitalsChart, VitalsSummaryCards } from './VitalsCharts'

const API_BASE_URL = 'http://localhost:8000/api'

const TIME_RANGES = [
  { value: '15m', label: '15 Min' },
  { value: '30m', label: '30 Min' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All (From Beginning)' },
]

export default function VitalsHistoryTab({ patientId }) {
  const [timeRange, setTimeRange] = useState('24h')
  const [exactMode, setExactMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aggregatedData, setAggregatedData] = useState([])
  const [summary, setSummary] = useState(null)
  const [abnormalities, setAbnormalities] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchVitalsHistory()
  }, [patientId, timeRange, exactMode])

  const fetchVitalsHistory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      // Determine interval based on time range and exact mode
      let interval
      if (exactMode) {
        interval = 'exact'  // Get every single reading with exact timestamps
      } else {
        interval = ['15m', '30m', '1h'].includes(timeRange) ? '1min' : ['6h'].includes(timeRange) ? '5min' : '15min'
      }

      // Fetch aggregated data for charts
      const [aggregatedRes, summaryRes, abnormalitiesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/patients/${patientId}/vitals/aggregated`, {
          headers,
          params: { time_range: timeRange, interval }
        }),
        axios.get(`${API_BASE_URL}/patients/${patientId}/vitals/summary`, {
          headers,
          params: { time_range: timeRange }
        }),
        axios.get(`${API_BASE_URL}/patients/${patientId}/vitals/abnormalities`, {
          headers,
          params: { time_range: timeRange }
        })
      ])

      setAggregatedData(aggregatedRes.data.data || [])
      setSummary(summaryRes.data.statistics || null)
      setAbnormalities(abnormalitiesRes.data.abnormalities || [])
    } catch (err) {
      console.error('Failed to fetch vitals history:', err)
      setError('Failed to load vitals history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchVitalsHistory()
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Vitals History & Analysis</h2>
            <p className="text-sm text-slate-400">Historical trends and abnormality detection</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Exact Mode Toggle */}
          <button
            onClick={() => setExactMode(!exactMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              exactMode
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              {exactMode ? 'Exact Timestamps' : 'Aggregated'}
            </span>
          </button>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-1">Error Loading Data</h4>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <p className="text-slate-400">Loading vitals history...</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && summary && (
        <VitalsSummaryCards summary={summary} />
      )}

      {/* Charts */}
      {!loading && aggregatedData.length > 0 && (
        <div className="space-y-6">
          {/* Heart Rate Chart */}
          <HeartRateChart data={aggregatedData} timeRange={TIME_RANGES.find(r => r.value === timeRange)?.label} />

          {/* SpO2 Chart */}
          <SpO2Chart data={aggregatedData} timeRange={TIME_RANGES.find(r => r.value === timeRange)?.label} />

          {/* Combined Chart */}
          <CombinedVitalsChart data={aggregatedData} timeRange={TIME_RANGES.find(r => r.value === timeRange)?.label} />
        </div>
      )}

      {/* Abnormalities List */}
      {!loading && abnormalities.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Detected Abnormalities</h3>
            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded border border-amber-500/20">
              {abnormalities.length} events
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {abnormalities.slice(0, 50).map((abnormality, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  abnormality.severity === 'critical'
                    ? 'bg-red-500/10 border-red-500/30'
                    : abnormality.severity === 'high'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle 
                      className={`w-4 h-4 ${
                        abnormality.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                      }`} 
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{abnormality.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(abnormality.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      abnormality.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {abnormality.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loading && aggregatedData.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Clock className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-400 text-center">
            No vitals data available for the selected time range.
            <br />
            <span className="text-sm">Try selecting a different time range or start live monitoring.</span>
          </p>
        </div>
      )}
    </div>
  )
}
