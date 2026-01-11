import { Droplet, Heart, Wind, Trash2 } from 'lucide-react';

const PatientCard = ({ patient, onViewProfile, onViewVitals, onPrescribe, onDelete }) => {
    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-sky-500 transition-all hover:shadow-lg hover:shadow-sky-500/20">
            {/* Header with Image */}
            <div className="relative h-48 bg-gradient-to-b from-slate-700 to-slate-800 overflow-hidden group">
                {patient.photo ? (
                    <img
                        src={patient.photo}
                        alt={patient.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-700">
                        <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center text-2xl font-bold text-slate-300">
                            {patient.name.charAt(0)}
                        </div>
                    </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            patient.status === 'CRITICAL'
                                ? 'border-red-500 text-red-400 bg-red-500/10'
                                : patient.status === 'WARNING'
                                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                                : 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                        }`}
                    >
                        {patient.status}
                    </span>
                </div>
            </div>

            {/* Patient Info */}
            <div className="p-4 space-y-3">
                {/* Name and Room */}
                <div>
                    <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{patient.room}</span>
                        <span>Age {patient.age}</span>
                    </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Heart Rate */}
                    <div className="bg-slate-700/50 rounded-lg p-2 border border-slate-600">
                        <div className="flex items-center gap-1 text-red-400 text-xs font-semibold mb-1">
                            <Heart className="w-3 h-3" />
                            HR
                        </div>
                        <p className="text-lg font-bold text-white">{patient.heartRate}</p>
                        <p className="text-xs text-slate-400">bpm</p>
                    </div>

                    {/* Blood Pressure */}
                    <div className="bg-slate-700/50 rounded-lg p-2 border border-slate-600">
                        <div className="flex items-center gap-1 text-blue-400 text-xs font-semibold mb-1">
                            <Droplet className="w-3 h-3" />
                            BP
                        </div>
                        <p className="text-lg font-bold text-white">{patient.bloodPressure}</p>
                        <p className="text-xs text-slate-400">mmHg</p>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-slate-700/50 rounded-lg p-2 border border-slate-600">
                        <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold mb-1">
                            <Wind className="w-3 h-3" />
                            SpO2
                        </div>
                        <p className="text-lg font-bold text-white">{patient.spo2}%</p>
                        <p className="text-xs text-slate-400">O2</p>
                    </div>
                </div>

                {/* Additional Vitals */}
                <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-700 pt-3">
                    <div>
                        <p className="text-slate-400">Temp</p>
                        <p className="text-white font-semibold">{patient.temperature}°F</p>
                    </div>
                    <div>
                        <p className="text-slate-400">RR</p>
                        <p className="text-white font-semibold">{patient.respiratoryRate}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Glucose</p>
                        <p className="text-white font-semibold">{patient.glucose || 'N/A'}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => onViewProfile(patient.id)}
                        className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => onViewVitals(patient.id)}
                        className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-lg transition-colors border border-sky-500 hover:border-sky-400"
                    >
                        Vitals
                    </button>
                    <button
                        onClick={() => onPrescribe(patient.id)}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors border border-emerald-500 hover:border-emerald-400"
                    >
                        Prescribe
                    </button>
                </div>

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(patient.id, patient.name)}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors border border-red-500 hover:border-red-400 flex items-center justify-center gap-2 mt-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Patient
                </button>
            </div>
        </div>
    );
};

export default PatientCard;
