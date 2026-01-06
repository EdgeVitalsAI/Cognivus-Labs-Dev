import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

const ProfileDropdown = ({ userName, avatarUrl = null, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const currentUser = authService.getCurrentUser()
  const displayName = userName || currentUser?.full_name || 'User'
  const userEmail = currentUser?.email || 'No email'

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
        className="flex items-center gap-3 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="text-sm text-slate-200 hidden md:block">{displayName}</div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{userEmail}</p>
          </div>

          <div className="py-2">
            <button
              onClick={handleProfileSettings}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
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
