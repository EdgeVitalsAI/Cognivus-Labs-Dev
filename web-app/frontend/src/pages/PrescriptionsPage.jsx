import { Pill, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AddPrescriptionModal from '../components/prescriptions/AddPrescriptionModal';
import PrescriptionCard from '../components/prescriptions/PrescriptionCard';
import { authService } from '../services/api';

const PrescriptionsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortOption, setSortOption] = useState('recent');
    const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);

    // Mock prescriptions data
    const [prescriptions, setPrescriptions] = useState([
        {
            id: 1,
            medicationName: 'Aspirin',
            dosage: '100mg',
            frequency: '1 tablet once daily',
            duration: '30 days',
            status: 'ACTIVE',
            category: 'Cardiovascular',
            patientName: 'Wathsala Dewmina',
            patientId: 1,
            patientRoom: 'Room No. 302A',
            prescribedBy: 'Dr. Sarah Smith',
            prescribedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Today at 14:30',
            nextDue: 'Tomorrow at 14:30',
            adherence: '100%',
            notes: 'Antiplatelet Agent - Take after breakfast',
            indications: 'Prevention of cardiovascular events',
            sideEffects: 'Stomach upset, bleeding',
            contraindications: 'Active bleeding, allergic to aspirin',
            refillsRemaining: 2,
            totalDispenses: 7,
        },
        {
            id: 2,
            medicationName: 'Metoprolol',
            dosage: '50mg',
            frequency: '1 tablet twice daily',
            duration: '60 days',
            status: 'ACTIVE',
            category: 'Cardiovascular',
            patientName: 'Wooshan Gamage',
            patientId: 2,
            patientRoom: 'Room No. 108C',
            prescribedBy: 'Dr. Sarah Smith',
            prescribedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Yesterday at 10:15',
            nextDue: 'Tomorrow at 10:15',
            adherence: '95%',
            notes: 'Beta Blocker - Heart Rate Control',
            indications: 'Hypertension, heart failure',
            sideEffects: 'Dizziness, fatigue, slow heart rate',
            contraindications: 'Severe asthma, heart block',
            refillsRemaining: 1,
            totalDispenses: 19,
        },
        {
            id: 3,
            medicationName: 'Lisinopril',
            dosage: '10mg',
            frequency: '1 tablet once daily',
            duration: '60 days',
            status: 'ACTIVE',
            category: 'Cardiovascular',
            patientName: 'Rivindu Ashinsa',
            patientId: 3,
            patientRoom: 'Ward 3 2A',
            prescribedBy: 'Dr. Sarah Smith',
            prescribedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Pending',
            nextDue: 'Today',
            adherence: 'N/A',
            notes: 'ACE Inhibitor - Blood Pressure Control',
            indications: 'Hypertension, heart failure',
            sideEffects: 'Dry cough, dizziness, hyperkalemia',
            contraindications: 'Pregnancy, renal disease',
            refillsRemaining: 3,
            totalDispenses: 0,
        },
        {
            id: 4,
            medicationName: 'Albuterol Inhaler',
            dosage: '90mcg',
            frequency: '2 puffs as needed',
            duration: 'Ongoing',
            status: 'DISCONTINUED',
            category: 'Respiratory',
            patientName: 'Robert Key',
            patientId: 4,
            patientRoom: 'Room No. 152B',
            prescribedBy: 'Dr. Sarah Smith',
            prescribedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Oct 15',
            nextDue: 'N/A',
            adherence: 'N/A',
            notes: 'Discontinued - Patient improved',
            indications: 'Asthma, COPD',
            sideEffects: 'Tremor, tachycardia, headache',
            contraindications: 'Coronary artery disease',
            refillsRemaining: 0,
            totalDispenses: 12,
        },
        {
            id: 5,
            medicationName: 'Amlodipine',
            dosage: '5mg',
            frequency: '1 tablet once daily',
            duration: '30 days',
            status: 'ACTIVE',
            category: 'Cardiovascular',
            patientName: 'Lakindu Minosha',
            patientId: 5,
            patientRoom: 'Ward 1 10C',
            prescribedBy: 'Dr. John Wilson',
            prescribedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Today at 08:00',
            nextDue: 'Tomorrow at 08:00',
            adherence: '100%',
            notes: 'Calcium Channel Blocker - Blood Pressure',
            indications: 'Hypertension, angina',
            sideEffects: 'Edema, headache, flushing',
            contraindications: 'Severe hypotension',
            refillsRemaining: 2,
            totalDispenses: 3,
        },
        {
            id: 6,
            medicationName: 'Atorvastatin',
            dosage: '20mg',
            frequency: '1 tablet once daily',
            duration: 'Ongoing',
            status: 'SCHEDULED',
            category: 'Cardiovascular',
            patientName: 'Ben Southern',
            patientId: 6,
            patientRoom: 'Room No. 311B',
            prescribedBy: 'Dr. Sarah Smith',
            prescribedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Pending',
            nextDue: 'Today',
            adherence: 'N/A',
            notes: 'Statin - Cholesterol Control',
            indications: 'Hypercholesterolemia',
            sideEffects: 'Muscle pain, liver dysfunction',
            contraindications: 'Pregnancy, liver disease',
            refillsRemaining: 3,
            totalDispenses: 0,
        },
        {
            id: 7,
            medicationName: 'Omeprazole',
            dosage: '20mg',
            frequency: '1 tablet once daily',
            duration: '14 days',
            status: 'ACTIVE',
            category: 'Gastrointestinal',
            patientName: 'Emma Davis',
            patientId: 7,
            patientRoom: 'Room No. 250A',
            prescribedBy: 'Dr. Michael Brown',
            prescribedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            lastDispensed: 'Today at 07:30',
            nextDue: 'Tomorrow at 07:30',
            adherence: '100%',
            notes: 'Proton Pump Inhibitor - GERD',
            indications: 'Gastroesophageal reflux',
            sideEffects: 'Headache, diarrhea, nausea',
            contraindications: 'None major',
            refillsRemaining: 1,
            totalDispenses: 2,
        },
        {
            id: 8,
            medicationName: 'Ciprofloxacin',
            dosage: '500mg',
            frequency: '1 tablet twice daily',
            duration: '7 days',
            status: 'ACTIVE',
            category: 'Antibiotic',
            patientName: 'Michael Johnson',
            patientId: 8,
            patientRoom: 'Room No. 410C',
            prescribedBy: 'Dr. Sarah Smith',
            prescribedDate: new Date(),
            lastDispensed: 'Today at 09:00',
            nextDue: 'Today at 21:00',
            adherence: 'N/A',
            notes: 'Fluoroquinolone - UTI Treatment',
            indications: 'Urinary tract infection',
            sideEffects: 'Nausea, tendinitis, photosensitivity',
            contraindications: 'Tendon disorders, QT prolongation',
            refillsRemaining: 0,
            totalDispenses: 0,
        },
    ]);

    // Filter and sort logic
    const getFilteredAndSortedPrescriptions = () => {
        let filtered = prescriptions.filter((prescription) => {
            // Apply search filter
            const matchesSearch =
                prescription.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prescription.category.toLowerCase().includes(searchTerm.toLowerCase());

            // Apply status filter
            const statusMap = {
                all: true,
                active: prescription.status === 'ACTIVE',
                scheduled: prescription.status === 'SCHEDULED',
                discontinued: prescription.status === 'DISCONTINUED',
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
                case 'status':
                    const statusOrder = { ACTIVE: 0, SCHEDULED: 1, DISCONTINUED: 2 };
                    return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
                default:
                    return 0;
            }
        });

        return sorted;
    };

    const filteredPrescriptions = getFilteredAndSortedPrescriptions();

    const handleViewPatient = (patientId) => {
        navigate(`/doctor/patients/${patientId}`);
    };

    const handleEditPrescription = (prescriptionId) => {
        console.log('Edit prescription:', prescriptionId);
    };

    const handleRefillPrescription = (prescriptionId) => {
        console.log('Refill prescription:', prescriptionId);
    };

    const handleAddPrescription = (newPrescription) => {
        setPrescriptions([...prescriptions, newPrescription]);
        setIsAddPrescriptionModalOpen(false);
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
                            <h1 className="text-3xl font-bold text-white mb-2">Prescriptions</h1>
                            <p className="text-slate-400">
                                Manage and monitor all patient prescriptions
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddPrescriptionModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors border border-sky-500"
                        >
                            <Plus className="w-5 h-5" />
                            New Prescription
                        </button>
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
                            <p className="text-slate-400 text-sm">Scheduled</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {prescriptions.filter((p) => p.status === 'SCHEDULED').length}
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
                                placeholder="Search by medication, patient, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                            title="Filter by Status"
                        >
                            <option value="all">Status: All</option>
                            <option value="active">Active</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="discontinued">Discontinued</option>
                        </select>

                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                            title="Filter by Category"
                        >
                            <option value="all">Category: All</option>
                            <option value="Cardiovascular">Cardiovascular</option>
                            <option value="Respiratory">Respiratory</option>
                            <option value="Gastrointestinal">Gastrointestinal</option>
                            <option value="Antibiotic">Antibiotic</option>
                            <option value="Pain Relief">Pain Relief</option>
                            <option value="Diabetes">Diabetes</option>
                        </select>

                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                            title="Sort Options"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="medication-asc">Medication A-Z</option>
                            <option value="medication-desc">Medication Z-A</option>
                            <option value="patient">By Patient</option>
                            <option value="status">By Status</option>
                        </select>
                    </div>

                    {/* Prescriptions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredPrescriptions.length > 0 ? (
                            filteredPrescriptions.map((prescription) => (
                                <PrescriptionCard
                                    key={prescription.id}
                                    prescription={prescription}
                                    onViewPatient={handleViewPatient}
                                    onEdit={handleEditPrescription}
                                    onRefill={handleRefillPrescription}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <Pill className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">No prescriptions found</p>
                                <p className="text-slate-500">
                                    Try adjusting your filters or search terms
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Prescription Modal */}
            <AddPrescriptionModal
                isOpen={isAddPrescriptionModalOpen}
                onClose={() => setIsAddPrescriptionModalOpen(false)}
                onAdd={handleAddPrescription}
            />
        </div>
    );
};

export default PrescriptionsPage;
