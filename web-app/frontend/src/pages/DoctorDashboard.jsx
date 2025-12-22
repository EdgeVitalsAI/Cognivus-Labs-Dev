import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { authService } from '../services/api'

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = authService.getCurrentUser()
    setUser(userData)
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/doctor/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/favicon.png" alt="CognivusLabs" className="w-10 h-10" />
              <div>
                <h1 className="text-base font-display font-semibold text-gray-900">
                  COGNIVUSLABS
                </h1>
                <p className="text-xs text-gray-500">Doctor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">
                  Dr. {user?.full_name || 'Loading...'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
            Welcome to Your Dashboard
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Your professional doctor dashboard is under construction. Patient monitoring,
            AI predictions, and real-time alerts will be available here.
          </p>
        </div>
      </main>
    </div>
  )
}

export default DoctorDashboard
