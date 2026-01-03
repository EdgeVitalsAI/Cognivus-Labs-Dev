import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AIInsightsPage from './pages/AIInsightsPage';
import DeviceManagementPage from './pages/DeviceManagementPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorLogin from './pages/DoctorLogin';
import NotesReportsPage from './pages/NotesReportsPage';
import PatientDetail from './pages/PatientDetail';
import PatientsPage from './pages/PatientsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import StaffDashboard from './pages/StaffDashboard';
import StaffLogin from './pages/StaffLogin';
import TelemedicinePage from './pages/TelemedicinePage';

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
                <Route
                    path="/doctor/patients"
                    element={
                        <ProtectedRoute role="doctor">
                            <PatientsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/patients/:patientId"
                    element={
                        <ProtectedRoute role="doctor">
                            <PatientDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/prescriptions"
                    element={
                        <ProtectedRoute role="doctor">
                            <PrescriptionsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/ai-insights"
                    element={
                        <ProtectedRoute role="doctor">
                            <AIInsightsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/telemedicine"
                    element={
                        <ProtectedRoute role="doctor">
                            <TelemedicinePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/notes-reports"
                    element={
                        <ProtectedRoute role="doctor">
                            <NotesReportsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/devices"
                    element={
                        <ProtectedRoute role="doctor">
                            <DeviceManagementPage />
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
    );
}

export default App;
