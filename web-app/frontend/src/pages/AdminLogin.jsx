import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Shield, Sun, Moon } from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { theme, currentTheme, toggleTheme } = useTheme()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:8001/api/sys/auth/login', {
        username: credentials.username,
        password: credentials.password
      })

      localStorage.setItem('admin_token', response.data.access_token)
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin))

      navigate('/sys/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: currentTheme.background,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border}`,
          backgroundColor: currentTheme.cardBackground,
          color: currentTheme.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 4px ${currentTheme.shadowLight}`,
          transition: 'all 0.15s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.hoverBackground}
        onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.cardBackground}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* Left Panel - Branding */}
      <div style={{
        flex: 1,
        backgroundColor: currentTheme.primary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{
            width: '220px',
            height: '220px',
            backgroundColor: 'transparent',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            padding: '0.5rem'
          }}>
            <img src="/LOGO.png" alt="CognivusLabs" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '1rem',
            letterSpacing: '-0.5px'
          }}>
            Cognivus Health
          </h1>
          <p style={{
            fontSize: '1.125rem',
            opacity: 0.95,
            lineHeight: '1.6',
            fontWeight: '300'
          }}>
            System Administration Portal
          </p>
          <div style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.2)'
          }}>
            <p style={{
              fontSize: '0.875rem',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Secure access for authorized administrators only
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            padding: '3rem',
            borderRadius: '4px',
            border: `1px solid ${currentTheme.border}`,
            boxShadow: `0 2px 4px ${currentTheme.shadow}`
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: currentTheme.text,
                marginBottom: '0.5rem'
              }}>
                Administrator Sign In
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: currentTheme.textSecondary
              }}>
                Enter your credentials to access the system
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: theme === 'light' ? '#fef2f2' : '#3d1a1a',
                border: `1px solid ${currentTheme.error}`,
                borderRadius: '4px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <AlertCircle size={18} color={currentTheme.error} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: currentTheme.error,
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    Authentication Error
                  </p>
                  <p style={{
                    fontSize: '0.813rem',
                    color: currentTheme.error
                  }}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: currentTheme.text,
                  marginBottom: '0.5rem'
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.938rem',
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    backgroundColor: currentTheme.inputBackground,
                    color: currentTheme.text,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                  onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                  required
                  autoComplete="username"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: currentTheme.text,
                  marginBottom: '0.5rem'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.938rem',
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    backgroundColor: currentTheme.inputBackground,
                    color: currentTheme.text,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                  onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '0.938rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: loading ? currentTheme.textTertiary : currentTheme.primary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = currentTheme.primaryHover)}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = currentTheme.primary)}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${currentTheme.borderLight}`
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: currentTheme.textTertiary,
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                This is a restricted system. Unauthorized access is prohibited.
                <br />
                All activity is monitored and logged.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.813rem',
              color: currentTheme.textTertiary
            }}>
              © 2026 Cognivus Labs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
