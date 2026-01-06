import { useState, useEffect } from 'react'
import { Plus, Search, FileText, User, Calendar, Clock, Filter } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

export default function StaffNotes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 100 }
      })

      const transformed = response.data.notes.map(n => ({
        id: n.id,
        patient: n.patient_name,
        room: 'N/A',
        title: n.title,
        content: n.content || n.subjective || n.objective || 'No content',
        date: new Date(n.created_at).toLocaleDateString(),
        time: new Date(n.created_at).toLocaleTimeString(),
        author: n.created_by_name || 'Unknown',
        category: n.note_type,
        tags: [n.note_type, n.specialty].filter(Boolean)
      }))

      setNotes(transformed)
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = activeFilter === 'all' || note.category === activeFilter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Clinical Notes</h1>
                <p className="text-sm text-slate-400">{notes.length} notes recorded</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700">
                <Plus className="w-4 h-4" />
                New Note
              </button>
            </div>

            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-slate-700 transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="PROGRESS_NOTE">Progress Notes</option>
                <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                <option value="CONSULTATION_NOTE">Consultation</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                <p className="ml-4 text-slate-400">Loading notes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <div key={note.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{note.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                            <User className="w-3 h-3" />
                            <span>{note.patient}</span>
                            <span>•</span>
                            <span>{note.room}</span>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-medium">
                          {note.category}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 mb-3 line-clamp-3">{note.content}</p>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{note.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{note.time}</span>
                          </div>
                        </div>
                        <span>By: {note.author}</span>
                      </div>

                      {note.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {note.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">
                      {notes.length === 0
                        ? 'No clinical notes yet. Create your first note!'
                        : 'No notes match your search'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
