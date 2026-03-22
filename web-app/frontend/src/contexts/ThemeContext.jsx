import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const themes = {
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    sectionBackground: '#f8f9fa',
    cardBackground: '#ffffff',
    text: '#1a1a1a',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    primary: '#0066cc',
    primaryHover: '#0052a3',
    primaryDark: '#004d99',
    accent: '#0066cc',
    success: '#16a34a',
    warning: '#eab308',
    error: '#dc2626',
    info: '#0284c7',
    shadow: 'rgba(0,0,0,0.1)',
    shadowLight: 'rgba(0,0,0,0.05)',
    inputBackground: '#ffffff',
    hoverBackground: '#fafafa',
    hover: '#f0f0f0'
  },
  dark: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    sectionBackground: '#252525',
    cardBackground: '#2d2d2d',
    text: '#e5e5e5',
    textPrimary: '#e5e5e5',
    textSecondary: '#b0b0b0',
    textTertiary: '#808080',
    border: '#404040',
    borderLight: '#353535',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryDark: '#1d4ed8',
    accent: '#3b82f6',
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#ef4444',
    info: '#3b82f6',
    shadow: 'rgba(0,0,0,0.3)',
    shadowLight: 'rgba(0,0,0,0.2)',
    inputBackground: '#1f1f1f',
    hoverBackground: '#353535',
    hover: '#404040'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('admin_theme')
    return saved || 'dark'  // Default to dark theme
  })

  useEffect(() => {
    localStorage.setItem('admin_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const currentTheme = themes[theme]

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
