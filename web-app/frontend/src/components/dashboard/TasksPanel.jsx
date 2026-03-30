import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const PRIORITY_CFG = {
  HIGH:   { bar: 'bg-red-500',     text: 'text-red-400',     badge: 'bg-red-500/10 border-red-500/30 text-red-400',     icon: AlertCircle },
  URGENT: { bar: 'bg-red-600',     text: 'text-red-400',     badge: 'bg-red-600/10 border-red-600/30 text-red-400',     icon: AlertCircle },
  MEDIUM: { bar: 'bg-amber-500',   text: 'text-amber-400',   badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400', icon: Clock       },
  LOW:    { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: CheckCircle2 },
}

const TasksPanel = ({ tasks }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
    <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
      <div>
        <h3 className="text-sm font-semibold text-white">Upcoming Tasks</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} pending</p>
      </div>
      <button className="text-xs px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">
        + Add
      </button>
    </div>

    {tasks.length === 0 ? (
      <div className="p-8 flex flex-col items-center gap-2">
        <CheckCircle2 className="w-8 h-8 text-slate-700" />
        <p className="text-sm text-slate-500">All caught up!</p>
      </div>
    ) : (
      <ul className="divide-y divide-slate-800/70">
        {tasks.map((t, i) => {
          const cfg = PRIORITY_CFG[t.priority] || PRIORITY_CFG.LOW
          const IconComp = cfg.icon
          return (
            <li key={i} className={`flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer border-l-2 ${
              t.priority === 'HIGH' || t.priority === 'URGENT' ? 'border-l-red-500' :
              t.priority === 'MEDIUM' ? 'border-l-amber-500' :
              'border-l-emerald-500/40'
            }`}>
              {/* Priority icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-red-500/10' :
                t.priority === 'MEDIUM' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
              }`}>
                <IconComp className={`w-4 h-4 ${cfg.text}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug line-clamp-1">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.when}</p>
              </div>

              {/* Priority badge */}
              <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md border ${cfg.badge}`}>
                {t.priority}
              </span>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)

export default TasksPanel
