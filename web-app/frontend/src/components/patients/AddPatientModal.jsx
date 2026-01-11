import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, Upload, Cpu } from 'lucide-react';
import { api } from '../../services/api';

export default function AddPatientModal({ isOpen, onClose, onAddPatient }) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableDevices, setAvailableDevices] = useState([]);
  
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    relationship: 'Spouse',
    room: '',
    
    // Medical Info
    bloodType: 'O+',
    allergies: '',
    medicalHistory: '',
    currentMedications: '',
    insuranceProvider: '',
    insuranceId: '',
    notes: '',
    
    // Device Assignment (optional)
    assignedDeviceId: '',
  });

  // Fetch available devices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableDevices();
    }
  }, [isOpen]);

  const fetchAvailableDevices = async () => {
    try {
      const response = await api.get('/devices/register');
      // Filter only AVAILABLE devices
      const available = (response.data || []).filter(
        device => device.assignment_status === 'AVAILABLE' && device.status === 'ONLINE'
      );
      setAvailableDevices(available);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setAvailableDevices([]);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handlePhotoUpload = (files) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handlePhotoUpload(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    
    const newPatient = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      age: age,
      room: formData.room || `Room ${Math.floor(Math.random() * 400) + 100}`,
      status: 'Active',
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      bloodType: formData.bloodType,
      allergies: formData.allergies,
      medicalHistory: formData.medicalHistory,
      currentMedications: formData.currentMedications,
      insuranceProvider: formData.insuranceProvider,
      insuranceId: formData.insuranceId,
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.relationship,
      },
      photo: photoPreview,
      clinicalNotes: formData.notes,
      assignedDeviceId: formData.assignedDeviceId || null,
      addedDate: new Date().toISOString(),
    };

    // If device is assigned, call the assignment API
    if (formData.assignedDeviceId) {
      try {
        await api.post(`/devices/${formData.assignedDeviceId}/assign`, {
          patient_id: newPatient.id,
          patient_name: newPatient.name
        });
        console.log(`✅ Device ${formData.assignedDeviceId} assigned to ${newPatient.name}`);
      } catch (error) {
        console.error('Failed to assign device:', error);
        alert('Patient registered but device assignment failed. Please assign manually.');
      }
    }

    onAddPatient(newPatient);
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      phoneNumber: '',
      email: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      relationship: 'Spouse',
      room: '',
      bloodType: 'O+',
      allergies: '',
      medicalHistory: '',
      currentMedications: '',
      insuranceProvider: '',
      insuranceId: '',
      notes: '',
      assignedDeviceId: '',
    });
    setPhotoPreview(null);
    setActiveTab('basic');
    onClose();
  };

  if (!isOpen) return null;

  const age = calculateAge(formData.dateOfBirth);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-900">
          <h2 className="text-2xl font-bold text-white">Add New Patient</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6 pt-4">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'basic'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'medical'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Medical Info
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Photo Upload */}
              <div className="flex gap-6">
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-28 h-28 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center transition-colors ${
                    isDragging
                      ? 'border-blue-400 bg-blue-400/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-slate-400" />
                      <p className="text-xs text-slate-400 mt-1">Photo</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Personal Info */}
                <div className="flex-1 space-y-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                        errors.firstName ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                        errors.lastName ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date of Birth: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors ${
                        errors.dateOfBirth ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gender: <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mt-2">
                    {['Male', 'Female', 'Other'].map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={handleInputChange}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Age Display */}
              {age && (
                <div className="bg-slate-800 p-3 rounded-lg">
                  <p className="text-slate-300">
                    <span className="text-sm">Age: </span>
                    <span className="text-lg font-semibold text-slate-100">{age}</span>
                  </p>
                </div>
              )}

              {/* Phone and Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+94 23 567 8901"
                    className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                      errors.phoneNumber ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Room Number (Optional)
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="e.g., Room 302A"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Device Assignment */}
              <div className="bg-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-slate-200">Device Assignment (Optional)</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Assign Wearable Device:
                  </label>
                  <select
                    name="assignedDeviceId"
                    value={formData.assignedDeviceId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">No device assigned</option>
                    {availableDevices.map(device => (
                      <option key={device.id} value={device.device_id}>
                        {device.device_name} ({device.device_id})
                      </option>
                    ))}
                  </select>
                  {availableDevices.length === 0 && (
                    <p className="text-xs text-slate-500 mt-2">No available devices online</p>
                  )}
                  {formData.assignedDeviceId && (
                    <p className="text-xs text-blue-400 mt-2">
                      Device will be assigned to patient upon registration
                    </p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-800 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-slate-200">Emergency Contact</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                        errors.emergencyContactName ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.emergencyContactName && (
                      <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      placeholder="+94 23 567 8901"
                      className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                        errors.emergencyContactPhone ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Relationship:
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'].map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Medical Info Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Blood Type and Allergies */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Blood Type:
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Allergies:
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="e.g., Penicillin, Shellfish"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Medical History */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Medical History:
                </label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  placeholder="e.g., Hypertension, Diabetes, Asthma"
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Current Medications */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Medications:
                </label>
                <textarea
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Insurance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Insurance Provider:
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    placeholder="e.g., AIA Insurance"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Insurance ID:
                  </label>
                  <input
                    type="text"
                    name="insuranceId"
                    value={formData.insuranceId}
                    onChange={handleInputChange}
                    placeholder="Policy number"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Vitals */}
              <div className="bg-slate-800 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-slate-200">Initial Vitals</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Heart Rate (bpm):
                    </label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      SpO2 (%):
                    </label>
                    <input
                      type="number"
                      name="spo2"
                      value={formData.spo2}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Blood Pressure:
                    </label>
                    <input
                      type="text"
                      name="bloodPressure"
                      value={formData.bloodPressure}
                      onChange={handleInputChange}
                      placeholder="120/80"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Temperature (°F):
                    </label>
                    <input
                      type="number"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Respiratory Rate (breaths/min):
                    </label>
                    <input
                      type="number"
                      name="respiratoryRate"
                      value={formData.respiratoryRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Glucose (mg/dL):
                    </label>
                    <input
                      type="number"
                      name="glucose"
                      value={formData.glucose}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Clinical Notes:
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional clinical notes..."
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
