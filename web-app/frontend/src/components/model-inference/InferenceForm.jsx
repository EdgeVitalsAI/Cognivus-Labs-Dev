import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Play, AlertCircle } from 'lucide-react';

export default function InferenceForm({ onSubmit }) {
  const { currentTheme, theme } = useTheme();
  const [inputData, setInputData] = useState(JSON.stringify({ age: 65, systolic_bp: 120, diastolic_bp: 80 }, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let parsedData;
    try {
      parsedData = JSON.parse(inputData);
    } catch {
      setError('Input must be valid JSON');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsedData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: currentTheme.textSecondary,
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Model Input Data (JSON)
      </label>

      <textarea
        rows="7"
        value={inputData}
        onChange={(e) => { setInputData(e.target.value); setError(''); }}
        placeholder='{"age": 65, "systolic_bp": 120, "diastolic_bp": 80}'
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: currentTheme.inputBackground,
          border: `1px solid ${error ? currentTheme.error : currentTheme.border}`,
          borderRadius: '8px',
          color: currentTheme.textPrimary,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.6',
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = currentTheme.primary;
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = currentTheme.border;
        }}
      />

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          color: currentTheme.error,
          fontSize: '13px'
        }}>
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          marginTop: '14px',
          padding: '14px',
          backgroundColor: loading ? (theme === 'dark' ? '#404040' : '#d0d0d0') : currentTheme.primary,
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!loading) e.target.style.backgroundColor = currentTheme.primaryHover;
        }}
        onMouseOut={(e) => {
          if (!loading) e.target.style.backgroundColor = currentTheme.primary;
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            Running Inference...
          </>
        ) : (
          <>
            <Play style={{ width: '18px', height: '18px', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' }} />
            Run Inference
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
