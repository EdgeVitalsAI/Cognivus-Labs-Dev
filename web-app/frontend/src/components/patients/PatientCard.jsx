import { Droplet, Heart, Wind, Trash2, Activity, User, MapPin, RefreshCw } from 'lucide-react';

const PatientCard = ({ patient, onViewProfile, onViewVitals, onPrescribe, onDelete, onRefresh }) => {
    // Use actual photo or placeholder
    const photoUrl = patient.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&size=200&background=3b82f6&color=ffffff&bold=true`;
    
    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header with Photo */}
            <div className="relative h-32 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                <img
                    src={photoUrl}
                    alt={patient.name}
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&size=200&background=3b82f6&color=ffffff&bold=true`;
                    }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent"></div>
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            patient.status === 'CRITICAL'
                                ? 'bg-red-900/90 text-red-200 border border-red-700'
                                : patient.status === 'WARNING'
                                ? 'bg-amber-900/90 text-amber-200 border border-amber-700'
                                : 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
                        }`}
                    >
                        {patient.status}
                    </span>
                </div>

                {/* Name overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900 to-transparent">
                    <h3 className="text-base font-semibold text-white">{patient.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {patient.age} years
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {patient.room}
                        </span>
                    </div>
                </div>
            </div>

            {/* Patient Info */}
            <div className="p-4 space-y-4">
                {/* Vitals Grid */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Vital Signs</h4>
                        </div>
                        {/* Refresh Button */}
                        <button
                            onClick={() => onRefresh && onRefresh(patient.id)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                            title="Refresh vitals"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Heart Rate */}
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Heart className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-xs font-medium text-slate-300">Heart Rate</span>
                            </div>
                            <p className="text-xl font-bold text-white">{patient.heartRate}</p>
                            <p className="text-xs text-slate-400 mt-0.5">bpm</p>
                        </div>

                        {/* Blood Pressure */}
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Droplet className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-medium text-slate-300">Blood Pressure</span>
                            </div>
                            <p className="text-xl font-bold text-white">{patient.bloodPressure}</p>
                            <p className="text-xs text-slate-400 mt-0.5">mmHg</p>
                        </div>

                        {/* SpO2 */}
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-xs font-medium text-slate-300">Oxygen</span>
                            </div>
                            <p className="text-xl font-bold text-white">{patient.spo2}%</p>
                            <p className="text-xs text-slate-400 mt-0.5">SpO2</p>
                        </div>
                    </div>
                </div>

                {/* Additional Vitals */}
                <div className="flex justify-center py-3 border-t border-slate-700">
                    <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Temperature</p>
                        <p className="text-sm font-semibold text-white">{patient.temperature}°C</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-700">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onViewProfile(patient.id)}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded transition-colors"
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => onViewVitals(patient.id)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                        >
                            Vitals
                        </button>
                        <button
                            onClick={() => onPrescribe(patient.id)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
                        >
                            Prescribe
                        </button>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                        onClick={() => onDelete(patient.id, patient.name)}
                        className="w-full px-3 py-2 bg-slate-700 hover:bg-red-900/50 text-red-400 hover:text-red-300 text-xs font-medium rounded border border-slate-600 hover:border-red-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Patient
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientCard;
