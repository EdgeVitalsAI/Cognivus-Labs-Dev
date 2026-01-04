import { FileText, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AddNoteModal from '../components/notes-reports/AddNoteModal';
import NoteCard from '../components/notes-reports/NoteCard';
import { authService } from '../services/api';

const NotesReportsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

    const [notes, setNotes] = useState([
        {
            id: 1,
            title: 'Follow-up Consultation Notes',
            patient: 'Wathsala Dewmina',
            patientId: 1,
            type: 'Clinical Note',
            category: 'Consultation',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            author: 'Dr. Sarah Smith',
            content:
                'Patient presented with chest pain and shortness of breath. Vital signs show elevated BP. Recommended cardiology referral and increased medication monitoring.',
            tags: ['cardiology', 'follow-up', 'urgent'],
            attachments: 1,
            isPrivate: false,
        },
        {
            id: 2,
            title: 'Lab Test Results Summary',
            patient: 'Wooshan Gamage',
            patientId: 2,
            type: 'Lab Report',
            category: 'Test Results',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            author: 'Dr. John Wilson',
            content:
                'Complete blood count and metabolic panel completed. Results within normal range except for slightly elevated troponin levels (0.08 ng/mL). Recommend cardiac enzyme monitoring.',
            tags: ['labs', 'cardiac', 'abnormal'],
            attachments: 2,
            isPrivate: false,
        },
        {
            id: 3,
            title: 'Discharge Summary',
            patient: 'Rivindu Ashinsa',
            patientId: 3,
            type: 'Discharge Report',
            category: 'Hospital Reports',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            author: 'Dr. Sarah Smith',
            content:
                'Patient discharged after 5 days of hospitalization. Primary diagnosis: Acute respiratory infection. Treated with antibiotics and supportive care. Follow-up appointment scheduled in 1 week.',
            tags: ['discharge', 'respiratory', 'admitted'],
            attachments: 3,
            isPrivate: false,
        },
        {
            id: 4,
            title: 'Medication Review and Optimization',
            patient: 'Robert Key',
            patientId: 4,
            type: 'Clinical Note',
            category: 'Medication Management',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            author: 'Dr. Michael Brown',
            content:
                'Reviewed all current medications for potential interactions. Recommended discontinuation of Albuterol as patient shows improvement. Continue current BP management regimen.',
            tags: ['medications', 'optimization', 'review'],
            attachments: 0,
            isPrivate: false,
        },
        {
            id: 5,
            title: 'Pathology Report - Biopsy Results',
            patient: 'Lakindu Minosha',
            patientId: 5,
            type: 'Pathology Report',
            category: 'Test Results',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            author: 'Dr. Sarah Smith',
            content:
                'Tissue biopsy shows no malignancy. Findings consistent with benign inflammatory lesion. Recommend monitoring and clinical follow-up at 6-month intervals.',
            tags: ['pathology', 'biopsy', 'benign'],
            attachments: 2,
            isPrivate: true,
        },
        {
            id: 6,
            title: 'Imaging Study Interpretation',
            patient: 'Ben Southern',
            patientId: 6,
            type: 'Imaging Report',
            category: 'Radiology',
            date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            author: 'Dr. John Wilson',
            content:
                'CT scan of chest shows mild subcutaneous emphysema, likely post-procedure related. No acute findings. Lungs clear. Recommend follow-up imaging in 4 weeks.',
            tags: ['imaging', 'ct-scan', 'radiology'],
            attachments: 1,
            isPrivate: false,
        },
        {
            id: 7,
            title: 'Therapy Session Notes',
            patient: 'Emma Davis',
            patientId: 7,
            type: 'Clinical Note',
            category: 'Therapy',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            author: 'Dr. Michael Brown',
            content:
                'Patient attended occupational therapy session. Good progress observed with range of motion exercises. Continue current therapy plan. Patient compliant with home exercises.',
            tags: ['therapy', 'rehabilitation', 'ot'],
            attachments: 1,
            isPrivate: false,
        },
        {
            id: 8,
            title: 'Pre-operative Assessment',
            patient: 'Michael Johnson',
            patientId: 8,
            type: 'Clinical Note',
            category: 'Surgery',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            author: 'Dr. Sarah Smith',
            content:
                'Patient cleared for elective surgery. All pre-operative tests completed and within acceptable range. NPO after midnight. Medications reviewed with anesthesia team.',
            tags: ['surgery', 'pre-op', 'clearance'],
            attachments: 1,
            isPrivate: false,
        },
    ]);

    const getFilteredNotes = () => {
        let filtered = notes.filter((note) => {
            const matchesSearch =
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || note.type === filterType;
            return matchesSearch && matchesType;
        });
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const filteredNotes = getFilteredNotes();

    const handleAddNote = (newNote) => {
        setNotes([...notes, newNote]);
        setIsAddNoteModalOpen(false);
    };

    const handleDelete = (noteId) => {
        setNotes(notes.filter((n) => n.id !== noteId));
    };

    const handleDownload = (noteId) => {
        console.log('Download note:', noteId);
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
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-8 h-8 text-emerald-500" />
                                <h1 className="text-3xl font-bold text-white">Notes & Reports</h1>
                            </div>
                            <p className="text-slate-400">
                                Clinical notes, lab reports, and medical documentation
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddNoteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors border border-sky-500"
                        >
                            <Plus className="w-5 h-5" />
                            New Note
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Notes</p>
                            <p className="text-2xl font-bold text-white">{notes.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Clinical Notes</p>
                            <p className="text-2xl font-bold text-blue-400">
                                {notes.filter((n) => n.type === 'Clinical Note').length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Lab Reports</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {notes.filter((n) => n.type === 'Lab Report').length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Discharge Notes</p>
                            <p className="text-2xl font-bold text-purple-400">
                                {notes.filter((n) => n.type === 'Discharge Report').length}
                            </p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 relative min-w-max">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search notes or reports..."
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
                            <option value="Clinical Note">Clinical Note</option>
                            <option value="Lab Report">Lab Report</option>
                            <option value="Discharge Report">Discharge Report</option>
                            <option value="Pathology Report">Pathology Report</option>
                            <option value="Imaging Report">Imaging Report</option>
                        </select>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                        {filteredNotes.length > 0 ? (
                            filteredNotes.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onDelete={handleDelete}
                                    onDownload={handleDownload}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-slate-900 border border-slate-700 rounded-lg">
                                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">No notes found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Note Modal */}
            <AddNoteModal
                isOpen={isAddNoteModalOpen}
                onClose={() => setIsAddNoteModalOpen(false)}
                onAdd={handleAddNote}
            />
        </div>
    );
};

export default NotesReportsPage;
