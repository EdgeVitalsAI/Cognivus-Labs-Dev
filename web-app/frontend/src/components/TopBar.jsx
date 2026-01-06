import { Search } from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'

const TopBar = ({ userName, avatarUrl = null, onLogout }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      {/* Logo + Tagline */}
      <div className="flex items-center gap-3">
        <img src="/LOGO.png" alt="CognivusLabs" className="h-10 w-auto" />
        <div className="hidden md:block text-[11px] text-slate-400">PREDICT. PROTECT. HEAL.</div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-full max-w-xl">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          className="bg-transparent outline-none text-sm text-slate-200 placeholder-slate-500 w-full"
          placeholder="Search"
        />
      </div>

      {/* Profile Dropdown */}
      <ProfileDropdown userName={userName} avatarUrl={avatarUrl} onLogout={onLogout} />
    </div>
  )
}

export default TopBar
