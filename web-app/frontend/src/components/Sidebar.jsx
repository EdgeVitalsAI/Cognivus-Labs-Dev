import { Brain, Cpu, FileText, LayoutDashboard, LogOut, Pill, Users, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext'

const Item = ({ icon: Icon, label, to, active, theme }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm`}
        style={{
            backgroundColor: active ? theme.borderLight || theme.cardBackground : 'transparent',
            color: active ? theme.text : theme.textSecondary
        }}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </Link>
);

const Sidebar = ({ onLogout }) => {
    const { pathname } = useLocation();
    const { currentTheme } = useTheme()
    return (
        <aside className="w-[260px] h-screen sticky top-0 p-4 flex flex-col gap-2" style={{ backgroundColor: currentTheme.cardBackground, borderRight: `1px solid ${currentTheme.border}` }}>
            <Item
                icon={LayoutDashboard}
                label="Dashboard"
                to="/doctor/dashboard"
                active={pathname.includes('/doctor/dashboard')}
                theme={currentTheme}
            />
            <Item
                icon={Users}
                label="Patients"
                to="/doctor/patients"
                active={pathname.includes('/doctor/patients')}
                theme={currentTheme}
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
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm"
                style={{ color: currentTheme.textSecondary }}
            >
                <LogOut className="w-4 h-4" />
                Logout
            </button>
        </aside>
    );
};

export default Sidebar;
