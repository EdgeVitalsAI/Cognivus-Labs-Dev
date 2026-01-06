import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Server, Database, Cpu, HardDrive, Zap, Wifi, WifiOff,
  Users, Shield, Terminal, TrendingUp, AlertTriangle, CheckCircle,
  Circle, RefreshCw, LogOut, Bell, Settings, BarChart3, Package
} from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { currentTheme, theme } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState(null)
  const [systemHealth, setSystemHealth] = useState([])
  const [devices, setDevices] = useState([])
  const [logs, setLogs] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/sys/auth')
      return
    }

    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      const [analyticsRes, healthRes, devicesRes, logsRes, metricsRes] = await Promise.all([
        axios.get('http://localhost:8001/api/sys/system/analytics', config),
        axios.get('http://localhost:8001/api/sys/system/health', config),
        axios.get('http://localhost:8001/api/sys/devices/devices?limit=10', config),
        axios.get('http://localhost:8001/api/sys/system/logs?limit=20', config),
        axios.get('http://localhost:8001/api/sys/system/metrics', config)
      ])

      setAnalytics(analyticsRes.data)
      setSystemHealth(healthRes.data)
      setDevices(devicesRes.data)
      setLogs(logsRes.data)
      setMetrics(metricsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      if (error.response?.status === 401) {
        navigate('/sys/auth')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    navigate('/sys/auth')
  }

  const getStatusColor = (status) => {
    const isDark = theme === 'dark'
    const colors = {
      healthy: { color: currentTheme.success, background: currentTheme.successBg, border: currentTheme.success },
      degraded: { color: currentTheme.warning, background: currentTheme.warningBg, border: currentTheme.warning },
      down: { color: currentTheme.error, background: currentTheme.errorBg, border: currentTheme.error },
      online: { color: currentTheme.success, background: currentTheme.successBg, border: currentTheme.success },
      offline: { color: currentTheme.textTertiary, background: currentTheme.hoverBackground, border: currentTheme.border },
      error: { color: currentTheme.error, background: currentTheme.errorBg, border: currentTheme.error },
      maintenance: { color: currentTheme.info, background: currentTheme.infoBg, border: currentTheme.info }
    }
    return colors[status] || colors.offline
  }

  const getLogLevelColor = (level) => {
    const isDark = theme === 'dark'
    const colors = {
      info: currentTheme.info,
      warning: currentTheme.warning,
      error: currentTheme.error,
      critical: currentTheme.primary || '#7c3aed',
      debug: currentTheme.info
    }
    return colors[level] || currentTheme.textSecondary
  }

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
          <p style={{
            color: currentTheme.textSecondary,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>Loading system data...</p>
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: currentTheme.surface,
        borderBottom: `1px solid ${currentTheme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: currentTheme.primary,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Terminal style={{ width: '16px', height: '16px', color: currentTheme.primary }} />
                    Administrator Control Panel
                  </h1>
                  <p style={{
                    fontSize: '11px',
                    color: currentTheme.textTertiary,
                    margin: 0,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>System Monitor v1.0</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => navigate('/sys/dashboard')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: currentTheme.textSecondary,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = currentTheme.hoverBackground
                  e.target.style.color = currentTheme.textPrimary
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = currentTheme.textSecondary
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/sys/devices')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: currentTheme.textSecondary,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = currentTheme.hoverBackground
                  e.target.style.color = currentTheme.textPrimary
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = currentTheme.textSecondary
                }}
              >
                Devices
              </button>
              <button
                onClick={() => navigate('/sys/users')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: currentTheme.textSecondary,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = currentTheme.hoverBackground
                  e.target.style.color = currentTheme.textPrimary
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = currentTheme.textSecondary
                }}
              >
                Users
              </button>
              <button
                onClick={() => navigate('/sys/settings')}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: currentTheme.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = currentTheme.hoverBackground
                  e.target.style.color = currentTheme.textPrimary
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = currentTheme.textSecondary
                }}
              >
                <Settings style={{ width: '20px', height: '20px' }} />
              </button>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.error}`,
                  borderRadius: '4px',
                  color: currentTheme.error,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = currentTheme.error
                  e.target.style.color = currentTheme.surface
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = currentTheme.surface
                  e.target.style.color = currentTheme.error
                }}
              >
                <LogOut style={{ width: '16px', height: '16px' }} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Total Devices Card */}
          <div style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                backgroundColor: currentTheme.primaryBg,
                borderRadius: '4px'
              }}>
                <Package style={{ width: '24px', height: '24px', color: currentTheme.primary }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: currentTheme.success, fontSize: '12px' }}>
                <TrendingUp style={{ width: '12px', height: '12px' }} />
                <span>+12%</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: currentTheme.textSecondary, margin: '0 0 4px 0' }}>Total Devices</p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: '0' }}>{analytics?.total_devices || 0}</p>
            <p style={{ fontSize: '12px', color: currentTheme.primary, marginTop: '8px' }}>{analytics?.online_devices || 0} online</p>
          </div>

          {/* Active Patients Card */}
          <div style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                backgroundColor: currentTheme.successBg,
                borderRadius: '4px'
              }}>
                <Users style={{ width: '24px', height: '24px', color: currentTheme.success }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: currentTheme.success, fontSize: '12px' }}>
                <TrendingUp style={{ width: '12px', height: '12px' }} />
                <span>+8%</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: currentTheme.textSecondary, margin: '0 0 4px 0' }}>Active Patients</p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: '0' }}>{analytics?.total_patients || 0}</p>
            <p style={{ fontSize: '12px', color: currentTheme.success, marginTop: '8px' }}>Monitored 24/7</p>
          </div>

          {/* Alerts Today Card */}
          <div style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                backgroundColor: currentTheme.warningBg,
                borderRadius: '4px'
              }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: currentTheme.warning }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: currentTheme.error, fontSize: '12px' }}>
                <TrendingUp style={{ width: '12px', height: '12px' }} />
                <span>+3</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: currentTheme.textSecondary, margin: '0 0 4px 0' }}>Alerts Today</p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: '0' }}>{analytics?.alerts_today || 0}</p>
            <p style={{ fontSize: '12px', color: currentTheme.warning, marginTop: '8px' }}>2 critical</p>
          </div>

          {/* System Health Card */}
          <div style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '20px',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                backgroundColor: currentTheme.infoBg,
                borderRadius: '4px'
              }}>
                <Shield style={{ width: '24px', height: '24px', color: currentTheme.info }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: currentTheme.success, fontSize: '12px' }}>
                <CheckCircle style={{ width: '12px', height: '12px' }} />
                <span>100%</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: currentTheme.textSecondary, margin: '0 0 4px 0' }}>System Health</p>
            <p style={{ fontSize: '32px', fontWeight: '600', color: currentTheme.textPrimary, margin: '0' }}>99.9%</p>
            <p style={{ fontSize: '12px', color: currentTheme.info, marginTop: '8px' }}>All systems operational</p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* System Health */}
            <div style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              padding: '24px',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Activity style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
                  System Health
                </h2>
                <button
                  onClick={loadData}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: currentTheme.textSecondary,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = currentTheme.hoverBackground
                    e.target.style.color = currentTheme.textPrimary
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.color = currentTheme.textSecondary
                  }}
                >
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {systemHealth.map((service, idx) => {
                  const statusStyle = getStatusColor(service.status)
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: currentTheme.hoverBackground,
                        border: `1px solid ${currentTheme.border}`,
                        borderRadius: '4px',
                        padding: '16px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = currentTheme.hoverBackground}
                      onMouseOut={(e) => e.target.style.backgroundColor = currentTheme.hoverBackground}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: statusStyle.color
                          }} />
                          <h3 style={{ fontSize: '14px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>{service.service_name}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {service.response_time && (
                            <span style={{ fontSize: '12px', color: currentTheme.textTertiary }}>{service.response_time}ms</span>
                          )}
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: `1px solid ${statusStyle.border}`,
                            backgroundColor: statusStyle.background,
                            color: statusStyle.color
                          }}>
                            {service.status}
                          </span>
                        </div>
                      </div>
                      {service.details && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: currentTheme.textTertiary, marginTop: '8px' }}>
                          {Object.entries(service.details).map(([key, value]) => (
                            <span key={key}>{key}: {value}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* System Metrics */}
            <div style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              padding: '24px',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Cpu style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
                System Metrics
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* CPU */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: currentTheme.textSecondary }}>CPU Usage</span>
                    <span style={{
                      fontSize: '13px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      color: currentTheme.textPrimary,
                      fontWeight: '600'
                    }}>{metrics?.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    backgroundColor: currentTheme.border,
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        backgroundColor: currentTheme.primary,
                        height: '8px',
                        borderRadius: '4px',
                        width: `${metrics?.cpu.usage}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                {/* Memory */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: currentTheme.textSecondary }}>Memory</span>
                    <span style={{
                      fontSize: '13px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      color: currentTheme.textPrimary,
                      fontWeight: '600'
                    }}>{metrics?.memory.percent.toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    backgroundColor: currentTheme.border,
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        backgroundColor: '#16a34a',
                        height: '8px',
                        borderRadius: '4px',
                        width: `${metrics?.memory.percent}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                {/* Disk */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: currentTheme.textSecondary }}>Disk Usage</span>
                    <span style={{
                      fontSize: '13px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      color: currentTheme.textPrimary,
                      fontWeight: '600'
                    }}>{metrics?.disk.percent.toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    backgroundColor: currentTheme.border,
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        backgroundColor: currentTheme.primary,
                        height: '8px',
                        borderRadius: '4px',
                        width: `${metrics?.disk.percent}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: `1px solid ${currentTheme.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                  color: currentTheme.textSecondary
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cores:</span>
                    <span style={{ color: currentTheme.textPrimary, fontWeight: '500' }}>{metrics?.cpu.cores}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Memory:</span>
                    <span style={{ color: currentTheme.textPrimary, fontWeight: '500' }}>{(metrics?.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Disk Free:</span>
                    <span style={{ color: currentTheme.textPrimary, fontWeight: '500' }}>{(metrics?.disk.free / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Devices */}
          <div style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '24px',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Package style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
              Recent Devices
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {devices.length > 0 ? devices.map((device) => {
                const statusStyle = getStatusColor(device.status)
                return (
                  <div
                    key={device.id}
                    style={{
                      backgroundColor: currentTheme.hoverBackground,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      padding: '12px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: device.status === 'online' ? currentTheme.success : currentTheme.textTertiary
                        }} />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: currentTheme.textPrimary, margin: 0 }}>{device.device_name}</p>
                          <p style={{ fontSize: '11px', color: currentTheme.textTertiary, margin: '2px 0 0 0' }}>{device.device_id}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          border: `1px solid ${statusStyle.border}`,
                          backgroundColor: statusStyle.background,
                          color: statusStyle.color
                        }}>
                          {device.status}
                        </span>
                        {device.battery_level && (
                          <p style={{ fontSize: '11px', color: currentTheme.textTertiary, margin: '4px 0 0 0' }}>{device.battery_level}% battery</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '32px 0' }}>No devices found</p>
              )}
            </div>
          </div>

          {/* System Logs */}
          <div style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            padding: '24px',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Terminal style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
              System Logs
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '400px',
              overflowY: 'auto',
              backgroundColor: currentTheme.hoverBackground,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              padding: '8px'
            }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '11px',
                    padding: '6px 8px',
                    borderRadius: '2px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = currentTheme.hoverBackground}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: currentTheme.textTertiary }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {' '}
                  <span style={{ fontWeight: '600', color: getLogLevelColor(log.level) }}>{log.level.toUpperCase()}</span>
                  {' '}
                  <span style={{ color: currentTheme.textSecondary }}>{log.service}</span>
                  {' → '}
                  <span style={{ color: currentTheme.textPrimary }}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
