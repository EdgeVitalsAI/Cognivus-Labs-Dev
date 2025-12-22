import { Navigate } from 'react-router-dom'
import { authService } from '../services/api'

const ProtectedRoute = ({ children, role }) => {
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
