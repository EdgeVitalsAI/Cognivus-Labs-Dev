import { AlertCircle, CheckCircle, ChevronRight, TrendingUp } from 'lucide-react';

const AIInsightCard = ({ insight, onMarkAddressed, onViewPatient }) => {
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'HIGH':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500',
                    text: 'text-red-400',
                    icon: AlertCircle,
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500',
                    text: 'text-amber-400',
                    icon: TrendingUp,
                };
            case 'LOW':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500',
                    text: 'text-emerald-400',
                    icon: CheckCircle,
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

    const severity = getSeverityColor(insight.severity);
    const SeverityIcon = severity.icon;

    const getTypeColor = (type) => {
        switch (type) {
            case 'medication':
                return 'bg-purple-500/20 text-purple-300';
            case 'prediction':
                return 'bg-blue-500/20 text-blue-300';
            case 'dosage':
                return 'bg-orange-500/20 text-orange-300';
            case 'lifestyle':
                return 'bg-green-500/20 text-green-300';
            case 'lab':
                return 'bg-pink-500/20 text-pink-300';
            case 'pattern':
                return 'bg-indigo-500/20 text-indigo-300';
            default:
                return 'bg-slate-500/20 text-slate-300';
        }
    };

    return (
        <div
            className={`${severity.bg} border-l-4 ${severity.border} bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4 hover:shadow-lg hover:shadow-slate-700/50 transition-all`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    {/* Header with Type and Severity */}
                    <div className="flex items-center gap-3 mb-3">
                        <SeverityIcon className={`w-5 h-5 ${severity.text}`} />
                        <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTypeColor(
                                insight.type
                            )} capitalize`}
                        >
                            {insight.type}
                        </span>
                        <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${severity.border} ${severity.text} ${severity.bg}`}
                        >
                            {insight.severity} ({insight.confidence}%)
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2">{insight.title}</h3>

                    {/* Patient Info */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-slate-400">Patient:</span>
                        <button
                            onClick={() => onViewPatient(insight.patientId)}
                            className="text-sm text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                        >
                            {insight.patient}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-300 mb-3">{insight.description}</p>

                    {/* Recommendation */}
                    <div className="bg-slate-700/30 rounded-lg p-3 mb-4 border border-slate-600">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Recommendation
                        </p>
                        <p className="text-sm text-slate-200">{insight.recommendation}</p>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-slate-500">
                        Generated {new Date(insight.timestamp).toLocaleString()}
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex flex-col gap-2">
                    <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-lg transition-colors border border-sky-500 whitespace-nowrap">
                        {insight.action}
                    </button>
                    {!insight.addressed && (
                        <button
                            onClick={() => onMarkAddressed(insight.id)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600"
                        >
                            Mark Done
                        </button>
                    )}
                    {insight.addressed && (
                        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg border border-emerald-500 text-center font-semibold">
                            Addressed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIInsightCard;
