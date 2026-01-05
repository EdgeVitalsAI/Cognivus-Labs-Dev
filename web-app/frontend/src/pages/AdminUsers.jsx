import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Search, Filter, Edit2, Trash2, Key, CheckCircle,
  XCircle, Shield, Stethoscope, Briefcase, Mail, X, AlertTriangle
} from 'lucide-react'
import axios from 'axios'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [loading, setLoading] = useState(true)

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'doctor',
    specialty: '',
    license_number: '',
    department: '',
    employee_id: ''
  })

  const [passwordReset, setPasswordReset] = useState({
    user_id: null,
    new_password: ''
  })

  useEffect(() => {
    loadData()
  }, [roleFilter, statusFilter])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      let url = 'http://localhost:8000/api/sys/users/users?limit=1000'
      if (roleFilter !== 'all') url += `&role=${roleFilter}`
      if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active'}`

      const [usersRes, statsRes] = await Promise.all([
        axios.get(url, config),
        axios.get('http://localhost:8000/api/sys/users/statistics', config)
      ])

      setUsers(usersRes.data)
      setStatistics(statsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      if (error.response?.status === 401) {
        navigate('/sys/auth')
      }
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post('http://localhost:8000/api/sys/users/users', newUser, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setShowCreateModal(false)
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'doctor',
        specialty: '',
        license_number: '',
        department: '',
        employee_id: ''
      })
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create user')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `http://localhost:8000/api/sys/users/users/${selectedUser.id}`,
        {
          full_name: selectedUser.full_name,
          is_active: selectedUser.is_active,
          specialty: selectedUser.specialty,
          license_number: selectedUser.license_number,
          department: selectedUser.department,
          employee_id: selectedUser.employee_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setShowEditModal(false)
      setSelectedUser(null)
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}?`)) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`http://localhost:8000/api/sys/users/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to deactivate user')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        `http://localhost:8000/api/sys/users/users/${passwordReset.user_id}/reset-password`,
        { user_id: passwordReset.user_id, new_password: passwordReset.new_password },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setShowPasswordReset(false)
      setPasswordReset({ user_id: null, new_password: '' })
      alert('Password reset successfully!')
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to reset password')
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.employee_id && user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-cyan-400" />
          User Management
        </h1>
        <p className="text-sm text-slate-400">Manage doctors and staff accounts</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400">Total Users</p>
            <p className="text-3xl font-bold text-white">{statistics.total_users}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Stethoscope className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400">Doctors</p>
            <p className="text-3xl font-bold text-white">{statistics.total_doctors}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Briefcase className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400">Staff</p>
            <p className="text-3xl font-bold text-white">{statistics.total_staff}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400">Active Users</p>
            <p className="text-3xl font-bold text-white">{statistics.active_users}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-5 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="lg:col-span-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                      user.role === 'doctor'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {user.role === 'doctor' ? <Stethoscope className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-400">
                      {user.role === 'doctor' && user.specialty && (
                        <p>Specialty: {user.specialty}</p>
                      )}
                      {user.role === 'staff' && user.department && (
                        <p>Department: {user.department}</p>
                      )}
                      {user.employee_id && (
                        <p className="text-slate-600">ID: {user.employee_id}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setPasswordReset({ user_id: user.id, new_password: '' })
                          setShowPasswordReset(true)
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded text-amber-400 hover:text-amber-300 transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="p-1.5 hover:bg-slate-700 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Deactivate User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  >
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                {newUser.role === 'doctor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Specialty</label>
                      <input
                        type="text"
                        value={newUser.specialty}
                        onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">License Number</label>
                      <input
                        type="text"
                        value={newUser.license_number}
                        onChange={(e) => setNewUser({ ...newUser, license_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </>
                )}

                {newUser.role === 'staff' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                      <input
                        type="text"
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Employee ID</label>
                      <input
                        type="text"
                        value={newUser.employee_id}
                        onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
              <button
                onClick={() => setShowPasswordReset(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Warning</p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      This will reset the user's password. They will be notified to change it on next login.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password *</label>
                <input
                  type="password"
                  value={passwordReset.new_password}
                  onChange={(e) => setPasswordReset({ ...passwordReset, new_password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                  minLength={8}
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
