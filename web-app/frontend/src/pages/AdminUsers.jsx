import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Search, Filter, Edit2, Trash2, Key, CheckCircle,
  XCircle, Shield, Stethoscope, Briefcase, Mail, X, AlertTriangle, ChevronLeft
} from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminUsers() {
  const navigate = useNavigate()
  const { currentTheme, theme } = useTheme()
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

      let url = 'http://localhost:8001/api/sys/users/users?limit=1000'
      if (roleFilter !== 'all') url += `&role=${roleFilter}`
      if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active'}`

      const [usersRes, statsRes] = await Promise.all([
        axios.get(url, config),
        axios.get('http://localhost:8001/api/sys/users/statistics', config)
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
      await axios.post('http://localhost:8001/api/sys/users/users', newUser, {
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
        `http://localhost:8001/api/sys/users/users/${selectedUser.id}`,
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
      await axios.delete(`http://localhost:8001/api/sys/users/users/${userId}`, {
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
        `http://localhost:8001/api/sys/users/users/${passwordReset.user_id}/reset-password`,
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
      <div style={{
        minHeight: '100vh',
        backgroundColor: currentTheme.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: `4px solid ${currentTheme.border}`,
            borderTop: `4px solid ${currentTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: currentTheme.secondaryText, fontSize: '14px' }}>Loading users...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.background,
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: currentTheme.cardBackground,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '4px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/sys/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: currentTheme.cardBackground,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              color: currentTheme.textPrimary,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.hoverBackground
              e.currentTarget.style.borderColor = currentTheme.primary
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.cardBackground
              e.currentTarget.style.borderColor = currentTheme.border
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Back
          </button>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users style={{ width: '24px', height: '24px', color: currentTheme.primary }} />
              User Management
            </h1>
            <p style={{ fontSize: '13px', color: currentTheme.secondaryText, margin: 0 }}>
              Manage doctors and staff accounts
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: currentTheme.primary,
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.primaryHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary}
          >
            <UserPlus style={{ width: '16px', height: '16px' }} />
            Create New User
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : '#e6f2ff',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: currentTheme.secondaryText, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Users
            </p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
              {statistics.total_users}
            </p>
          </div>

          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : '#e6f2ff',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Stethoscope style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: currentTheme.secondaryText, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Doctors
            </p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
              {statistics.total_doctors}
            </p>
          </div>

          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : '#e6f2ff',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: currentTheme.secondaryText, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Staff
            </p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
              {statistics.total_staff}
            </p>
          </div>

          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme === 'dark' ? 'rgba(22, 163, 74, 0.15)' : '#e6f7f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a' }} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: currentTheme.secondaryText, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Users
            </p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
              {statistics.active_users}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{
        backgroundColor: currentTheme.cardBackground,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '4px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: currentTheme.secondaryText
            }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or employee ID..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '4px',
                fontSize: '14px',
                color: currentTheme.textPrimary,
                backgroundColor: currentTheme.inputBackground,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = currentTheme.border}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 32px 9px 12px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              color: currentTheme.textPrimary,
              backgroundColor: currentTheme.inputBackground,
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = currentTheme.border}
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 32px 9px 12px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              color: currentTheme.textPrimary,
              backgroundColor: currentTheme.inputBackground,
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = currentTheme.border}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: currentTheme.cardBackground,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: currentTheme.tableHeaderBackground, borderBottom: `1px solid ${currentTheme.border}` }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  User Information
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Role
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Professional Details
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Created
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: index < filteredUsers.length - 1 ? `1px solid ${currentTheme.border}` : 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: currentTheme.textPrimary, margin: '0 0 4px 0' }}>
                        {user.full_name}
                      </p>
                      <p style={{ fontSize: '13px', color: currentTheme.secondaryText, margin: 0 }}>
                        {user.email}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: user.role === 'doctor'
                        ? (theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : '#e6f2ff')
                        : (theme === 'dark' ? 'rgba(22, 163, 74, 0.15)' : '#e6f7f0'),
                      border: `1px solid ${user.role === 'doctor' ? currentTheme.primary : '#16a34a'}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: user.role === 'doctor' ? currentTheme.primary : '#16a34a'
                    }}>
                      {user.role === 'doctor' ? (
                        <Stethoscope style={{ width: '12px', height: '12px' }} />
                      ) : (
                        <Briefcase style={{ width: '12px', height: '12px' }} />
                      )}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: currentTheme.secondaryText }}>
                      {user.role === 'doctor' && user.specialty && (
                        <p style={{ margin: '0 0 2px 0' }}>
                          <span style={{ fontWeight: '500' }}>Specialty:</span> {user.specialty}
                        </p>
                      )}
                      {user.role === 'doctor' && user.license_number && (
                        <p style={{ margin: '0 0 2px 0' }}>
                          <span style={{ fontWeight: '500' }}>License:</span> {user.license_number}
                        </p>
                      )}
                      {user.role === 'staff' && user.department && (
                        <p style={{ margin: '0 0 2px 0' }}>
                          <span style={{ fontWeight: '500' }}>Department:</span> {user.department}
                        </p>
                      )}
                      {user.employee_id && (
                        <p style={{ margin: '0', color: currentTheme.mutedText }}>
                          ID: {user.employee_id}
                        </p>
                      )}
                      {!user.specialty && !user.department && !user.employee_id && (
                        <span style={{ color: currentTheme.mutedText, fontStyle: 'italic' }}>No details</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {user.is_active ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: theme === 'dark' ? 'rgba(22, 163, 74, 0.15)' : '#e6f7f0',
                        border: '1px solid #16a34a',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#16a34a'
                      }}>
                        <CheckCircle style={{ width: '12px', height: '12px' }} />
                        Active
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: theme === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff0f0',
                        border: '1px solid #dc2626',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#dc2626'
                      }}>
                        <XCircle style={{ width: '12px', height: '12px' }} />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ fontSize: '13px', color: currentTheme.secondaryText, margin: 0 }}>
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <button
                        onClick={() => {
                          setPasswordReset({ user_id: user.id, new_password: '' })
                          setShowPasswordReset(true)
                        }}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(234, 179, 8, 0.15)' : '#fffbeb'
                          e.currentTarget.style.borderColor = '#eab308'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = currentTheme.border
                        }}
                        title="Reset Password"
                      >
                        <Key style={{ width: '16px', height: '16px', color: '#eab308' }} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : '#e6f2ff'
                          e.currentTarget.style.borderColor = currentTheme.primary
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = currentTheme.border
                        }}
                        title="Edit User"
                      >
                        <Edit2 style={{ width: '16px', height: '16px', color: currentTheme.primary }} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff0f0'
                          e.currentTarget.style.borderColor = '#dc2626'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = currentTheme.border
                        }}
                        title="Deactivate User"
                      >
                        <Trash2 style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div style={{
              padding: '80px 20px',
              textAlign: 'center'
            }}>
              <Users style={{ width: '48px', height: '48px', color: currentTheme.border, margin: '0 auto 16px' }} />
              <p style={{ fontSize: '14px', color: currentTheme.mutedText, margin: 0 }}>No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${currentTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: currentTheme.tableHeaderBackground
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                Create New User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '20px', height: '20px', color: currentTheme.secondaryText }} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Role <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      backgroundColor: currentTheme.inputBackground,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      backgroundColor: currentTheme.inputBackground,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Email <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      backgroundColor: currentTheme.inputBackground,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Password <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      backgroundColor: currentTheme.inputBackground,
                      outline: 'none'
                    }}
                  />
                </div>

                {newUser.role === 'doctor' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          Specialty
                        </label>
                        <input
                          type="text"
                          value={newUser.specialty}
                          onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          License Number
                        </label>
                        <input
                          type="text"
                          value={newUser.license_number}
                          onChange={(e) => setNewUser({ ...newUser, license_number: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {newUser.role === 'staff' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          Department
                        </label>
                        <input
                          type="text"
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={newUser.employee_id}
                          onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: `1px solid ${currentTheme.border}`
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: currentTheme.cardBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    color: currentTheme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.cardBackground}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: currentTheme.primary,
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.primaryHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${currentTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: currentTheme.tableHeaderBackground
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                Edit User
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '20px', height: '20px', color: currentTheme.secondaryText }} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedUser.full_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: currentTheme.textPrimary,
                      backgroundColor: currentTheme.inputBackground,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: currentTheme.mutedText,
                      backgroundColor: currentTheme.disabledBackground,
                      cursor: 'not-allowed',
                      outline: 'none'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: currentTheme.mutedText, margin: '4px 0 0 0' }}>
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: currentTheme.textPrimary
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedUser.is_active}
                      onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontWeight: '500' }}>Active User</span>
                  </label>
                  <p style={{ fontSize: '12px', color: currentTheme.secondaryText, margin: '4px 0 0 24px' }}>
                    Inactive users cannot log in to the system
                  </p>
                </div>

                {selectedUser.role === 'doctor' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          Specialty
                        </label>
                        <input
                          type="text"
                          value={selectedUser.specialty || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, specialty: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          License Number
                        </label>
                        <input
                          type="text"
                          value={selectedUser.license_number || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, license_number: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.role === 'staff' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          Department
                        </label>
                        <input
                          type="text"
                          value={selectedUser.department || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentTheme.textPrimary,
                          marginBottom: '6px'
                        }}>
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={selectedUser.employee_id || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, employee_id: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: currentTheme.textPrimary,
                            backgroundColor: currentTheme.inputBackground,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: `1px solid ${currentTheme.border}`
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: currentTheme.cardBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    color: currentTheme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.cardBackground}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: currentTheme.primary,
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.primaryHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${currentTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: currentTheme.tableHeaderBackground
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                Reset User Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordReset(false)
                  setPasswordReset({ user_id: null, new_password: '' })
                }}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '20px', height: '20px', color: currentTheme.secondaryText }} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ padding: '24px' }}>
              <div style={{
                padding: '12px 16px',
                backgroundColor: theme === 'dark' ? 'rgba(234, 179, 8, 0.15)' : '#fffbeb',
                border: '1px solid #eab308',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle style={{
                    width: '20px',
                    height: '20px',
                    color: '#eab308',
                    flexShrink: 0,
                    marginTop: '2px'
                  }} />
                  <div>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: theme === 'dark' ? '#fde047' : '#854d0e',
                      margin: '0 0 4px 0'
                    }}>
                      Warning
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: theme === 'dark' ? '#fde047' : '#854d0e',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      This will reset the user's password. They will be notified to change it on next login.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: currentTheme.textPrimary,
                  marginBottom: '6px'
                }}>
                  New Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  value={passwordReset.new_password}
                  onChange={(e) => setPasswordReset({ ...passwordReset, new_password: e.target.value })}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: currentTheme.textPrimary,
                    backgroundColor: currentTheme.inputBackground,
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '12px', color: currentTheme.mutedText, margin: '4px 0 0 0' }}>
                  Minimum 8 characters required
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: `1px solid ${currentTheme.border}`
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false)
                    setPasswordReset({ user_id: null, new_password: '' })
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: currentTheme.cardBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    color: currentTheme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.cardBackground}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#eab308',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ca8a04'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eab308'}
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
