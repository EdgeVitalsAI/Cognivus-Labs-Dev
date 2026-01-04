import { useState } from 'react'
import { Plus, Filter, MoreVertical, CheckCircle2, Circle } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffTasks() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('todo')
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Administer meds - Room 302A',
      description: 'Patient: Sarah J.',
      dueTime: '15 mins',
      patient: 'Sarah Johnson',
      priority: 'high',
      status: 'todo'
    },
    {
      id: 2,
      title: 'Check vitals - Room 410C',
      description: 'Emma D. | Post-op',
      dueTime: '30 mins',
      patient: 'Emma Davis',
      priority: 'high',
      status: 'todo'
    },
    {
      id: 3,
      title: 'Wound dressing - Room 215B',
      description: '2 PM scheduled',
      dueTime: '2 hours',
      patient: 'Michael Chen',
      priority: 'medium',
      status: 'todo'
    }
  ])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/20 border-red-900/50 text-red-300'
      case 'medium':
        return 'bg-amber-900/20 border-amber-900/50 text-amber-300'
      default:
        return 'bg-emerald-900/20 border-emerald-900/50 text-emerald-300'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      default:
        return '🟢'
    }
  }

  const handleTaskComplete = (id) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === 'completed' ? 'todo' : 'completed' } : t
      )
    )
  }

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'todo') return t.status === 'todo'
    if (activeTab === 'inprogress') return t.status === 'inprogress'
    return t.status === 'completed'
  })

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">My Tasks</h1>
                <p className="text-slate-400 mt-1">Manage your daily patient care activities</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <Plus className="w-5 h-5" />
                New Task
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-700">
              {[
                { id: 'todo', label: 'To Do (8)', count: 8 },
                { id: 'inprogress', label: 'In Progress (3)', count: 3 },
                { id: 'completed', label: 'Done (12)', count: 12 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-blue-600'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-600 hover:text-slate-500" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-white">{task.title}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}
                          >
                            {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{task.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span>⏱️ Due: {task.dueTime}</span>
                          <span>👤 {task.patient}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors">
                          Complete
                        </button>
                        <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors">
                          View
                        </button>
                        <button className="p-1.5 hover:bg-slate-800 text-slate-400 rounded transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No tasks in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
