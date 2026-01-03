import { useState } from 'react'
import { X } from 'lucide-react'

const AddPrescriptionModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    category: 'Cardiovascular',
    patientId: '',
    notes: '',
  })

  const [patients] = useState([
    { id: 1, name: 'Wathsala Dewmina', room: 'Room No. 302A' },
    { id: 2, name: 'Wooshan Gamage', room: 'Room No. 108C' },
    { id: 3, name: 'Rivindu Ashinsa', room: 'Ward 3 2A' },
    { id: 4, name: 'Robert Key', room: 'Room No. 152B' },
    { id: 5, name: 'Lakindu Minosha', room: 'Ward 1 10C' },
    { id: 6, name: 'Ben Southern', room: 'Room No. 311B' },
    { id: 7, name: 'Emma Davis', room: 'Room No. 250A' },
    { id: 8, name: 'Michael Johnson', room: 'Room No. 410C' },
  ])

  const categories = [
    'Cardiovascular',
    'Respiratory',
    'Gastrointestinal',
    'Antibiotic',
    'Pain Relief',
    'Diabetes',
    'Neurological',
    'Rheumatology',
  ]

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

    const newPrescription = {
      id: Date.now(),
      medicationName: formData.medicationName,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      status: 'ACTIVE',
      category: formData.category,
      patientName: selectedPatient?.name || '',
      patientId: parseInt(formData.patientId),
      patientRoom: selectedPatient?.room || '',
      prescribedBy: 'Dr. Admin',
      prescribedDate: new Date(),
      lastDispensed: 'Today',
      nextDue: 'Tomorrow',
      adherence: 'N/A',
      notes: formData.notes,
      refillsRemaining: 3,
      totalDispenses: 0,
      indications: '',
      sideEffects: '',
      contraindications: '',
    }

    onAdd(newPrescription)
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      category: 'Cardiovascular',
      patientId: '',
      notes: '',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
          <h2 className="text-xl font-bold text-white">Add New Prescription</h2>
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
            {/* Medication Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Medication Name *
              </label>
              <input
                type="text"
                name="medicationName"
                value={formData.medicationName}
                onChange={handleChange}
                required
                placeholder="e.g., Aspirin"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                required
                placeholder="e.g., 100mg"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Frequency *
              </label>
              <input
                type="text"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
                placeholder="e.g., 1 tablet once daily"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Duration *
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                placeholder="e.g., 30 days"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
                    {patient.name} ({patient.room})
                  </option>
                ))}
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
              placeholder="Add any notes about this prescription..."
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
              Add Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPrescriptionModal
