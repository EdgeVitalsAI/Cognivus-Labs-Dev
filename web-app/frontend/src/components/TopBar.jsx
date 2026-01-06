import { Search } from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'
import { useTheme } from '../contexts/ThemeContext'

const TopBar = ({ userName, avatarUrl = null, onLogout }) => {
  const { currentTheme } = useTheme()

  return (
    <div
      className="flex items-center justify-between px-6 py-4 backdrop-blur sticky top-0 z-30"
      style={{
        backgroundColor: currentTheme.cardBackground + (currentTheme === undefined ? '' : ''),
        borderBottom: `1px solid ${currentTheme.border}`
      }}
    >
      {/* Logo + Tagline */}
      <div className="flex items-center gap-4">
        <img src="/LOGO.png" alt="CognivusLabs" className="h-20 w-auto" />
        <div className="hidden md:block text-xs font-medium tracking-wider" style={{ color: currentTheme.textSecondary }}>PREDICT. PROTECT. HEAL.</div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full max-w-xl" style={{ backgroundColor: currentTheme.inputBackground, border: `1px solid ${currentTheme.border}` }}>
        <Search className="w-4 h-4" style={{ color: currentTheme.textSecondary }} />
        <input
          className="bg-transparent outline-none text-sm w-full"
          placeholder="Search"
          style={{ color: currentTheme.text, backgroundColor: 'transparent' }}
        />
      </div>

      {/* Profile Dropdown */}
      <ProfileDropdown userName={userName} avatarUrl={avatarUrl} onLogout={onLogout} />
    </div>
  )
}

export default TopBar
