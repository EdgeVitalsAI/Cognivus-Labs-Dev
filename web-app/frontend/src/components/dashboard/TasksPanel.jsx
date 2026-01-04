const TasksPanel = ({ tasks }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Upcoming Tasks ({tasks.length})</h3>
      <button className="text-xs px-3 py-1 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors">
        + Add Task
      </button>
    </div>
    <ul className="divide-y divide-slate-800">
      {tasks.map((t, i) => (
        <li key={i} className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
          <div>
            <p className="text-sm text-slate-200">{t.title}</p>
            <p className="text-xs text-slate-400">{t.when}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border ${
              t.priority === 'HIGH'
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : t.priority === 'MEDIUM'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
            }`}
          >
            {t.priority}
          </span>
        </li>
      ))}
    </ul>
  </div>
)

export default TasksPanel
