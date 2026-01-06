import { useState, useEffect } from 'react';
import { Activity, Bell, Stethoscope, HeartPulse } from 'lucide-react';
import StatCard from './StatCard';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        icon={Activity}
        label="Active Patients"
        value={stats.active_patients}
        sub={`+${stats.patients_this_week} From This Week`}
      />
      <StatCard
        icon={Bell}
        label="Critical Alerts"
        value={`${stats.critical_alerts} ${stats.critical_alerts === 1 ? 'Alert' : 'Alerts'}`}
        sub="(•) Live"
      />
      <StatCard
        icon={Stethoscope}
        label="Active Prescriptions"
        value={stats.pending_prescriptions}
        sub="Currently Active"
      />
      <StatCard
        icon={HeartPulse}
        label="Pending Tasks"
        value={stats.pending_tasks}
        sub="Awaiting Action"
      />
    </section>
  );
};

export default StatsSection;
