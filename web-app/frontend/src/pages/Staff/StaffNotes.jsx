import { useState } from 'react'
import { Plus, Search, FileText, Trash2, User, Calendar, Clock, X, Filter, Edit2, Tag, Stethoscope } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffNotes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [notes, setNotes] = useState([
    {
      id: 1,
      patient: 'Sarah Johnson',
      room: '302A',
      title: 'Morning Rounds - Vitals Check',
      content: 'Patient alert and responsive. Vitals stable. HR 125 (elevated), O2 97%, temp 98.6°F. Patient reports feeling better today with decreased chest discomfort. Continued monitoring recommended.',
      date: 'Nov 1, 2025',
      time: '8:30 AM',
      author: 'Jane Johnson',
      category: 'Assessment',
      tags: ['vitals', 'cardiology']
    },
    {
      id: 2,
      patient: 'Michael Chen',
      room: '215B',
      title: 'Medication Administration',
      content: 'Administered morning medications as prescribed. Patient tolerated well. No adverse reactions noted. Blood pressure medication taken with breakfast.',
      date: 'Nov 1, 2025',
      time: '9:15 AM',
      author: 'Jane Johnson',
      category: 'Medication',
      tags: ['medication', 'routine']
    },
    {
      id: 3,
      patient: 'Emma Davis',
      room: '410C',
      title: 'Post-op Assessment',
      content: 'Patient recovering well from hip replacement procedure. Pain level 3/10, controlled with current medication regimen. Dressing clean and dry. Patient able to ambulate short distances with walker.',
      date: 'Nov 1, 2025',
      time: '10:45 AM',
      author: 'Jane Johnson',
      category: 'Post-Op',
      tags: ['post-op', 'recovery']
    },
    {
      id: 4,
      patient: 'Sarah Johnson',
      room: '302A',
      title: 'Family Conference',
      content: 'Met with patient family to discuss treatment plan and progress. Family expressed concerns about discharge planning. Social worker notified for coordination.',
      date: 'Oct 31, 2025',
      time: '3:45 PM',
      author: 'Jane Johnson',
      category: 'Communication',
      tags: ['family', 'discharge-planning']
    }
  ])

  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({
    patient: '',
    title: '',
    content: '',
    category: 'Assessment'
  })

  const categories = ['Assessment', 'Medication', 'Post-Op', 'Communication', 'Emergency', 'Other']

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = activeFilter === 'all' || n.category === activeFilter

    return matchesSearch && matchesFilter
  })

  const handleAddNote = () => {
    if (newNote.patient && newNote.title && newNote.content) {
      const now = new Date()
      setNotes([
        {
          id: notes.length + 1,
          patient: newNote.patient,
          room: '---',
          title: newNote.title,
          content: newNote.content,
          date: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          author: 'Jane Johnson',
          category: newNote.category,
          tags: []
        },
        ...notes
      ])
      setNewNote({ patient: '', title: '', content: '', category: 'Assessment' })
      setShowAddNote(false)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Assessment': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Medication': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Post-Op': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Communication': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Emergency': 'bg-red-500/10 text-red-400 border-red-500/20',
      'Other': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
    return colors[category] || colors['Other']
  }

  const notesToday = notes.filter(n => n.date.includes('Nov 1')).length
  const categoryCount = (cat) => notes.filter(n => n.category === cat).length

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
                <h1 className="text-2xl font-bold text-white mb-1">Clinical Notes</h1>
                <p className="text-sm text-slate-400">{notes.length} total notes • {notesToday} today</p>
              </div>
              <button
                onClick={() => setShowAddNote(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Today</p>
                    <p className="text-2xl font-bold text-white mt-1">{notesToday}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Assessment</p>
                    <p className="text-2xl font-bold text-white mt-1">{categoryCount('Assessment')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Medication</p>
                    <p className="text-2xl font-bold text-white mt-1">{categoryCount('Medication')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Total Notes</p>
                    <p className="text-2xl font-bold text-white mt-1">{notes.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search notes by patient, title, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                All ({notes.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeFilter === cat
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {cat} ({categoryCount(cat)})
                </button>
              ))}
            </div>

            {/* Notes List */}
            <div className="grid grid-cols-1 gap-4 max-w-5xl">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                  >
                    {/* Note Header */}
                    <div className="px-4 py-3 border-b border-slate-800">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base font-semibold text-white">{note.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(note.category)}`}>
                              {note.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span>{note.patient}</span>
                              <span className="text-slate-600">•</span>
                              <span>Room {note.room}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="px-4 py-3 bg-slate-800/30">
                      <p className="text-slate-300 text-sm leading-relaxed">{note.content}</p>
                    </div>

                    {/* Note Footer */}
                    <div className="px-4 py-2.5 bg-slate-800/50 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{note.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{note.time}</span>
                          </div>
                          <span>By: {note.author}</span>
                        </div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {note.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No notes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-white">Add Clinical Note</h2>
              <button
                onClick={() => setShowAddNote(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Patient *</label>
                <input
                  type="text"
                  value={newNote.patient}
                  onChange={(e) => setNewNote({ ...newNote, patient: e.target.value })}
                  placeholder="Select or type patient name"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Category *</label>
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Note Title *</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="e.g., Morning Rounds, Medication Administration"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Content *</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your clinical note here..."
                  rows="10"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
