import { useState } from 'react'
import { Plus, Filter, AlertTriangle, Eye } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffIncidents() {
  const [activeTab, setActiveTab] = useState('open')
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      number: 'IR-2025-1148',
      type: 'Patient Safety',
      severity: 'High',
      status: 'Under Investigation',
      time: 'Nov 1, 2:15 PM',
      timeAgo: '15 mins ago',
      location: 'Room 410C',
      patient: 'Emma Davis (67F)',
      summary:
        'Near-fall incident. Patient attempted ambulation without assist. Caught by staff before hitting ground. No injuries sustained.',
      actions: [
        'Patient assessed - no injury',
        'MD notified',
        'Bed alarm activated',
        'Fall risk sign posted'
      ],
      reportedBy: 'Nurse Peterson'
    },
    {
      id: 2,
      number: 'IR-2025-1145',
      type: 'Equipment Malfunction',
      severity: 'Medium',
      status: 'Awaiting Biomed',
      time: 'Nov 1, 10:15 AM',
      timeAgo: '2 hours ago',
      location: 'Med Room A',
      summary: 'Auto-Dispenser jammed - unable to dispense medications',
      actions: ['Dispenser locked', 'Biomed contacted'],
      reportedBy: 'Nurse Johnson'
    }
  ])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High':
        return 'bg-red-900/20 border-red-900/50 text-red-300'
      case 'Medium':
        return 'bg-amber-900/20 border-amber-900/50 text-amber-300'
      default:
        return 'bg-emerald-900/20 border-emerald-900/50 text-emerald-300'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'High':
        return '🔴'
      case 'Medium':
        return '🟡'
      default:
        return '🟢'
    }
  }

  const filteredIncidents = incidents.filter((i) => {
    if (activeTab === 'open') return ['Under Investigation', 'Awaiting Biomed'].includes(i.status)
    return i.status === 'Resolved'
  })

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Incident Reporting</h1>
                <p className="text-slate-400 mt-1">Stats: 24 This Month | 8 Open | 4 Today</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <Plus className="w-5 h-5" />
                Report Incident
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-700">
              {[
                { id: 'open', label: 'My Reports', count: 0 },
                { id: 'open', label: 'All (8)', count: 8 },
                { id: 'pending', label: 'Pending', count: 0 },
                { id: 'resolved', label: 'Resolved', count: 0 }
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-blue-600'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Incidents List */}
            <div className="space-y-4">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            #{incident.number} [{incident.status.toUpperCase()}]
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">{incident.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                          {getSeverityIcon(incident.severity)} {incident.severity}
                        </span>
                        <p className="text-xs text-slate-500 mt-2">{incident.timeAgo}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                      <p>
                        <span className="text-slate-400">Time:</span>{' '}
                        <span className="text-slate-300">{incident.time}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Location:</span>{' '}
                        <span className="text-slate-300">{incident.location}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Patient:</span>{' '}
                        <span className="text-slate-300">{incident.patient}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Reported By:</span>{' '}
                        <span className="text-slate-300">{incident.reportedBy}</span>
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Summary:</h4>
                      <p className="text-sm text-slate-400">{incident.summary}</p>
                    </div>

                    {/* Actions Taken */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Actions Taken:</h4>
                      <ul className="space-y-1">
                        {incident.actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-slate-400">
                            ✓ {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Full
                      </button>
                      <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded transition-colors">
                        Update
                      </button>
                      {incident.status !== 'Resolved' && (
                        <button className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition-colors">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No incidents in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
