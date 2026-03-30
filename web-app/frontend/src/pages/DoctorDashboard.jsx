import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import StatsSection from '../components/dashboard/StatsSection';
import VitalsOverviewChart from '../components/dashboard/VitalsOverviewChart';
import ActiveMonitoringPanel from '../components/dashboard/ActiveMonitoringPanel';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import PatientStatusChart from '../components/dashboard/PatientStatusChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import TasksPanel from '../components/dashboard/TasksPanel';
import { authService } from '../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { CalendarDays, ShieldCheck } from 'lucide-react';

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

const formatDate = () =>
    new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
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

            const [activityRes, tasksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/dashboard/activity`, { headers }),
                axios.get(`${API_BASE_URL}/dashboard/tasks`, { headers })
            ]);

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

                <main className="flex-1 p-6 space-y-5 min-w-0">

                    {/* ── Welcome header ── */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                {getGreeting()}, Dr. {user?.full_name?.split(' ')[0] || '—'}
                            </h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs text-slate-500">{formatDate()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">All Systems Operational</span>
                        </div>
                    </div>

                    {/* ── KPI cards ── */}
                    <StatsSection />

                    {/* ── Vitals chart + Patient status side by side ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: 340 }}>
                        <div className="lg:col-span-2">
                            <VitalsOverviewChart />
                        </div>
                        <div>
                            <PatientStatusChart />
                        </div>
                    </div>

                    {/* ── Active monitoring + Alerts ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2">
                            <ActiveMonitoringPanel basePath="/doctor" />
                        </div>
                        <div>
                            <AlertsPanel basePath="/doctor" />
                        </div>
                    </div>

                    {/* ── Activity feed + Tasks ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {loading ? (
                            <>
                                {[0, 1].map(i => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
                                        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4" />
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(j => (
                                                <div key={j} className="flex gap-3">
                                                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex-shrink-0" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="h-3 bg-slate-800 rounded w-3/4" />
                                                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <ActivityFeed items={activity} />
                                <TasksPanel tasks={tasks} />
                            </>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default DoctorDashboard;
