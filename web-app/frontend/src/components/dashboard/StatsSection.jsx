import { useState, useEffect } from 'react';
import { Activity, Bell, Stethoscope, HeartPulse } from 'lucide-react';
import StatCard from './StatCard';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const StatsSection = () => {
  const [stats, setStats] = useState({
    active_patients: 0,
    patients_this_week: 0,
    critical_alerts: 0,
    pending_prescriptions: 0,
    pending_tasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
            <div className="w-10 h-10 bg-slate-800 rounded-lg mb-4" />
            <div className="h-3 bg-slate-800 rounded w-2/3 mb-3" />
            <div className="h-8 bg-slate-800 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <StatCard
        icon={Activity}
        label="Active Patients"
        value={stats.active_patients}
        sub={`+${stats.patients_this_week} admitted this week`}
        color="blue"
      />
      <StatCard
        icon={Bell}
        label="Critical Alerts"
        value={stats.critical_alerts}
        sub={stats.critical_alerts > 0 ? '⬤ Requires immediate attention' : 'No active alerts'}
        color="red"
      />
      <StatCard
        icon={Stethoscope}
        label="Active Prescriptions"
        value={stats.pending_prescriptions}
        sub="Currently active"
        color="emerald"
      />
      <StatCard
        icon={HeartPulse}
        label="Pending Tasks"
        value={stats.pending_tasks}
        sub="Awaiting action"
        color="amber"
      />
    </section>
  );
};

export default StatsSection;
