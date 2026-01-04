import { Navigate } from 'react-router-dom'
import { authService } from '../services/api'

const ProtectedRoute = ({ children, role }) => {
  const isAuthenticated = authService.isAuthenticated()
  const userRole = authService.getUserRole()

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={`/${role}/login`} replace />
  }

  // Authenticated but wrong role - redirect to their correct dashboard
  if (userRole !== role) {
    return <Navigate to={`/${userRole}/dashboard`} replace />
  }

  // Authenticated and correct role - allow access
  return children
}

export default ProtectedRoute
