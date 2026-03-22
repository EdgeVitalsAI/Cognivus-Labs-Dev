import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import {
  Layers, Cpu, Clock, Zap, Server, HardDrive,
  Play, Pause, Square, Activity, AlertTriangle,
  Terminal, Filter
} from 'lucide-react';

export default function ModelMonitoring({ monitoringData, logsData }) {
  const { currentTheme, theme } = useTheme();
  const [logFilter, setLogFilter] = useState('all');

  const logLevels = ['all', 'ERROR', 'WARNING', 'INFO'];

  const getLogLevelStyle = (level) => {
    const styles = {
      ERROR: { color: '#ef4444', bg: theme === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)' },
      WARNING: { color: '#eab308', bg: theme === 'dark' ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.06)' },
      INFO: { color: '#3b82f6', bg: theme === 'dark' ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)' },
      DEBUG: { color: '#06b6d4', bg: theme === 'dark' ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.06)' },
    };
    return styles[level] || styles.INFO;
  };

  const getStatusStyle = (status) => {
    const styles = {
      running: { color: '#22c55e', bg: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)', label: 'Running', icon: Play },
      idle: { color: '#eab308', bg: theme === 'dark' ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.08)', label: 'Idle', icon: Pause },
      stopped: { color: '#ef4444', bg: theme === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)', label: 'Stopped', icon: Square },
    };
    return styles[status] || styles.stopped;
  };

  const getLatencyColor = (ms) => {
    if (ms < 50) return '#22c55e';
    if (ms < 100) return '#eab308';
    return '#ef4444';
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const formatUptime = (hours) => {
    const days = Math.floor(hours / 24);
    const hrs = Math.round(hours % 24);
    return days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
  };

  const filteredLogs = logsData
    ? (logFilter === 'all' ? logsData : logsData.filter(l => l.level === logFilter))
    : [];

  // Card wrapper style
  const cardStyle = {
    backgroundColor: currentTheme.surface,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '8px',
    padding: '24px',
    boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
  };

  const sectionHeader = (icon, title) => {
    const Icon = icon;
    return (
      <h2 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: currentTheme.textPrimary,
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Icon style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
        {title}
      </h2>
    );
  };

  const statBox = (label, value, icon, color) => {
    const Icon = icon;
    return (
      <div style={{
        padding: '12px',
        backgroundColor: currentTheme.hoverBackground,
        borderRadius: '8px',
        border: `1px solid ${currentTheme.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon style={{ width: '13px', height: '13px', color: color || currentTheme.textTertiary }} />
          <span style={{ fontSize: '11px', color: currentTheme.textTertiary, fontWeight: '500' }}>{label}</span>
        </div>
        <p style={{
          fontSize: '17px',
          fontWeight: '700',
          color: color || currentTheme.textPrimary,
          margin: 0,
          fontFamily: 'Consolas, monospace'
        }}>{value}</p>
      </div>
    );
  };

  const progressBar = (percent, color, height = '6px') => (
    <div style={{
      width: '100%',
      height,
      backgroundColor: currentTheme.border,
      borderRadius: '3px',
      overflow: 'hidden'
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          height,
          borderRadius: '3px',
          backgroundColor: color,
        }}
      />
    </div>
  );

  if (!monitoringData || monitoringData.length === 0) {
    return (
      <div style={cardStyle}>
        {sectionHeader(Activity, 'Model Monitoring')}
        <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '32px 0' }}>
          No monitoring data available. Run an inference to start collecting metrics.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Model Architecture & Complexity ── */}
      <div style={cardStyle}>
        {sectionHeader(Layers, 'Model Architecture & Complexity')}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px'
        }}>
          {monitoringData.map((model, idx) => {
            const dc = model.depth_complexity;
            return (
              <motion.div
                key={model.model_name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                style={{
                  padding: '18px',
                  backgroundColor: currentTheme.hoverBackground,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
                onMouseOut={(e) => e.currentTarget.style.borderColor = currentTheme.border}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
                    {model.model_name}
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '700',
                    fontFamily: 'Consolas, monospace',
                    backgroundColor: theme === 'dark' ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.1)',
                    color: '#a855f7',
                    border: `1px solid ${theme === 'dark' ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.2)'}`,
                  }}>
                    {dc.architecture}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  {statBox('Layers', dc.layers, Layers, '#3b82f6')}
                  {statBox('Parameters', formatNumber(dc.parameters), Cpu, '#a855f7')}
                  {statBox('Memory', `${dc.memory_mb}MB`, HardDrive, '#f97316')}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {statBox('Compute Cost', `${dc.compute_cost_ms}ms`, Zap, '#eab308')}
                  {statBox('Input Shape', dc.input_shape, Cpu, currentTheme.textSecondary)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Latency Metrics + Operational Status (side by side) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Latency */}
        <div style={cardStyle}>
          {sectionHeader(Clock, 'Latency Metrics')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {monitoringData.map((model, idx) => {
              const lat = model.latency;
              const latColor = getLatencyColor(lat.avg_ms);
              return (
                <motion.div
                  key={model.model_name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  style={{
                    padding: '16px',
                    backgroundColor: currentTheme.hoverBackground,
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
                      {model.model_name}
                    </h3>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: latColor,
                      fontFamily: 'Consolas, monospace',
                    }}>
                      {lat.avg_ms}ms
                    </span>
                  </div>

                  {/* Latency bar */}
                  <div style={{ marginBottom: '12px' }}>
                    {progressBar(Math.min(lat.avg_ms / 100 * 100, 100), latColor)}
                  </div>

                  {/* Min/Max/Percentiles */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Min', value: `${lat.min_ms}ms` },
                      { label: 'Max', value: `${lat.max_ms}ms` },
                      { label: 'P95', value: `${lat.p95_ms}ms` },
                      { label: 'P99', value: `${lat.p99_ms}ms` },
                    ].map(item => (
                      <span key={item.label} style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        fontFamily: 'Consolas, monospace',
                        backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(0,102,204,0.06)',
                        color: currentTheme.textSecondary,
                        border: `1px solid ${currentTheme.border}`,
                      }}>
                        {item.label}: <span style={{ color: currentTheme.textPrimary }}>{item.value}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Operational Status */}
        <div style={cardStyle}>
          {sectionHeader(Server, 'Operational Status')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {monitoringData.map((model, idx) => {
              const ops = model.operational_status;
              const res = model.resource_usage;
              const statusStyle = getStatusStyle(ops.status);
              const StatusIcon = statusStyle.icon;
              return (
                <motion.div
                  key={model.model_name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  style={{
                    padding: '16px',
                    backgroundColor: currentTheme.hoverBackground,
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>
                      {model.model_name}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      <StatusIcon style={{ width: '10px', height: '10px' }} />
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Status details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: currentTheme.textTertiary, margin: '0 0 2px 0' }}>Uptime</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: currentTheme.textPrimary, margin: 0, fontFamily: 'Consolas, monospace' }}>
                        {formatUptime(ops.uptime_hours)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: currentTheme.textTertiary, margin: '0 0 2px 0' }}>Served</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: currentTheme.textPrimary, margin: 0, fontFamily: 'Consolas, monospace' }}>
                        {ops.total_requests_served}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: currentTheme.textTertiary, margin: '0 0 2px 0' }}>Queue</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: ops.requests_in_queue > 0 ? '#eab308' : currentTheme.textPrimary, margin: 0, fontFamily: 'Consolas, monospace' }}>
                        {ops.requests_in_queue}
                      </p>
                    </div>
                  </div>

                  {/* Resource bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'CPU', value: res.cpu_percent, color: res.cpu_percent > 70 ? '#ef4444' : res.cpu_percent > 40 ? '#eab308' : '#22c55e' },
                      { label: 'GPU', value: res.gpu_percent, color: res.gpu_percent > 70 ? '#ef4444' : res.gpu_percent > 40 ? '#eab308' : '#3b82f6' },
                      { label: 'RAM', value: res.ram_percent, color: res.ram_percent > 80 ? '#ef4444' : res.ram_percent > 50 ? '#eab308' : '#a855f7' },
                    ].map(r => (
                      <div key={r.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '11px', color: currentTheme.textTertiary }}>{r.label}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: r.color, fontFamily: 'Consolas, monospace' }}>{r.value}%</span>
                        </div>
                        {progressBar(r.value, r.color, '4px')}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Troubleshooting Logs ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          {sectionHeader(Terminal, 'Troubleshooting Logs')}
        </div>

        {/* Log level filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Filter style={{ width: '14px', height: '14px', color: currentTheme.textTertiary }} />
          {logLevels.map(level => (
            <button
              key={level}
              onClick={() => setLogFilter(level)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                border: `1px solid ${logFilter === level ? currentTheme.primary : currentTheme.border}`,
                backgroundColor: logFilter === level
                  ? (theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(0,102,204,0.08)')
                  : 'transparent',
                color: logFilter === level ? currentTheme.primary : currentTheme.textSecondary,
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                if (logFilter !== level) e.currentTarget.style.borderColor = currentTheme.primary;
              }}
              onMouseOut={(e) => {
                if (logFilter !== level) e.currentTarget.style.borderColor = currentTheme.border;
              }}
            >
              {level === 'all' ? 'All' : level}
            </button>
          ))}
        </div>

        {/* Log entries */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          borderRadius: '6px',
          border: `1px solid ${currentTheme.border}`,
          backgroundColor: theme === 'dark' ? '#0d1117' : '#fafbfc',
        }}>
          {filteredLogs.length === 0 ? (
            <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '32px 0' }}>
              No log entries found
            </p>
          ) : (
            filteredLogs.map((log, idx) => {
              const levelStyle = getLogLevelStyle(log.level);
              return (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderBottom: idx < filteredLogs.length - 1 ? `1px solid ${currentTheme.border}` : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'background-color 0.15s',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Timestamp */}
                  <span style={{ color: currentTheme.textTertiary, whiteSpace: 'nowrap', flexShrink: 0, fontSize: '11px' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>

                  {/* Level badge */}
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: levelStyle.bg,
                    color: levelStyle.color,
                    flexShrink: 0,
                    minWidth: '52px',
                    textAlign: 'center',
                  }}>
                    {log.level}
                  </span>

                  {/* Model name */}
                  <span style={{ color: '#a855f7', flexShrink: 0, fontSize: '11px' }}>
                    [{log.model_name}]
                  </span>

                  {/* Message */}
                  <span style={{ color: currentTheme.textSecondary, lineHeight: '1.4', fontSize: '11px' }}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
