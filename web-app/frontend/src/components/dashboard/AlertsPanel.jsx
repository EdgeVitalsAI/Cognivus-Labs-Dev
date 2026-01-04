import { Bell } from 'lucide-react'

const AlertsPanel = ({ alerts }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-slate-200" />
        <h3 className="text-sm font-semibold">Real-time Alerts</h3>
      </div>
      <button className="text-xs px-3 py-1 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors">
        View more
      </button>
    </div>
    <div className="grid grid-cols-12 px-5 py-3 text-xs text-slate-400 bg-slate-800/30">
      <div className="col-span-4">Patient</div>
      <div className="col-span-3">Room</div>
      <div className="col-span-2">Condition</div>
      <div className="col-span-2">Severity</div>
      <div className="col-span-1">Time</div>
    </div>
    <ul className="divide-y divide-slate-800">
      {alerts.map((a, i) => (
        <li key={i} className="px-5 py-3 grid grid-cols-12 items-center hover:bg-slate-800/50 transition-colors">
          <div className="col-span-4 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                a.severity === 'high' ? 'bg-red-500' : a.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            ></span>
            <span className="text-slate-200 text-sm">{a.patient}</span>
          </div>
          <div className="col-span-3 text-slate-300 text-sm">{a.room}</div>
          <div className="col-span-2 text-slate-300 text-sm">{a.condition}</div>
          <div className="col-span-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${
                a.severity === 'high'
                  ? 'border-red-500 text-red-400 bg-red-500/10'
                  : a.severity === 'medium'
                  ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                  : 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
              }`}
            >
              {a.severity.toUpperCase()}
            </span>
          </div>
          <div className="col-span-1 text-slate-400 text-xs">{a.time}</div>
        </li>
      ))}
    </ul>
  </div>
)

export default AlertsPanel
