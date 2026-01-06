import { FileText, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AddNoteModal from '../components/notes-reports/AddNoteModal';
import NoteCard from '../components/notes-reports/NoteCard';
import { authService } from '../services/api';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const NotesReportsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/notes`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { limit: 100 }
            });

            const transformed = response.data.notes.map(n => ({
                id: n.id,
                title: n.title,
                patient: n.patient_name,
                patientId: n.patient_id,
                type: n.note_type,
                category: n.specialty || 'General',
                date: new Date(n.created_at),
                author: n.created_by_name,
                content: n.content || n.subjective || n.objective || '',
                tags: [n.note_type, n.visit_type].filter(Boolean),
                attachments: 0,
                isPrivate: false,
            }));

            setNotes(transformed);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredNotes = () => {
        return notes.filter((note) => {
            const matchesSearch =
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || note.type === filterType;
            return matchesSearch && matchesType;
        });
    };

    const filteredNotes = getFilteredNotes();

    const handleAddNote = async (newNote) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/notes`, {
                ...newNote,
                created_by_id: user.id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            await fetchNotes();
            setIsAddNoteModalOpen(false);
        } catch (err) {
            console.error('Failed to add note:', err);
            alert('Failed to add note');
        }
    };

    const handleViewNote = (noteId) => {
        console.log('View note:', noteId);
    };

    const handleEditNote = (noteId) => {
        console.log('Edit note:', noteId);
    };

    const handleDeleteNote = (noteId) => {
        console.log('Delete note:', noteId);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-8 h-8 text-purple-500" />
                                <h1 className="text-3xl font-bold text-white">Clinical Notes & Reports</h1>
                            </div>
                            <p className="text-slate-400">Document and manage patient medical records</p>
                        </div>
                        <button
                            onClick={() => setIsAddNoteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            New Note
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Notes</p>
                            <p className="text-2xl font-bold text-white">{notes.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Clinical Notes</p>
                            <p className="text-2xl font-bold text-blue-400">
                                {notes.filter((n) => n.type === 'PROGRESS_NOTE').length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Lab Reports</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {notes.filter((n) => n.type === 'LAB_RESULTS').length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">This Week</p>
                            <p className="text-2xl font-bold text-purple-400">
                                {notes.filter((n) => {
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return n.date >= weekAgo;
                                }).length}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 relative min-w-max">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search notes by title or patient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                            <option value="all">Type: All</option>
                            <option value="PROGRESS_NOTE">Clinical Notes</option>
                            <option value="LAB_RESULTS">Lab Reports</option>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNotes.length > 0 ? (
                                filteredNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onView={handleViewNote}
                                        onEdit={handleEditNote}
                                        onDelete={handleDeleteNote}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-700 rounded-lg">
                                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg">
                                        {notes.length === 0
                                            ? 'No clinical notes yet. Create your first note!'
                                            : 'No notes match your filters'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            <AddNoteModal
                isOpen={isAddNoteModalOpen}
                onClose={() => setIsAddNoteModalOpen(false)}
                onAddNote={handleAddNote}
            />
        </div>
    );
};

export default NotesReportsPage;
