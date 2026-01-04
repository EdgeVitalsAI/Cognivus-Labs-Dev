import { useState } from 'react'
import { Plus, Filter, AlertTriangle, Eye, MapPin, Clock, User, CheckCircle2, FileWarning, Shield } from 'lucide-react'
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
        return 'bg-red-500/10 border-red-500/20 text-red-400'
      case 'Medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      default:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
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
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Incident Reporting</h1>
                <p className="text-sm text-slate-400">24 This Month • 8 Open • 4 Today</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Report Incident
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Open Cases</p>
                    <p className="text-3xl font-bold text-white mt-1">8</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">This Month</p>
                    <p className="text-3xl font-bold text-white mt-1">24</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileWarning className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Resolved</p>
                    <p className="text-3xl font-bold text-white mt-1">16</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex gap-1 p-1 bg-slate-800/50">
                {[
                  { id: 'open', label: 'Open Cases', count: 8 },
                  { id: 'resolved', label: 'Resolved', count: 16 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Incidents List */}
              <div className="divide-y divide-slate-800">
                {filteredIncidents.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {filteredIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              incident.severity === 'High' ? 'bg-red-500/10' :
                              incident.severity === 'Medium' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                            }`}>
                              <AlertTriangle className={`w-4 h-4 ${
                                incident.severity === 'High' ? 'text-red-400' :
                                incident.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-white">
                                  {incident.number}
                                </h3>
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">
                                  {incident.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{incident.type}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{incident.timeAgo}</span>
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="bg-slate-900/50 rounded p-3 mb-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-400">Time:</span>
                              <span className="text-slate-300">{incident.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-400">Location:</span>
                              <span className="text-slate-300">{incident.location}</span>
                            </div>
                            {incident.patient && (
                              <div className="flex items-center gap-1.5 col-span-2">
                                <User className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-400">Patient:</span>
                                <span className="text-slate-300">{incident.patient}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 col-span-2">
                              <Shield className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-400">Reported By:</span>
                              <span className="text-slate-300">{incident.reportedBy}</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-white mb-1.5">Summary:</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{incident.summary}</p>
                        </div>

                        {/* Actions Taken */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-white mb-1.5">Actions Taken:</h4>
                          <div className="space-y-1">
                            {incident.actions.map((action, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-1.5">
                            <Eye className="w-3 h-3" />
                            View Full
                          </button>
                          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700">
                            Update
                          </button>
                          {incident.status !== 'Resolved' && (
                            <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No incidents in this category</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
