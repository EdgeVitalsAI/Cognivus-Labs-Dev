import { Navigate } from 'react-router-dom'
import { authService } from '../services/api'

const ProtectedRoute = ({ children, role }) => {
  const isAuthenticated = authService.isAuthenticated()
  const userRole = authService.getUserRole()

  console.log('ProtectedRoute - Required role:', role)
  console.log('ProtectedRoute - User authenticated:', isAuthenticated)
  console.log('ProtectedRoute - User role:', userRole)
  console.log('ProtectedRoute - Access token:', localStorage.getItem('access_token'))

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login')
    return <Navigate to={`/${role}/login`} replace />
  }

  // Authenticated but wrong role - redirect to their correct dashboard
  if (userRole !== role) {
    console.log(`ProtectedRoute - Role mismatch! Expected: ${role}, Got: ${userRole}`)
    return <Navigate to={`/${userRole}/dashboard`} replace />
  }

  // Authenticated and correct role - allow access
  console.log('ProtectedRoute - Access granted')
  return children
}

export default ProtectedRoute
