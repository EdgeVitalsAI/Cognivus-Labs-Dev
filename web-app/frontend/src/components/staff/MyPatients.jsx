import { Heart, Thermometer, AlertCircle, Wind } from 'lucide-react'

export default function MyPatients({ patients }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">My Patients</h3>
        <p className="text-xs text-slate-400 mt-1">{patients.length} assigned patients</p>
      </div>

      <div className="p-4 space-y-3">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">{patient.name}</p>
                  <p className="text-xs text-slate-400">{patient.age}y • Room {patient.room}</p>
                </div>
                {patient.alerts > 0 && (
                  <span className="px-2 py-1 bg-red-900/30 border border-red-900/50 text-red-300 text-xs rounded-full">
                    {patient.alerts} alerts
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-slate-300">
                  <Heart className="w-3 h-3 text-red-400" />
                  {patient.hr} bpm
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Thermometer className="w-3 h-3 text-orange-400" />
                  {patient.temp}°F
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <AlertCircle className="w-3 h-3 text-blue-400" />
                  {patient.bp} mmHg
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  {patient.o2}%
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors">
                  View
                </button>
                <button className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded transition-colors">
                  Vitals
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 py-6">No assigned patients</p>
        )}
      </div>
    </div>
  )
}
