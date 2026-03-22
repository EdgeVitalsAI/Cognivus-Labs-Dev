import { useTheme } from '../../contexts/ThemeContext';
import { TrendingUp } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, currentTheme }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: currentTheme.textPrimary, margin: '0 0 8px 0' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
          <span style={{ fontSize: '12px', color: currentTheme.textSecondary }}>{entry.name}:</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: currentTheme.textPrimary, fontFamily: 'Consolas, monospace' }}>
            {entry.value}{entry.name.includes('%') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PredictionChart({ data }) {
  const { currentTheme, theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div style={{
        backgroundColor: currentTheme.surface,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '8px',
        padding: '24px',
        boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{
          fontSize: '16px', fontWeight: '600', color: currentTheme.textPrimary, margin: 0,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <div style={{
            padding: '6px',
            background: theme === 'dark' ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
            borderRadius: '8px',
            boxShadow: '0 0 12px rgba(34,197,94,0.35), 0 0 4px rgba(34,197,94,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TrendingUp style={{ width: '20px', height: '20px', color: '#22c55e', filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.6))' }} />
          </div>
          Prediction Trends
        </h2>
        <p style={{ fontSize: '13px', color: currentTheme.textTertiary, textAlign: 'center', padding: '40px 0' }}>
          No prediction data available yet
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '8px',
      padding: '24px',
      boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <h2 style={{
        fontSize: '16px', fontWeight: '600', color: currentTheme.textPrimary, margin: '0 0 20px 0',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <div style={{
          padding: '6px',
          background: theme === 'dark' ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
          borderRadius: '8px',
          boxShadow: '0 0 12px rgba(34,197,94,0.35), 0 0 4px rgba(34,197,94,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TrendingUp style={{ width: '20px', height: '20px', color: '#22c55e', filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.6))' }} />
        </div>
        Prediction Trends
      </h2>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={currentTheme.border}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke={currentTheme.textTertiary}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: currentTheme.border }}
          />
          <YAxis
            yAxisId="left"
            stroke={currentTheme.textTertiary}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={currentTheme.textTertiary}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip currentTheme={currentTheme} />} />
          <Legend
            wrapperStyle={{ color: currentTheme.textSecondary, fontSize: '12px', paddingTop: '16px' }}
            iconType="circle"
          />
          <Bar
            yAxisId="left"
            dataKey="predictions"
            fill="url(#barGradient)"
            name="Total Predictions"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="confidence"
            fill="url(#areaGradient)"
            stroke="#22c55e"
            strokeWidth={2.5}
            name="Avg Confidence %"
            dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: currentTheme.surface }}
            activeDot={{ r: 6, fill: '#22c55e', stroke: currentTheme.surface, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
