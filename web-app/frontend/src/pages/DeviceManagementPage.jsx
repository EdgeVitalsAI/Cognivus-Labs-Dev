import { Cpu, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DeviceCard from '../components/device-management/DeviceCard';
import PairDeviceModal from '../components/device-management/PairDeviceModal';
import { authService } from '../services/api';

const DeviceManagementPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isPairDeviceModalOpen, setIsPairDeviceModalOpen] = useState(false);

    const [devices, setDevices] = useState([
        {
            id: 1,
            name: 'Wearable Patch - Wathsala',
            patient: 'Wathsala Dewmina',
            patientId: 1,
            type: 'Wearable Patch',
            model: 'CognivusLabs ECG Monitor v1.0',
            serialNumber: 'CLW-2024-001',
            status: 'ACTIVE',
            battery: 92,
            signal: 85,
            lastSync: new Date(Date.now() - 5 * 60 * 1000),
            pairedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            sensors: [
                { name: 'ECG', status: 'healthy', value: '72 bpm' },
                { name: 'SpO2', status: 'healthy', value: '97%' },
                { name: 'Temperature', status: 'healthy', value: '98.6°F' },
            ],
            firmware: 'v2.4.1',
            storageUsed: 65,
            alerts: 0,
            location: 'Room 302A',
        },
        {
            id: 2,
            name: 'Wearable Patch - Wooshan',
            patient: 'Wooshan Gamage',
            patientId: 2,
            type: 'Wearable Patch',
            model: 'CognivusLabs ECG Monitor v1.0',
            serialNumber: 'CLW-2024-002',
            status: 'ACTIVE',
            battery: 78,
            signal: 92,
            lastSync: new Date(Date.now() - 2 * 60 * 1000),
            pairedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            sensors: [
                { name: 'ECG', status: 'warning', value: '110 bpm' },
                { name: 'SpO2', status: 'healthy', value: '95%' },
                { name: 'Temperature', status: 'healthy', value: '98.2°F' },
            ],
            firmware: 'v2.4.1',
            storageUsed: 48,
            alerts: 2,
            location: 'Room 108C',
        },
        {
            id: 3,
            name: 'Smart Blood Pressure Monitor',
            patient: 'Rivindu Ashinsa',
            patientId: 3,
            type: 'Blood Pressure Monitor',
            model: 'OmniHealth BP-500',
            serialNumber: 'OHB-2024-015',
            status: 'ACTIVE',
            battery: 45,
            signal: 78,
            lastSync: new Date(Date.now() - 1 * 60 * 1000),
            pairedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            sensors: [
                { name: 'Systolic', status: 'warning', value: '145 mmHg' },
                { name: 'Diastolic', status: 'healthy', value: '92 mmHg' },
            ],
            firmware: 'v1.2.0',
            storageUsed: 32,
            alerts: 1,
            location: 'Ward 3 2A',
        },
        {
            id: 4,
            name: 'Glucose Monitor',
            patient: 'Robert Key',
            patientId: 4,
            type: 'Glucose Monitor',
            model: 'AccuCheck SmartView',
            serialNumber: 'ACK-2024-089',
            status: 'LOW_BATTERY',
            battery: 15,
            signal: 65,
            lastSync: new Date(Date.now() - 12 * 60 * 60 * 1000),
            pairedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            sensors: [{ name: 'Glucose', status: 'warning', value: '156 mg/dL' }],
            firmware: 'v3.1.2',
            storageUsed: 78,
            alerts: 3,
            location: 'Room 152B',
        },
        {
            id: 5,
            name: 'Wearable Patch - Lakindu',
            patient: 'Lakindu Minosha',
            patientId: 5,
            type: 'Wearable Patch',
            model: 'CognivusLabs ECG Monitor v1.0',
            serialNumber: 'CLW-2024-005',
            status: 'INACTIVE',
            battery: 8,
            signal: 0,
            lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            pairedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            sensors: [
                { name: 'ECG', status: 'offline', value: 'N/A' },
                { name: 'SpO2', status: 'offline', value: 'N/A' },
            ],
            firmware: 'v2.3.0',
            storageUsed: 100,
            alerts: 0,
            location: 'Ward 1 10C',
        },
        {
            id: 6,
            name: 'Sleep Tracker',
            patient: 'Ben Southern',
            patientId: 6,
            type: 'Sleep Tracker',
            model: 'SleepBuddy Pro',
            serialNumber: 'SBP-2024-042',
            status: 'ACTIVE',
            battery: 88,
            signal: 88,
            lastSync: new Date(Date.now() - 30 * 60 * 1000),
            pairedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            sensors: [
                { name: 'Sleep Quality', status: 'healthy', value: 'Good' },
                { name: 'Heart Rate', status: 'healthy', value: '58 bpm' },
            ],
            firmware: 'v1.8.1',
            storageUsed: 42,
            alerts: 0,
            location: 'Room 311B',
        },
    ]);

    const getFilteredDevices = () => {
        let filtered = devices.filter((device) => {
            const matchesSearch =
                device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
        return filtered.sort((a, b) => b.battery - a.battery);
    };

    const filteredDevices = getFilteredDevices();

    const handlePairDevice = (newDevice) => {
        setDevices([...devices, newDevice]);
        setIsPairDeviceModalOpen(false);
    };

    const handleResync = (deviceId) => {
        console.log('Resync device:', deviceId);
    };

    const handleUnpair = (deviceId) => {
        setDevices(devices.filter((d) => d.id !== deviceId));
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    const activeDevices = devices.filter((d) => d.status === 'ACTIVE').length;
    const warningDevices = devices.filter((d) => d.status === 'LOW_BATTERY').length;
    const inactiveDevices = devices.filter((d) => d.status === 'INACTIVE').length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Cpu className="w-8 h-8 text-orange-500" />
                                <h1 className="text-3xl font-bold text-white">Device Management</h1>
                            </div>
                            <p className="text-slate-400">
                                Monitor and manage IoT devices and wearables
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPairDeviceModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors border border-sky-500"
                        >
                            <Plus className="w-5 h-5" />
                            Pair Device
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white">{devices.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Active</p>
                            <p className="text-2xl font-bold text-emerald-400">{activeDevices}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Low Battery</p>
                            <p className="text-2xl font-bold text-amber-400">{warningDevices}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Inactive</p>
                            <p className="text-2xl font-bold text-red-400">{inactiveDevices}</p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 relative min-w-max">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search devices or patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                            <option value="all">Status: All</option>
                            <option value="ACTIVE">Active</option>
                            <option value="LOW_BATTERY">Low Battery</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    {/* Devices Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredDevices.length > 0 ? (
                            filteredDevices.map((device) => (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    onResync={handleResync}
                                    onUnpair={handleUnpair}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-700 rounded-lg">
                                <Cpu className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">No devices found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Pair Device Modal */}
            <PairDeviceModal
                isOpen={isPairDeviceModalOpen}
                onClose={() => setIsPairDeviceModalOpen(false)}
                onPair={handlePairDevice}
            />
        </div>
    );
};

export default DeviceManagementPage;
