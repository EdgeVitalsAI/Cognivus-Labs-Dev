import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Shield, Sun, Moon } from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function AdminLogin() {
  const navigate = useNavigate()
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
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Left Panel - Branding */}
      <div style={{
        flex: 1,
        backgroundColor: '#0066cc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <Shield size={60} color="#0066cc" strokeWidth={2} />
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
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '0.5rem'
              }}>
                Administrator Sign In
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#666'
              }}>
                Enter your credentials to access the system
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#991b1b',
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    Authentication Error
                  </p>
                  <p style={{
                    fontSize: '0.813rem',
                    color: '#dc2626'
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
                  color: '#333',
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
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                  autoComplete="username"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#333',
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
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                  backgroundColor: loading ? '#6b7280' : '#0066cc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0052a3')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#0066cc')}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
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
              color: '#6b7280'
            }}>
              © 2026 Cognivus Labs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
