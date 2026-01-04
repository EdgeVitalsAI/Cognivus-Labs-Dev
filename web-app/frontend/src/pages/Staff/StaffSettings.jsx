import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Lock, User, LogOut } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffSettings() {
  const [activeTab, setActiveTab] = useState('account')
  const [settings, setSettings] = useState({
    name: 'Jane Johnson',
    email: 'jane.johnson@hospital.com',
    phone: '(555) 123-4567',
    role: 'Staff Nurse',
    zone: 'Med Ward 3',
    shift: 'Day (7 AM - 3 PM)',
    notifications: true,
    emailAlerts: true,
    criticalOnly: false,
    twoFactor: false
  })

  const handleSave = () => {
    alert('Settings saved successfully!')
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <SettingsIcon className="w-8 h-8" />
                Settings
              </h1>
              <p className="text-slate-400 mt-1">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-700">
              {[
                { id: 'account', label: 'Account', icon: User },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Lock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-blue-600'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === 'account' && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">Role</label>
                      <input
                        type="text"
                        value={settings.role}
                        disabled
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">Shift</label>
                      <input
                        type="text"
                        value={settings.shift}
                        disabled
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Zone</label>
                    <input
                      type="text"
                      value={settings.zone}
                      disabled
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-700 flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-sm text-slate-400">Receive real-time alerts on your device</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.notifications ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-white font-medium">Email Alerts</p>
                      <p className="text-sm text-slate-400">Receive notifications via email</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.emailAlerts ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.emailAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-white font-medium">Critical Alerts Only</p>
                      <p className="text-sm text-slate-400">Only receive critical incidents</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, criticalOnly: !settings.criticalOnly })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.criticalOnly ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.criticalOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Password</h3>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors">
                      Change Password
                    </button>
                  </div>

                  <div className="border-t border-slate-700 pt-6">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-400">Add an extra layer of security</p>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, twoFactor: !settings.twoFactor })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.twoFactor ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.twoFactor ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.twoFactor && (
                      <p className="text-sm text-slate-400 px-4">
                        Two-factor authentication is enabled. You'll be asked for a verification code when logging in.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Danger Zone</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-medium rounded-lg transition-colors border border-red-900/50">
                      <LogOut className="w-4 h-4" />
                      Logout All Sessions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
