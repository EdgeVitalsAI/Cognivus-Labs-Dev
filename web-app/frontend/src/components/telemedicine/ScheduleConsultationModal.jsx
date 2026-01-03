import { useState } from 'react'
import { X } from 'lucide-react'

const ScheduleConsultationModal = ({ isOpen, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: '30',
    type: 'Follow-up',
    notes: '',
  })

  const [patients] = useState([
    { id: 1, name: 'Wathsala Dewmina' },
    { id: 2, name: 'Wooshan Gamage' },
    { id: 3, name: 'Rivindu Ashinsa' },
    { id: 4, name: 'Robert Key' },
    { id: 5, name: 'Lakindu Minosha' },
    { id: 6, name: 'Ben Southern' },
    { id: 7, name: 'Emma Davis' },
    { id: 8, name: 'Michael Johnson' },
  ])

  const consultationTypes = ['Follow-up', 'Initial Consultation', 'Specialist Consultation', 'Emergency Consultation', 'Review']

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const selectedPatient = patients.find((p) => p.id === parseInt(formData.patientId))
    const [hours, minutes] = formData.time.split(':')
    const scheduledDate = new Date(formData.date)
    scheduledDate.setHours(parseInt(hours), parseInt(minutes))

    const newConsultation = {
      id: Date.now(),
      patient: selectedPatient?.name || '',
      patientId: parseInt(formData.patientId),
      status: 'SCHEDULED',
      date: scheduledDate,
      time: formData.time,
      duration: parseInt(formData.duration),
      type: formData.type,
      notes: formData.notes,
      room: `Video Room ${Math.floor(Math.random() * 4) + 1}`,
      symptoms: [],
      joinUrl: `https://meet.cognivuslabs.com/consultation/${Date.now()}`,
      doctorName: 'Dr. Sarah Smith',
      canJoin: false,
    }

    onSchedule(newConsultation)
    setFormData({
      patientId: '',
      date: '',
      time: '',
      duration: '30',
      type: 'Follow-up',
      notes: '',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
          <h2 className="text-xl font-bold text-white">Schedule Consultation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Patient */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Patient *
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Consultation Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {consultationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Duration (minutes) *
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="25">25 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
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
              placeholder="Add consultation notes..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors border border-sky-500"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleConsultationModal
