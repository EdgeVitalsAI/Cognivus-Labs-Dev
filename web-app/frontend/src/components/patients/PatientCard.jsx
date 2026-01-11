import { Droplet, Heart, Wind, Trash2, Activity, User, MapPin } from 'lucide-react';

const PatientCard = ({ patient, onViewProfile, onViewVitals, onPrescribe, onDelete }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {patient.photo ? (
                            <img
                                src={patient.photo}
                                alt={patient.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                                {patient.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">{patient.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
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
                    {/* Status Badge */}
                    <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            patient.status === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : patient.status === 'WARNING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                    >
                        {patient.status}
                    </span>
                </div>
            </div>

            {/* Patient Info */}
            <div className="p-4 space-y-4">
                {/* Vitals Grid */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vital Signs</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Heart Rate */}
                        <div className="bg-gradient-to-br from-red-50 to-red-50/50 rounded-lg p-3 border border-red-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Heart className="w-3.5 h-3.5 text-red-600" />
                                <span className="text-xs font-medium text-red-900">Heart Rate</span>
                            </div>
                            <p className="text-xl font-bold text-red-700">{patient.heartRate}</p>
                            <p className="text-xs text-red-600 mt-0.5">bpm</p>
                        </div>

                        {/* Blood Pressure */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Droplet className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs font-medium text-blue-900">Blood Pressure</span>
                            </div>
                            <p className="text-xl font-bold text-blue-700">{patient.bloodPressure}</p>
                            <p className="text-xs text-blue-600 mt-0.5">mmHg</p>
                        </div>

                        {/* SpO2 */}
                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-50/50 rounded-lg p-3 border border-cyan-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Wind className="w-3.5 h-3.5 text-cyan-600" />
                                <span className="text-xs font-medium text-cyan-900">Oxygen</span>
                            </div>
                            <p className="text-xl font-bold text-cyan-700">{patient.spo2}%</p>
                            <p className="text-xs text-cyan-600 mt-0.5">SpO2</p>
                        </div>
                    </div>
                </div>

                {/* Additional Vitals */}
                <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Temperature</p>
                        <p className="text-sm font-semibold text-gray-900">{patient.temperature}°F</p>
                    </div>
                    <div className="text-center border-x border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Resp. Rate</p>
                        <p className="text-sm font-semibold text-gray-900">{patient.respiratoryRate}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Glucose</p>
                        <p className="text-sm font-semibold text-gray-900">{patient.glucose || 'N/A'}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onViewProfile(patient.id)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
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
                        className="w-full px-3 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-medium rounded border border-red-200 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
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
