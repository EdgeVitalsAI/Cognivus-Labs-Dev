import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, BarChart3, Percent } from 'lucide-react';

export default function ModelHealth({ data }) {
  const { currentTheme, theme } = useTheme();

  const getStatusConfig = (status) => {
    if (status === 'healthy') {
      return {
        color: '#22c55e',
        bg: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
        border: theme === 'dark' ? '#22c55e' : '#bbf7d0',
        label: 'Healthy',
        icon: CheckCircle,
      };
    }
    return {
      color: '#eab308',
      bg: theme === 'dark' ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.08)',
      border: theme === 'dark' ? '#eab308' : '#fef08a',
      label: 'Degraded',
      icon: AlertTriangle,
    };
  };

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '8px',
      padding: '24px',
      boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
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
        <div style={{
          padding: '6px',
          background: theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(0,102,204,0.1)',
          borderRadius: '8px',
          boxShadow: '0 0 12px rgba(59,130,246,0.35), 0 0 4px rgba(59,130,246,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Activity style={{ width: '20px', height: '20px', color: currentTheme.primary, filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.6))' }} />
        </div>
        Model Health Monitoring
      </h2>

      {data && data.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {data.map((model, i) => {
            const status = getStatusConfig(model.status);
            const StatusIcon = status.icon;
            const confidencePercent = Math.round((model.confidence || 0) * 100);
            const errorPercent = Math.round((model.errorRate || 0) * 100 * 100) / 100;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                style={{
                  padding: '20px',
                  backgroundColor: currentTheme.hoverBackground,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  transition: 'border-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
                onMouseOut={(e) => e.currentTarget.style.borderColor = currentTheme.border}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>{model.name}</h3>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: status.bg,
                    color: status.color,
                    border: `1px solid ${status.border}`,
                  }}>
                    <StatusIcon style={{ width: '12px', height: '12px' }} />
                    {status.label}
                  </span>
                </div>

                {/* Confidence bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: currentTheme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Percent style={{ width: '12px', height: '12px', color: '#22c55e', filter: 'drop-shadow(0 0 3px rgba(34,197,94,0.6))' }} /> Avg Confidence
                    </span>
                    <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600', fontFamily: 'Consolas, monospace' }}>{confidencePercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: currentTheme.border, borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidencePercent}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                      style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: currentTheme.surface,
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <BarChart3 style={{ width: '12px', height: '12px', color: currentTheme.primary, filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.6))' }} />
                      <span style={{ fontSize: '11px', color: currentTheme.textTertiary }}>Total Inferences</span>
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: '700', color: currentTheme.textPrimary, margin: 0, fontFamily: 'Consolas, monospace' }}>
                      {(model.totalInferences || 0).toLocaleString()}
                    </p>
                  </div>
                  <div style={{
                    padding: '10px',
                    backgroundColor: currentTheme.surface,
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <AlertTriangle style={{ width: '12px', height: '12px', color: errorPercent < 5 ? '#22c55e' : '#ef4444', filter: `drop-shadow(0 0 3px ${errorPercent < 5 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'})` }} />
                      <span style={{ fontSize: '11px', color: currentTheme.textTertiary }}>Error Rate</span>
                    </div>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: errorPercent < 5 ? '#22c55e' : '#ef4444',
                      margin: 0,
                      fontFamily: 'Consolas, monospace'
                    }}>
                      {errorPercent}%
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '32px 0' }}>
          No model health data available
        </p>
      )}
    </div>
  );
}