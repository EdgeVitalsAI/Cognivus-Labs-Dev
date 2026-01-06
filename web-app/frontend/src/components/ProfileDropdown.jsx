import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'

const ProfileDropdown = ({ userName, avatarUrl = null, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const currentUser = authService.getCurrentUser()
  const displayName = userName || currentUser?.full_name || 'User'
  const userEmail = currentUser?.email || 'No email'

  const { currentTheme } = useTheme()
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileSettings = () => {
    setIsOpen(false)
    // Navigate based on user role
    const role = currentUser?.role || 'doctor'
    if (role === 'staff' || role === 'STAFF') {
      navigate('/staff/profile')
    } else {
      navigate('/doctor/profile')
    }
  }

  const handleLogout = () => {
    setIsOpen(false)
    if (onLogout) {
      onLogout()
    } else {
      authService.logout()
      navigate('/doctor/login')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
        style={{ backgroundColor: 'transparent' }}
      >
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: currentTheme.borderLight }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5" style={{ color: currentTheme.textSecondary }} />
          )}
        </div>
        <div className="text-sm hidden md:block" style={{ color: currentTheme.text }}>{displayName}</div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: currentTheme.textSecondary }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl z-50 overflow-hidden" style={{ backgroundColor: currentTheme.cardBackground, border: `1px solid ${currentTheme.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
            <p className="text-sm font-medium" style={{ color: currentTheme.text }}>{displayName}</p>
            <p className="text-xs mt-0.5" style={{ color: currentTheme.textSecondary }}>{userEmail}</p>
          </div>

          <div className="py-2">
            <button
              onClick={handleProfileSettings}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: currentTheme.text, backgroundColor: 'transparent' }}
            >
              <Settings className="w-4 h-4" style={{ color: currentTheme.textSecondary }} />
              Profile Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: currentTheme.error, backgroundColor: 'transparent' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
