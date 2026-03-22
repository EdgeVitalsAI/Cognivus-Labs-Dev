import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle({ style = {} }) {
  const { theme, currentTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        border: `1px solid ${currentTheme.border}`,
        backgroundColor: currentTheme.cardBackground,
        color: currentTheme.text,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        ...style
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.hoverBackground}
      onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.cardBackground}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
