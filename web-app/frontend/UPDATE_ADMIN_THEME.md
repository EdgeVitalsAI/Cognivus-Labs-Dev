# Quick Instructions to Add Dark Theme to Remaining Admin Pages

Since the files are large, here's what you need to do for each page:

## For AdminDashboard.jsx, AdminDevices.jsx, AdminUsers.jsx:

### 1. Add imports at the top:
```javascript
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
```

### 2. Get theme in the component:
```javascript
const { currentTheme, theme } = useTheme()
```

### 3. Add ThemeToggle button in the header (next to logout button):
```javascript
<ThemeToggle style={{ marginRight: '12px' }} />
```

### 4. Replace ALL color values:

**Backgrounds:**
- `backgroundColor: '#f5f5f5'` → `backgroundColor: currentTheme.background`
- `backgroundColor: '#ffffff'` → `backgroundColor: currentTheme.cardBackground`
- `backgroundColor: 'white'` → `backgroundColor: currentTheme.cardBackground`

**Text:**
- `color: '#1a1a1a'` → `color: currentTheme.text`
- `color: '#666'` or `color: '#666666'` → `color: currentTheme.textSecondary`
- `color: '#999'` → `color: currentTheme.textTertiary`

**Borders:**
- `border: '1px solid #e0e0e0'` → `border: \`1px solid \${currentTheme.border}\``
- `borderColor: '#e0e0e0'` → `borderColor: currentTheme.border`

**Buttons:**
- `backgroundColor: '#0066cc'` → `backgroundColor: currentTheme.primary`
- Hover: `'#0052a3'` → `currentTheme.primaryHover`

**Inputs:**
- `backgroundColor: 'white'` → `backgroundColor: currentTheme.inputBackground`

**Status colors (keep semantic colors but adjust for dark mode):**
For status badges, use this helper function:
```javascript
const getStatusColor = (status) => {
  const isDark = theme === 'dark'
  const colors = {
    healthy: {
      color: '#16a34a',
      background: isDark ? '#1a2e1a' : '#f0fdf4',
      border: isDark ? '#16a34a' : '#bbf7d0'
    },
    // ... same for other statuses
  }
  return colors[status] || colors.offline
}
```

## Quick Replace Guide

Use Find & Replace in your editor:

1. `backgroundColor: '#f5f5f5'` → `backgroundColor: currentTheme.background`
2. `backgroundColor: '#ffffff'` → `backgroundColor: currentTheme.cardBackground`
3. `backgroundColor: 'white'` → `backgroundColor: currentTheme.cardBackground`
4. `color: '#1a1a1a'` → `color: currentTheme.text`
5. `color: '#666'` → `color: currentTheme.textSecondary`
6. `color: '#999'` → `color: currentTheme.textTertiary`
7. `border: '1px solid #e0e0e0'` → ```border: `1px solid ${currentTheme.border}` ```
8. `borderColor: '#e0e0e0'` → `borderColor: currentTheme.border`
9. `backgroundColor: '#0066cc'` → `backgroundColor: currentTheme.primary`

Then manually fix status colors to work in both themes.

Save me time - just do the find & replace! The theme system is already set up.
