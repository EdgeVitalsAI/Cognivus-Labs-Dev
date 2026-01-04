import { useState } from 'react'
import { Plus, Search, FileText, Trash2, User, Calendar, Clock, X } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffNotes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState([
    {
      id: 1,
      patient: 'Sarah Johnson',
      room: '302A',
      title: 'Morning Rounds - Vitals Check',
      content: 'Patient alert and responsive. Vitals stable. HR 125 (elevated), O2 97%, temp 98.6°F',
      date: 'Nov 1, 2025',
      time: '8:30 AM',
      author: 'Jane Johnson'
    },
    {
      id: 2,
      patient: 'Michael Chen',
      room: '215B',
      title: 'Medication Administration',
      content: 'Administered morning medications. Patient tolerated well. No adverse reactions noted.',
      date: 'Nov 1, 2025',
      time: '9:15 AM',
      author: 'Jane Johnson'
    },
    {
      id: 3,
      patient: 'Emma Davis',
      room: '410C',
      title: 'Post-op Assessment',
      content: 'Patient recovering well from procedure. Pain controlled. Dressing clean and dry.',
      date: 'Nov 1, 2025',
      time: '10:45 AM',
      author: 'Jane Johnson'
    }
  ])

  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({
    patient: '',
    title: '',
    content: ''
  })

  const filteredNotes = notes.filter(
    (n) =>
      n.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          author: 'Jane Johnson'
        },
        ...notes
      ])
      setNewNote({ patient: '', title: '', content: '' })
      setShowAddNote(false)
    }
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
                <h1 className="text-2xl font-bold text-white mb-1">Clinical Notes</h1>
                <p className="text-sm text-slate-400">{notes.length} notes in your records</p>
              </div>
              <button
                onClick={() => setShowAddNote(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes by patient or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
              />
            </div>

            {/* Notes List */}
            <div className="grid grid-cols-1 gap-4 max-w-5xl">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                  >
                    <div className="px-4 py-3 border-b border-slate-800 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-1.5">{note.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{note.patient} (Room {note.room})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>{note.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{note.time}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 py-3 bg-slate-800/30">
                      <p className="text-slate-300 text-sm leading-relaxed">{note.content}</p>
                    </div>

                    <div className="px-4 py-2 bg-slate-800/50 flex items-center justify-between border-t border-slate-800">
                      <span className="text-xs text-slate-500">By: {note.author}</span>
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</button>
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
                  rows="8"
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
