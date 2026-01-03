import { Plus, Search, Video } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ConsultationCard from '../components/telemedicine/ConsultationCard';
import ScheduleConsultationModal from '../components/telemedicine/ScheduleConsultationModal';
import TopBar from '../components/TopBar';
import { authService } from '../services/api';

const TelemedicinePage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const [consultations, setConsultations] = useState([
        {
            id: 1,
            patient: 'Wathsala Dewmina',
            patientId: 1,
            status: 'SCHEDULED',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            time: '10:00 AM',
            duration: 30,
            type: 'Follow-up',
            notes: 'Discuss medication adjustments',
            room: 'Video Room 1',
            symptoms: ['Chest pain', 'Shortness of breath'],
            joinUrl: 'https://meet.cognivuslabs.com/consultation/1',
            doctorName: 'Dr. Sarah Smith',
            canJoin: false,
        },
        {
            id: 2,
            patient: 'Emma Davis',
            patientId: 7,
            status: 'IN_PROGRESS',
            date: new Date(),
            time: '02:00 PM',
            duration: 20,
            type: 'Initial Consultation',
            notes: 'First-time patient assessment',
            room: 'Video Room 2',
            symptoms: ['Fever', 'Cough'],
            joinUrl: 'https://meet.cognivuslabs.com/consultation/2',
            doctorName: 'Dr. Sarah Smith',
            canJoin: true,
            startedAt: new Date(Date.now() - 10 * 60 * 1000),
        },
        {
            id: 3,
            patient: 'Rivindu Ashinsa',
            patientId: 3,
            status: 'COMPLETED',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            time: '03:30 PM',
            duration: 25,
            type: 'Follow-up',
            notes: 'Reviewed lab results',
            room: 'Video Room 1',
            symptoms: ['Low oxygen levels'],
            joinUrl: 'https://meet.cognivuslabs.com/consultation/3',
            doctorName: 'Dr. John Wilson',
            canJoin: false,
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
            id: 4,
            patient: 'Wooshan Gamage',
            patientId: 2,
            status: 'SCHEDULED',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            time: '11:30 AM',
            duration: 30,
            type: 'Specialist Consultation',
            notes: 'Cardiology follow-up',
            room: 'Video Room 3',
            symptoms: ['High heart rate'],
            joinUrl: 'https://meet.cognivuslabs.com/consultation/4',
            doctorName: 'Dr. Michael Brown',
            canJoin: false,
        },
        {
            id: 5,
            patient: 'Robert Key',
            patientId: 4,
            status: 'COMPLETED',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            time: '09:00 AM',
            duration: 35,
            type: 'Follow-up',
            notes: 'Blood pressure management',
            room: 'Video Room 2',
            symptoms: ['High blood pressure'],
            joinUrl: 'https://meet.cognivuslabs.com/consultation/5',
            doctorName: 'Dr. Sarah Smith',
            canJoin: false,
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
            id: 6,
            patient: 'Lakindu Minosha',
            patientId: 5,
            status: 'SCHEDULED',
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            time: '04:00 PM',
            duration: 25,
            type: 'Emergency Consultation',
            notes: 'Urgent assessment needed',
            room: 'Video Room 4',
            symptoms: ['Severe pain'],
            joinUrl: 'https://meet.cognivuslabs.com/consultation/6',
            doctorName: 'Dr. Sarah Smith',
            canJoin: false,
        },
    ]);

    const getFilteredConsultations = () => {
        let filtered = consultations.filter((c) => {
            const matchesSearch = c.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
        return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const filteredConsultations = getFilteredConsultations();

    const handleScheduleConsultation = (newConsultation) => {
        setConsultations([...consultations, newConsultation]);
        setIsScheduleModalOpen(false);
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

    const handleCancel = (consultationId) => {
        setConsultations(consultations.filter((c) => c.id !== consultationId));
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
                                <p className="text-slate-400 text-lg">No consultations found</p>
                            </div>
                        )}
                    </div>
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
