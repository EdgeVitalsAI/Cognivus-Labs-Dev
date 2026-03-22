import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { GitBranch, CheckCircle, BarChart3, Hash } from 'lucide-react';

export default function ModelVersion({ data }) {
  const { currentTheme, theme } = useTheme();

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
          background: theme === 'dark' ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.1)',
          borderRadius: '8px',
          boxShadow: '0 0 12px rgba(168,85,247,0.35), 0 0 4px rgba(168,85,247,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <GitBranch style={{ width: '20px', height: '20px', color: '#a855f7', filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' }} />
        </div>
        Model Version Tracking
      </h2>

      {data && data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((model, i) => {
            const accuracyPercent = Math.round((model.accuracy || 0) * 100);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                style={{
                  padding: '18px',
                  backgroundColor: currentTheme.hoverBackground,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  transition: 'border-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
                onMouseOut={(e) => e.currentTarget.style.borderColor = currentTheme.border}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0 }}>{model.name}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      fontFamily: 'Consolas, monospace',
                      backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(0,102,204,0.1)',
                      color: currentTheme.primary,
                      border: `1px solid ${theme === 'dark' ? 'rgba(59,130,246,0.3)' : 'rgba(0,102,204,0.2)'}`,
                    }}>
                      <Hash style={{ width: '10px', height: '10px' }} />
                      v{model.version}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                      color: '#22c55e',
                      border: `1px solid ${theme === 'dark' ? 'rgba(34,197,94,0.3)' : '#bbf7d0'}`,
                    }}>
                      <CheckCircle style={{ width: '10px', height: '10px' }} />
                      Production
                    </span>
                  </div>
                </div>

                {/* Accuracy bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Model Accuracy</span>
                    <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600', fontFamily: 'Consolas, monospace' }}>{accuracyPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: currentTheme.border, borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${accuracyPercent}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                      style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}
                    />
                  </div>
                </div>

                {/* Footer stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 style={{ width: '14px', height: '14px', color: '#3b82f6', filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.5))' }} />
                    <span style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                      <span style={{ fontWeight: '600', color: currentTheme.textPrimary, fontFamily: 'Consolas, monospace' }}>
                        {(model.totalPredictions || 0).toLocaleString()}
                      </span> predictions
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '32px 0' }}>
          No model version data available
        </p>
      )}
    </div>
  );
}