import { useState } from 'react'
import { Plus, CheckCircle2, Clock, User, AlertTriangle } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffTasks() {
  const [activeTab, setActiveTab] = useState('todo')
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Administer medication - Morning dose',
      description: 'Lisinopril 10mg, Metformin 500mg',
      dueTime: '9:00 AM',
      patient: 'Sarah Johnson',
      room: '302A',
      priority: 'high',
      status: 'todo',
      category: 'Medication'
    },
    {
      id: 2,
      title: 'Check vitals and record',
      description: 'Post-op monitoring - BP, HR, O2, Temp',
      dueTime: '10:30 AM',
      patient: 'Emma Davis',
      room: '410C',
      priority: 'high',
      status: 'todo',
      category: 'Vital Signs'
    },
    {
      id: 3,
      title: 'Wound dressing change',
      description: 'Surgical site - sterile technique',
      dueTime: '2:00 PM',
      patient: 'Michael Chen',
      room: '215B',
      priority: 'medium',
      status: 'todo',
      category: 'Treatment'
    },
    {
      id: 4,
      title: 'Assist with mobility exercises',
      description: 'Physical therapy session',
      dueTime: '3:30 PM',
      patient: 'Robert Williams',
      room: '108A',
      priority: 'low',
      status: 'todo',
      category: 'Therapy'
    },
    {
      id: 5,
      title: 'IV line check and flush',
      description: 'Saline flush q4h',
      dueTime: '11:00 AM',
      patient: 'Sarah Johnson',
      room: '302A',
      priority: 'medium',
      status: 'inprogress',
      category: 'Nursing Care'
    },
    {
      id: 6,
      title: 'Patient education - Diabetes management',
      description: 'Review insulin administration',
      dueTime: 'Completed at 8:30 AM',
      patient: 'Michael Chen',
      room: '215B',
      priority: 'low',
      status: 'completed',
      category: 'Education'
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

  const tabCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">My Tasks</h1>
                <p className="text-sm text-slate-400">Manage your daily patient care activities</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700">
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">To Do</p>
                    <p className="text-3xl font-bold text-white mt-1">{tabCounts.todo}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">In Progress</p>
                    <p className="text-3xl font-bold text-white mt-1">{tabCounts.inprogress}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Completed</p>
                    <p className="text-3xl font-bold text-white mt-1">{tabCounts.completed}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-between">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex gap-1 p-1 bg-slate-800/50">
                {[
                  { id: 'todo', label: 'To Do', count: tabCounts.todo },
                  { id: 'inprogress', label: 'In Progress', count: tabCounts.inprogress },
                  { id: 'completed', label: 'Completed', count: tabCounts.completed }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Tasks List */}
              <div className="divide-y divide-slate-800">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <button onClick={() => handleTaskComplete(task.id)} className="mt-1 flex-shrink-0">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-slate-500 transition-colors" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                                {task.title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                            </div>
                            <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{task.dueTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{task.patient} • {task.room}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">{task.category}</span>
                          </div>
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
    </div>
  )
}
