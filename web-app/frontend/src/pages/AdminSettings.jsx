import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Key, User, Mail, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import axios from 'axios'

export default function AdminSettings() {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('admin_user') || '{}'))
  const [activeTab, setActiveTab] = useState('profile')
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  const [passwordChange, setPasswordChange] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setShowSuccess(false)

    if (passwordChange.new_password !== passwordChange.confirm_password) {
      setError('New passwords do not match')
      return
    }

    if (passwordChange.new_password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        'http://localhost:8000/api/sys/users/change-password',
        {
          current_password: passwordChange.current_password,
          new_password: passwordChange.new_password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setShowSuccess(true)
      setPasswordChange({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })

      setTimeout(() => setShowSuccess(false), 5000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          Admin Settings
        </h1>
        <p className="text-sm text-slate-400">Manage your administrator account</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-6 mb-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-10 h-10 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{adminUser.full_name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>{adminUser.email}</span>
            </div>
            {adminUser.is_super_admin && (
              <div className="flex items-center gap-2 text-xs text-purple-400 mt-2">
                <Shield className="w-3 h-3" />
                <span>Super Administrator</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </div>
            <p className="text-xs text-slate-500">@{adminUser.username}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 max-w-4xl">
        <div className="flex gap-1 p-1 bg-slate-800/50">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Key }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl space-y-6">
        {activeTab === 'profile' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  value={adminUser.username}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={adminUser.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={adminUser.full_name}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400">
                    Account information is managed by system administrators and cannot be changed here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Key className="w-5 h-5 text-slate-400" />
              Change Password
            </h2>

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Password Changed Successfully</p>
                  <p className="text-xs text-emerald-400/80 mt-1">
                    Your password has been updated. Please use the new password for future logins.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-xs text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password *</label>
                <input
                  type="password"
                  value={passwordChange.current_password}
                  onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password *</label>
                <input
                  type="password"
                  value={passwordChange.new_password}
                  onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Enter new password (min 8 characters)"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordChange.confirm_password}
                  onChange={(e) => setPasswordChange({ ...passwordChange, confirm_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-xs text-amber-400">
                    💡 Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
