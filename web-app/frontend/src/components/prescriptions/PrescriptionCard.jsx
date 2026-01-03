import { AlertCircle, CheckCircle, ChevronRight, Clock, MoreVertical } from 'lucide-react';

const PrescriptionCard = ({ prescription, onViewPatient, onEdit, onRefill }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500',
                    text: 'text-emerald-400',
                    icon: CheckCircle,
                };
            case 'SCHEDULED':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500',
                    text: 'text-amber-400',
                    icon: Clock,
                };
            case 'DISCONTINUED':
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500',
                    text: 'text-slate-400',
                    icon: AlertCircle,
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500',
                    text: 'text-slate-400',
                    icon: AlertCircle,
                };
        }
    };

    const status = getStatusColor(prescription.status);
    const StatusIcon = status.icon;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-sky-500 transition-all hover:shadow-lg hover:shadow-sky-500/20">
            {/* Header */}
            <div
                className={`${status.bg} border-b ${status.border} p-4 flex items-start justify-between`}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">
                            {prescription.medicationName}
                        </h3>
                        <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.border} ${status.text} ${status.bg}`}
                        >
                            {prescription.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400">
                        {prescription.dosage} • {prescription.frequency}
                    </p>
                </div>
                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Patient Info */}
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-700">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Patient
                        </p>
                        <p className="text-white font-semibold">{prescription.patientName}</p>
                        <p className="text-xs text-slate-400">{prescription.patientRoom}</p>
                    </div>
                    <button
                        onClick={() => onViewPatient(prescription.patientId)}
                        className="flex items-center gap-1 px-3 py-2 bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 text-sm rounded-lg transition-colors border border-sky-500/30"
                    >
                        View
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Prescription Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Duration */}
                    <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Duration
                        </p>
                        <p className="text-white font-semibold text-sm">{prescription.duration}</p>
                    </div>

                    {/* Category */}
                    <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Category
                        </p>
                        <p className="text-white font-semibold text-sm">{prescription.category}</p>
                    </div>

                    {/* Prescribed By */}
                    <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Prescribed By
                        </p>
                        <p className="text-white font-semibold text-sm">
                            {prescription.prescribedBy}
                        </p>
                    </div>

                    {/* Adherence */}
                    <div
                        className={`rounded-lg p-3 border ${
                            prescription.adherence !== 'N/A'
                                ? 'bg-emerald-500/10 border-emerald-500'
                                : 'bg-slate-700/20 border-slate-700'
                        }`}
                    >
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Adherence
                        </p>
                        <p
                            className={`font-semibold text-sm ${
                                prescription.adherence !== 'N/A' ? 'text-emerald-400' : 'text-white'
                            }`}
                        >
                            {prescription.adherence}
                        </p>
                    </div>
                </div>

                {/* Timing Info */}
                <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-700 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Last Dispensed:</span>
                        <span className="text-white font-semibold">
                            {prescription.lastDispensed}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Next Due:</span>
                        <span className="text-white font-semibold">{prescription.nextDue}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-600 pt-2">
                        <span className="text-slate-400">Refills Remaining:</span>
                        <span
                            className={`font-semibold ${
                                prescription.refillsRemaining > 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                            }`}
                        >
                            {prescription.refillsRemaining}
                        </span>
                    </div>
                </div>

                {/* Notes */}
                {prescription.notes && (
                    <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                            Notes
                        </p>
                        <p className="text-sm text-slate-300">{prescription.notes}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => onEdit(prescription.id)}
                        className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onRefill(prescription.id)}
                        disabled={prescription.refillsRemaining === 0}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors border ${
                            prescription.refillsRemaining > 0
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 hover:border-emerald-400'
                                : 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                        }`}
                    >
                        Refill
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionCard;
