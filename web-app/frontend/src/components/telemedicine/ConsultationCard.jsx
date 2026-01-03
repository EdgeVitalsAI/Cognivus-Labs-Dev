import { Video, Clock, User, MapPin, Phone, XCircle, Calendar } from 'lucide-react'

const ConsultationCard = ({ consultation, onJoin, onReschedule, onCancel }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-400' }
      case 'IN_PROGRESS':
        return { bg: 'bg-sky-500/10', border: 'border-sky-500', text: 'text-sky-400' }
      case 'COMPLETED':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-400' }
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500', text: 'text-slate-400' }
    }
  }

  const status = getStatusColor(consultation.status)
  const date = new Date(consultation.date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={`${status.bg} border-l-4 ${status.border} bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4 hover:shadow-lg hover:shadow-slate-700/50 transition-all`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Status and Type */}
          <div className="flex items-center gap-3 mb-3">
            <Video className={`w-5 h-5 ${status.text}`} />
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.border} ${status.text} ${status.bg}`}>
              {consultation.status}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
              {consultation.type}
            </span>
          </div>

          {/* Patient and Doctor */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Patient</p>
              <p className="text-white font-semibold">{consultation.patient}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Doctor</p>
              <p className="text-white font-semibold">{consultation.doctorName}</p>
            </div>
          </div>

          {/* Date, Time, Room */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{consultation.time} ({consultation.duration} min)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{consultation.room}</span>
            </div>
          </div>

          {/* Notes and Symptoms */}
          <div className="bg-slate-700/30 rounded-lg p-3 mb-3 border border-slate-600">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-slate-200 mb-2">{consultation.notes}</p>
            {consultation.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {consultation.symptoms.map((symptom, idx) => (
                  <span key={idx} className="text-xs bg-slate-600 text-slate-200 px-2.5 py-1 rounded-full">
                    {symptom}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 whitespace-nowrap">
          {consultation.canJoin && (
            <button
              onClick={() => onJoin(consultation.id)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-lg transition-colors border border-sky-500 font-semibold"
            >
              Join Now
            </button>
          )}
          {(consultation.status === 'SCHEDULED' || consultation.status === 'IN_PROGRESS') && (
            <>
              <button
                onClick={() => onReschedule(consultation.id)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600"
              >
                Reschedule
              </button>
              <button
                onClick={() => onCancel(consultation.id)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-lg transition-colors border border-red-500/30"
              >
                Cancel
              </button>
            </>
          )}
          {consultation.status === 'COMPLETED' && (
            <button className="px-4 py-2 bg-emerald-600/20 text-emerald-400 text-sm rounded-lg border border-emerald-500/30 cursor-default">
              Completed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConsultationCard
