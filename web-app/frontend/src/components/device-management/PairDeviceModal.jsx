import { useState } from 'react'
import { X } from 'lucide-react'

const PairDeviceModal = ({ isOpen, onClose, onPair }) => {
  const [formData, setFormData] = useState({
    deviceName: '',
    patientId: '',
    deviceType: 'Wearable Patch',
    model: '',
    serialNumber: '',
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

  const deviceTypes = [
    { type: 'Wearable Patch', model: 'CognivusLabs ECG Monitor v1.0' },
    { type: 'Blood Pressure Monitor', model: 'OmniHealth BP-500' },
    { type: 'Glucose Monitor', model: 'AccuCheck SmartView' },
    { type: 'Sleep Tracker', model: 'SleepBuddy Pro' },
    { type: 'Pulse Oximeter', model: 'MediOx Pro' },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'deviceType') {
      const selected = deviceTypes.find(d => d.type === value)
      setFormData((prev) => ({
        ...prev,
        model: selected?.model || '',
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const selectedPatient = patients.find((p) => p.id === parseInt(formData.patientId))

    const newDevice = {
      id: Date.now(),
      name: formData.deviceName,
      patient: selectedPatient?.name || '',
      patientId: parseInt(formData.patientId),
      type: formData.deviceType,
      model: formData.model,
      serialNumber: formData.serialNumber,
      status: 'ACTIVE',
      battery: 100,
      signal: 85,
      lastSync: new Date(),
      pairedDate: new Date(),
      sensors: [],
      firmware: 'v2.0.0',
      storageUsed: 0,
      alerts: 0,
      location: 'TBD',
    }

    onPair(newDevice)
    setFormData({
      deviceName: '',
      patientId: '',
      deviceType: 'Wearable Patch',
      model: '',
      serialNumber: '',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
          <h2 className="text-xl font-bold text-white">Pair New Device</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Device Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Device Name *
            </label>
            <input
              type="text"
              name="deviceName"
              value={formData.deviceName}
              onChange={handleChange}
              required
              placeholder="e.g., Wearable Patch - Patient Name"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
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
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Device Type *
            </label>
            <select
              name="deviceType"
              value={formData.deviceType}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              {deviceTypes.map((device) => (
                <option key={device.type} value={device.type}>
                  {device.type}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              readOnly
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Serial Number *
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              required
              placeholder="Device serial number"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
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
              Pair Device
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PairDeviceModal
