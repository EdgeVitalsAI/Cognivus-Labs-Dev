import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Clock, Cpu, Gauge } from 'lucide-react';

export default function InferenceResult({ result }) {
  const { currentTheme, theme } = useTheme();

  if (!result) return null;

  const inference = result.output || result;
  const severity = inference.severity || 'MEDIUM';

  const severityConfig = {
    CRITICAL: { color: '#ef4444', bg: theme === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)', border: theme === 'dark' ? '#ef4444' : '#fecaca', icon: AlertTriangle, label: 'Critical Risk' },
    HIGH: { color: '#f97316', bg: theme === 'dark' ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)', border: theme === 'dark' ? '#f97316' : '#fed7aa', icon: AlertTriangle, label: 'High Risk' },
    MEDIUM: { color: '#eab308', bg: theme === 'dark' ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.08)', border: theme === 'dark' ? '#eab308' : '#fef08a', icon: AlertTriangle, label: 'Medium Risk' },
    LOW: { color: '#22c55e', bg: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)', border: theme === 'dark' ? '#22c55e' : '#bbf7d0', icon: CheckCircle, label: 'Low Risk' },
  };

  const sev = severityConfig[severity] || severityConfig.MEDIUM;
  const SevIcon = sev.icon;
  const confidencePercent = Math.round((inference.confidence || 0) * 100);
  const predictionPercent = Math.round((inference.prediction || 0) * 100);

  const cards = [
    { label: 'Model', value: result.model_name, icon: Cpu, color: currentTheme.primary },
    { label: 'Prediction Score', value: `${(inference.prediction * 100).toFixed(1)}%`, icon: Gauge, color: '#3b82f6' },
    { label: 'Confidence', value: `${(inference.confidence * 100).toFixed(1)}%`, icon: CheckCircle, color: '#22c55e' },
    { label: 'Processing Time', value: `${inference.processing_time_ms || 45}ms`, icon: Clock, color: '#a855f7' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        backgroundColor: currentTheme.surface,
        border: `1px solid ${sev.border}`,
        borderRadius: '8px',
        padding: '24px',
        boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
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
          <CheckCircle style={{ width: '20px', height: '20px', color: '#22c55e' }} />
          Inference Result
        </h2>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: sev.bg,
          color: sev.color,
          border: `1px solid ${sev.border}`,
        }}>
          <SevIcon style={{ width: '14px', height: '14px' }} />
          {sev.label}
        </span>
      </div>

      {/* Confidence Visual Bar */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: currentTheme.hoverBackground,
        borderRadius: '8px',
        border: `1px solid ${currentTheme.border}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: currentTheme.textSecondary, fontWeight: '500' }}>Confidence Level</span>
          <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '700', fontFamily: 'Consolas, monospace' }}>{confidencePercent}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: currentTheme.border,
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            style={{
              height: '10px',
              borderRadius: '5px',
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: currentTheme.textSecondary, fontWeight: '500' }}>Prediction Score</span>
          <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '700', fontFamily: 'Consolas, monospace' }}>{predictionPercent}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: currentTheme.border,
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${predictionPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            style={{
              height: '10px',
              borderRadius: '5px',
              background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
            }}
          />
        </div>
      </div>

      {/* Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
            style={{
              padding: '14px',
              backgroundColor: currentTheme.hoverBackground,
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <card.icon style={{ width: '14px', height: '14px', color: card.color }} />
              <span style={{ fontSize: '12px', color: currentTheme.textTertiary, fontWeight: '500' }}>{card.label}</span>
            </div>
            <p style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme.textPrimary,
              margin: 0,
              fontFamily: card.label !== 'Model' ? 'Consolas, monospace' : 'inherit'
            }}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Timestamp */}
      <div style={{
        marginTop: '16px',
        padding: '10px 14px',
        backgroundColor: currentTheme.hoverBackground,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: `1px solid ${currentTheme.border}`,
      }}>
        <Clock style={{ width: '14px', height: '14px', color: currentTheme.textTertiary }} />
        <span style={{ fontSize: '12px', color: currentTheme.textTertiary }}>
          {new Date(result.timestamp).toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}
