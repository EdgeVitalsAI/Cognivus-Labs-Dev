import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DoctorLogin from './pages/DoctorLogin'
import StaffLogin from './pages/StaffLogin'
import DoctorDashboard from './pages/DoctorDashboard'
import StaffDashboard from './pages/StaffDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor/login" replace />} />

        {/* Doctor Routes */}
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute role="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/doctor/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
