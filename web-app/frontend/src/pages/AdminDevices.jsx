import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Search, Filter, Wifi, WifiOff, Battery, BatteryCharging,
  Activity, Heart, Thermometer, Wind, Terminal, Send, RefreshCw,
  AlertTriangle, CheckCircle, Settings, Power, PlayCircle, X, ArrowLeft
} from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminDevices() {
  const navigate = useNavigate()
  const { currentTheme, theme } = useTheme()
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceDetails, setDeviceDetails] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugCommand, setDebugCommand] = useState('')
  const [debugOutput, setDebugOutput] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [deviceToAssign, setDeviceToAssign] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')

  useEffect(() => {
    loadDevices()
    const interval = setInterval(loadDevices, 5000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const loadDevices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const url = statusFilter === 'all'
        ? 'http://localhost:8001/api/sys/devices/devices'
        : `http://localhost:8001/api/sys/devices/devices?status=${statusFilter}`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDevices(response.data)
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDeviceDetails = async (deviceId) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(
        `http://localhost:8001/api/sys/devices/devices/${deviceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDeviceDetails(response.data)
      setShowDebugPanel(true)
    } catch (error) {
      console.error('Failed to load device details:', error)
    }
  }

  const sendDebugCommand = async () => {
    if (!selectedDevice || !debugCommand.trim()) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.post(
        `http://localhost:8001/api/sys/devices/devices/${selectedDevice.device_id}/debug`,
        {
          device_id: selectedDevice.device_id,
          command: debugCommand,
          parameters: {}
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setDebugOutput(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          type: 'command',
          content: debugCommand
        },
        {
          timestamp: new Date().toISOString(),
          type: 'response',
          content: response.data.message
        }
      ])
      setDebugCommand('')
    } catch (error) {
      setDebugOutput(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          type: 'error',
          content: error.response?.data?.detail || 'Command failed'
        }
      ])
    }
  }

  const restartDevice = async (deviceId) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        `http://localhost:8001/api/sys/devices/devices/${deviceId}/restart`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      loadDevices()
    } catch (error) {
      console.error('Failed to restart device:', error)
    }
  }

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get('http://localhost:8000/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPatients(response.data)
    } catch (error) {
      console.error('Failed to load patients:', error)
    }
  }

  const handleAssignDevice = async () => {
    if (!selectedPatientId || !deviceToAssign) return

    try {
      const token = localStorage.getItem('admin_token')
      const patient = patients.find(p => p.patient_id === selectedPatientId)

      await axios.post(
        `http://localhost:8000/api/sys/devices/${deviceToAssign.device_id}/assign`,
        {
          patient_id: selectedPatientId,
          patient_name: patient?.name || '',
          assigned_room: patient?.room_number || '',
          assigned_by: localStorage.getItem('admin_user') || 'admin',
          assigned_by_name: 'Admin'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setShowAssignModal(false)
      setDeviceToAssign(null)
      setSelectedPatientId('')
      loadDevices()
      alert('Device assigned successfully!')
    } catch (error) {
      console.error('Failed to assign device:', error)
      alert(error.response?.data?.detail || 'Failed to assign device')
    }
  }

  const handleUnassignDevice = async (device) => {
    if (!confirm(`Unassign device ${device.device_name} from patient ${device.patient_name}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('admin_token')

      await axios.post(
        `http://localhost:8000/api/sys/devices/${device.device_id}/unassign`,
        {
          unassigned_by: localStorage.getItem('admin_user') || 'admin'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      loadDevices()
      alert('Device unassigned successfully!')
    } catch (error) {
      console.error('Failed to unassign device:', error)
      alert(error.response?.data?.detail || 'Failed to unassign device')
    }
  }

  const openAssignModal = (device) => {
    setDeviceToAssign(device)
    setShowAssignModal(true)
    loadPatients()
  }

  const getAssignmentColor = (assignmentStatus) => {
    const isDark = theme === 'dark'

    const colors = {
      available: {
        bg: currentTheme.successBg,
        text: currentTheme.success,
        border: currentTheme.success
      },
      assigned: {
        bg: currentTheme.primaryBg,
        text: currentTheme.primary,
        border: currentTheme.primary
      },
      in_use: {
        bg: currentTheme.infoBg,
        text: currentTheme.primary,
        border: currentTheme.primary
      },
      maintenance: {
        bg: currentTheme.warningBg,
        text: currentTheme.warning,
        border: currentTheme.warning
      }
    }

    return colors[assignmentStatus] || colors.available
  }

  const getStatusColor = (status) => {
    const isDark = theme === 'dark'

    const colors = {
      online: {
        bg: currentTheme.successBg,
        text: currentTheme.success,
        border: currentTheme.success
      },
      offline: {
        bg: currentTheme.hoverBackground,
        text: currentTheme.textSecondary,
        border: currentTheme.border
      },
      error: {
        bg: currentTheme.errorBg,
        text: currentTheme.error,
        border: currentTheme.error
      },
      maintenance: {
        bg: currentTheme.primaryBg,
        text: currentTheme.primary,
        border: currentTheme.primary
      }
    }
    return colors[status] || colors.offline
  }

  const filteredDevices = devices.filter(device =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.background,
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: currentTheme.cardBackground,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '4px',
                color: currentTheme.text,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.hover
                e.currentTarget.style.borderColor = currentTheme.accent
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.cardBackground
                e.currentTarget.style.borderColor = currentTheme.border
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Back to Dashboard
            </button>
            <ThemeToggle />
          </div>
          <button
            onClick={() => loadDevices()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: currentTheme.accent,
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.opacity = '1')}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            {loading ? 'Refreshing...' : 'Refresh Devices'}
          </button>
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: currentTheme.text,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <Package style={{ width: '32px', height: '32px', color: currentTheme.accent }} />
          Device Management
        </h1>
        <p style={{ fontSize: '14px', color: currentTheme.textSecondary }}>
          Monitor and debug smart patient tracking devices • Auto-discovered ESP32 devices
        </p>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', gridColumn: 'span 2' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: currentTheme.textSecondary
          }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search devices by name, ID, or patient..."
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '12px',
              paddingTop: '10px',
              paddingBottom: '10px',
              backgroundColor: currentTheme.inputBackground,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              color: currentTheme.text,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
            onBlur={(e) => e.target.style.borderColor = currentTheme.border}
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: currentTheme.inputBackground,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              color: currentTheme.text,
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
            onBlur={(e) => e.target.style.borderColor = currentTheme.border}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Refresh Button */}
        <div>
          <button
            onClick={loadDevices}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: currentTheme.accent,
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showDebugPanel ? '1fr 1fr' : '1fr',
        gap: '24px'
      }}>
        {/* Devices List */}
        <div style={{
          backgroundColor: currentTheme.cardBackground,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: '4px',
          boxShadow: currentTheme.shadow,
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            padding: '16px',
            backgroundColor: currentTheme.sectionBackground,
            borderBottom: `1px solid ${currentTheme.border}`
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: currentTheme.text,
              margin: 0
            }}>
              Devices ({filteredDevices.length})
            </h2>
          </div>

          {/* Devices Table */}
          <div style={{
            maxHeight: 'calc(100vh - 320px)',
            overflowY: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead style={{
                backgroundColor: currentTheme.sectionBackground,
                borderBottom: `2px solid ${currentTheme.border}`,
                position: 'sticky',
                top: 0
              }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Device</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Patient</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Assignment</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Vitals</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Battery</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const statusColors = getStatusColor(device.status)
                  return (
                    <tr
                      key={device.id}
                      onClick={() => {
                        setSelectedDevice(device)
                        loadDeviceDetails(device.device_id)
                      }}
                      style={{
                        borderBottom: `1px solid ${currentTheme.border}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hover}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.cardBackground}
                    >
                      {/* Device Name & ID */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: device.status === 'online' ? currentTheme.success : currentTheme.textTertiary,
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: currentTheme.text,
                              marginBottom: '4px'
                            }}>
                              {device.device_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: currentTheme.textSecondary,
                              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                            }}>
                              {device.device_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td style={{ padding: '16px' }}>
                        {device.patient_name ? (
                          <div>
                            <div style={{
                              fontSize: '14px',
                              color: currentTheme.text,
                              marginBottom: '2px'
                            }}>
                              {device.patient_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: currentTheme.textSecondary
                            }}>
                              Room {device.assigned_room}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: currentTheme.textSecondary }}>Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: statusColors.text,
                          backgroundColor: statusColors.bg,
                          border: `1px solid ${statusColors.border}`,
                          borderRadius: '3px',
                          textTransform: 'capitalize'
                        }}>
                          {device.status}
                        </span>
                      </td>

                      {/* Assignment Status */}
                      <td style={{ padding: '16px' }}>
                        {device.assignment_status && (() => {
                          const assignmentColors = getAssignmentColor(device.assignment_status)
                          return (
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: assignmentColors.text,
                              backgroundColor: assignmentColors.bg,
                              border: `1px solid ${assignmentColors.border}`,
                              borderRadius: '3px',
                              textTransform: 'capitalize'
                            }}>
                              {device.assignment_status.replace('_', ' ')}
                            </span>
                          )
                        })()}
                      </td>

                      {/* Vitals */}
                      <td style={{ padding: '16px' }}>
                        {device.status === 'online' && (
                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '13px',
                            color: currentTheme.textSecondary
                          }}>
                            {device.heart_rate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Heart style={{ width: '14px', height: '14px', color: currentTheme.error }} />
                                <span>{device.heart_rate}</span>
                              </div>
                            )}
                            {device.spo2 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Wind style={{ width: '14px', height: '14px', color: currentTheme.info }} />
                                <span>{device.spo2}%</span>
                              </div>
                            )}
                            {device.temperature && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Thermometer style={{ width: '14px', height: '14px', color: currentTheme.warning }} />
                                <span>{device.temperature}°F</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Battery */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {device.battery_level && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: device.battery_level > 20 ? currentTheme.textSecondary : currentTheme.error
                          }}>
                            {device.battery_level > 20 ? (
                              <Battery style={{ width: '16px', height: '16px' }} />
                            ) : (
                              <BatteryCharging style={{ width: '16px', height: '16px' }} />
                            )}
                            <span>{device.battery_level}%</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {device.assignment_status === 'available' ? (
                          <button
                            onClick={() => openAssignModal(device)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#ffffff',
                              backgroundColor: currentTheme.info,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.primaryHover}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.info}
                          >
                            Assign
                          </button>
                        ) : (device.assignment_status === 'assigned' || device.assignment_status === 'in_use') ? (
                          <button
                            onClick={() => handleUnassignDevice(device)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#ffffff',
                              backgroundColor: currentTheme.error,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.error}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.error}
                          >
                            Unassign
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: currentTheme.textTertiary }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredDevices.length === 0 && (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center'
              }}>
                <Package style={{
                  width: '48px',
                  height: '48px',
                  color: currentTheme.textSecondary,
                  margin: '0 auto 16px'
                }} />
                <p style={{
                  fontSize: '14px',
                  color: currentTheme.textSecondary,
                  margin: 0
                }}>
                  No devices found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && deviceDetails && (
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            boxShadow: currentTheme.shadow,
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Debug Panel Header */}
            <div style={{
              padding: '16px',
              backgroundColor: currentTheme.sectionBackground,
              borderBottom: `1px solid ${currentTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: currentTheme.text,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Terminal style={{ width: '18px', height: '18px', color: currentTheme.accent }} />
                Debug Console
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: currentTheme.inputBackground,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: currentTheme.textTertiary
                }}>Phase 6</span>
              </h2>
              <button
                onClick={() => setShowDebugPanel(false)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: currentTheme.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.hover
                  e.currentTarget.style.color = currentTheme.text
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = currentTheme.textSecondary
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Device Information Card */}
            <div style={{
              padding: '16px',
              backgroundColor: currentTheme.sectionBackground,
              borderBottom: `1px solid ${currentTheme.border}`
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: currentTheme.text,
                marginBottom: '12px',
                marginTop: 0
              }}>
                {deviceDetails.device.device_name}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '13px',
                marginBottom: '12px'
              }}>
                <div>
                  <span style={{ color: currentTheme.textSecondary }}>ID: </span>
                  <span style={{
                    color: currentTheme.text,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>
                    {deviceDetails.device.device_id}
                  </span>
                </div>
                <div>
                  <span style={{ color: currentTheme.textSecondary }}>Firmware: </span>
                  <span style={{ color: currentTheme.text }}>
                    {deviceDetails.device.firmware_version || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: currentTheme.textSecondary }}>IP: </span>
                  <span style={{
                    color: currentTheme.text,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>
                    {deviceDetails.device.ip_address || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: currentTheme.textSecondary }}>MAC: </span>
                  <span style={{
                    color: currentTheme.text,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>
                    {deviceDetails.device.mac_address || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons - Disabled (Phase 6 Features) */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled
                  title="Phase 6 Feature - Device remote control via WebSocket/MQTT"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: currentTheme.inputBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    color: currentTheme.textTertiary,
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'not-allowed',
                    opacity: 0.5
                  }}
                >
                  <Power style={{ width: '14px', height: '14px' }} />
                  Restart (Phase 6)
                </button>
                <button
                  disabled
                  title="Phase 6 Feature - Device configuration via WebSocket/MQTT"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: currentTheme.inputBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    color: currentTheme.textTertiary,
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'not-allowed',
                    opacity: 0.5
                  }}
                >
                  <Settings style={{ width: '14px', height: '14px' }} />
                  Config (Phase 6)
                </button>
              </div>
            </div>

            {/* Terminal Output */}
            <div style={{
              flex: 1,
              padding: '16px',
              backgroundColor: currentTheme.inputBackground,
              borderBottom: `1px solid ${currentTheme.border}`,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '12px',
              overflowY: 'auto',
              minHeight: '200px',
              maxHeight: '300px',
              color: currentTheme.text
            }}>
              {debugOutput.map((output, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <span style={{ color: currentTheme.textSecondary }}>
                    [{new Date(output.timestamp).toLocaleTimeString()}]
                  </span>
                  {' '}
                  {output.type === 'command' && (
                    <span style={{ color: currentTheme.accent }}>$ {output.content}</span>
                  )}
                  {output.type === 'response' && (
                    <span style={{ color: currentTheme.success }}>{output.content}</span>
                  )}
                  {output.type === 'error' && (
                    <span style={{ color: currentTheme.error }}>Error: {output.content}</span>
                  )}
                </div>
              ))}
              {debugOutput.length === 0 && (
                <p style={{ color: currentTheme.textSecondary, margin: 0 }}>
                  Waiting for commands...
                </p>
              )}
            </div>

            {/* Command Input */}
            <div style={{
              padding: '16px',
              backgroundColor: currentTheme.cardBackground,
              borderBottom: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={debugCommand}
                  onChange={(e) => setDebugCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendDebugCommand()}
                  placeholder="Enter debug command..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: currentTheme.inputBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: currentTheme.text,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                  onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                />
                <button
                  onClick={sendDebugCommand}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.accent,
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <p style={{
                fontSize: '12px',
                color: currentTheme.textSecondary,
                margin: 0
              }}>
                Try: status, reboot, reset, get_logs, update_firmware
              </p>
            </div>

            {/* Recent Logs */}
            <div style={{
              padding: '16px',
              backgroundColor: currentTheme.cardBackground,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: currentTheme.text,
                marginBottom: '12px',
                marginTop: 0
              }}>
                Recent Logs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {deviceDetails.recent_logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      fontSize: '12px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                    }}
                  >
                    <span style={{ color: currentTheme.textSecondary }}>
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    {' '}
                    <span style={{
                      color: log.log_type === 'error' ? currentTheme.error :
                             log.log_type === 'warning' ? currentTheme.warning :
                             log.log_type === 'debug' ? currentTheme.primary : currentTheme.textSecondary
                    }}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty Debug Panel State */}
        {!showDebugPanel && (
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px',
            boxShadow: currentTheme.shadow,
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Terminal style={{
              width: '48px',
              height: '48px',
              color: currentTheme.textSecondary,
              margin: '0 auto 16px'
            }} />
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              margin: 0
            }}>
              Select a device to debug
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowAssignModal(false)}
        >
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: currentTheme.text
            }}>
              Assign Device: {deviceToAssign?.device_name}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: currentTheme.text
              }}>
                Select Patient:
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: currentTheme.text,
                  backgroundColor: currentTheme.inputBackground,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '4px',
                  outline: 'none'
                }}
              >
                <option value="">-- Select Patient --</option>
                {patients.map(patient => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.name} - Room {patient.room_number}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: currentTheme.text,
                  backgroundColor: currentTheme.inputBackground,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDevice}
                disabled={!selectedPatientId}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: selectedPatientId ? currentTheme.primary : currentTheme.textTertiary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedPatientId ? 'pointer' : 'not-allowed',
                  opacity: selectedPatientId ? 1 : 0.6
                }}
              >
                Assign Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
