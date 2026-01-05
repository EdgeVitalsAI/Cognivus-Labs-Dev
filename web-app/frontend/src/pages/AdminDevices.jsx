import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Search, Filter, Wifi, WifiOff, Battery, BatteryCharging,
  Activity, Heart, Thermometer, Wind, Terminal, Send, RefreshCw,
  AlertTriangle, CheckCircle, Settings, Power, PlayCircle, X, ArrowLeft
} from 'lucide-react'
import axios from 'axios'

export default function AdminDevices() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceDetails, setDeviceDetails] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugCommand, setDebugCommand] = useState('')
  const [debugOutput, setDebugOutput] = useState([])

  useEffect(() => {
    loadDevices()
    const interval = setInterval(loadDevices, 5000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const loadDevices = async () => {
    try {
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

  const getStatusColor = (status) => {
    const colors = {
      online: { bg: '#e6f4ea', text: '#16a34a', border: '#16a34a' },
      offline: { bg: '#f5f5f5', text: '#666666', border: '#999999' },
      error: { bg: '#fef2f2', text: '#dc2626', border: '#dc2626' },
      maintenance: { bg: '#dbeafe', text: '#0284c7', border: '#0284c7' }
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
      backgroundColor: '#f5f5f5',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              color: '#1a1a1a',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.borderColor = '#0066cc'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#e0e0e0'
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Dashboard
          </button>
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <Package style={{ width: '32px', height: '32px', color: '#0066cc' }} />
          Device Management
        </h1>
        <p style={{ fontSize: '14px', color: '#666666' }}>
          Monitor and debug smart patient tracking devices
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
            color: '#999999'
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
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#1a1a1a',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0066cc'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
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
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#1a1a1a',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0066cc'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
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
              backgroundColor: '#0066cc',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
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
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            padding: '16px',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a1a1a',
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
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
                position: 'sticky',
                top: 0
              }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Device</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Patient</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Vitals</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Battery</th>
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
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      {/* Device Name & ID */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: device.status === 'online' ? '#16a34a' : '#999999',
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1a1a1a',
                              marginBottom: '4px'
                            }}>
                              {device.device_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#999999',
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
                              color: '#1a1a1a',
                              marginBottom: '2px'
                            }}>
                              {device.patient_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#999999'
                            }}>
                              Room {device.assigned_room}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#999999' }}>Unassigned</span>
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

                      {/* Vitals */}
                      <td style={{ padding: '16px' }}>
                        {device.status === 'online' && (
                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '13px',
                            color: '#666666'
                          }}>
                            {device.heart_rate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Heart style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                                <span>{device.heart_rate}</span>
                              </div>
                            )}
                            {device.spo2 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Wind style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                                <span>{device.spo2}%</span>
                              </div>
                            )}
                            {device.temperature && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Thermometer style={{ width: '14px', height: '14px', color: '#ea580c' }} />
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
                            color: device.battery_level > 20 ? '#666666' : '#dc2626'
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
                  color: '#cccccc',
                  margin: '0 auto 16px'
                }} />
                <p style={{
                  fontSize: '14px',
                  color: '#999999',
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
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Debug Panel Header */}
            <div style={{
              padding: '16px',
              backgroundColor: '#fafafa',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Terminal style={{ width: '18px', height: '18px', color: '#0066cc' }} />
                Debug Console
              </h2>
              <button
                onClick={() => setShowDebugPanel(false)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#666666',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0'
                  e.currentTarget.style.color = '#1a1a1a'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#666666'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Device Information Card */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#1a1a1a',
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
                  <span style={{ color: '#666666' }}>ID: </span>
                  <span style={{
                    color: '#1a1a1a',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>
                    {deviceDetails.device.device_id}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#666666' }}>Firmware: </span>
                  <span style={{ color: '#1a1a1a' }}>
                    {deviceDetails.device.firmware_version || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#666666' }}>IP: </span>
                  <span style={{
                    color: '#1a1a1a',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>
                    {deviceDetails.device.ip_address || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#666666' }}>MAC: </span>
                  <span style={{
                    color: '#1a1a1a',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}>
                    {deviceDetails.device.mac_address || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => restartDevice(deviceDetails.device.device_id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #dc2626',
                    borderRadius: '4px',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2'
                  }}
                >
                  <Power style={{ width: '14px', height: '14px' }} />
                  Restart
                </button>
                <button
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    color: '#1a1a1a',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                    e.currentTarget.style.borderColor = '#0066cc'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#e0e0e0'
                  }}
                >
                  <Settings style={{ width: '14px', height: '14px' }} />
                  Config
                </button>
              </div>
            </div>

            {/* Terminal Output */}
            <div style={{
              flex: 1,
              padding: '16px',
              backgroundColor: '#fafafa',
              borderBottom: '1px solid #e0e0e0',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '12px',
              overflowY: 'auto',
              minHeight: '200px',
              maxHeight: '300px'
            }}>
              {debugOutput.map((output, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#999999' }}>
                    [{new Date(output.timestamp).toLocaleTimeString()}]
                  </span>
                  {' '}
                  {output.type === 'command' && (
                    <span style={{ color: '#0066cc' }}>$ {output.content}</span>
                  )}
                  {output.type === 'response' && (
                    <span style={{ color: '#16a34a' }}>{output.content}</span>
                  )}
                  {output.type === 'error' && (
                    <span style={{ color: '#dc2626' }}>Error: {output.content}</span>
                  )}
                </div>
              ))}
              {debugOutput.length === 0 && (
                <p style={{ color: '#999999', margin: 0 }}>
                  Waiting for commands...
                </p>
              )}
            </div>

            {/* Command Input */}
            <div style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e0e0e0'
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
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#1a1a1a',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <button
                  onClick={sendDebugCommand}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0066cc',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#999999',
                margin: 0
              }}>
                Try: status, reboot, reset, get_logs, update_firmware
              </p>
            </div>

            {/* Recent Logs */}
            <div style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
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
                    <span style={{ color: '#999999' }}>
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    {' '}
                    <span style={{
                      color: log.log_type === 'error' ? '#dc2626' :
                             log.log_type === 'warning' ? '#eab308' :
                             log.log_type === 'debug' ? '#0066cc' : '#666666'
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
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Terminal style={{
              width: '48px',
              height: '48px',
              color: '#cccccc',
              margin: '0 auto 16px'
            }} />
            <p style={{
              fontSize: '14px',
              color: '#999999',
              margin: 0
            }}>
              Select a device to debug
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
