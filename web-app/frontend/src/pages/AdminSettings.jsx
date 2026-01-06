import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Key, User, Mail, Shield, AlertTriangle, CheckCircle, ArrowLeft, Sun, Moon } from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminSettings() {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('admin_user') || '{}'))
  const [activeTab, setActiveTab] = useState('profile')
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const { currentTheme, theme } = useTheme()

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
        'http://localhost:8001/api/sys/users/change-password',
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

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: currentTheme.background,
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }

  const headerContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }

  const backButtonStyle = {
    padding: '8px 16px',
    backgroundColor: currentTheme.cardBackground,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: currentTheme.textSecondary,
    transition: 'all 0.2s'
  }

  const headerStyle = {
    flex: 1
  }

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '600',
    color: currentTheme.text,
    margin: '0 0 4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }

  const subtitleStyle = {
    fontSize: '14px',
    color: currentTheme.textSecondary,
    margin: 0
  }

  const contentWrapperStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  }

  const profileCardStyle = {
    backgroundColor: currentTheme.cardBackground,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '4px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }

  const profileContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  }

  const avatarStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: theme === 'dark' ? 'rgba(0, 102, 204, 0.2)' : '#e3f2fd',
    border: `2px solid ${currentTheme.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const profileInfoStyle = {
    flex: 1
  }

  const profileNameStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: currentTheme.text,
    margin: '0 0 8px 0'
  }

  const profileEmailStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: currentTheme.textSecondary,
    marginBottom: '8px'
  }

  const superAdminBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#7c3aed',
    backgroundColor: theme === 'dark' ? 'rgba(124, 58, 237, 0.2)' : '#f3e8ff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: '500'
  }

  const profileStatusStyle = {
    textAlign: 'right'
  }

  const statusBadgeStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#16a34a',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
    justifyContent: 'flex-end'
  }

  const statusDotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#16a34a'
  }

  const usernameStyle = {
    fontSize: '12px',
    color: currentTheme.textTertiary
  }

  const tabsContainerStyle = {
    backgroundColor: currentTheme.cardBackground,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }

  const tabsWrapperStyle = {
    display: 'flex',
    gap: '0',
    borderBottom: `1px solid ${currentTheme.border}`
  }

  const getTabStyle = (isActive) => ({
    flex: '1',
    padding: '16px 24px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    backgroundColor: isActive ? currentTheme.cardBackground : currentTheme.hoverBackground,
    color: isActive ? currentTheme.primary : currentTheme.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    borderBottom: isActive ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
    outline: 'none'
  })

  const cardStyle = {
    backgroundColor: currentTheme.cardBackground,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '4px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }

  const cardHeaderStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: currentTheme.text,
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${currentTheme.border}`
  }

  const formGroupStyle = {
    marginBottom: '20px'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: currentTheme.text,
    marginBottom: '6px'
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '4px',
    backgroundColor: currentTheme.cardBackground,
    color: currentTheme.text,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  }

  const inputDisabledStyle = {
    ...inputStyle,
    backgroundColor: currentTheme.hoverBackground,
    color: currentTheme.textTertiary,
    cursor: 'not-allowed'
  }

  const inputFocusStyle = {
    borderColor: currentTheme.primary
  }

  const infoBannerStyle = {
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? 'rgba(0, 102, 204, 0.2)' : '#e3f2fd',
    border: theme === 'dark' ? '1px solid rgba(0, 102, 204, 0.3)' : '1px solid #90caf9',
    borderRadius: '4px',
    marginTop: '24px'
  }

  const infoBannerTextStyle = {
    fontSize: '13px',
    color: theme === 'dark' ? '#90caf9' : '#0284c7',
    margin: 0
  }

  const warningBannerStyle = {
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : '#fef3c7',
    border: theme === 'dark' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid #fbbf24',
    borderRadius: '4px',
    marginBottom: '20px'
  }

  const warningBannerTextStyle = {
    fontSize: '13px',
    color: theme === 'dark' ? '#fbbf24' : '#92400e',
    margin: 0
  }

  const successMessageStyle = {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#1a2e1a' : '#f0fdf4',
    border: theme === 'dark' ? '1px solid #16a34a' : '1px solid #86efac',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  }

  const errorMessageStyle = {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#3d1a1a' : '#fef2f2',
    border: theme === 'dark' ? '1px solid #dc2626' : '1px solid #fca5a5',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  }

  const messageContentStyle = {
    flex: 1
  }

  const messageTitleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  }

  const messageTextStyle = {
    fontSize: '13px',
    margin: 0
  }

  const submitButtonStyle = {
    width: '100%',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: currentTheme.primary,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '24px'
  }

  const dividerStyle = {
    height: '1px',
    backgroundColor: currentTheme.border,
    margin: '24px 0',
    border: 'none'
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerContainerStyle}>
        <button
          style={backButtonStyle}
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.hoverBackground
            e.currentTarget.style.borderColor = currentTheme.primary
            e.currentTarget.style.color = currentTheme.primary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.cardBackground
            e.currentTarget.style.borderColor = currentTheme.border
            e.currentTarget.style.color = currentTheme.textSecondary
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back
        </button>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <SettingsIcon style={{ width: '28px', height: '28px', color: currentTheme.primary }} />
            Administrator Settings
          </h1>
          <p style={subtitleStyle}>Manage your administrator account and security settings</p>
        </div>
        <ThemeToggle />
      </div>

      <div style={contentWrapperStyle}>
        {/* Profile Card */}
        <div style={profileCardStyle}>
          <div style={profileContentStyle}>
            <div style={avatarStyle}>
              <Shield style={{ width: '40px', height: '40px', color: currentTheme.primary }} />
            </div>
            <div style={profileInfoStyle}>
              <h2 style={profileNameStyle}>{adminUser.full_name}</h2>
              <div style={profileEmailStyle}>
                <Mail style={{ width: '14px', height: '14px' }} />
                <span>{adminUser.email}</span>
              </div>
              {adminUser.is_super_admin && (
                <div style={superAdminBadgeStyle}>
                  <Shield style={{ width: '12px', height: '12px' }} />
                  <span>Super Administrator</span>
                </div>
              )}
            </div>
            <div style={profileStatusStyle}>
              <div style={statusBadgeStyle}>
                <div style={statusDotStyle} />
                Active
              </div>
              <p style={usernameStyle}>@{adminUser.username}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabsContainerStyle}>
          <div style={tabsWrapperStyle}>
            <button
              onClick={() => setActiveTab('profile')}
              style={getTabStyle(activeTab === 'profile')}
              onMouseEnter={(e) => {
                if (activeTab !== 'profile') {
                  e.currentTarget.style.backgroundColor = currentTheme.hoverBackground
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'profile') {
                  e.currentTarget.style.backgroundColor = currentTheme.hoverBackground
                }
              }}
            >
              <User style={{ width: '16px', height: '16px' }} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={getTabStyle(activeTab === 'security')}
              onMouseEnter={(e) => {
                if (activeTab !== 'security') {
                  e.currentTarget.style.backgroundColor = currentTheme.hoverBackground
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'security') {
                  e.currentTarget.style.backgroundColor = currentTheme.hoverBackground
                }
              }}
            >
              <Key style={{ width: '16px', height: '16px' }} />
              Security
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'profile' && (
            <div style={cardStyle}>
              <h2 style={cardHeaderStyle}>
                <User style={{ width: '20px', height: '20px', color: currentTheme.textSecondary }} />
                Account Information
              </h2>

              <div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text"
                    value={adminUser.username}
                    disabled
                    style={inputDisabledStyle}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={adminUser.email}
                    disabled
                    style={inputDisabledStyle}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={adminUser.full_name}
                    disabled
                    style={inputDisabledStyle}
                  />
                </div>

                <div style={infoBannerStyle}>
                  <p style={infoBannerTextStyle}>
                    Account information is managed by system administrators and cannot be changed here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={cardStyle}>
              <h2 style={cardHeaderStyle}>
                <Key style={{ width: '20px', height: '20px', color: currentTheme.textSecondary }} />
                Change Password
              </h2>

              {/* Success Message */}
              {showSuccess && (
                <div style={successMessageStyle}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0 }} />
                  <div style={messageContentStyle}>
                    <p style={{ ...messageTitleStyle, color: '#16a34a' }}>Password Changed Successfully</p>
                    <p style={{ ...messageTextStyle, color: '#15803d' }}>
                      Your password has been updated. Please use the new password for future logins.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={errorMessageStyle}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0 }} />
                  <div style={messageContentStyle}>
                    <p style={{ ...messageTitleStyle, color: '#dc2626' }}>Error</p>
                    <p style={{ ...messageTextStyle, color: '#b91c1c' }}>{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordChange}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Current Password *</label>
                  <input
                    type="password"
                    value={passwordChange.current_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
                    style={inputStyle}
                    placeholder="Enter your current password"
                    required
                    onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                    onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>New Password *</label>
                  <input
                    type="password"
                    value={passwordChange.new_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
                    style={inputStyle}
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                    onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                    onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordChange.confirm_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, confirm_password: e.target.value })}
                    style={inputStyle}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                    onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                  />
                </div>

                <hr style={dividerStyle} />

                <div style={warningBannerStyle}>
                  <p style={warningBannerTextStyle}>
                    Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>

                <button
                  type="submit"
                  style={submitButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.primaryHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary}
                >
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
