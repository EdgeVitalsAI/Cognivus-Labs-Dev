import { AlertCircle, Eye } from 'lucide-react'

export default function CriticalAlerts({ alerts }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-red-950 to-slate-900 border border-red-900/50 text-slate-200 mb-8 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Critical Alerts</h2>
      </div>

      <div className="space-y-3">
        {alerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between bg-red-900/20 border border-red-900/30 rounded-lg p-4"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300">
                🔴 {alert.patient} - {alert.room}
              </p>
              <p className="text-xs text-slate-400 mt-1">{alert.issue}</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors">
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
          </div>
        ))}
      </div>

      {alerts.length > 3 && (
        <button className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
          View All Alerts →
        </button>
      )}
    </div>
  )
}
