import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { History, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function InferenceHistory({ history, total, limit, offset, onPageChange, onFilterChange }) {
  const { currentTheme, theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');

  const severityFilters = ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const getSeverityStyle = (severity) => {
    const configs = {
      CRITICAL: { color: '#ef4444', bg: theme === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)' },
      HIGH: { color: '#f97316', bg: theme === 'dark' ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.06)' },
      MEDIUM: { color: '#eab308', bg: theme === 'dark' ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.06)' },
      LOW: { color: '#22c55e', bg: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.06)' },
    };
    return configs[severity] || configs.MEDIUM;
  };

  const handleFilter = (filter) => {
    setActiveFilter(filter);
    if (onFilterChange) {
      onFilterChange(filter === 'all' ? null : filter);
    }
  };

  const totalPages = Math.ceil((total || history.length) / (limit || 50));
  const currentPage = Math.floor((offset || 0) / (limit || 50)) + 1;

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '8px',
      padding: '24px',
      boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: currentTheme.textPrimary,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <History style={{ width: '20px', height: '20px', color: currentTheme.primary }} />
          Prediction History
          {total != null && (
            <span style={{
              fontSize: '12px',
              color: currentTheme.textTertiary,
              fontWeight: '400',
              fontFamily: 'Consolas, monospace',
            }}>({total} total)</span>
          )}
        </h2>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Filter style={{ width: '14px', height: '14px', color: currentTheme.textTertiary }} />
        {severityFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilter(filter)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              border: `1px solid ${activeFilter === filter ? currentTheme.primary : currentTheme.border}`,
              backgroundColor: activeFilter === filter
                ? (theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(0,102,204,0.08)')
                : 'transparent',
              color: activeFilter === filter ? currentTheme.primary : currentTheme.textSecondary,
              transition: 'all 0.2s ease',
              textTransform: 'capitalize',
            }}
            onMouseOver={(e) => {
              if (activeFilter !== filter) e.currentTarget.style.borderColor = currentTheme.primary;
            }}
            onMouseOut={(e) => {
              if (activeFilter !== filter) e.currentTarget.style.borderColor = currentTheme.border;
            }}
          >
            {filter === 'all' ? 'All' : filter}
          </button>
        ))}
      </div>

      {/* Table */}
      {history.length === 0 ? (
        <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '40px 0' }}>
          No prediction history available. Run an inference to see results here.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Model', 'Severity', 'Risk Score', 'Confidence', 'Status', 'Time'].map((header) => (
                    <th key={header} style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: currentTheme.textTertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: `1px solid ${currentTheme.border}`,
                      whiteSpace: 'nowrap',
                    }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => {
                  const sevStyle = getSeverityStyle(item.severity || item.result?.severity);
                  return (
                    <tr
                      key={item.id || index}
                      style={{ transition: 'background-color 0.15s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBackground}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500', color: currentTheme.textPrimary, borderBottom: `1px solid ${currentTheme.borderLight}` }}>
                        {item.model_name || item.model}
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${currentTheme.borderLight}` }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: sevStyle.color,
                          backgroundColor: sevStyle.bg,
                        }}>
                          {item.severity || item.result?.severity || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#3b82f6', fontWeight: '600', fontFamily: 'Consolas, monospace', borderBottom: `1px solid ${currentTheme.borderLight}` }}>
                        {item.risk_score != null ? `${(item.risk_score * 100).toFixed(1)}%` : item.result?.prediction != null ? `${(item.result.prediction * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#22c55e', fontWeight: '600', fontFamily: 'Consolas, monospace', borderBottom: `1px solid ${currentTheme.borderLight}` }}>
                        {item.confidence_score != null ? `${(item.confidence_score * 100).toFixed(1)}%` : item.result?.confidence != null ? `${(item.result.confidence * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${currentTheme.borderLight}` }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          color: currentTheme.textSecondary,
                          textTransform: 'capitalize'
                        }}>
                          {item.status || 'completed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: currentTheme.textTertiary, borderBottom: `1px solid ${currentTheme.borderLight}`, whiteSpace: 'nowrap' }}>
                        {new Date(item.created_at || item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${currentTheme.border}`,
            }}>
              <span style={{ fontSize: '12px', color: currentTheme.textTertiary }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onPageChange && onPageChange(Math.max(0, (offset || 0) - (limit || 50)))}
                  disabled={currentPage <= 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '6px',
                    color: currentPage <= 1 ? currentTheme.textTertiary : currentTheme.textSecondary,
                    fontSize: '12px',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage <= 1 ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  Previous
                </button>
                <button
                  onClick={() => onPageChange && onPageChange((offset || 0) + (limit || 50))}
                  disabled={currentPage >= totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '6px',
                    color: currentPage >= totalPages ? currentTheme.textTertiary : currentTheme.textSecondary,
                    fontSize: '12px',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  Next
                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
