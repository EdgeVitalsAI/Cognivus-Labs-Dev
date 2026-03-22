import { useState } from 'react'
<<<<<<< HEAD
import { Settings as SettingsIcon, Bell, Lock, User, LogOut } from 'lucide-react'
=======
import { Settings as SettingsIcon, Bell, Lock, User, LogOut, Mail, Phone, Briefcase, Clock, MapPin, Shield, Key, AlertTriangle } from 'lucide-react'
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffSettings() {
<<<<<<< HEAD
  const [sidebarOpen, setSidebarOpen] = useState(true)
=======
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
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
<<<<<<< HEAD
      <StaffSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
=======
      <StaffSidebar />
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
<<<<<<< HEAD
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
=======
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
              <p className="text-sm text-slate-400">Manage your account and preferences</p>
            </div>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-6 mb-6 max-w-4xl">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">{settings.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{settings.role}</span>
                    <span className="text-slate-600">•</span>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{settings.zone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active Now
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{settings.shift}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 max-w-4xl">
              <div className="flex gap-1 p-1 bg-slate-800/50">
                {[
                  { id: 'account', label: 'Account', icon: User },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'security', label: 'Security', icon: Lock }
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
              {activeTab === 'account' && (
                <>
                  {/* Personal Information */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                      <User className="w-5 h-5 text-slate-400" />
                      Personal Information
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="email"
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="tel"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                      Work Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={settings.role}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Shift</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={settings.shift}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Assigned Zone</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={settings.zone}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-400">
                        Work information fields are managed by your administrator and cannot be changed.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700">
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-slate-400" />
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Bell className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Push Notifications</p>
                          <p className="text-xs text-slate-400 mt-1">Receive real-time alerts on your device</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          settings.notifications ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.notifications ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Mail className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Email Alerts</p>
                          <p className="text-xs text-slate-400 mt-1">Receive notifications via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          settings.emailAlerts ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.emailAlerts ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Critical Alerts Only</p>
                          <p className="text-xs text-slate-400 mt-1">Only receive critical priority incidents</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, criticalOnly: !settings.criticalOnly })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          settings.criticalOnly ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.criticalOnly ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password Section */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                      <Key className="w-5 h-5 text-slate-400" />
                      Password
                    </h2>

                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                      <div>
                        <p className="text-white font-medium text-sm">Change Password</p>
                        <p className="text-xs text-slate-400 mt-1">Update your account password</p>
                      </div>
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-slate-400" />
                      Two-Factor Authentication
                    </h2>

                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800 hover:bg-slate-800/50 transition-colors mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Two-Factor Authentication</p>
                          <p className="text-xs text-slate-400 mt-1">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, twoFactor: !settings.twoFactor })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
                          settings.twoFactor ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
<<<<<<< HEAD
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.twoFactor ? 'translate-x-6' : 'translate-x-1'
=======
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.twoFactor ? 'translate-x-5' : 'translate-x-0.5'
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
                          }`}
                        />
                      </button>
                    </div>

                    {settings.twoFactor && (
<<<<<<< HEAD
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
=======
                      <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-xs text-emerald-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Two-factor authentication is enabled. You'll be asked for a verification code when logging in.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-red-400 mb-5 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </h2>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-900/30">
                        <div>
                          <p className="text-white font-medium text-sm">Logout All Sessions</p>
                          <p className="text-xs text-slate-400 mt-1">Sign out from all devices and browsers</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20">
                          <LogOut className="w-4 h-4" />
                          Logout All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
          </div>
        </div>
      </div>
    </div>
  )
}
