import { Brain, Cpu, FileText, LayoutDashboard, LogOut, Pill, Users, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Item = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={
            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm ` +
            (active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/60')
        }
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </Link>
);

const Sidebar = ({ onLogout }) => {
    const { pathname } = useLocation();
    return (
        <aside className="w-[260px] bg-slate-900 border-r border-slate-800 min-h-screen p-4 flex flex-col gap-2">
            <Item
                icon={LayoutDashboard}
                label="Dashboard"
                to="/doctor/dashboard"
                active={pathname.includes('/doctor/dashboard')}
            />
            <Item
                icon={Users}
                label="Patients"
                to="/doctor/patients"
                active={pathname.includes('/doctor/patients')}
            />
            <Item
                icon={Pill}
                label="Prescriptions"
                to="/doctor/prescriptions"
                active={pathname.includes('/doctor/prescriptions')}
            />
            <Item
                icon={Brain}
                label="AI Insights"
                to="/doctor/ai-insights"
                active={pathname.includes('/doctor/ai-insights')}
            />
            <Item
                icon={Video}
                label="Telemedicine"
                to="/doctor/telemedicine"
                active={pathname.includes('/doctor/telemedicine')}
            />
            <Item
                icon={FileText}
                label="Notes & Reports"
                to="/doctor/notes-reports"
                active={pathname.includes('/doctor/notes-reports')}
            />
            <Item
                icon={Cpu}
                label="Device Management"
                to="/doctor/devices"
                active={pathname.includes('/doctor/devices')}
            />
            <div className="mt-auto" />
            <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60"
            >
                <LogOut className="w-4 h-4" />
                Logout
            </button>
        </aside>
    );
};

export default Sidebar;
