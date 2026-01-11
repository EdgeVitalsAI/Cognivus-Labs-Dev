import {
    ChevronDown,
    ChevronUp,
    Droplet,
    Filter,
    Heart,
    Pill,
    Plus,
    Search,
    Thermometer,
    Wind,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

const VitalsModal = ({ isOpen, onClose, vitals }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
                    <h2 className="text-xl font-bold text-white">Current Vital Signs</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Vitals Grid */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Heart Rate */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-400 mb-2">
                                <Heart className="w-5 h-5" />
                                <span className="text-sm font-semibold">Heart Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{vitals.heartRate}</p>
                            <p className="text-xs text-slate-400">bpm</p>
                        </div>

                        {/* Temperature */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-orange-400 mb-2">
                                <Thermometer className="w-5 h-5" />
                                <span className="text-sm font-semibold">Temperature</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {vitals.temperature.toFixed(1)}
                            </p>
                            <p className="text-xs text-slate-400">°F</p>
                        </div>

                        {/* Blood Pressure */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Droplet className="w-5 h-5" />
                                <span className="text-sm font-semibold">Blood Pressure</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{vitals.bloodPressure}</p>
                            <p className="text-xs text-slate-400">mmHg</p>
                        </div>

                        {/* O2 Saturation */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                <Wind className="w-5 h-5" />
                                <span className="text-sm font-semibold">O2 Saturation</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{vitals.o2Saturation}</p>
                            <p className="text-xs text-slate-400">%</p>
                        </div>

                        {/* Respiratory Rate */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Zap className="w-5 h-5" />
                                <span className="text-sm font-semibold">Respiratory Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {vitals.respiratoryRate}
                            </p>
                            <p className="text-xs text-slate-400">breaths/min</p>
                        </div>

                        {/* pH */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Zap className="w-5 h-5" />
                                <span className="text-sm font-semibold">pH Level</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{vitals.pH}</p>
                            <p className="text-xs text-slate-400">Normal: 7.35-7.45</p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddPrescriptionModal = ({ isOpen, onClose, onAdd, patientName }) => {
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        category: 'Cardiovascular',
        duration: '30 days',
        frequency: '',
        notes: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newPrescription = {
            id: Date.now(),
            name: formData.name,
            dosage: `${formData.dosage}`,
            category: formData.category,
            duration: formData.duration,
            status: 'ACTIVE',
            frequency: formData.frequency,
            prescribedBy: 'Dr. Admin',
            lastDispensed: 'Today',
            adherence: 'N/A',
            notes: formData.notes,
        };
        onAdd(newPrescription);
        setFormData({
            name: '',
            dosage: '',
            category: 'Cardiovascular',
            duration: '30 days',
            frequency: '',
            notes: '',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
                    <h2 className="text-xl font-bold text-white">
                        Add New Prescription for {patientName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Medication Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Medication Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Aspirin"
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Dosage */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Dosage *
                            </label>
                            <input
                                type="text"
                                name="dosage"
                                value={formData.dosage}
                                onChange={handleChange}
                                required
                                placeholder="e.g., 100mg"
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Frequency *
                            </label>
                            <input
                                type="text"
                                name="frequency"
                                value={formData.frequency}
                                onChange={handleChange}
                                required
                                placeholder="e.g., 1 tablet once daily"
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Duration *
                            </label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                                <option>Cardiovascular</option>
                                <option>Respiratory</option>
                                <option>Gastrointestinal</option>
                                <option>Antibiotic</option>
                                <option>Pain Relief</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Add any notes..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-semibold"
                        >
                            Add Prescription
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PrescriptionsTabComponent = ({
    patientData,
    expandedPrescription,
    setExpandedPrescription,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState('Active');
    const [showAddModal, setShowAddModal] = useState(false);
    const [prescriptions, setPrescriptions] = useState(patientData.prescriptions);
    const [showVitalsModal, setShowVitalsModal] = useState(false);

    const handleAddPrescription = (newPrescription) => {
        setPrescriptions([...prescriptions, newPrescription]);
        setShowAddModal(false);
    };

    const getStatusCounts = () => {
        return {
            Active: prescriptions.filter((p) => p.status === 'ACTIVE').length,
            Scheduled: prescriptions.filter((p) => p.status === 'SCHEDULED').length,
            Discontinued: prescriptions.filter((p) => p.status === 'DISCONTINUED').length,
            'AI Suggestions': 1,
            All: prescriptions.length,
        };
    };

    const filteredPrescriptions = prescriptions.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());

        const statusMap = {
            Active: p.status === 'ACTIVE',
            Scheduled: p.status === 'SCHEDULED',
            Discontinued: p.status === 'DISCONTINUED',
            'AI Suggestions': false,
            All: true,
        };

        return matchesSearch && statusMap[activeStatus];
    });

    const statusCounts = getStatusCounts();

    return (
        <div className="space-y-6">
            {/* Search and Add Button */}
            <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search medications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors">
                    <Filter className="w-5 h-5" />
                    Filter
                </button>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Add New Prescription
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-4 border-b border-slate-700 overflow-x-auto pb-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setActiveStatus(status)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                            activeStatus === status
                                ? 'bg-sky-500/20 text-sky-400 border-b-2 border-sky-400'
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        {status} <span className="ml-2 text-sm">{count}</span>
                    </button>
                ))}
            </div>

            {/* Prescriptions List */}
            <div className="space-y-3">
                {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map((prescription) => (
                        <div
                            key={prescription.id}
                            className={`bg-slate-800 border-2 rounded-lg p-5 cursor-pointer transition-all hover:border-sky-500 ${
                                prescription.status === 'ACTIVE'
                                    ? 'border-emerald-500'
                                    : prescription.status === 'SCHEDULED'
                                    ? 'border-amber-500'
                                    : 'border-slate-600'
                            }`}
                            onClick={() =>
                                setExpandedPrescription(
                                    expandedPrescription === prescription.id
                                        ? null
                                        : prescription.id
                                )
                            }
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Pill className="w-5 h-5 text-blue-400" />
                                        <h4 className="text-lg font-bold text-white">
                                            {prescription.name}
                                        </h4>
                                        <span
                                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                prescription.status === 'ACTIVE'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : prescription.status === 'SCHEDULED'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-slate-600/20 text-slate-400'
                                            }`}
                                        >
                                            {prescription.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-2">
                                        {prescription.category}
                                    </p>
                                    <p className="text-slate-300 text-sm">
                                        <span className="font-semibold">Dosage:</span>{' '}
                                        {prescription.dosage}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowVitalsModal(true);
                                    }}
                                    className="ml-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    View Vitals
                                </button>
                                {expandedPrescription === prescription.id ? (
                                    <ChevronUp className="w-6 h-6 ml-4" />
                                ) : (
                                    <ChevronDown className="w-6 h-6 ml-4" />
                                )}
                            </div>

                            {expandedPrescription === prescription.id && (
                                <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                                                Prescribed by
                                            </p>
                                            <p className="text-white font-semibold">
                                                {prescription.prescribedBy}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                                                Last Dispensed
                                            </p>
                                            <p className="text-white font-semibold">
                                                {prescription.lastDispensed}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                                                Adherence
                                            </p>
                                            <p className="text-white font-semibold">
                                                {prescription.adherence}
                                            </p>
                                        </div>
                                    </div>
                                    {prescription.notes && (
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                                                Notes
                                            </p>
                                            <p className="text-slate-300">{prescription.notes}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-4">
                                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold">
                                            Edit
                                        </button>
                                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold">
                                            History
                                        </button>
                                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold">
                                            Hold
                                        </button>
                                        <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-semibold border border-red-500/30">
                                            Discontinue
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No prescriptions found</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <VitalsModal
                isOpen={showVitalsModal}
                onClose={() => setShowVitalsModal(false)}
                vitals={patientData.vitals}
            />
            <AddPrescriptionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddPrescription}
                patientName={patientData.name}
            />
        </div>
    );
};

export default PrescriptionsTabComponent;
