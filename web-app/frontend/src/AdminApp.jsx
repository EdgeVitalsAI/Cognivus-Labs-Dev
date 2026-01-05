import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDevices from './pages/AdminDevices';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

function AdminApp() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/sys/auth" replace />} />
          <Route path="/sys/auth" element={<AdminLogin />} />
          <Route path="/sys/dashboard" element={<AdminDashboard />} />
          <Route path="/sys/devices" element={<AdminDevices />} />
          <Route path="/sys/users" element={<AdminUsers />} />
          <Route path="/sys/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/sys/auth" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default AdminApp;
