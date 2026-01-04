import { Navigate } from 'react-router-dom'
import { authService } from '../services/api'

const ProtectedRoute = ({ children, role }) => {
  // In development, bypass auth for quick UI preview
  if (import.meta.env.DEV) {
    // Optional: seed dev identity so headers show a name
    if (!authService.isAuthenticated()) {
      localStorage.setItem('access_token', 'dev-token')
      localStorage.setItem('user_role', role)
      localStorage.setItem('user_data', JSON.stringify({ full_name: 'Preview User' }))
    }
    return children
  }

  const isAuthenticated = authService.isAuthenticated()
  const userRole = authService.getUserRole()

  if (!isAuthenticated) {
    return <Navigate to={`/${role}/login`} replace />
  }

  if (userRole !== role) {
    return <Navigate to={`/${userRole}/login`} replace />
  }

  return children
}

export default ProtectedRoute
