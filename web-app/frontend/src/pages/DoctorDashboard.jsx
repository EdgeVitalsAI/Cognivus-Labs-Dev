import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import StatsSection from '../components/dashboard/StatsSection';
import TasksPanel from '../components/dashboard/TasksPanel';
import VitalsTrends from '../components/dashboard/VitalsTrends';
import { authService } from '../services/api';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [activity, setActivity] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = authService.getCurrentUser();
        setUser(userData);
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch all dashboard data in parallel
            const [alertsRes, activityRes, tasksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/dashboard/alerts`, { headers }),
                axios.get(`${API_BASE_URL}/dashboard/activity`, { headers }),
                axios.get(`${API_BASE_URL}/dashboard/tasks`, { headers })
            ]);

            setAlerts(alertsRes.data.alerts);
            setActivity(activityRes.data.activity);
            setTasks(tasksRes.data.tasks);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    {/* KPI Cards */}
                    <StatsSection />

                    {/* Alerts */}
                    <section className="mt-6">
                        {loading ? (
                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 animate-pulse">
                                <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-slate-700 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <AlertsPanel alerts={alerts} />
                        )}
                    </section>

                    {/* Bottom grid */}
                    <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-6 lg:col-span-2">
                            {loading ? (
                                <>
                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 animate-pulse">
                                        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-12 bg-slate-700 rounded"></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 animate-pulse">
                                        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-12 bg-slate-700 rounded"></div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ActivityFeed items={activity} />
                                    <TasksPanel tasks={tasks} />
                                </>
                            )}
                        </div>
                        <VitalsTrends />
                    </section>
                </main>
            </div>
        </div>
    );
};

export default DoctorDashboard;
