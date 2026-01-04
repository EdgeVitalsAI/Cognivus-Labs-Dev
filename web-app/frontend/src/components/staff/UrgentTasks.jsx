import { Clock, AlertCircle } from 'lucide-react'

export default function UrgentTasks({ tasks }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Urgent Tasks</h3>
        <p className="text-xs text-slate-400 mt-1">{tasks.length} high priority items</p>
      </div>

      <div className="p-4 space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Patient: {task.patient}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <Clock className="w-3 h-3" />
                Due: {task.dueIn}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                  Complete
                </button>
                <button className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded transition-colors">
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 py-6">No urgent tasks</p>
        )}
      </div>
    </div>
  )
}
