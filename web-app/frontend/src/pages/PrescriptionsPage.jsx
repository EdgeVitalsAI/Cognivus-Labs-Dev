import { Pill, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AddPrescriptionModal from '../components/prescriptions/AddPrescriptionModal';
import PrescriptionCard from '../components/prescriptions/PrescriptionCard';
import { authService } from '../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const PrescriptionsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortOption, setSortOption] = useState('recent');
    const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch prescriptions from API
    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/prescriptions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    limit: 500
                }
            });

            // Transform API data to match component expectations
            const transformedPrescriptions = response.data.prescriptions.map(p => ({
                id: p.id,
                medicationName: p.medication_name,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration || 'Ongoing',
                status: p.status,
                category: p.medication_class || 'General',
                patientName: p.patient?.name || 'Unknown',
                patientId: p.patient_id,
                patientRoom: p.patient?.room_number || 'N/A',
                prescribedBy: p.prescribed_by?.full_name || 'Unknown',
                prescribedDate: new Date(p.start_date || p.created_at),
                notes: p.instructions || '',
                indications: p.special_instructions || '',
                sideEffects: p.side_effects_warning || '',
                contraindications: p.interaction_warnings || '',
                refillsRemaining: p.refills_remaining || 0,
                isCritical: p.is_critical,
                requiresMonitoring: p.requires_monitoring
            }));

            setPrescriptions(transformedPrescriptions);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch prescriptions:', err);
            setError('Failed to load prescriptions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort logic
    const getFilteredAndSortedPrescriptions = () => {
        let filtered = prescriptions.filter(prescription => {
            // Apply search filter
            const matchesSearch =
                prescription.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase());

            // Apply status filter
            const statusMap = {
                all: true,
                active: prescription.status === 'ACTIVE',
                discontinued: prescription.status === 'DISCONTINUED',
                scheduled: prescription.status === 'SCHEDULED',
            };
            const matchesStatus = statusMap[filterStatus] !== false;

            // Apply category filter
            const matchesCategory =
                filterCategory === 'all' ||
                prescription.category.toLowerCase() === filterCategory.toLowerCase();

            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            switch (sortOption) {
                case 'recent':
                    return new Date(b.prescribedDate) - new Date(a.prescribedDate);
                case 'medication-asc':
                    return a.medicationName.localeCompare(b.medicationName);
                case 'medication-desc':
                    return b.medicationName.localeCompare(a.medicationName);
                case 'patient':
                    return a.patientName.localeCompare(b.patientName);
                case 'critical':
                    return (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0);
                default:
                    return 0;
            }
        });

        return sorted;
    };

    const filteredPrescriptions = getFilteredAndSortedPrescriptions();

    const handleViewDetails = (prescriptionId) => {
        console.log('View details for prescription:', prescriptionId);
    };

    const handleDiscontinue = async (prescriptionId) => {
        if (!window.confirm('Are you sure you want to discontinue this prescription?')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(
                `${API_BASE_URL}/prescriptions/${prescriptionId}/discontinue`,
                {
                    discontinued_by_id: user.id,
                    discontinuation_reason: 'Discontinued by doctor'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Refresh prescriptions after discontinuation
            await fetchPrescriptions();
        } catch (err) {
            console.error('Failed to discontinue prescription:', err);
            alert('Failed to discontinue prescription. Please try again.');
        }
    };

    const handleAddPrescription = async (newPrescription) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/prescriptions`, newPrescription, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Refresh prescription list after adding
            await fetchPrescriptions();
            setIsAddPrescriptionModalOpen(false);
        } catch (err) {
            console.error('Failed to add prescription:', err);
            alert('Failed to add prescription. Please try again.');
        }
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
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Prescriptions</h1>
                        <p className="text-slate-400">Manage and track all medication prescriptions</p>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Prescriptions</p>
                            <p className="text-2xl font-bold text-white">{prescriptions.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Active</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {prescriptions.filter((p) => p.status === 'ACTIVE').length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Critical</p>
                            <p className="text-2xl font-bold text-red-400">
                                {prescriptions.filter((p) => p.isCritical).length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Discontinued</p>
                            <p className="text-2xl font-bold text-slate-400">
                                {prescriptions.filter((p) => p.status === 'DISCONTINUED').length}
                            </p>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 relative min-w-max">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by medication or patient name..."
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
                            <option value="active">Active</option>
                            <option value="discontinued">Discontinued</option>
                            <option value="scheduled">Scheduled</option>
                        </select>

                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                            <option value="all">Category: All</option>
                            <option value="cardiovascular">Cardiovascular</option>
                            <option value="respiratory">Respiratory</option>
                            <option value="antibiotic">Antibiotic</option>
                            <option value="analgesic">Analgesic</option>
                            <option value="other">Other</option>
                        </select>

                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                            <option value="recent">Sort: Recent</option>
                            <option value="medication-asc">Medication (A-Z)</option>
                            <option value="medication-desc">Medication (Z-A)</option>
                            <option value="patient">Patient Name</option>
                            <option value="critical">Critical First</option>
                        </select>

                        <button
                            onClick={() => setIsAddPrescriptionModalOpen(true)}
                            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            New Prescription
                        </button>
                    </div>

                    {/* Prescriptions Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                            <p className="ml-4 text-slate-400">Loading prescriptions...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 text-center">
                            <p className="text-red-400 text-lg">{error}</p>
                            <button
                                onClick={fetchPrescriptions}
                                className="mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPrescriptions.length > 0 ? (
                                filteredPrescriptions.map((prescription) => (
                                    <PrescriptionCard
                                        key={prescription.id}
                                        prescription={prescription}
                                        onViewDetails={handleViewDetails}
                                        onDiscontinue={handleDiscontinue}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-slate-400 text-lg">
                                        {prescriptions.length === 0
                                            ? 'No prescriptions in the system yet. Add your first prescription!'
                                            : 'No prescriptions match your filters'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Prescription Modal */}
            <AddPrescriptionModal
                isOpen={isAddPrescriptionModalOpen}
                onClose={() => setIsAddPrescriptionModalOpen(false)}
                onAddPrescription={handleAddPrescription}
            />
        </div>
    );
};

export default PrescriptionsPage;
