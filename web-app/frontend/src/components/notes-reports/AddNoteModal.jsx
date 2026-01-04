import { useState } from 'react'
import { X } from 'lucide-react'

const AddNoteModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    patientId: '',
    type: 'Clinical Note',
    category: 'Consultation',
    content: '',
    tags: '',
    isPrivate: false,
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

  const noteTypes = ['Clinical Note', 'Lab Report', 'Discharge Report', 'Pathology Report', 'Imaging Report']
  const categories = ['Consultation', 'Test Results', 'Hospital Reports', 'Medication Management', 'Therapy', 'Surgery', 'Radiology']

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const selectedPatient = patients.find((p) => p.id === parseInt(formData.patientId))
    const tagArray = formData.tags.split(',').map(t => t.trim()).filter(t => t)

    const newNote = {
      id: Date.now(),
      title: formData.title,
      patient: selectedPatient?.name || '',
      patientId: parseInt(formData.patientId),
      type: formData.type,
      category: formData.category,
      content: formData.content,
      tags: tagArray,
      date: new Date(),
      author: 'Dr. Sarah Smith',
      attachments: 0,
      isPrivate: formData.isPrivate,
    }

    onAdd(newNote)
    setFormData({
      title: '',
      patientId: '',
      type: 'Clinical Note',
      category: 'Consultation',
      content: '',
      tags: '',
      isPrivate: false,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
          <h2 className="text-xl font-bold text-white">Add New Note</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Note title..."
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

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
                <option value="">Select patient</option>
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
                Note Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {noteTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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

            {/* Private */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-600 accent-sky-500"
                />
                <span className="text-sm text-slate-200">Mark as Private</span>
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="Write your note..."
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., urgent, follow-up, medication"
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
              Add Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNoteModal
