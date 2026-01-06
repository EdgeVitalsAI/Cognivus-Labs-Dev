import { Plus, Search, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ConsultationCard from '../components/telemedicine/ConsultationCard';
import ScheduleConsultationModal from '../components/telemedicine/ScheduleConsultationModal';
import TopBar from '../components/TopBar';
import { authService } from '../services/api';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const TelemedicinePage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/telemedicine`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { limit: 100 }
            });

            const transformed = response.data.consultations.map(c => ({
                id: c.id,
                patient: c.patient_name,
                patientId: c.patient_id,
                status: c.status,
                date: new Date(c.scheduled_start_time),
                time: new Date(c.scheduled_start_time).toLocaleTimeString(),
                duration: 30,
                type: c.consultation_type,
                notes: c.consultation_reason,
                room: 'Virtual Room',
                symptoms: c.chief_complaint ? [c.chief_complaint] : [],
                joinUrl: c.meeting_link || '#',
                doctorName: c.doctor_name,
                canJoin: c.status === 'IN_PROGRESS',
            }));

            setConsultations(transformed);
        } catch (err) {
            console.error('Failed to fetch consultations:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredConsultations = () => {
        let filtered = consultations.filter((c) => {
            const matchesSearch = c.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
        return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const filteredConsultations = getFilteredConsultations();

    const handleScheduleConsultation = async (newConsultation) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/telemedicine`, newConsultation, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            await fetchConsultations();
            setIsScheduleModalOpen(false);
        } catch (err) {
            console.error('Failed to schedule consultation:', err);
            alert('Failed to schedule consultation');
        }
    };

    const handleJoinConsultation = (consultationId) => {
        const consultation = consultations.find((c) => c.id === consultationId);
        if (consultation?.canJoin) {
            window.open(consultation.joinUrl, '_blank');
        }
    };

    const handleReschedule = (consultationId) => {
        console.log('Reschedule consultation:', consultationId);
    };

    const handleCancel = async (consultationId) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.patch(
                `${API_BASE_URL}/telemedicine/${consultationId}`,
                { status: 'CANCELLED' },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            await fetchConsultations();
        } catch (err) {
            console.error('Failed to cancel consultation:', err);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    const upcomingCount = consultations.filter((c) => c.status === 'SCHEDULED').length;
    const inProgressCount = consultations.filter((c) => c.status === 'IN_PROGRESS').length;
    const completedCount = consultations.filter((c) => c.status === 'COMPLETED').length;

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
                                <Video className="w-8 h-8 text-cyan-500" />
                                <h1 className="text-3xl font-bold text-white">Telemedicine</h1>
                            </div>
                            <p className="text-slate-400">
                                Manage and conduct virtual consultations
                            </p>
                        </div>
                        <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors border border-sky-500"
                        >
                            <Plus className="w-5 h-5" />
                            Schedule Consultation
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Consultations</p>
                            <p className="text-2xl font-bold text-white">{consultations.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Scheduled</p>
                            <p className="text-2xl font-bold text-amber-400">{upcomingCount}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">In Progress</p>
                            <p className="text-2xl font-bold text-sky-400">{inProgressCount}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Completed</p>
                            <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 relative min-w-max">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by patient name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                            <option value="all">Status: All</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {/* Consultations List */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                            <p className="ml-4 text-slate-400">Loading consultations...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredConsultations.length > 0 ? (
                                filteredConsultations.map((consultation) => (
                                    <ConsultationCard
                                        key={consultation.id}
                                        consultation={consultation}
                                        onJoin={handleJoinConsultation}
                                        onReschedule={handleReschedule}
                                        onCancel={handleCancel}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-900 border border-slate-700 rounded-lg">
                                    <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg">
                                        {consultations.length === 0
                                            ? 'No consultations scheduled yet. Schedule your first consultation!'
                                            : 'No consultations match your filters'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Schedule Modal */}
            <ScheduleConsultationModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSchedule={handleScheduleConsultation}
            />
        </div>
    );
};

export default TelemedicinePage;
