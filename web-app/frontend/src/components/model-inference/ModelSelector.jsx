import { useTheme } from '../../contexts/ThemeContext';
import { Heart, Wind, Cpu } from 'lucide-react';

const modelIcons = {
  'ECG Analysis Model': Heart,
  'SpO2 Prediction Model': Wind,
};

export default function ModelSelector({ selectedModel, setSelectedModel, models = [] }) {
  const { currentTheme, theme } = useTheme();

  const availableModels = models.length > 0 ? models : [
    'ECG Analysis Model',
    'SpO2 Prediction Model',
  ];

  return (
    <div>
      <p style={{
        fontSize: '14px',
        fontWeight: '600',
        color: currentTheme.textSecondary,
        margin: '0 0 12px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>Select Model</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {availableModels.map((model) => {
          const isSelected = selectedModel === model;
          const Icon = modelIcons[model] || Cpu;

          return (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: isSelected
                  ? (theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(0,102,204,0.08)')
                  : currentTheme.hoverBackground,
                border: `1.5px solid ${isSelected ? currentTheme.primary : currentTheme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                outline: 'none',
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = currentTheme.primary;
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(59,130,246,0.08)' : 'rgba(0,102,204,0.04)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = currentTheme.border;
                  e.currentTarget.style.backgroundColor = currentTheme.hoverBackground;
                }
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isSelected
                  ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                  : (theme === 'dark' ? 'rgba(59,130,246,0.12)' : 'rgba(0,102,204,0.08)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                boxShadow: isSelected
                  ? '0 0 16px rgba(59,130,246,0.5), 0 0 6px rgba(99,102,241,0.3)'
                  : '0 0 10px rgba(59,130,246,0.2), 0 0 4px rgba(59,130,246,0.1)',
              }}>
                <Icon style={{
                  width: '20px',
                  height: '20px',
                  color: isSelected ? '#ffffff' : currentTheme.primary,
                  filter: isSelected
                    ? 'drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                    : 'drop-shadow(0 0 3px rgba(59,130,246,0.5))',
                }} />
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isSelected ? currentTheme.primary : currentTheme.textPrimary,
                  margin: 0,
                  lineHeight: '1.3'
                }}>{model}</p>
                <p style={{
                  fontSize: '11px',
                  color: currentTheme.textTertiary,
                  margin: '2px 0 0 0'
                }}>{isSelected ? 'Selected' : 'Click to select'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
